/**
 * FASE 3 · ACESSO — código de seis dígitos por e-mail
 *
 * Até a v3 o portão aceitava qualquer e-mail digitado: bastava saber o
 * endereço de um colega para ver o que ele escolheu. A partir daqui o e-mail
 * é uma alegação; o código recebido nele é a prova.
 *
 * Depois de verificado, o servidor emite um bilhete assinado (HMAC-SHA256 com
 * a chave em MRO_HMAC_KEY). Toda função da Fase 3 exige esse bilhete — o
 * cliente não consegue forjá-lo, e nenhum dado pessoal sai daqui sem ele.
 *
 * O código em si nunca é gravado: guardamos só o resumo criptográfico.
 */

var ACESSO = {
  MINUTOS_VALIDADE: 12,      // vida do código de seis dígitos
  HORAS_BILHETE: 3,          // vida da sessão depois de verificado
  MAX_TENTATIVAS: 5,         // erros de digitação antes de invalidar o código
  MAX_PEDIDOS: 4,            // códigos por e-mail...
  JANELA_PEDIDOS: 15         // ...a cada quantos minutos
};

var CABECALHO_ACESSO = ['Carimbo', 'Email', 'Resumo', 'Expira', 'Tentativas', 'Estado'];

function abaAcesso() {
  return getAba(ABAS.ACESSO);
}

/* ------------------------------------------------------------------
   Utilidades criptográficas
   ------------------------------------------------------------------ */

function chaveHmac() {
  var props = PropertiesService.getScriptProperties();
  var chave = props.getProperty(PROP.HMAC_KEY);
  if (!chave) {
    chave = Utilities.getUuid() + Utilities.getUuid();
    props.setProperty(PROP.HMAC_KEY, chave);
  }
  return chave;
}

function paraHex(bytes) {
  var s = '';
  for (var i = 0; i < bytes.length; i++) {
    var b = (bytes[i] < 0 ? bytes[i] + 256 : bytes[i]).toString(16);
    s += (b.length === 1 ? '0' : '') + b;
  }
  return s;
}

/** O código nunca é gravado em claro. O e-mail entra no resumo para que um
    resumo vazado não sirva em outra conta. */
function resumoCodigo(email, codigo) {
  return paraHex(Utilities.computeHmacSha256Signature(
    normalizarEmail(email) + '|' + String(codigo), chaveHmac()));
}

/** Comparação de tempo constante: sair no primeiro caractere diferente
    vaza, pelo relógio, quantos caracteres estavam certos. */
function iguaisEmTempoConstante(a, b) {
  a = String(a || ''); b = String(b || '');
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= (a.charCodeAt(i) ^ b.charCodeAt(i));
  return diff === 0;
}

/* ------------------------------------------------------------------
   Bilhete de sessão
   ------------------------------------------------------------------ */

function emitirBilhete(email) {
  var alvo = normalizarEmail(email);
  var expira = Date.now() + ACESSO.HORAS_BILHETE * 3600 * 1000;
  var corpo = alvo + '|' + expira;
  var assinatura = paraHex(Utilities.computeHmacSha256Signature(corpo, chaveHmac()));
  return Utilities.base64EncodeWebSafe(corpo + '|' + assinatura);
}

/**
 * Devolve o e-mail do portador, ou lança. Toda função da Fase 3 começa
 * chamando isto — é o único ponto onde a identidade é estabelecida.
 */
function exigirSessao(bilhete) {
  var bruto;
  try {
    bruto = Utilities.newBlob(Utilities.base64DecodeWebSafe(String(bilhete || ''))).getDataAsString();
  } catch (e) {
    throw new Error('Sessão inválida. Volte ao início e peça um novo código.');
  }

  var p = bruto.split('|');
  if (p.length !== 3) throw new Error('Sessão inválida. Volte ao início e peça um novo código.');

  var esperada = paraHex(Utilities.computeHmacSha256Signature(p[0] + '|' + p[1], chaveHmac()));
  if (!iguaisEmTempoConstante(p[2], esperada)) {
    registrar('AVISO', 'BILHETE_INVALIDO', p[0]);
    throw new Error('Sessão inválida. Volte ao início e peça um novo código.');
  }
  if (Number(p[1]) < Date.now()) {
    throw new Error('Sua sessão expirou. Volte ao início e peça um novo código.');
  }
  return p[0];
}

/* ------------------------------------------------------------------
   Pedido de código
   ------------------------------------------------------------------ */

/**
 * Envia um código de seis dígitos ao e-mail informado.
 *
 * A resposta é sempre a mesma, exista ou não inscrição para aquele endereço:
 * dizer "não encontrei" aqui transformaria o portão em um verificador de
 * quem está inscrito. Quem se cadastra pela primeira vez também recebe código.
 */
function solicitarCodigo(email) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var alvo = normalizarEmail(email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(alvo)) {
      return { ok: false, erro: 'Digite um e-mail válido.' };
    }

    var aba = abaAcesso();
    var agora = Date.now();

    if (pedidosRecentes(aba, alvo, agora) >= ACESSO.MAX_PEDIDOS) {
      registrar('AVISO', 'ACESSO_LIMITE', alvo);
      return {
        ok: false,
        erro: 'Você pediu códigos demais. Aguarde ' + ACESSO.JANELA_PEDIDOS +
              ' minutos e tente de novo.'
      };
    }

    var codigo = String(Math.floor(Math.random() * 900000) + 100000);
    var expira = agora + ACESSO.MINUTOS_VALIDADE * 60 * 1000;

    aba.appendRow([
      Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss'),
      alvo,
      resumoCodigo(alvo, codigo),
      expira,
      0,
      'PENDENTE'
    ]);
    SpreadsheetApp.flush();

    try {
      enviarEmailCodigo(alvo, codigo);
      registrar('INFO', 'ACESSO_CODIGO_ENVIADO', alvo);
    } catch (err) {
      registrar('ERRO', 'ACESSO_EMAIL_FALHOU', alvo + ' · ' + err.message);
      return { ok: false, erro: 'Não conseguimos enviar o código agora. Tente de novo em instantes.' };
    }

    return { ok: true, minutos: ACESSO.MINUTOS_VALIDADE };

  } catch (err) {
    registrar('ERRO', 'ACESSO_FALHOU', err.message);
    return { ok: false, erro: 'Não foi possível enviar o código: ' + err.message };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function pedidosRecentes(aba, alvo, agora) {
  if (aba.getLastRow() < 2) return 0;
  var col = mapaColunas(aba, CABECALHO_ACESSO);
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var limite = agora - ACESSO.JANELA_PEDIDOS * 60 * 1000;
  var n = 0;
  for (var i = v.length - 1; i >= 0 && i >= v.length - 60; i--) {
    if (normalizarEmail(v[i][col.Email]) !== alvo) continue;
    // Expira guarda o instante de validade; o pedido é MINUTOS_VALIDADE antes.
    var pedido = Number(v[i][col.Expira]) - ACESSO.MINUTOS_VALIDADE * 60 * 1000;
    if (pedido >= limite) n++;
  }
  return n;
}

/* ------------------------------------------------------------------
   Verificação
   ------------------------------------------------------------------ */

/**
 * Confere o código e, dando certo, devolve o bilhete e a situação da pessoa:
 * se já tem inscrição, se já concluiu a Fase 2 e quais obras escolheu reger.
 */
function verificarCodigo(email, codigo) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

    var alvo = normalizarEmail(email);
    var digitado = String(codigo || '').replace(/\D/g, '');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(alvo)) {
      return { ok: false, erro: 'Digite um e-mail válido.' };
    }
    if (digitado.length !== 6) {
      return { ok: false, erro: 'O código tem seis dígitos.' };
    }

    var aba = abaAcesso();
    if (aba.getLastRow() < 2) {
      return { ok: false, erro: 'Peça um código antes de continuar.' };
    }

    var col = mapaColunas(aba, CABECALHO_ACESSO);
    var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();

    // De baixo para cima: vale sempre o código mais recente daquele e-mail.
    for (var i = v.length - 1; i >= 0; i--) {
      if (normalizarEmail(v[i][col.Email]) !== alvo) continue;
      if (String(v[i][col.Estado]).trim().toUpperCase() !== 'PENDENTE') {
        return { ok: false, erro: 'Este código já foi usado. Peça um novo.' };
      }

      var linha = i + 2;

      if (Number(v[i][col.Expira]) < Date.now()) {
        aba.getRange(linha, col.Estado + 1).setValue('EXPIRADO');
        return { ok: false, erro: 'O código expirou. Peça um novo.' };
      }

      var tentativas = Number(v[i][col.Tentativas]) || 0;
      if (tentativas >= ACESSO.MAX_TENTATIVAS) {
        aba.getRange(linha, col.Estado + 1).setValue('BLOQUEADO');
        return { ok: false, erro: 'Tentativas demais. Peça um novo código.' };
      }

      if (!iguaisEmTempoConstante(String(v[i][col.Resumo]), resumoCodigo(alvo, digitado))) {
        aba.getRange(linha, col.Tentativas + 1).setValue(tentativas + 1);
        SpreadsheetApp.flush();
        var restam = ACESSO.MAX_TENTATIVAS - tentativas - 1;
        return {
          ok: false,
          erro: restam > 0
            ? 'Código incorreto. ' + (restam === 1 ? 'Resta 1 tentativa.' : 'Restam ' + restam + ' tentativas.')
            : 'Código incorreto. Peça um novo código.'
        };
      }

      aba.getRange(linha, col.Estado + 1).setValue('USADO');
      SpreadsheetApp.flush();
      registrar('INFO', 'ACESSO_VERIFICADO', alvo);

      var situacao = situacaoDoParticipante(alvo);
      situacao.ok = true;
      situacao.bilhete = emitirBilhete(alvo);
      return situacao;
    }

    return { ok: false, erro: 'Peça um código antes de continuar.' };

  } catch (err) {
    registrar('ERRO', 'ACESSO_VERIFICAR_FALHOU', err.message);
    return { ok: false, erro: 'Não foi possível verificar: ' + err.message };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/* ------------------------------------------------------------------
   Situação do participante
   ------------------------------------------------------------------ */

/**
 * Reúne o que a pessoa já fez: inscrição, escolhas da Fase 2 e quizzes já
 * respondidos. Só é chamada depois da verificação do código.
 */
function situacaoDoParticipante(email) {
  var alvo = normalizarEmail(email);
  var base = buscarInscricao(alvo);

  var fora = {
    encontrado: false,
    nome: '', protocolo: '', encontros: [],
    fase2Concluida: false, escolhas: [], obrasQuiz: [], quizzesFeitos: []
  };
  if (!base || !base.ok || !base.encontrado) return fora;

  fora.encontrado = true;
  fora.nome = base.nome;
  fora.protocolo = base.protocolo;
  fora.encontros = base.encontros || [];

  var f2 = ultimaFase2(alvo);
  if (f2) {
    fora.fase2Concluida = true;
    fora.escolhas = f2.escolhas;
    fora.encontrosFase2 = f2.encontros;
    fora.comoLevaPartitura = f2.comoLevaPartitura;
    fora.levaInstrumento = f2.levaInstrumento;
  }

  fora.obrasQuiz = obrasParaOQuiz(fora.escolhas);
  fora.quizzesFeitos = quizzesJaFeitos(alvo);
  fora.ciencias = cienciasDadas(alvo);
  fora.ensaio = respostaFase4(alvo);
  return fora;
}

/** Última linha da Fase2 para este e-mail, ou null. */
function ultimaFase2(email) {
  var alvo = normalizarEmail(email);
  var aba = getAba(ABAS.FASE2);
  if (aba.getLastRow() < 2) return null;

  var col = mapaColunas(aba, CABECALHO_FASE2);
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();

  for (var i = v.length - 1; i >= 0; i--) {
    if (normalizarEmail(v[i][col.Email]) !== alvo) continue;
    var escolhas = [String(v[i][col.Prioridade1] || ''), String(v[i][col.Prioridade2] || '')]
      .map(function (s) { return s.trim(); })
      .filter(String);
    return {
      escolhas: escolhas,
      encontros: String(v[i][col.Encontros] || '').trim(),
      comoLevaPartitura: String(v[i][col.ComoLevaPartitura] || '').trim(),
      levaInstrumento: String(v[i][col.LevaInstrumento] || '').trim()
    };
  }
  return null;
}

/**
 * Traduz as escolhas gravadas ("Beethoven — Sinfonia nº 7, op. 92: II — …")
 * para os identificadores de obra do banco de perguntas, sem repetir.
 *
 * Quem não escolheu trecho nenhum — porque só vai ao dia 09 — pode responder
 * sobre qualquer uma das quatro obras.
 */
function obrasParaOQuiz(escolhas) {
  var rep = getRepertorio();
  var out = [], vistos = {};

  (escolhas || []).forEach(function (texto) {
    for (var i = 0; i < rep.length; i++) {
      var o = rep[i];
      if (texto.indexOf(o.obra) === -1) continue;
      if (vistos[o.id] || !QUIZ_BANCO[o.id]) continue;
      vistos[o.id] = true;
      out.push({ id: o.id, obra: o.obra, compositor: o.compositor, escolhida: true });
    }
  });

  if (out.length) return out;

  return rep.filter(function (o) { return !!QUIZ_BANCO[o.id]; })
    .map(function (o) {
      return { id: o.id, obra: o.obra, compositor: o.compositor, escolhida: false };
    });
}

/* ------------------------------------------------------------------
   E-mail do código
   ------------------------------------------------------------------ */

function enviarEmailCodigo(email, codigo) {
  var cfg = getConfig();
  var contato = cfg.emailContato || PADRAO.CONTATO;

  var texto = [
    'Seu código de acesso é ' + codigo + '.',
    '',
    'Ele vale por ' + ACESSO.MINUTOS_VALIDADE + ' minutos e só serve nesta tela.',
    'Se não foi você que pediu, ignore este e-mail.',
    '',
    cfg.assinaturaEmail || 'Equipe Academia Kephra',
    'Dúvidas: ' + contato
  ].join('\n');

  var html = '' +
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#0A0A0A;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;">' +
    '<tr><td align="center" style="padding:22px 10px 30px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;max-width:460px;background:#FFFFFF;">' +

    '<tr><td style="background:#0A0A0A;padding:30px 26px;text-align:center;">' +
    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.22em;text-transform:uppercase;' +
    'color:#E0C56E;">Masterclasses de Regência Orquestral</div>' +
    '<div style="font:400 10.5px/1.6 ' + FONTE + ';letter-spacing:.2em;text-transform:uppercase;' +
    'color:#9A9A9A;margin-top:12px;">Código de acesso</div></td></tr>' +

    '<tr><td style="padding:34px 26px 6px;text-align:center;">' +
    '<div style="font:600 40px/1.1 ' + FONTE + ';letter-spacing:.24em;color:#0A0A0A;' +
    'padding-left:.24em;">' + escapeHtml(codigo) + '</div></td></tr>' +

    '<tr><td style="padding:16px 26px 0;text-align:center;">' +
    '<div style="font:400 14px/1.7 ' + FONTE + ';color:#5A5A5A;max-width:32ch;margin:0 auto;">' +
    'Vale por ' + ACESSO.MINUTOS_VALIDADE + ' minutos e só funciona na tela em que você o pediu.' +
    '</div></td></tr>' +

    '<tr><td style="padding:24px 26px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#F4F1EA;border-left:3px solid #B08542;"><tr>' +
    '<td style="padding:14px 16px;font:400 13px/1.7 ' + FONTE + ';color:#2A2A2A;">' +
    'Não foi você que pediu? Ignore este e-mail. Sem o código, ninguém entra.' +
    '</td></tr></table></td></tr>' +

    '<tr><td style="padding:30px 26px 30px;text-align:center;">' +
    '<div style="border-top:1px solid #E8E8E8;padding-top:18px;font:400 13px/1.8 ' + FONTE + ';' +
    'color:#8A8A8A;">' + escapeHtml(cfg.assinaturaEmail || 'Equipe Academia Kephra') + '<br>' +
    '<a href="mailto:' + escapeHtml(contato) + '" style="color:#8A7940;text-decoration:none;' +
    'border-bottom:1px solid #DCDCDC;">' + escapeHtml(contato) + '</a></div>' +
    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.16em;text-transform:uppercase;' +
    'color:#B4B4B4;margin-top:18px;">Plataforma desenvolvida por ' +
    '<a href="' + escapeHtml(cfg.creditoUrl || 'https://opusaitech.com/') + '" ' +
    'style="color:#8A8A8A;text-decoration:none;">' +
    escapeHtml(cfg.creditoNome || 'Opus AI') + '</a></div>' +
    '</td></tr></table></td></tr></table></body></html>';

  GmailApp.sendEmail(email, 'Seu código: ' + codigo + ' · Masterclasses de Regência', texto, {
    htmlBody: html,
    name: cfg.assinaturaEmail || 'Equipe Academia Kephra',
    replyTo: contato
  });
}
