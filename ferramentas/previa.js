#!/usr/bin/env node
/**
 * PRÉVIA — monta a plataforma numa página só, para abrir no navegador
 * sem publicar nada.
 *
 *   node ferramentas/previa.js
 *   → ferramentas/saida/previa.html
 *
 * Resolve os <?!= include('X') ?> do HtmlService, troca os scriptlets de
 * variável por valores fixos e injeta um dublê de google.script.run que
 * responde o que o servidor responderia. Serve para ver o desenho e
 * caminhar pelas telas; não testa nada do lado do servidor — para isso
 * existe o verificar.js.
 *
 * O dublê fica em ferramentas/dado.js. Mexa nele para simular outra
 * situação: quem nunca se inscreveu, quem está sem a fase 2, e por aí.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const SAIDA = path.join(__dirname, 'saida');

function incluir(html, profundidade) {
  if (profundidade > 6) throw new Error('include circular');
  return html.replace(/<\?!=\s*include\('([A-Za-z0-9_]+)'\)\s*\?>/g, (todo, nome) => {
    const arquivo = path.join(SRC, nome + '.html');
    if (!fs.existsSync(arquivo)) throw new Error('include sem arquivo: ' + nome);
    return incluir(fs.readFileSync(arquivo, 'utf8'), profundidade + 1);
  });
}

let pagina = incluir(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'), 0);

pagina = pagina
  .replace('"<?= appUrl ?>"', '"https://exemplo.invalido/exec"')
  .replace('"<?= versao ?>"', '"PRÉVIA LOCAL"')
  .replace('"<?= viewMode ?>"', '"form"');

const sobrou = pagina.match(/<\?[\s\S]{0,40}?\?>/);
if (sobrou) throw new Error('scriptlet não resolvido: ' + sobrou[0]);

// O dublê precisa existir antes de qualquer script da plataforma.
pagina = pagina.replace('<body>', '<body>\n<script src="dado.js"></script>', 1);

fs.mkdirSync(SAIDA, { recursive: true });
fs.writeFileSync(path.join(SAIDA, 'previa.html'), pagina);
fs.copyFileSync(path.join(__dirname, 'dado.js'), path.join(SAIDA, 'dado.js'));

console.log('ferramentas/saida/previa.html — ' +
  (pagina.length / 1024).toFixed(0) + ' KB. Abra no navegador.');
