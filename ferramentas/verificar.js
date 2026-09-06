#!/usr/bin/env node
/**
 * VERIFICAR — tudo o que dá para conferir sem publicar.
 *
 * Roda em qualquer Node 18+, sem dependência nenhuma. É o que a Action
 * executa a cada push, e o que você deve rodar antes de mandar para o
 * Apps Script:  node ferramentas/verificar.js
 *
 * Confere, nesta ordem:
 *   1. sintaxe de todo .gs e de todo <script> dentro dos .html
 *   2. integridade do banco de perguntas — gabarito entre as opções,
 *      dez eixos cobertos, fonte citável em cada pergunta
 *   3. correção — resposta perfeita dá o máximo, resposta em branco dá zero,
 *      e os créditos parciais valem o que deveriam valer
 *   4. o caminho real: servir embaralhado, responder pelo texto, corrigir
 *   5. bilhete de sessão — assinatura, expiração, adulteração
 *   6. que nenhuma chave de gabarito escapa no que vai para o navegador
 *
 * Sai com código 1 na primeira falha real, para a Action barrar o deploy.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

const RAIZ = path.resolve(__dirname, '..');
const SRC = path.join(RAIZ, 'src');

let falhas = 0;
const ok = m => console.log('  OK     ' + m);
const falha = m => { falhas++; console.log('  FALHA  ' + m); };
const secao = t => console.log('\n' + t);
const conferir = (cond, m) => cond ? ok(m) : falha(m);

/* ============================================================
   1 · SINTAXE
   ============================================================ */

secao('SINTAXE');

const arquivosGs = fs.readdirSync(SRC).filter(f => f.endsWith('.gs')).sort();
const arquivosHtml = fs.readdirSync(SRC).filter(f => f.endsWith('.html')).sort();

function checarSintaxe(rotulo, codigo) {
  try {
    new vm.Script(codigo, { filename: rotulo });
    ok(rotulo);
  } catch (e) {
    falha(rotulo + ' — ' + e.message);
  }
}

for (const f of arquivosGs) {
  checarSintaxe(f, fs.readFileSync(path.join(SRC, f), 'utf8'));
}

for (const f of arquivosHtml) {
  const bruto = fs.readFileSync(path.join(SRC, f), 'utf8');
  const blocos = [...bruto.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (!blocos.length) { ok(f + ' (sem <script>)'); continue; }
  checarSintaxe(f, blocos.join('\n'));
}

// Scriptlets do HtmlService só fazem sentido nos dois arquivos que
// hospedam includes. Em qualquer outro, indicam include mal fechado.
const HOSPEDAM_INCLUDE = ['index.html', 'Formulario.html'];
for (const f of arquivosHtml) {
  if (HOSPEDAM_INCLUDE.includes(f)) continue;
  const bruto = fs.readFileSync(path.join(SRC, f), 'utf8');
  if (/<\?[!=]?/.test(bruto)) falha(f + ' — scriptlet <? ?> fora do index');
}

/* ============================================================
   AMBIENTE FINGIDO DO APPS SCRIPT
   ============================================================ */

const CHAVE = 'chave-de-teste-nao-usada-em-producao';

function carregarServidor() {
  const fonte = ['QuizBanco.gs', 'Quiz.gs', 'Acesso.gs']
    .map(f => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');

  const caixa = {
    console,
    Logger: { log: () => {} },
    Utilities: {
      formatDate: () => '',
      getUuid: () => 'uuid-de-teste',
      computeHmacSha256Signature: (v, k) =>
        Array.from(crypto.createHmac('sha256', k).update(v).digest()),
      base64EncodeWebSafe: s => Buffer.from(s).toString('base64url'),
      base64DecodeWebSafe: s => Buffer.from(s, 'base64url'),
      newBlob: b => ({ getDataAsString: () => Buffer.from(b).toString('utf8') })
    },
    SpreadsheetApp: { flush: () => {} },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    GmailApp: { sendEmail: () => {} },
    MailApp: { getRemainingDailyQuota: () => 100 },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => CHAVE, setProperty: () => {} })
    },
    // Vindas do Code.gs; nenhuma delas é exercitada por estas verificações.
    getAba: () => { throw new Error('a verificação não toca na planilha'); },
    getSS: () => { throw new Error('a verificação não toca na planilha'); },
    criarAbaSeFaltar: () => {},
    mapaColunas: () => ({}),
    registrar: () => {},
    normalizarEmail: s => String(s || '').trim().toLowerCase(),
    buscarInscricao: () => ({ ok: true, encontrado: false }),
    situacaoDoParticipante: () => ({ nome: 'Teste', protocolo: 'X' }),
    getConfig: () => ({}),
    getRepertorio: () => [],
    escapeHtml: s => String(s || ''),
    rubrica: () => '',
    ABAS: {}, PADRAO: {}, PROP: { HMAC_KEY: 'K' },
    TZ: 'America/Sao_Paulo', FONTE: 'Arial', CABECALHO_FASE2: []
  };
  caixa.globalThis = caixa;
  vm.createContext(caixa);
  vm.runInContext(fonte, caixa);
  return caixa;
}

let S;
try {
  S = carregarServidor();
} catch (e) {
  falha('não foi possível carregar o servidor: ' + e.message);
  process.exit(1);
}

/* ============================================================
   2 · BANCO DE PERGUNTAS
   ============================================================ */

secao('BANCO DE PERGUNTAS');

const relatorioBanco = S.testarBancoQuiz();
for (const linha of relatorioBanco.split('\n')) {
  if (linha.includes('FALHA')) falha(linha.trim());
}
conferir(relatorioBanco.includes('Banco íntegro.'),
  'gabaritos entre as opções, dez eixos cobertos, fonte em toda pergunta');

const obras = Object.keys(S.QUIZ_BANCO);
conferir(obras.length > 0, obras.length + ' obra(s): ' + obras.join(', '));

/* ============================================================
   3 · CORREÇÃO
   ============================================================ */

secao('CORREÇÃO');

const relatorioCorrecao = S.testarCorrecaoQuiz();
for (const linha of relatorioCorrecao.split('\n')) {
  if (linha.includes('FALHA')) falha(linha.trim());
}
conferir(!relatorioCorrecao.includes('FALHA'),
  'resposta perfeita dá o máximo e resposta em branco dá zero, em toda obra');

// Crédito parcial: um valor errado aqui não quebra nada, e por isso
// passaria despercebido. Daí valer a pena fixá-lo.
const MAX = S.QUIZ_PONTOS_POR_PERGUNTA;
const acharTipo = (obra, tipo) => S.QUIZ_BANCO[obra].perguntas.find(p => p.tipo === tipo);
const pontos = (p, r) => p ? S.corrigirPergunta(p, r).pontos : null;

function esperar(rotulo, obtido, esperado) {
  conferir(obtido === esperado, rotulo + ': ' + obtido + ' (esperado ' + esperado + ')');
}

for (const id of obras) {
  const dig = acharTipo(id, 'digitar');
  if (dig) {
    esperar(id + ' · digitar exato', pontos(dig, dig.aceita[0]), MAX);
    esperar(id + ' · digitar em CAIXA ALTA', pontos(dig, dig.aceita[0].toUpperCase()), MAX);
    esperar(id + ' · digitar vazio', pontos(dig, ''), 0);
    // Uma letra trocada: crédito parcial, nunca crédito cheio.
    const quase = dig.aceita[0].slice(0, -1) + 'x';
    const p = pontos(dig, quase);
    conferir(p > 0 && p < MAX, id + ' · digitar com uma letra errada: ' + p + ' (parcial)');
  }

  const mult = acharTipo(id, 'multipla');
  if (mult) {
    esperar(id + ' · múltipla completa', pontos(mult, mult.certas), MAX);
    esperar(id + ' · múltipla marcando tudo', pontos(mult, mult.opcoes), 0);
    const parcial = pontos(mult, mult.certas.slice(0, -1));
    conferir(parcial > 0 && parcial < MAX, id + ' · múltipla incompleta: ' + parcial);
  }

  const ano = acharTipo(id, 'ano');
  if (ano) {
    esperar(id + ' · ano exato', pontos(ano, ano.certo), MAX);
    esperar(id + ' · ano muito longe', pontos(ano, ano.certo + 60), 0);
    conferir(ano.certo >= ano.min && ano.certo <= ano.max,
      id + ' · ano certo dentro da faixa da barra');
  }

  const ligar = acharTipo(id, 'ligar');
  if (ligar) {
    esperar(id + ' · ligar completo', pontos(ligar, ligar.pares), MAX);
    const meio = pontos(ligar, [ligar.pares[0]]);
    conferir(meio > 0 && meio < MAX, id + ' · ligar um par só: ' + meio);
  }

  const ord = acharTipo(id, 'ordenar');
  if (ord) {
    esperar(id + ' · ordenar correto', pontos(ord, ord.ordem), MAX);
    conferir(pontos(ord, ord.ordem.slice().reverse()) < MAX,
      id + ' · ordenar invertido não dá o máximo');
  }
}

/* ============================================================
   4 · BILHETE DE SESSÃO
   ============================================================ */

secao('BILHETE DE SESSÃO');

const bilhete = S.emitirBilhete('Aluno@USP.br');
conferir(S.exigirSessao(bilhete) === 'aluno@usp.br',
  'emite, valida e normaliza o e-mail do portador');

function recusa(rotulo, fn) {
  try { fn(); falha(rotulo + ' — aceitou'); }
  catch (e) { ok(rotulo + ' — recusou'); }
}

recusa('assinatura adulterada', () => S.exigirSessao(bilhete.slice(0, -4) + 'aaaa'));
recusa('bilhete que não é bilhete', () => S.exigirSessao('nada disso'));
recusa('bilhete vazio', () => S.exigirSessao(''));
recusa('bilhete expirado', () => {
  const corpo = 'x@y.com|' + (Date.now() - 1000);
  const sig = Buffer.from(S.Utilities
    ? crypto.createHmac('sha256', CHAVE).update(corpo).digest()
    : []).toString('hex');
  S.exigirSessao(Buffer.from(corpo + '|' + sig).toString('base64url'));
});

const r1 = S.resumoCodigo('a@b.com', '123456');
const r2 = S.resumoCodigo('c@d.com', '123456');
conferir(r1 !== r2, 'o mesmo código em e-mails diferentes gera resumos diferentes');
conferir(S.iguaisEmTempoConstante(r1, r1) && !S.iguaisEmTempoConstante(r1, r2),
  'comparação de tempo constante distingue igual de diferente');

/* ============================================================
   5 · SERVIR → RESPONDER → CORRIGIR, E O QUE VAZA
   ============================================================ */

secao('SERVIR → RESPONDER → CORRIGIR');

// Se qualquer uma destas chaves aparecer no que vai ao navegador, a
// resposta está indo junto com a pergunta.
const CHAVES_DE_GABARITO = [
  'certa', 'certas', 'aceita', 'certo', 'pares', 'ordem',
  'gabarito', 'porque', 'fonte', 'tolerancia'
];

conferir(S.carregarQuiz('', obras[0]).ok === false,
  'carregarQuiz sem bilhete é recusado');

for (const id of obras) {
  const servido = S.carregarQuiz(bilhete, id);
  if (!servido.ok) { falha(id + ' — não serviu: ' + servido.erro); continue; }

  const json = JSON.stringify(servido);
  const vazadas = CHAVES_DE_GABARITO.filter(k => new RegExp('"' + k + '"').test(json));
  conferir(vazadas.length === 0,
    id + ' · nada de gabarito no que vai ao navegador' +
    (vazadas.length ? ' — vazou: ' + vazadas.join(', ') : ''));

  // Responde usando SÓ o que o cliente recebeu, casando pelo texto.
  // É assim que o navegador responde de verdade.
  const banco = S.QUIZ_BANCO[id].perguntas;
  const respostas = {};
  servido.perguntas.forEach((sp, i) => {
    const p = banco[i];
    if (sp.tipo === 'escolha') respostas[sp.n] = sp.opcoes.find(o => o === p.certa);
    if (sp.tipo === 'multipla') respostas[sp.n] = sp.opcoes.filter(o => p.certas.includes(o));
    if (sp.tipo === 'digitar') respostas[sp.n] = p.aceita[0];
    if (sp.tipo === 'ano') respostas[sp.n] = p.certo;
    if (sp.tipo === 'ligar') {
      respostas[sp.n] = sp.esquerda.map(e => [e, (p.pares.find(x => x[0] === e) || [])[1]]);
    }
    if (sp.tipo === 'ordenar') respostas[sp.n] = p.ordem.slice();
  });

  let total = 0;
  banco.forEach(p => { total += S.corrigirPergunta(p, respostas[String(p.n)]).pontos; });
  conferir(total === servido.maximo,
    id + ' · respondendo pelo texto servido: ' + total + '/' + servido.maximo);
}

/* ============================================================
   FECHO
   ============================================================ */

console.log('');
if (falhas) {
  console.log(falhas + ' falha(s). Nada foi publicado.');
  process.exit(1);
}
console.log('Tudo certo. Pode publicar.');
