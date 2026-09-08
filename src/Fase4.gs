/**
 * FASE 4 · ENSAIO ABERTO DA OSESP — lista de acesso
 *
 * A Osesp precisa de nome completo, RG e data de nascimento para liberar a
 * entrada no ensaio aberto. Esta fase colhe isso de quem tem interesse e
 * devolve, num comando só, a lista pronta para mandar à produção.
 *
 * Duas coisas governam o comportamento:
 *
 * 1. O PRAZO. A lista tem de sair antes da hora combinada com a Osesp;
 *    depois disso a tela fecha sozinha e passa a dizer que fechou. Um
 *    formulário que aceita inscrição depois do prazo é pior que um
 *    formulário fechado: promete o que não pode cumprir.
 *
 * 2. O RG. É o dado mais sensível que a plataforma toca. Só é pedido a quem
 *    disse que vai, só serve para a lista da portaria, e a tela diz isso com
 *    todas as letras antes de pedir. Quem não vai não digita documento.
 */

var CABECALHO_FASE4 = [
  'Carimbo', 'Email', 'Interesse', 'NomeCompleto', 'RG', 'Nascimento', 'Versao'
];

/* O programa do ensaio. Como EVENTOS_PADRAO, é conteúdo do evento que mora
   no código: quem o edita é quem edita este arquivo. */
var PROGRAMA_OSESP = [
  { compositor: 'John Adams',   obra: 'The rock you stand on' },
  { compositor: 'Samuel Barber', obra: 'Concerto para violino, op. 14', nota: 'solista: Randall Goosby' },
  { compositor: 'Samuel Barber', obra: 'Adagio para cordas, op. 11' },
  { compositor: 'John Adams',   obra: 'On the transmigration of souls', nota: 'com o Coro e o Coro Acadêmico da Osesp' }
];

var CONFIG_OSESP = [
  ['osespData', '10/09/2026'],
  ['osespHora', '10:00'],
  ['osespDuracao', '90 minutos'],
  ['osespLocal', 'Sala São Paulo'],
  ['osespEndereco', 'Praça Júlio Prestes, 16 · Campos Elísios'],
  ['osespMapa', 'https://www.google.com/maps/dir/?api=1&destination=Sala+S%C3%A3o+Paulo%2C+Pra%C3%A7a+J%C3%BAlio+Prestes%2C+16%2C+S%C3%A3o+Paulo'],
  ['osespRegente', 'Marin Alsop'],
  ['osespSolista', 'Randall Goosby · violino'],
  ['osespTempo', 'Muitas nuvens, com pancadas de chuva isoladas · 15°C a 22°C'],
  ['osespTempoUrl', 'https://www.climatempo.com.br/previsao-do-tempo/15-dias/cidade/558/saopaulo-sp'],
  ['osespPrazo', '07/09/2026 17:00'],
  ['osespAberto', 'SIM']
];

function garantirAbaFase4() {
  var ss = getSS();
  criarAbaSeFaltar(ss, ABAS.FASE4, CABECALHO_FASE4);

  // As chaves do ensaio entram na Config sem tocar no que já existe.
  var aba = ss.getSheetByName(ABAS.CONFIG);
  var tem = {};
  if (aba.getLastRow() > 1) {
    var v = aba.getRange(2, 1, aba.getLastRow() - 1, 2).getValues();
    for (var i = 0; i < v.length; i++) tem[String(v[i][0]).trim()] = true;
  }
  var faltam = CONFIG_OSESP.filter(function (p) { return !tem[p[0]]; });
  if (faltam.length) {
    aba.getRange(aba.getLastRow() + 1, 1, faltam.length, 2).setValues(faltam);
    registrar('AVISO', 'CONFIG_OSESP', faltam.map(function (f) { return f[0]; }).join(', '));
  }
}

/* ============================================================
   O PRAZO
   ============================================================ */

/** Ainda dá tempo de entrar na lista? */
function ensaioAbertoParaInscricao(cfg) {
  cfg = cfg || getConfig();
  if ((cfg.osespAberto || 'SIM').toUpperCase() !== 'SIM') return false;
  var p = partesDeData(cfg.osespPrazo, '23:59');
  if (!p) return true;                     // sem prazo declarado, não fecha
  return carimbo(agoraPartes()) < carimbo(p);
}

/** O que a tela precisa saber sobre o ensaio. Vai junto de getDadosIniciais. */
function getEnsaioAberto() {
  var cfg = getConfig();
  var p = partesDeData(cfg.osespPrazo, '23:59');
  return {
    aberto: ensaioAbertoParaInscricao(cfg),
    prazoTexto: p ? (pad2(p.d) + '/' + pad2(p.mo) + ' às ' + pad2(p.h) + 'h' + pad2(p.mi)) : '',
    programa: PROGRAMA_OSESP
  };
}

/* ============================================================
   GRAVAÇÃO
   ============================================================ */

function acharLinhaFase4(aba, email) {
  if (aba.getLastRow() < 2) return 0;
  var col = mapaColunas(aba, CABECALHO_FASE4);
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var alvo = normalizarEmail(email);
  for (var i = v.length - 1; i >= 0; i--) {
    if (normalizarEmail(v[i][col.Email]) === alvo) return i + 2;
  }
  return 0;
}

/**
 * Grava o interesse no ensaio. Uma linha por pessoa, como no resto.
 * Quem disse que não vai não tem documento gravado — nem em branco por
 * engano: os campos vão vazios de propósito.
 */
function salvarFase4(bilhete, dados) {
  var lock = LockService.getScriptLock();
  try {
    var email = exigirSessao(bilhete);
    lock.waitLock(20000);
    garantirAbaFase4();

    var cfg = getConfig();
    var d = dados || {};
    var vai = !!d.interesse;

    // Resposta sobre o ensaio não se muda pela plataforma. A lista da Osesp
    // sai uma vez; alguém que trocasse de ideia depois dela partir estaria
    // na lista sem saber, ou fora dela achando que está. Mudança de última
    // hora se resolve falando com a gente, não clicando.
    var jaRespondeu = respostaFase4(email);
    if (jaRespondeu) {
      return { ok: true, interesse: jaRespondeu.interesse, jaEstava: true };
    }

    if (vai && !ensaioAbertoParaInscricao(cfg)) {
      return { ok: false, erro: 'O prazo para entrar na lista da Osesp encerrou.' };
    }

    if (vai) {
      if (!limpar(d.nomeCompleto) || limpar(d.nomeCompleto).split(/\s+/).length < 2) {
        return { ok: false, erro: 'Escreva o nome completo, como está no documento.' };
      }
      if (limpar(d.rg).replace(/[^0-9A-Za-z]/g, '').length < 5) {
        return { ok: false, erro: 'Digite o número do RG.' };
      }
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(limpar(d.nascimento))) {
        return { ok: false, erro: 'Digite a data de nascimento no formato dd/mm/aaaa.' };
      }
    }

    var aba = getAba(ABAS.FASE4);
    var linha = [
      Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss'),
      email,
      vai ? 'SIM' : 'NÃO',
      vai ? limpar(d.nomeCompleto) : '',
      vai ? "'" + limpar(d.rg) : '',
      vai ? limpar(d.nascimento) : '',
      VERSAO
    ];

    var onde = acharLinhaFase4(aba, email);
    if (onde) aba.getRange(onde, 1, 1, linha.length).setValues([linha]);
    else aba.appendRow(linha);

    SpreadsheetApp.flush();
    registrar('INFO', 'FASE4', email + ' · ' + (vai ? 'VAI' : 'não vai'));
    return { ok: true, interesse: vai };

  } catch (err) {
    registrar('ERRO', 'FASE4_FALHOU', err.message);
    return { ok: false, erro: err.message };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/** O que esta pessoa já respondeu sobre o ensaio, ou null. */
function respostaFase4(email) {
  var aba = getAba(ABAS.FASE4);
  var onde = acharLinhaFase4(aba, email);
  if (!onde) return null;
  var col = mapaColunas(aba, CABECALHO_FASE4);
  var v = aba.getRange(onde, 1, 1, aba.getLastColumn()).getValues()[0];
  return {
    interesse: String(v[col.Interesse]).trim().toUpperCase() === 'SIM',
    nomeCompleto: String(v[col.NomeCompleto] || '').trim(),
    quando: String(v[col.Carimbo] || '').split(' ')[0]
  };
}

/* ============================================================
   A LISTA PARA A OSESP
   ============================================================ */

/**
 * A lista pronta para colar num e-mail à produção da Osesp.
 * Rode no editor e copie o resultado do registro de execução.
 */
function listaOsesp() {
  garantirAbaFase4();
  var cfg = getConfig();
  var aba = getAba(ABAS.FASE4);

  var out = ['LISTA · Ensaio aberto da Osesp',
    cfg.osespData + ' · ' + cfg.osespHora + ' · ' + cfg.osespLocal, ''];

  if (aba.getLastRow() < 2) {
    out.push('Ninguém respondeu ainda.');
    var vazio = out.join('\n'); Logger.log(vazio); return vazio;
  }

  var col = mapaColunas(aba, CABECALHO_FASE4);
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var vao = [], nao = 0;

  for (var i = 0; i < v.length; i++) {
    if (String(v[i][col.Interesse]).trim().toUpperCase() !== 'SIM') { nao++; continue; }
    vao.push({
      nome: String(v[i][col.NomeCompleto] || '').trim(),
      rg: String(v[i][col.RG] || '').replace(/^'/, '').trim(),
      nasc: String(v[i][col.Nascimento] || '').trim(),
      email: String(v[i][col.Email] || '').trim()
    });
  }

  vao.sort(function (a, b) { return a.nome.localeCompare(b.nome, 'pt-BR'); });

  out.push('TOTAL DE PESSOAS: ' + vao.length);
  out.push('');
  out.push('Nº · NOME COMPLETO · RG · NASCIMENTO');
  out.push('');
  vao.forEach(function (p, i) {
    out.push((i + 1) + '. ' + p.nome + ' · ' + p.rg + ' · ' + p.nasc);
  });
  out.push('');
  out.push('(disseram que não vão: ' + nao + ')');

  var texto = out.join('\n');
  Logger.log(texto);
  return texto;
}

/* ============================================================
   O CONVITE POR E-MAIL
   ============================================================ */

/**
 * Manda o convite do ensaio para todo mundo que se inscreveu e ainda não
 * respondeu sobre ele.
 *
 * Existe porque o prazo é curto e nem todo mundo vai voltar à plataforma a
 * tempo por conta própria. Rode no editor. É seguro repetir: quem já
 * respondeu, e quem já recebeu, são pulados.
 */
function enviarConviteOsesp() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    garantirAbaFase4();

    var cfg = getConfig();
    if (!ensaioAbertoParaInscricao(cfg)) {
      return 'O prazo já encerrou (' + cfg.osespPrazo + '). Nada enviado.';
    }

    var abaI = getAba(ABAS.INSCRICOES);
    if (abaI.getLastRow() < 2) return 'Nenhuma inscrição. Nada enviado.';

    var colI = mapaColunas(abaI, CABECALHO_INSCRICOES);
    var vi = abaI.getRange(2, 1, abaI.getLastRow() - 1, abaI.getLastColumn()).getValues();

    var aba4 = getAba(ABAS.FASE4);
    var responderam = {};
    if (aba4.getLastRow() > 1) {
      var col4 = mapaColunas(aba4, CABECALHO_FASE4);
      var v4 = aba4.getRange(2, 1, aba4.getLastRow() - 1, aba4.getLastColumn()).getValues();
      for (var k = 0; k < v4.length; k++) responderam[normalizarEmail(v4[k][col4.Email])] = true;
    }

    var vistos = {}, enviados = 0, pulados = 0, erros = 0;

    for (var i = 0; i < vi.length; i++) {
      var email = normalizarEmail(vi[i][colI.Email]);
      if (!email || vistos[email]) continue;
      vistos[email] = true;
      if (responderam[email]) { pulados++; continue; }

      try {
        enviarEmailOsesp(email, String(vi[i][colI.Nome] || '').trim(), cfg);
        enviados++;
      } catch (err) {
        erros++;
        registrar('ERRO', 'OSESP_EMAIL_FALHOU', email + ' · ' + err.message);
      }
    }

    var texto = 'Convite do ensaio · enviados: ' + enviados +
      ' · já haviam respondido: ' + pulados + (erros ? ' · falhas: ' + erros : '');
    registrar('INFO', 'OSESP_CONVITE', texto);
    Logger.log(texto);
    return texto;

  } catch (err) {
    registrar('ERRO', 'OSESP_CONVITE_FALHOU', err.message);
    return 'Falhou: ' + err.message;
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function linhaPrograma(p) {
  return '<tr><td style="padding:8px 0;border-bottom:1px solid #E8E8E8;">' +
    '<div style="font:400 10px/1.6 ' + FONTE + ';letter-spacing:.14em;' +
    'text-transform:uppercase;color:#9A9A9A;">' + escapeHtml(p.compositor) + '</div>' +
    '<div style="font:400 14.5px/1.5 ' + FONTE + ';color:#1A1A1A;margin-top:3px;">' +
    escapeHtml(p.obra) + '</div>' +
    (p.nota ? '<div style="font:400 12px/1.6 ' + FONTE + ';color:#8A8A8A;margin-top:2px;">' +
      escapeHtml(p.nota) + '</div>' : '') +
    '</td></tr>';
}

function enviarEmailOsesp(email, nome, cfg) {
  var contato = cfg.emailContato || PADRAO.CONTATO;
  var url = cfg.appUrlPublica || getAppUrl() || '';
  var primeiro = String(nome || '').trim().split(/\s+/)[0] || 'Olá';
  var p = partesDeData(cfg.osespPrazo, '23:59');
  var prazo = p ? (pad2(p.d) + '/' + pad2(p.mo) + ' às ' + pad2(p.h) + 'h' + pad2(p.mi)) : '';

  var html = '' +
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#0A0A0A;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;">' +
    '<tr><td align="center" style="padding:22px 10px 30px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;max-width:560px;background:#FFFFFF;">' +

    '<tr><td style="background:#0A0A0A;padding:34px 26px;text-align:center;">' +
    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.22em;' +
    'text-transform:uppercase;color:#E0C56E;">Convite · ensaio aberto da Osesp</div>' +
    '<div style="font:300 24px/1.35 ' + FONTE + ';color:#EAEAEA;margin-top:14px;' +
    'max-width:340px;margin-left:auto;margin-right:auto;">' +
    escapeHtml(cfg.osespRegente || 'Marin Alsop') + ' na Sala São Paulo</div>' +
    '<div style="font:400 10.5px/1.6 ' + FONTE + ';letter-spacing:.2em;' +
    'text-transform:uppercase;color:#9A9A9A;margin-top:16px;">' +
    escapeHtml(cfg.osespData + ' · ' + cfg.osespHora) + '</div></td></tr>' +

    '<tr><td style="padding:32px 26px 0;">' +
    '<div style="font:400 17px/1.5 ' + FONTE + ';color:#0A0A0A;">' +
    escapeHtml(primeiro) + ', conseguimos um convite para vocês.</div>' +
    '<div style="font:400 15px/1.72 ' + FONTE + ';color:#5A5A5A;margin-top:12px;">' +
    'Vamos juntos ao ensaio aberto da Osesp, com regência de ' +
    escapeHtml(cfg.osespRegente || 'Marin Alsop') + ' e ' +
    escapeHtml(cfg.osespSolista || 'Randall Goosby · violino') + '. ' +
    'Ver uma orquestra sendo construída de dentro é uma aula que não cabe em ' +
    'sala: dá para acompanhar o que a regente pede, como pede, e o que muda ' +
    'no som depois do pedido.</div></td></tr>' +

    '<tr><td style="padding:26px 26px 0;">' + rubrica('O programa') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;">' +
    PROGRAMA_OSESP.map(linhaPrograma).join('') + '</table>' +
    '<div style="font:400 12.5px/1.7 ' + FONTE + ';color:#9A9A9A;margin-top:10px;">' +
    'Por ser ensaio, pode haver pausas, repetições de trechos e mudança na ' +
    'ordem das obras, conforme a regente conduzir.</div></td></tr>' +

    '<tr><td style="padding:26px 26px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#F4F1EA;border-left:3px solid #B08542;"><tr>' +
    '<td style="padding:16px 18px;font:400 14px/1.72 ' + FONTE + ';color:#2A2A2A;">' +
    '<strong>Confirme até ' + escapeHtml(prazo) + '</strong><br>' +
    'A Osesp precisa da lista com antecedência. Depois desse horário não ' +
    'conseguimos mais incluir ninguém.</td></tr></table></td></tr>' +

    (url ? '<tr><td style="padding:26px 26px 0;text-align:center;">' +
      '<a href="' + escapeHtml(url) + '" style="display:inline-block;padding:15px 26px;' +
      'background:#E0C56E;color:#0A0A0A;text-decoration:none;font:600 12px/1 ' + FONTE + ';' +
      'letter-spacing:.14em;text-transform:uppercase;">Quero ir · confirmar</a>' +
      '<div style="font:400 12px/1.7 ' + FONTE + ';color:#9A9A9A;margin-top:14px;">' +
      'Entre com este mesmo e-mail. Vamos pedir nome completo, RG e data de ' +
      'nascimento — é o que a portaria da Sala São Paulo exige, e serve só ' +
      'para isso.</div></td></tr>' : '') +

    '<tr><td style="padding:28px 26px 30px;text-align:center;">' +
    '<div style="border-top:1px solid #E8E8E8;padding-top:18px;font:400 13px/1.8 ' + FONTE + ';' +
    'color:#8A8A8A;">' + escapeHtml(cfg.assinaturaEmail || 'Equipe Academia Kephra') + '<br>' +
    '<a href="mailto:' + escapeHtml(contato) + '" style="color:#8A7940;text-decoration:none;' +
    'border-bottom:1px solid #DCDCDC;">' + escapeHtml(contato) + '</a></div></td></tr>' +

    '</table></td></tr></table></body></html>';

  var texto = [
    primeiro + ', conseguimos um convite para voces.',
    '',
    'ENSAIO ABERTO DA OSESP',
    cfg.osespData + ' - ' + cfg.osespHora + ' - ' + cfg.osespLocal,
    'Regencia: ' + (cfg.osespRegente || 'Marin Alsop'),
    'Solista: ' + (cfg.osespSolista || 'Randall Goosby - violino'),
    '',
    'PROGRAMA'
  ];
  PROGRAMA_OSESP.forEach(function (x) {
    texto.push('- ' + x.compositor + ': ' + x.obra + (x.nota ? ' (' + x.nota + ')' : ''));
  });
  texto.push('');
  texto.push('CONFIRME ATE ' + prazo + '. Depois disso nao conseguimos incluir ninguem.');
  if (url) {
    texto.push('');
    texto.push(url);
    texto.push('Entre com este mesmo e-mail. Vamos pedir nome completo, RG e');
    texto.push('data de nascimento - e o que a portaria exige, e serve so para isso.');
  }
  texto.push('');
  texto.push(cfg.assinaturaEmail || 'Equipe Academia Kephra');

  GmailApp.sendEmail(email,
    'Convite · ensaio aberto da Osesp com ' + (cfg.osespRegente || 'Marin Alsop') +
    ' · confirme até ' + prazo,
    texto.join('\n'),
    { htmlBody: html, name: cfg.assinaturaEmail || 'Equipe Academia Kephra', replyTo: contato });
}


/* ============================================================
   AVISO DE QUE O PEDIDO FOI ENVIADO À OSESP

   Escreve só a quem disse SIM. Não promete lugar: os ingressos
   deste ensaio estão esgotados, e a Osesp só reconfirma as
   reservas devolvidas no início da semana. Um e-mail que
   prometesse entrada e depois não a entregasse valeria menos
   que nenhum e-mail.
   ============================================================ */

/**
 * Avisa os confirmados de que a lista foi enviada e a resposta é aguardada.
 * Rode à mão, uma vez, depois de mandar a lista à produção da Osesp.
 */
function avisarPedidoEnviadoOsesp() {
  garantirAbaFase4();
  var cfg = getConfig();
  var aba = getAba(ABAS.FASE4);
  if (aba.getLastRow() < 2) return 'Ninguém respondeu à Fase 4. Nada enviado.';

  var col = mapaColunas(aba, CABECALHO_FASE4);
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();

  var vistos = {}, enviados = 0, erros = 0, quem = [];
  for (var i = v.length - 1; i >= 0; i--) {         // a última resposta manda
    var email = normalizarEmail(v[i][col.Email]);
    if (!email || vistos[email]) continue;
    vistos[email] = true;
    if (String(v[i][col.Interesse]).toUpperCase().indexOf('SIM') !== 0) continue;

    var nome = String(v[i][col.NomeCompleto] || '').split(' ')[0];
    try {
      enviarAvisoPedidoOsesp(email, nome, cfg);
      enviados++;
      quem.push(nome + ' <' + email + '>');
    } catch (e) {
      erros++;
      registrar('ERRO', 'OSESP_AVISO', email + ' · ' + e.message);
    }
  }

  registrar('INFO', 'OSESP_AVISO', 'Enviados: ' + enviados + ' · erros: ' + erros);
  return 'Avisados: ' + enviados + (erros ? ' · erros: ' + erros : '') +
    '\n' + quem.join('\n');
}

function enviarAvisoPedidoOsesp(email, primeiroNome, cfg) {
  var contato = cfg.emailContato || PADRAO.CONTATO;
  var assinatura = cfg.assinaturaEmail || 'Equipe Academia Kephra';
  var F = FONTE;

  function p(t, mt) {
    return '<div style="font:400 15px/1.72 ' + F + ';color:#2A2A2A;margin-top:' +
      (mt || '0') + ';">' + t + '</div>';
  }

  var programa = PROGRAMA_OSESP.map(function (o) {
    return '<tr><td style="padding:9px 0;border-bottom:1px solid #E8E8E8;' +
      'font:400 14px/1.6 ' + F + ';color:#2A2A2A;">' +
      '<span style="color:#8A8A8A;">' + escapeHtml(o.compositor) + '</span><br>' +
      '<i>' + escapeHtml(o.obra) + '</i>' +
      (o.nota ? ' — ' + escapeHtml(o.nota) : '') + '</td></tr>';
  }).join('');

  var html = '' +
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#0A0A0A;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;">' +
    '<tr><td align="center" style="padding:22px 10px 30px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;max-width:560px;background:#FFFFFF;">' +

    '<tr><td style="background:#0A0A0A;padding:36px 26px 34px;text-align:center;">' +
    '<div style="font:400 10px/1.8 ' + F + ';letter-spacing:.2em;text-transform:uppercase;' +
    'color:#E0C56E;max-width:330px;margin:0 auto;">ECA/USP e Academia Kephra oferecem</div>' +
    '<div style="font:300 24px/1.35 ' + F + ';color:#EAEAEA;margin-top:16px;max-width:330px;' +
    'margin-left:auto;margin-right:auto;">Masterclasses de<br>Regência Orquestral</div>' +
    '<div style="font:400 10.5px/1.6 ' + F + ';letter-spacing:.22em;text-transform:uppercase;' +
    'color:#9A9A9A;margin-top:18px;">Maestro João Rocha</div></td></tr>' +

    '<tr><td style="padding:34px 26px 0;">' +
    '<div style="font:400 19px/1.5 ' + F + ';color:#0A0A0A;max-width:30ch;">' +
    (primeiroNome ? escapeHtml(primeiroNome) + ', o' : 'O') +
    ' pedido está com a Osesp. Agora é aguardar.</div>' +
    '<div style="font:400 15px/1.7 ' + F + ';color:#5A5A5A;margin-top:12px;max-width:44ch;">' +
    'Você marcou na plataforma que gostaria de ir ao ensaio aberto de quinta-feira. ' +
    'Aqui está exatamente em que pé estamos — sem promessa e sem suspense.</div></td></tr>' +

    '<tr><td style="padding:22px 26px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;"><tr>' +
    '<td align="center" style="padding:16px 18px;font:400 11px/1.8 ' + F + ';' +
    'letter-spacing:.14em;text-transform:uppercase;color:#FFFFFF;">' +
    'Seu nome já está na lista<br>enviada à Osesp</td></tr></table></td></tr>' +

    '<tr><td style="padding:34px 26px 0;">' + rubrica('O que já foi feito') +
    p('O pedido foi enviado à Osesp, com o seu nome completo, RG e data de nascimento, ' +
      'junto com o dos demais colegas e o do maestro. Foi para a gerência de experiência ' +
      'do cliente, que é quem decide.') + '</td></tr>' +

    '<tr><td style="padding:24px 26px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#F4F1EA;border-left:3px solid #B08542;"><tr>' +
    '<td style="padding:16px 18px;font:400 14px/1.72 ' + F + ';color:#2A2A2A;">' +
    '<b style="font-weight:700;">Os ingressos deste ensaio estão esgotados.</b> ' +
    'A Osesp respondeu que reconfirma no início da semana quais reservas já feitas ' +
    'serão de fato usadas — e é dessas devoluções que dependeria a nossa entrada. ' +
    'Pedido feito, resposta pendente: uma chance real, que não é uma certeza.' +
    '</td></tr></table></td></tr>' +

    '<tr><td style="padding:24px 26px 0;">' +
    p('Assim que houver resposta, você é avisado no mesmo dia. Não precisa fazer nada ' +
      'até lá — e, por favor, <b style="font-weight:700;">não compre ingresso por conta ' +
      'própria</b> antes do nosso retorno.') + '</td></tr>' +

    '<tr><td style="padding:34px 26px 0;">' + rubrica('O ensaio') +
    '<div style="font:400 14px/1.6 ' + F + ';color:#2A2A2A;"><span style="color:#8A8A8A;">' +
    escapeHtml(cfg.osespData + ' · ' + cfg.osespHora + ' · ' + cfg.osespDuracao) +
    '</span><br>' + escapeHtml(cfg.osespLocal + ' — ' + cfg.osespEndereco) +
    '<br><span style="color:#8A8A8A;">Regência de ' + escapeHtml(cfg.osespRegente) +
    '</span></div></td></tr>' +

    '<tr><td style="padding:26px 26px 0;">' + rubrica('Programa') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;table-layout:fixed;">' + programa + '</table></td></tr>' +

    '<tr><td style="padding:24px 26px 0;">' +
    p('Nos vemos na masterclass de qualquer modo — e essa parte não depende de lista ' +
      'de espera nenhuma.') + '</td></tr>' +

    '<tr><td style="padding:34px 26px 0;text-align:center;">' +
    '<div style="font:400 15px/1.8 ' + F + ';color:#3A3A3A;max-width:340px;margin:0 auto;">' +
    'Até lá,<br>' + escapeHtml(assinatura) + '</div>' +
    '<div style="font:400 13px/1.8 ' + F + ';color:#8A8A8A;margin-top:14px;max-width:330px;' +
    'margin-left:auto;margin-right:auto;">Qualquer dúvida, escreva para<br>' +
    '<a href="mailto:' + escapeHtml(contato) + '" style="color:#8A7940;text-decoration:none;' +
    'border-bottom:1px solid #DCDCDC;">' + escapeHtml(contato) + '</a></div></td></tr>' +

    '<tr><td style="padding:30px 26px 0;">' +
    '<div style="border-top:1px solid #E8E8E8;padding-top:20px;font:400 11px/1.9 ' + F + ';' +
    'color:#9A9A9A;text-align:center;max-width:320px;margin:0 auto;">' +
    'Tratamos seus dados conforme a LGPD<br>(Lei nº 13.709/2018). Seu nome completo, RG e<br>' +
    'data de nascimento foram enviados à Osesp<br>apenas para o credenciamento deste ensaio,<br>' +
    'conforme você autorizou na plataforma.<br>Para acessar, corrigir ou excluir seus dados,<br>' +
    'escreva para ' + escapeHtml(contato) + '</div></td></tr>' +

    '<tr><td style="padding:24px 26px 30px;text-align:center;">' +
    '<div style="font:400 10px/1.8 ' + F + ';letter-spacing:.16em;text-transform:uppercase;' +
    'color:#B4B4B4;">Plataforma desenvolvida por <a href="' +
    escapeHtml(cfg.creditoUrl || 'https://opusaitech.com/') + '" style="color:#8A8A8A;' +
    'text-decoration:none;border-bottom:1px solid #DCDCDC;">' +
    escapeHtml(cfg.creditoNome || 'Opus AI') + '</a></div></td></tr>' +

    '</table></td></tr></table></body></html>';

  var texto = [
    'O pedido está com a Osesp. Agora é aguardar.',
    '',
    'O pedido foi enviado à Osesp, com o seu nome completo, RG e data de',
    'nascimento, junto com o dos demais colegas e o do maestro.',
    '',
    'Os ingressos deste ensaio estão ESGOTADOS. A Osesp reconfirma no início',
    'da semana quais reservas já feitas serão de fato usadas — e é dessas',
    'devoluções que dependeria a nossa entrada. Uma chance real, que não é',
    'uma certeza.',
    '',
    'Assim que houver resposta, você é avisado no mesmo dia. Não compre',
    'ingresso por conta própria antes do nosso retorno.',
    '',
    cfg.osespData + ' · ' + cfg.osespHora + ' · ' + cfg.osespLocal,
    'Regência de ' + cfg.osespRegente,
    '',
    'Até lá,',
    assinatura
  ];

  MailApp.sendEmail(email,
    'Ensaio aberto da Osesp: o pedido foi feito — agora é aguardar',
    texto.join('\n'),
    { htmlBody: html, name: assinatura, replyTo: contato });
}
