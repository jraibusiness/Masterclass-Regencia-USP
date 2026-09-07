/**
 * LEMBRETES — quem escolheu repertório mas ainda não fez o preparo
 *
 * Roda por gatilho de tempo e escreve para quem está no meio do caminho:
 * já disse o que quer reger, ainda não respondeu às dez perguntas. Para no
 * instante em que o encontro do dia 08 começa — depois disso o lembrete
 * deixa de ser lembrete e vira incômodo.
 *
 * Duas decisões que valem explicação:
 *
 * 1. Nada aqui cria gatilho por código. Fazê-lo exigiria o escopo
 *    script.scriptapp, e mudar o conjunto de escopos obriga o dono a
 *    reautorizar o projeto — com o app publicado e gente usando, isso o
 *    derruba até alguém abrir o editor. O gatilho se cria à mão, no painel
 *    de acionadores, apontando para enviarLembretes. Esta função só lê a
 *    planilha e manda e-mail, que é o que o projeto já tinha permissão de
 *    fazer.
 *
 * 2. O controle de quantos lembretes cada um recebeu mora na aba Lembretes,
 *    não na memória. Gatilho de tempo não guarda estado entre execuções, e
 *    o que decide se alguém já foi avisado não pode viver só no relógio.
 */

var CABECALHO_LEMBRETES = ['Carimbo', 'Email', 'Nome', 'Numero', 'Obra', 'Estado'];

var LEMBRETE = {
  MAXIMO: 3,            // nunca mais que três, por pessoa
  HORAS_ENTRE: 8,       // e nunca dois no mesmo período do dia
  HORA_INICIO: 8,       // nada antes das oito
  HORA_FIM: 21          // nada depois das nove da noite
};

/**
 * Minutos absolutos desde uma origem fixa.
 *
 * O carimbo yyyyMMddHHmm serve para ordenar, mas não para subtrair: entre
 * 23h50 de um dia e 01h00 do seguinte a diferença dá dez mil e poucos, e
 * não setenta minutos. Quem usasse aquilo para medir intervalo mandaria
 * dois lembretes seguidos toda vez que a virada do dia ficasse no meio.
 */
function minutosDe(p) {
  return Math.floor(Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi) / 60000);
}

function garantirAbaLembretes() {
  var ss = getSS();
  criarAbaSeFaltar(ss, ABAS.LEMBRETES, CABECALHO_LEMBRETES);
}

/* ============================================================
   QUEM ESTÁ FALTANDO
   ============================================================ */

/**
 * Devolve quem escolheu trecho e não tem preparo gravado.
 *
 * A comparação é por e-mail normalizado nas duas abas: é a única chave que
 * as duas têm em comum e que a pessoa controla.
 */
function pendentesDoPreparo() {
  var abaF2 = getAba(ABAS.FASE2);
  if (abaF2.getLastRow() < 2) return [];

  var colF2 = mapaColunas(abaF2, CABECALHO_FASE2);
  var f2 = abaF2.getRange(2, 1, abaF2.getLastRow() - 1, abaF2.getLastColumn()).getValues();

  var abaF3 = getAba(ABAS.FASE3);
  var fizeram = {};
  if (abaF3.getLastRow() > 1) {
    var colF3 = mapaColunas(abaF3, CABECALHO_FASE3);
    var f3 = abaF3.getRange(2, 1, abaF3.getLastRow() - 1, abaF3.getLastColumn()).getValues();
    for (var k = 0; k < f3.length; k++) {
      fizeram[normalizarEmail(f3[k][colF3.Email])] = true;
    }
  }

  var vistos = {}, out = [];
  for (var i = f2.length - 1; i >= 0; i--) {
    var email = normalizarEmail(f2[i][colF2.Email]);
    if (!email || vistos[email] || fizeram[email]) continue;
    vistos[email] = true;

    var escolha = String(f2[i][colF2.Prioridade1] || '').trim();
    if (!escolha) continue;   // quem não escolheu trecho não tem o que preparar

    out.push({
      email: email,
      nome: String(f2[i][colF2.Nome] || '').trim(),
      obra: escolha.split(':')[0].trim()
    });
  }
  return out;
}

/** Quantos lembretes esta pessoa já recebeu, e quando foi o último. */
function historicoLembrete(aba, email) {
  if (aba.getLastRow() < 2) return { quantos: 0, ultimo: 0 };
  var col = mapaColunas(aba, CABECALHO_LEMBRETES);
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var alvo = normalizarEmail(email);
  var quantos = 0, ultimo = 0;
  for (var i = 0; i < v.length; i++) {
    if (normalizarEmail(v[i][col.Email]) !== alvo) continue;
    quantos++;
    var p = partesDeData(v[i][col.Carimbo], '00:00');
    if (p) { var m = minutosDe(p); if (m > ultimo) ultimo = m; }
  }
  return { quantos: quantos, ultimo: ultimo };
}

/** O encontro que exige preparo. Depois dele, nada mais é enviado. */
function encontroDoPreparo() {
  var evs = getEventos();
  for (var i = 0; i < evs.length; i++) if (evs[i].temRepertorio) return evs[i];
  return null;
}

/* ============================================================
   ENVIO
   ============================================================ */

/**
 * O que o gatilho chama. Seguro de rodar quantas vezes quiser: quem já
 * recebeu o bastante, ou recebeu há pouco, é pulado.
 */
function enviarLembretes() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    garantirAbaLembretes();

    var ev = encontroDoPreparo();
    if (!ev) {
      registrar('AVISO', 'LEMBRETE_SEM_ENCONTRO', 'nenhum evento com repertório');
      return 'Nenhum encontro com repertório. Nada enviado.';
    }
    if (ev.estado === 'encerrado') {
      return 'O encontro do dia ' + ev.dataTexto + ' já começou. Nada enviado.';
    }

    var cfg = getConfig();
    if ((cfg.lembretesLigados || 'SIM').toUpperCase() !== 'SIM') {
      return 'lembretesLigados está em NÃO na Config. Nada enviado.';
    }

    // Lembrete de madrugada não lembra nada: irrita e vai para o lixo.
    var relogio = agoraPartes();
    if (relogio.h < LEMBRETE.HORA_INICIO || relogio.h >= LEMBRETE.HORA_FIM) {
      return 'Fora da janela de envio (' + LEMBRETE.HORA_INICIO + 'h–' +
        LEMBRETE.HORA_FIM + 'h). Nada enviado.';
    }

    var aba = getAba(ABAS.LEMBRETES);
    var agora = minutosDe(relogio);
    var pendentes = pendentesDoPreparo();
    var enviados = 0, pulados = 0;

    for (var i = 0; i < pendentes.length; i++) {
      var p = pendentes[i];
      var h = historicoLembrete(aba, p.email);

      if (h.quantos >= LEMBRETE.MAXIMO) { pulados++; continue; }
      if (h.ultimo && (agora - h.ultimo) < LEMBRETE.HORAS_ENTRE * 60) { pulados++; continue; }

      try {
        enviarEmailLembrete(p, ev, cfg, h.quantos + 1);
        aba.appendRow([
          Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss'),
          p.email, p.nome, h.quantos + 1, p.obra, 'ENVIADO'
        ]);
        enviados++;
      } catch (err) {
        aba.appendRow([
          Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss'),
          p.email, p.nome, h.quantos + 1, p.obra, 'FALHOU · ' + err.message
        ]);
        registrar('ERRO', 'LEMBRETE_FALHOU', p.email + ' · ' + err.message);
      }
    }

    SpreadsheetApp.flush();
    var texto = 'Pendentes: ' + pendentes.length + ' · enviados: ' + enviados +
      ' · pulados: ' + pulados;
    registrar('INFO', 'LEMBRETES', texto);
    return texto;

  } catch (err) {
    registrar('ERRO', 'LEMBRETES_FALHOU', err.message);
    return 'Falhou: ' + err.message;
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/** Ensaio a seco: diz quem receberia, sem mandar nada. */
function previewLembretes() {
  garantirAbaLembretes();
  var ev = encontroDoPreparo();
  var aba = getAba(ABAS.LEMBRETES);
  var relogio = agoraPartes();
  var agora = minutosDe(relogio);
  var pendentes = pendentesDoPreparo();

  var out = ['LEMBRETES · ensaio a seco', ''];
  out.push('Encontro do preparo: ' + (ev ? ev.dataTexto + ' · ' + ev.estado : 'NENHUM'));
  out.push('Escolheram trecho e não fizeram o preparo: ' + pendentes.length);
  out.push('Janela de envio: ' + LEMBRETE.HORA_INICIO + 'h–' + LEMBRETE.HORA_FIM +
    'h · agora são ' + relogio.h + 'h' + (relogio.h < LEMBRETE.HORA_INICIO ||
    relogio.h >= LEMBRETE.HORA_FIM ? ' — FORA da janela' : ' — dentro'));
  out.push('No máximo ' + LEMBRETE.MAXIMO + ' por pessoa, a cada ' +
    LEMBRETE.HORAS_ENTRE + 'h');
  out.push('');

  pendentes.forEach(function (p) {
    var h = historicoLembrete(aba, p.email);
    var motivo = '';
    if (h.quantos >= LEMBRETE.MAXIMO) motivo = 'já recebeu ' + h.quantos;
    else if (h.ultimo && (agora - h.ultimo) < LEMBRETE.HORAS_ENTRE * 60) motivo = 'recebeu há pouco';
    out.push('  ' + (motivo ? '—  ' : '→  ') + p.email +
      '  ' + (p.obra || '') + (motivo ? '   (' + motivo + ')' : ''));
  });

  var texto = out.join('\n');
  Logger.log(texto);
  return texto;
}

/* ============================================================
   O E-MAIL
   ============================================================ */

var LEMBRETE_ASSUNTO = [
  'Falta o preparo da obra · Masterclasses de Regência',
  'Ainda dá tempo: o preparo da obra',
  'Amanhã tem masterclass — e falta o preparo'
];

function enviarEmailLembrete(p, ev, cfg, numero) {
  var contato = cfg.emailContato || PADRAO.CONTATO;
  var url = cfg.appUrlPublica || getAppUrl() || '';
  var primeiro = String(p.nome || '').trim().split(/\s+/)[0] || 'Olá';
  var assunto = LEMBRETE_ASSUNTO[Math.min(numero - 1, LEMBRETE_ASSUNTO.length - 1)];

  var quando = ev.diaSemana + ', ' + ev.dataTexto + ' · ' +
    ev.horaInicio.replace(':', 'h') + '–' + ev.horaFim.replace(':', 'h');

  var html = '' +
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light only"></head>' +
    '<body style="margin:0;padding:0;background:#0A0A0A;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;">' +
    '<tr><td align="center" style="padding:22px 10px 30px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;max-width:520px;background:#FFFFFF;">' +

    '<tr><td style="background:#0A0A0A;padding:32px 26px;text-align:center;">' +
    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.22em;' +
    'text-transform:uppercase;color:#E0C56E;">Preparo da obra</div>' +
    '<div style="font:300 23px/1.35 ' + FONTE + ';color:#EAEAEA;margin-top:14px;' +
    'max-width:320px;margin-left:auto;margin-right:auto;">Falta uma etapa<br>antes da música</div>' +
    '</td></tr>' +

    '<tr><td style="padding:32px 26px 0;">' +
    '<div style="font:400 17px/1.5 ' + FONTE + ';color:#0A0A0A;">' +
    escapeHtml(primeiro) + ', o seu trecho já está escolhido.</div>' +
    '<div style="font:400 15px/1.72 ' + FONTE + ';color:#5A5A5A;margin-top:12px;">' +
    'Falta responder às dez perguntas sobre ' +
    (p.obra ? '<strong style="color:#1A1A1A;">' + escapeHtml(p.obra) + '</strong>' : 'a obra') +
    '. Não é prova, e não vale nota: é o passo que faz você chegar ao pódio ' +
    'sabendo de onde a música veio.</div>' +
    '</td></tr>' +

    '<tr><td style="padding:24px 26px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#F4F1EA;border-left:3px solid #B08542;"><tr>' +
    '<td style="padding:16px 18px;font:400 14px/1.72 ' + FONTE + ';color:#2A2A2A;">' +
    '<strong>' + escapeHtml(quando) + '</strong><br>' +
    escapeHtml(ev.local) + (ev.endereco ? ' · ' + escapeHtml(ev.endereco) : '') +
    '</td></tr></table></td></tr>' +

    (url ? '<tr><td style="padding:26px 26px 0;text-align:center;">' +
      '<a href="' + escapeHtml(url) + '" style="display:inline-block;padding:15px 26px;' +
      'background:#E0C56E;color:#0A0A0A;text-decoration:none;font:600 12px/1 ' + FONTE + ';' +
      'letter-spacing:.14em;text-transform:uppercase;">Fazer o preparo agora</a>' +
      '<div style="font:400 12px/1.7 ' + FONTE + ';color:#9A9A9A;margin-top:14px;">' +
      'Entre com este mesmo e-mail. Leva poucos minutos.</div></td></tr>' : '') +

    '<tr><td style="padding:30px 26px 0;">' +
    '<div style="font:400 13.5px/1.7 ' + FONTE + ';color:#8A8A8A;">' +
    'Ao final você recebe o resultado comentado, com as fontes de cada resposta, ' +
    'e o acesso à pasta com as grades e as reduções para piano.</div></td></tr>' +

    '<tr><td style="padding:28px 26px 30px;text-align:center;">' +
    '<div style="border-top:1px solid #E8E8E8;padding-top:18px;font:400 13px/1.8 ' + FONTE + ';' +
    'color:#8A8A8A;">' + escapeHtml(cfg.assinaturaEmail || 'Equipe Academia Kephra') + '<br>' +
    '<a href="mailto:' + escapeHtml(contato) + '" style="color:#8A7940;text-decoration:none;' +
    'border-bottom:1px solid #DCDCDC;">' + escapeHtml(contato) + '</a></div>' +
    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.16em;' +
    'text-transform:uppercase;color:#B4B4B4;margin-top:16px;">Plataforma desenvolvida por ' +
    '<a href="' + escapeHtml(cfg.creditoUrl || 'https://opusaitech.com/') + '" ' +
    'style="color:#8A8A8A;text-decoration:none;">' +
    escapeHtml(cfg.creditoNome || 'Opus AI') + '</a></div></td></tr>' +

    '</table></td></tr></table></body></html>';

  var texto = [
    primeiro + ', o seu trecho já está escolhido.',
    '',
    'Falta responder as dez perguntas sobre ' + (p.obra || 'a obra') + '.',
    'Nao e prova: e o passo que faz voce chegar ao podio sabendo de onde a',
    'musica veio.',
    '',
    quando,
    ev.local + (ev.endereco ? ' - ' + ev.endereco : ''),
    ''
  ];
  if (url) {
    texto.push('Fazer o preparo: ' + url);
    texto.push('Entre com este mesmo e-mail.');
    texto.push('');
  }
  texto.push(cfg.assinaturaEmail || 'Equipe Academia Kephra');
  texto.push('Duvidas: ' + contato);

  GmailApp.sendEmail(p.email, assunto, texto.join('\n'), {
    htmlBody: html,
    name: cfg.assinaturaEmail || 'Equipe Academia Kephra',
    replyTo: contato
  });
}
