/**
 * FASE 3 · PREPARO DA OBRA — servir, corrigir, gravar, devolver
 *
 * O gabarito nunca sai do servidor. O cliente recebe enunciado e opções já
 * embaralhadas e devolve o TEXTO do que escolheu; a correção compara texto,
 * não índice. Assim o embaralhamento não exige guardar estado de sessão e o
 * índice deixa de ser um vazamento.
 *
 * Toda função pública começa por exigirSessao(bilhete): sem o código de seis
 * dígitos verificado, nada aqui responde.
 */

var CABECALHO_FASE3 = [
  'Carimbo', 'Email', 'Nome', 'Protocolo', 'ObraId', 'Obra',
  'Pontos', 'Acertos', 'Detalhe',
  'CienciaPartituras', 'CienciaSonataTheory', 'Versao'
];

var QUIZ_PONTOS_POR_PERGUNTA = 10;

/** Chamada por garantirAbasBase(). Fica aqui para a Fase 3 ser um arquivo só. */
function garantirAbasFase3() {
  var ss = getSS();
  criarAbaSeFaltar(ss, ABAS.ACESSO, CABECALHO_ACESSO);
  criarAbaSeFaltar(ss, ABAS.FASE3, CABECALHO_FASE3);
}

/* ============================================================
   1. SERVIR
   ============================================================ */

function embaralhar(lista) {
  var a = lista.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/**
 * Devolve as dez perguntas de uma obra, sem gabarito.
 *
 * Em 'ordenar' o embaralhamento é obrigatório: mandar os itens na ordem certa
 * seria entregar a resposta. Um sorteio pode devolver a ordem original — daí
 * a segunda tentativa.
 */
function carregarQuiz(bilhete, obraId) {
  try {
    exigirSessao(bilhete);
  } catch (err) {
    return { ok: false, erro: err.message };
  }

  var bloco = QUIZ_BANCO[obraId];
  if (!bloco) return { ok: false, erro: 'Obra desconhecida.' };

  var perguntas = bloco.perguntas.map(function (p) {
    var fora = {
      n: p.n,
      tipo: p.tipo,
      eixo: QUIZ_EIXOS[p.eixo],
      enunciado: p.enunciado,
      dica: p.dica || ''
    };

    if (p.tipo === 'escolha' || p.tipo === 'multipla') {
      fora.opcoes = embaralhar(p.opcoes);
      if (p.tipo === 'multipla') fora.minimo = 1;
    } else if (p.tipo === 'ano') {
      fora.min = p.min; fora.max = p.max;
      fora.inicial = Math.round((p.min + p.max) / 2);
    } else if (p.tipo === 'ligar') {
      fora.esquerda = p.esquerda.slice();
      fora.direita = embaralhar(p.direita);
      if (fora.direita.length > 1 && fora.direita.join('|') === p.direita.join('|')) {
        fora.direita = embaralhar(fora.direita);
      }
    } else if (p.tipo === 'ordenar') {
      fora.itens = embaralhar(p.itens);
      if (fora.itens.join('|') === p.ordem.join('|')) fora.itens = embaralhar(fora.itens);
    }
    return fora;
  });

  return {
    ok: true,
    obraId: obraId,
    obra: bloco.obra,
    compositor: bloco.compositor,
    total: perguntas.length,
    maximo: perguntas.length * QUIZ_PONTOS_POR_PERGUNTA,
    perguntas: perguntas
  };
}

/* ============================================================
   2. CORRIGIR
   ============================================================ */

/* Tabela em vez de String.prototype.normalize: o projeto pode estar rodando
   no runtime antigo, e ali normalize() não existe. */
var ACENTOS_DE = 'áàâãäåçéèêëíìîïñóòôõöúùûüýÿ';
var ACENTOS_PARA = 'aaaaaaceeeeiiiinooooouuuuyy';

/** minúsculas, sem acento, sem pontuação, espaços normalizados. */
function normalizarTexto(s) {
  var t = String(s === null || s === undefined ? '' : s).toLowerCase();
  var out = '';
  for (var i = 0; i < t.length; i++) {
    var c = t.charAt(i);
    var k = ACENTOS_DE.indexOf(c);
    out += (k === -1) ? c : ACENTOS_PARA.charAt(k);
  }
  return out.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Distância de edição, para dar crédito parcial a quem quase acertou a grafia. */
function distanciaEdicao(a, b) {
  a = String(a); b = String(b);
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  var anterior = [], atual = [];
  for (var j = 0; j <= b.length; j++) anterior[j] = j;

  for (var i = 1; i <= a.length; i++) {
    atual[0] = i;
    for (var k = 1; k <= b.length; k++) {
      var custo = a.charAt(i - 1) === b.charAt(k - 1) ? 0 : 1;
      atual[k] = Math.min(atual[k - 1] + 1, anterior[k] + 1, anterior[k - 1] + custo);
    }
    anterior = atual.slice();
  }
  return anterior[b.length];
}

function conjuntoNormalizado(lista) {
  var m = {};
  (lista || []).forEach(function (x) { m[normalizarTexto(x)] = true; });
  return m;
}

/** Devolve pontos de 0 a QUIZ_PONTOS_POR_PERGUNTA e o texto do que a pessoa marcou. */
function corrigirPergunta(p, resposta) {
  var MAX = QUIZ_PONTOS_POR_PERGUNTA;
  var vazio = { pontos: 0, sua: '—', acertou: false, parcial: false };
  if (resposta === null || resposta === undefined || resposta === '') return vazio;

  if (p.tipo === 'escolha') {
    var texto = String(resposta);
    var certo = normalizarTexto(texto) === normalizarTexto(p.certa);
    return { pontos: certo ? MAX : 0, sua: texto, acertou: certo, parcial: false };
  }

  if (p.tipo === 'multipla') {
    var marcadas = [].concat(resposta);
    var gab = conjuntoNormalizado(p.certas);
    var totalCertas = p.certas.length;
    var totalErradas = p.opcoes.length - totalCertas;
    var acertos = 0, erros = 0;
    marcadas.forEach(function (x) {
      if (gab[normalizarTexto(x)]) acertos++; else erros++;
    });
    // A penalização pesa pelo número de DISTRATORES, não pelo de acertos.
    // Dividindo pelos acertos, uma pergunta com quatro certas e dois
    // distratores dava cinco pontos a quem marcasse tudo — e marcar tudo
    // não é conhecimento. Assim, marcar tudo dá sempre exatamente zero.
    var bruto = (acertos / totalCertas) - (totalErradas ? erros / totalErradas : 0);
    var pontos = Math.max(0, Math.round(bruto * MAX));
    return {
      pontos: pontos,
      sua: marcadas.length ? marcadas.join(' · ') : '—',
      acertou: pontos === MAX,
      parcial: pontos > 0 && pontos < MAX
    };
  }

  if (p.tipo === 'digitar') {
    var dito = normalizarTexto(resposta);
    if (!dito) return vazio;
    var aceitos = p.aceita.map(normalizarTexto);
    for (var i = 0; i < aceitos.length; i++) {
      if (dito === aceitos[i]) {
        return { pontos: MAX, sua: String(resposta), acertou: true, parcial: false };
      }
    }
    // Erro de uma letra ainda demonstra conhecimento — mas a grafia é o ponto.
    for (var j = 0; j < aceitos.length; j++) {
      if (distanciaEdicao(dito, aceitos[j]) <= 1) {
        return { pontos: Math.round(MAX * 0.6), sua: String(resposta), acertou: false, parcial: true };
      }
    }
    return { pontos: 0, sua: String(resposta), acertou: false, parcial: false };
  }

  if (p.tipo === 'ano') {
    var ano = Number(resposta);
    if (!ano) return vazio;
    var d = Math.abs(ano - p.certo);
    var tol = Number(p.tolerancia) || 0;
    var pts = 0;
    if (d === 0) pts = MAX;
    else if (d <= tol) pts = Math.round(MAX * 0.7);
    else if (d <= Math.max(tol * 3, 5)) pts = Math.round(MAX * 0.3);
    return {
      pontos: pts,
      sua: String(ano),
      acertou: d === 0,
      parcial: pts > 0 && d !== 0
    };
  }

  if (p.tipo === 'ligar') {
    var enviados = [].concat(resposta || []);
    var certos = 0;
    p.pares.forEach(function (par) {
      for (var k = 0; k < enviados.length; k++) {
        var e = enviados[k] || [];
        if (normalizarTexto(e[0]) === normalizarTexto(par[0]) &&
            normalizarTexto(e[1]) === normalizarTexto(par[1])) { certos++; return; }
      }
    });
    var pl = Math.round((certos / p.pares.length) * MAX);
    return {
      pontos: pl,
      sua: enviados.map(function (e) { return (e[0] || '') + ' → ' + (e[1] || ''); }).join(' · ') || '—',
      acertou: certos === p.pares.length,
      parcial: pl > 0 && certos < p.pares.length
    };
  }

  if (p.tipo === 'ordenar') {
    var lista = [].concat(resposta || []);
    var naPosicao = 0;
    for (var m = 0; m < p.ordem.length; m++) {
      if (normalizarTexto(lista[m]) === normalizarTexto(p.ordem[m])) naPosicao++;
    }
    var po = Math.round((naPosicao / p.ordem.length) * MAX);
    return {
      pontos: po,
      sua: lista.join(' → ') || '—',
      acertou: naPosicao === p.ordem.length,
      parcial: po > 0 && naPosicao < p.ordem.length
    };
  }

  return vazio;
}

var QUIZ_FAIXAS = [
  { min: 85, rotulo: 'Obra situada',
    texto: 'Você sobe ao pódio sabendo de onde a obra vem. É desse chão que sai uma leitura sua, e não a cópia da leitura de outro.' },
  { min: 65, rotulo: 'Boa base',
    texto: 'A moldura está montada. Feche as lacunas apontadas abaixo e você chega ao ensaio com argumento próprio.' },
  { min: 40, rotulo: 'Meio caminho',
    texto: 'Dá para reger. Ainda não dá para defender uma leitura própria diante de uma orquestra que pergunta. Volte aos pontos abaixo.' },
  { min: 0, rotulo: 'Comece por aqui',
    texto: 'Sem constrangimento nenhum: é exatamente para isto que esta etapa existe. Leia as respostas abaixo — elas já são o roteiro de estudo.' }
];

function faixaDe(pontos, maximo) {
  var pct = maximo ? Math.round((pontos / maximo) * 100) : 0;
  for (var i = 0; i < QUIZ_FAIXAS.length; i++) {
    if (pct >= QUIZ_FAIXAS[i].min) {
      return { rotulo: QUIZ_FAIXAS[i].rotulo, texto: QUIZ_FAIXAS[i].texto, percentual: pct };
    }
  }
  return { rotulo: '', texto: '', percentual: pct };
}

/**
 * Corrige, grava e manda o e-mail de devolutiva. Uma ida ao servidor.
 * `respostas` é um objeto { '1': …, '2': … } com o número da pergunta na chave.
 */
function corrigirQuiz(bilhete, obraId, respostas) {
  var lock = LockService.getScriptLock();
  try {
    var email = exigirSessao(bilhete);
    lock.waitLock(20000);

    var bloco = QUIZ_BANCO[obraId];
    if (!bloco) return { ok: false, erro: 'Obra desconhecida.' };

    var r = respostas || {};
    var itens = [], pontos = 0, acertos = 0;

    bloco.perguntas.forEach(function (p) {
      var res = corrigirPergunta(p, r[String(p.n)]);
      pontos += res.pontos;
      if (res.acertou) acertos++;
      itens.push({
        n: p.n,
        eixo: QUIZ_EIXOS[p.eixo],
        enunciado: p.enunciado,
        pontos: res.pontos,
        maximo: QUIZ_PONTOS_POR_PERGUNTA,
        acertou: res.acertou,
        parcial: res.parcial,
        sua: res.sua,
        gabarito: p.gabarito,
        porque: p.porque,
        sugestao: res.acertou ? '' : QUIZ_SUGESTOES[p.eixo],
        fonte: p.fonte
      });
    });

    var maximo = bloco.perguntas.length * QUIZ_PONTOS_POR_PERGUNTA;
    var faixa = faixaDe(pontos, maximo);
    var situacao = situacaoDoParticipante(email);

    // Uma linha por pessoa e obra. Refazer sobrescreve em vez de acumular:
    // duas linhas para a mesma pessoa e a mesma obra não são histórico, são
    // ambiguidade — e quem fosse ler a planilha teria de decidir qual vale.
    var aba = getAba(ABAS.FASE3);
    var linha = [
      Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss'),
      email,
      situacao.nome || '',
      situacao.protocolo || '',
      obraId,
      bloco.obra,
      pontos,
      acertos + '/' + bloco.perguntas.length,
      JSON.stringify(itens.map(function (i) { return { n: i.n, p: i.pontos }; })),
      '', '',
      QUIZ_VERSAO
    ];

    var existente = acharLinhaFase3(aba, email, obraId);
    if (existente) {
      // As ciências já dadas não se perdem ao refazer o preparo.
      var col = mapaColunas(aba, CABECALHO_FASE3);
      var antiga = aba.getRange(existente, 1, 1, aba.getLastColumn()).getValues()[0];
      linha[col.CienciaPartituras] = antiga[col.CienciaPartituras] || '';
      linha[col.CienciaSonataTheory] = antiga[col.CienciaSonataTheory] || '';
      aba.getRange(existente, 1, 1, linha.length).setValues([linha]);
    } else {
      aba.appendRow(linha);
    }
    SpreadsheetApp.flush();
    registrar('INFO', 'FASE3_QUIZ', email + ' · ' + obraId + ' · ' + pontos + '/' + maximo);

    var resultado = {
      ok: true,
      obraId: obraId,
      obra: bloco.obra,
      compositor: bloco.compositor,
      pontos: pontos,
      maximo: maximo,
      acertos: acertos,
      total: bloco.perguntas.length,
      faixa: faixa,
      itens: itens,
      nome: situacao.nome || ''
    };

    try {
      enviarEmailQuiz(email, resultado);
      registrar('INFO', 'FASE3_EMAIL', email);
    } catch (err) {
      registrar('ERRO', 'FASE3_EMAIL_FALHOU', email + ' · ' + err.message);
      resultado.emailFalhou = true;
    }

    return resultado;

  } catch (err) {
    registrar('ERRO', 'FASE3_QUIZ_FALHOU', err.message + ' · ' + (err.stack || '').slice(0, 300));
    return { ok: false, erro: err.message };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/* ============================================================
   3. CIÊNCIAS
   ============================================================ */

/**
 * Grava as três ciências na última linha da Fase3 daquele e-mail e obra.
 * Procurar a linha em vez de recebê-la do cliente evita que um número de
 * linha adulterado escreva na ficha de outra pessoa.
 */
function registrarCiencias(bilhete, dados) {
  var lock = LockService.getScriptLock();
  try {
    var email = exigirSessao(bilhete);
    lock.waitLock(20000);

    var d = dados || {};
    var aba = getAba(ABAS.FASE3);
    if (aba.getLastRow() < 2) return { ok: false, erro: 'Responda o preparo antes de confirmar.' };

    var col = mapaColunas(aba, CABECALHO_FASE3);
    var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();

    for (var i = v.length - 1; i >= 0; i--) {
      if (normalizarEmail(v[i][col.Email]) !== email) continue;
      if (d.obraId && String(v[i][col.ObraId]).trim() !== String(d.obraId).trim()) continue;

      var linha = i + 2;
      aba.getRange(linha, col.CienciaPartituras + 1).setValue(d.partituras ? 'SIM' : 'NÃO');
      aba.getRange(linha, col.CienciaSonataTheory + 1).setValue(d.sonataTheory ? 'SIM' : 'NÃO');
      SpreadsheetApp.flush();

      registrar('INFO', 'FASE3_CIENCIAS', email + ' · ' + (d.obraId || '') +
        ' · P:' + (d.partituras ? 1 : 0) + ' S:' + (d.sonataTheory ? 1 : 0));
      return { ok: true };
    }

    return { ok: false, erro: 'Não encontramos o seu preparo para registrar as confirmações.' };

  } catch (err) {
    registrar('ERRO', 'FASE3_CIENCIAS_FALHOU', err.message);
    return { ok: false, erro: err.message };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/** Número da linha da Fase3 desta pessoa e obra, ou 0. */
function acharLinhaFase3(aba, email, obraId) {
  if (aba.getLastRow() < 2) return 0;
  var col = mapaColunas(aba, CABECALHO_FASE3);
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  for (var i = v.length - 1; i >= 0; i--) {
    if (normalizarEmail(v[i][col.Email]) !== normalizarEmail(email)) continue;
    if (String(v[i][col.ObraId]).trim() !== String(obraId).trim()) continue;
    return i + 2;
  }
  return 0;
}

/** Obras cujo preparo esta pessoa já respondeu — para a tela não repetir. */
function quizzesJaFeitos(email) {
  var alvo = normalizarEmail(email);
  var aba = getAba(ABAS.FASE3);
  if (aba.getLastRow() < 2) return [];

  var col = mapaColunas(aba, CABECALHO_FASE3);
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var out = [];
  for (var i = 0; i < v.length; i++) {
    if (normalizarEmail(v[i][col.Email]) !== alvo) continue;
    var bloco = QUIZ_BANCO[String(v[i][col.ObraId]).trim()];
    out.push({
      obraId: String(v[i][col.ObraId]).trim(),
      obra: String(v[i][col.Obra] || '').trim(),
      pontos: Number(v[i][col.Pontos]) || 0,
      maximo: bloco ? bloco.perguntas.length * QUIZ_PONTOS_POR_PERGUNTA : 100,
      acertos: String(v[i][col.Acertos] || '').trim(),
      quando: String(v[i][col.Carimbo] || '').trim().split(' ')[0],
      partituras: String(v[i][col.CienciaPartituras] || '').trim().toUpperCase() === 'SIM'
    });
  }
  // Se alguém refez a mesma obra, vale o mais recente.
  var porObra = {};
  out.forEach(function (x) { porObra[x.obraId] = x; });
  return Object.keys(porObra).map(function (k) { return porObra[k]; });
}

/* ============================================================
   4. E-MAIL DE DEVOLUTIVA
   ============================================================ */

function barraPontos(pontos, maximo) {
  var pct = maximo ? Math.round((pontos / maximo) * 100) : 0;
  var cheio = Math.max(1, Math.round(pct * 3.2));   // 320px de trilho
  return '<table role="presentation" width="320" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;width:320px;max-width:100%;background:#E8E8E8;"><tr>' +
    '<td width="' + cheio + '" height="6" style="width:' + cheio + 'px;height:6px;' +
    'background:#E0C56E;font-size:0;line-height:0;">&nbsp;</td>' +
    '<td height="6" style="height:6px;font-size:0;line-height:0;">&nbsp;</td>' +
    '</tr></table>';
}

function linhaItemQuiz(item) {
  var certo = item.acertou;
  var cor = certo ? '#3F7A52' : (item.parcial ? '#8A7940' : '#B0553F');
  var selo = certo ? 'Acertou' : (item.parcial ? 'Quase' : 'Escapou');

  return '' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;margin:0 0 18px;border-top:1px solid #E8E8E8;">' +
    '<tr><td style="padding:14px 0 0;">' +

    '<div style="font:500 9.5px/1.6 ' + FONTE + ';letter-spacing:.16em;text-transform:uppercase;' +
    'color:#9A9A9A;">' + item.n + ' · ' + escapeHtml(item.eixo) + '</div>' +

    '<div style="margin-top:7px;">' +
    '<span style="display:inline-block;border:1px solid ' + cor + ';color:' + cor + ';' +
    'padding:3px 8px;font:700 9.5px/1.3 ' + FONTE + ';letter-spacing:.14em;' +
    'text-transform:uppercase;">' + selo + '</span>' +
    '<span style="font:500 12px/1.3 ' + FONTE + ';color:#5A5A5A;margin-left:9px;">' +
    item.pontos + '/' + item.maximo + '</span></div>' +

    '<div style="font:400 14px/1.6 ' + FONTE + ';color:#1A1A1A;margin-top:10px;">' +
    escapeHtml(item.enunciado) + '</div>' +

    '<div style="font:400 13px/1.65 ' + FONTE + ';color:#8A8A8A;margin-top:6px;">' +
    'Você respondeu: ' + escapeHtml(item.sua) + '</div>' +

    '<div style="font:400 14px/1.7 ' + FONTE + ';color:#2A2A2A;margin-top:10px;' +
    'background:#F7F5F0;border-left:3px solid #B08542;padding:11px 13px;">' +
    escapeHtml(item.gabarito) + '</div>' +

    '<div style="font:400 13.5px/1.7 ' + FONTE + ';color:#5A5A5A;margin-top:9px;">' +
    escapeHtml(item.porque) + '</div>' +

    (item.sugestao
      ? '<div style="font:400 13px/1.7 ' + FONTE + ';color:#8A7940;margin-top:9px;">' +
        escapeHtml(item.sugestao) + '</div>'
      : '') +

    (item.fonte && item.fonte.url
      ? '<div style="font:400 11px/1.7 ' + FONTE + ';color:#9A9A9A;margin-top:9px;">Fonte: ' +
        '<a href="' + escapeHtml(item.fonte.url) + '" style="color:#8A7940;text-decoration:none;' +
        'border-bottom:1px solid #DCDCDC;">' + escapeHtml(item.fonte.rotulo) + '</a></div>'
      : '') +

    '</td></tr></table>';
}

function enviarEmailQuiz(email, r) {
  var cfg = getConfig();
  var contato = cfg.emailContato || PADRAO.CONTATO;
  var primeiro = String(r.nome || '').trim().split(/\s+/)[0] || 'Olá';
  var pasta = cfg.pastaPartiturasUrl || '';

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

    /* Cabeçalho */
    '<tr><td style="background:#0A0A0A;padding:34px 26px 32px;text-align:center;">' +
    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.2em;text-transform:uppercase;' +
    'color:#E0C56E;">Conhecendo a obra</div>' +
    '<div style="font:300 24px/1.35 ' + FONTE + ';color:#EAEAEA;margin-top:14px;' +
    'max-width:340px;margin-left:auto;margin-right:auto;">' + escapeHtml(r.obra) + '</div>' +
    '<div style="font:400 10.5px/1.6 ' + FONTE + ';letter-spacing:.22em;text-transform:uppercase;' +
    'color:#9A9A9A;margin-top:16px;">' + escapeHtml(r.compositor) + '</div></td></tr>' +

    /* Placar */
    '<tr><td style="padding:34px 26px 0;text-align:center;">' +
    '<div style="font:300 54px/1 ' + FONTE + ';color:#0A0A0A;">' + r.pontos +
    '<span style="font:400 18px/1 ' + FONTE + ';color:#9A9A9A;"> / ' + r.maximo + '</span></div>' +
    '<div style="margin:18px auto 0;">' + barraPontos(r.pontos, r.maximo) + '</div>' +
    '<div style="font:500 11px/1.6 ' + FONTE + ';letter-spacing:.2em;text-transform:uppercase;' +
    'color:#8A7940;margin-top:18px;">' + escapeHtml(r.faixa.rotulo) + '</div>' +
    '<div style="font:400 15px/1.7 ' + FONTE + ';color:#5A5A5A;margin-top:10px;' +
    'max-width:42ch;margin-left:auto;margin-right:auto;">' + escapeHtml(r.faixa.texto) + '</div>' +
    '<div style="font:400 13px/1.7 ' + FONTE + ';color:#9A9A9A;margin-top:12px;">' +
    r.acertos + ' de ' + r.total + ' perguntas inteiramente corretas</div>' +
    '</td></tr>' +

    /* Recado */
    '<tr><td style="padding:30px 26px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;"><tr>' +
    '<td style="padding:22px 20px;font:400 14px/1.75 ' + FONTE + ';color:#D1D1D1;">' +
    'O objetivo aqui nunca foi acertar tudo. É sair daqui sabendo mais sobre a obra ' +
    'do que você sabia ao entrar — e ter com que sustentar uma leitura sua.' +
    '</td></tr></table></td></tr>' +

    /* Gabarito */
    '<tr><td style="padding:32px 26px 0;">' + rubrica('Pergunta a pergunta') +
    r.itens.map(linhaItemQuiz).join('') + '</td></tr>' +

    /* Partituras */
    (pasta
      ? '<tr><td style="padding:8px 26px 0;">' + rubrica('Partituras') +
        '<div style="font:400 14px/1.72 ' + FONTE + ';color:#2A2A2A;">' +
        'As grades e as reduções para piano estão reunidas numa pasta do Drive: ' +
        '<a href="' + escapeHtml(pasta) + '" style="color:#8A7940;text-decoration:none;' +
        'font-weight:700;letter-spacing:.1em;border-bottom:1px solid #E0C56E;">LINK</a>. ' +
        'A curadoria das edições, entre as disponíveis no IMSLP, é do maestro João Rocha — ' +
        'o critério foi número de compasso, letras de ensaio e qualidade da edição. ' +
        'Se você já providenciou outra edição, tudo bem: isso não é fator limitante.' +
        '</div></td></tr>'
      : '') +

    /* Assinatura */
    '<tr><td style="padding:34px 26px 0;text-align:center;">' +
    '<div style="font:400 15px/1.8 ' + FONTE + ';color:#3A3A3A;max-width:340px;margin:0 auto;">' +
    'Até lá,<br>' + escapeHtml(cfg.assinaturaEmail || 'Equipe Academia Kephra') + '</div>' +
    '<div style="font:400 13px/1.8 ' + FONTE + ';color:#8A8A8A;margin-top:14px;">' +
    'Dúvidas: <a href="mailto:' + escapeHtml(contato) + '" style="color:#8A7940;' +
    'text-decoration:none;border-bottom:1px solid #DCDCDC;">' + escapeHtml(contato) + '</a></div>' +
    '</td></tr>' +

    '<tr><td style="padding:26px 26px 30px;text-align:center;">' +
    '<div style="border-top:1px solid #E8E8E8;padding-top:20px;font:400 10px/1.8 ' + FONTE + ';' +
    'letter-spacing:.16em;text-transform:uppercase;color:#B4B4B4;">Plataforma desenvolvida por ' +
    '<a href="' + escapeHtml(cfg.creditoUrl || 'https://opusaitech.com/') + '" ' +
    'style="color:#8A8A8A;text-decoration:none;border-bottom:1px solid #DCDCDC;">' +
    escapeHtml(cfg.creditoNome || 'Opus AI') + '</a></div></td></tr>' +

    '</table></td></tr></table></body></html>';

  var texto = [
    primeiro + ', seu preparo de ' + r.obra + ': ' + r.pontos + ' de ' + r.maximo + '.',
    r.faixa.rotulo + ' — ' + r.faixa.texto,
    '',
    'PERGUNTA A PERGUNTA'
  ];
  r.itens.forEach(function (i) {
    texto.push('');
    texto.push(i.n + '. ' + i.eixo + ' — ' + i.pontos + '/' + i.maximo);
    texto.push('   Você respondeu: ' + i.sua);
    texto.push('   Resposta: ' + i.gabarito);
    if (i.sugestao) texto.push('   Estude: ' + i.sugestao);
    if (i.fonte && i.fonte.url) texto.push('   Fonte: ' + i.fonte.rotulo + ' — ' + i.fonte.url);
  });
  if (pasta) {
    texto.push('');
    texto.push('PARTITURAS: ' + pasta);
  }
  texto.push('');
  texto.push(cfg.assinaturaEmail || 'Equipe Academia Kephra');
  texto.push('Dúvidas: ' + contato);

  GmailApp.sendEmail(
    email,
    'Seu preparo · ' + r.obra + ' · ' + r.pontos + '/' + r.maximo,
    texto.join('\n'),
    {
      htmlBody: html,
      name: cfg.assinaturaEmail || 'Equipe Academia Kephra',
      replyTo: contato
    }
  );
}

/* ============================================================
   5. TESTES DE MESA
   ============================================================ */

/** Confere que todo gabarito está entre as opções servidas. */
function testarBancoQuiz() {
  var out = ['BANCO ' + QUIZ_VERSAO, ''];
  var falhas = 0;

  Object.keys(QUIZ_BANCO).forEach(function (id) {
    var b = QUIZ_BANCO[id];
    out.push(id + ' · ' + b.compositor + ' — ' + b.obra + ' · ' + b.perguntas.length + ' perguntas');

    if (b.perguntas.length !== 10) { out.push('  FALHA · não são dez perguntas'); falhas++; }

    var eixos = {};
    b.perguntas.forEach(function (p) {
      eixos[p.eixo] = true;
      var erro = '';

      if (p.tipo === 'escolha') {
        if (p.opcoes.indexOf(p.certa) === -1) erro = 'a resposta certa não está entre as opções';
      } else if (p.tipo === 'multipla') {
        p.certas.forEach(function (c) {
          if (p.opcoes.indexOf(c) === -1) erro = 'opção certa ausente: ' + c;
        });
      } else if (p.tipo === 'ligar') {
        if (p.pares.length !== p.esquerda.length) erro = 'pares e coluna esquerda com tamanhos diferentes';
        p.pares.forEach(function (par) {
          if (p.esquerda.indexOf(par[0]) === -1) erro = 'par fora da esquerda: ' + par[0];
          if (p.direita.indexOf(par[1]) === -1) erro = 'par fora da direita: ' + par[1];
        });
      } else if (p.tipo === 'ordenar') {
        if (p.ordem.length !== p.itens.length) erro = 'ordem e itens com tamanhos diferentes';
        p.ordem.forEach(function (o) {
          if (p.itens.indexOf(o) === -1) erro = 'item da ordem ausente: ' + o;
        });
      } else if (p.tipo === 'ano') {
        if (p.certo < p.min || p.certo > p.max) erro = 'ano certo fora da faixa da barra';
      } else if (p.tipo === 'digitar') {
        if (!p.aceita || !p.aceita.length) erro = 'sem respostas aceitas';
      } else {
        erro = 'tipo desconhecido: ' + p.tipo;
      }

      if (!p.gabarito || !p.porque) erro = erro || 'sem gabarito ou sem justificativa';
      if (!p.fonte || !p.fonte.url) erro = erro || 'sem fonte citável';

      if (erro) { out.push('  FALHA · pergunta ' + p.n + ': ' + erro); falhas++; }
    });

    var faltando = [];
    for (var e = 0; e < 10; e++) if (!eixos[e]) faltando.push(QUIZ_EIXOS[e]);
    if (faltando.length) {
      out.push('  FALHA · eixos não cobertos: ' + faltando.join(', '));
      falhas++;
    }
  });

  out.push('');
  out.push(falhas ? falhas + ' FALHA(S)' : 'Banco íntegro.');
  var texto = out.join('\n');
  Logger.log(texto);
  return texto;
}

/** Simula uma resposta perfeita e uma resposta vazia, sem gravar nem enviar. */
function testarCorrecaoQuiz() {
  var out = ['CORREÇÃO ' + QUIZ_VERSAO, ''];

  Object.keys(QUIZ_BANCO).forEach(function (id) {
    var b = QUIZ_BANCO[id];
    var cheio = 0, vazio = 0;

    b.perguntas.forEach(function (p) {
      var perfeita;
      if (p.tipo === 'escolha') perfeita = p.certa;
      else if (p.tipo === 'multipla') perfeita = p.certas.slice();
      else if (p.tipo === 'digitar') perfeita = p.aceita[0];
      else if (p.tipo === 'ano') perfeita = p.certo;
      else if (p.tipo === 'ligar') perfeita = p.pares.map(function (x) { return x.slice(); });
      else if (p.tipo === 'ordenar') perfeita = p.ordem.slice();

      cheio += corrigirPergunta(p, perfeita).pontos;
      vazio += corrigirPergunta(p, null).pontos;
    });

    var maximo = b.perguntas.length * QUIZ_PONTOS_POR_PERGUNTA;
    out.push(id + ' · resposta perfeita: ' + cheio + '/' + maximo +
      (cheio === maximo ? '  OK' : '  FALHA') +
      ' · em branco: ' + vazio + (vazio === 0 ? '  OK' : '  FALHA'));
  });

  var texto = out.join('\n');
  Logger.log(texto);
  return texto;
}
