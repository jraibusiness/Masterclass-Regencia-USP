/**
 * MASTERCLASSES DE REGÊNCIA ORQUESTRAL — Maestro João Rocha
 * ECA/USP · Academia Kephra
 *
 * Template Opus AI v1. Nada específico deste evento vive neste arquivo:
 * datas, locais, textos de evento e repertório moram nas abas Eventos,
 * Repertorio e Config. Para o próximo projeto, copie os seis arquivos e
 * troque o conteúdo das abas.
 *
 * Padrões: PADROES_OPUS_AI.md (rev. 27/08/2026)
 */
  
var VERSAO = 'MRO-4.1.0 · 07/09/2026';
var TZ = 'America/Sao_Paulo';
  
var PROP = {
  SS_ID: 'MRO_SS_ID',
  ADMIN_EMAIL: 'MRO_ADMIN_EMAIL',
  LOGO_ID: 'MRO_LOGO_ID',
  HMAC_KEY: 'MRO_HMAC_KEY'
};
  
var PADRAO = {
  SS_ID: '1-PwQMYcL05i3tfkz_OIjWNISi9KpR47uAVlrMXbGPgs',
  ADMIN_EMAIL: 'jr.conductor83@gmail.com',
  CONTATO: 'contato@studiokephra.org',
  LOGO_ID: '15iHxx0zcL82u1ASCqbx-PYceQ7MqNAnJ'
};
  
var ABAS = {
  INSCRICOES: 'Inscricoes',
  CONFIG: 'Config',
  EVENTOS: 'Eventos',
  REPERTORIO: 'Repertorio',
  FASE2: 'Fase2',
  FASE3: 'Fase3',
  ACESSO: 'Acesso',
  LOG: 'Log'
};
  
/* ============================================================
   1. ROTEAMENTO
   ============================================================ */
  
function doGet(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  
  if (p.ics) {
    return servirICS(p.ics);
  }
  
  var t = HtmlService.createTemplateFromFile('index');
  t.appUrl = getAppUrl();
  t.versao = VERSAO;
  t.viewMode = 'form';
  return t.evaluate()
    .setTitle('Masterclasses de Regência Orquestral · João Rocha')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=5')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
  
/**
 * Inclui um arquivo, avaliando os scriptlets que houver dentro dele.
 *
 * createHtmlOutputFromFile devolve o conteúdo CRU. Com ele, um
 * <?!= include('X') ?> dentro de um arquivo já incluído não roda: chega ao
 * navegador como texto literal, e a tela que ele traria simplesmente não
 * existe. Foi o que aconteceu com o Fase3Formulario, incluído de dentro do
 * Formulario — a Fase 3 subiu sem nenhuma das telas dela.
 *
 * createTemplateFromFile().evaluate() avalia, e o include passa a funcionar
 * em qualquer profundidade. Para arquivo sem scriptlet o efeito é nenhum.
 */
function include(nome) {
  return HtmlService.createTemplateFromFile(nome).evaluate().getContent();
}
  
function getAppUrl() {
  try {
    return ScriptApp.getService().getUrl();
  } catch (err) {
    return '';
  }
}
  
/* ============================================================
   2. PLANILHA — auto-cura
   ============================================================ */
  
function getSS() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP.SS_ID) || PADRAO.SS_ID;
  var ss = SpreadsheetApp.openById(id);
  if (ss.getSpreadsheetTimeZone() !== TZ) ss.setSpreadsheetTimeZone(TZ);
  return ss;
}
  
function getAba(nome) {
  var ss = getSS();
  var aba = ss.getSheetByName(nome);
  if (!aba) {
    garantirAbasBase();
    aba = ss.getSheetByName(nome);
  }
  if (!aba) throw new Error('Aba "' + nome + '" não existe e não pôde ser criada.');
  return aba;
}
  
var CABECALHO_INSCRICOES = [
  'Carimbo', 'ID', 'Nome', 'Sobrenome', 'Email', 'EmailAdicional', 'WhatsApp',
  'Nascimento', 'FaixaEtaria', 'Pais', 'CEP', 'Cidade', 'Estado',
  'ConheciaTrabalho', 'InstrumentoPrincipal', 'OutrosInstrumentos',
  'Professores', 'Instituicoes', 'ExperienciaRegencia', 'RegeGrupo', 'QualGrupo',
  'Encontros', 'Prioridade1', 'Prioridade2', 'Prioridade3',
  'InteresseTransmissao', 'VisaoFuturo',
  'AutorizaJR', 'AutorizaAK', 'Historico'
];
  
var CABECALHO_EVENTOS = [
  'id', 'ordem', 'titulo', 'subtitulo', 'data', 'horaInicio', 'horaFim',
  'modalidade', 'local', 'endereco', 'link', 'avisoApos', 'abertoAte',
  'descricao', 'temRepertorio'
];
  
var CABECALHO_REPERTORIO = ['obraId', 'ordemObra', 'compositor', 'obra', 'trechoId', 'ordemTrecho', 'trecho'];
  
var CABECALHO_CONFIG = ['chave', 'valor'];
  
var CABECALHO_FASE2 = [
  'Carimbo', 'Email', 'Nome', 'Origem', 'Encontros',
  'Prioridade1', 'Prioridade2',
  'CienciaFarrenc', 'ComoLevaPartitura', 'LevaInstrumento', 'ProtocoloInscricao'
];
  
var CABECALHO_LOG = ['Carimbo', 'Nivel', 'Evento', 'Detalhe'];
  
function garantirAbasBase() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP.SS_ID) || PADRAO.SS_ID;
  var ss = SpreadsheetApp.openById(id);
  if (ss.getSpreadsheetTimeZone() !== TZ) ss.setSpreadsheetTimeZone(TZ);
  
  criarAbaSeFaltar(ss, ABAS.INSCRICOES, CABECALHO_INSCRICOES);
  criarAbaSeFaltar(ss, ABAS.EVENTOS, CABECALHO_EVENTOS);
  criarAbaSeFaltar(ss, ABAS.REPERTORIO, CABECALHO_REPERTORIO);
  criarAbaSeFaltar(ss, ABAS.CONFIG, CABECALHO_CONFIG);
  criarAbaSeFaltar(ss, ABAS.FASE2, CABECALHO_FASE2);
  criarAbaSeFaltar(ss, ABAS.LOG, CABECALHO_LOG);
  garantirAbasFase3();
  
  semearEventos(ss);
  semearRepertorio(ss);
  semearConfig(ss);
  
  return 'Abas garantidas em: ' + ss.getName();
}
  
/**
 * Lê o cabeçalho real da aba e devolve {nomeDaColuna: índice}.
 *
 * Ler por posição foi o que quebrou a v2.1: uma coluna nova no meio do
 * CABECALHO deslocou tudo e temRepertorio passou a ler célula vazia, sem
 * erro nenhum. Por nome, acrescentar ou reordenar coluna deixa de importar.
 */
function mapaColunas(aba, esperado) {
  var largura = Math.max(aba.getLastColumn(), esperado.length);
  var cab = aba.getRange(1, 1, 1, largura).getValues()[0];
  var mapa = {};
  for (var i = 0; i < cab.length; i++) {
    var nome = String(cab[i] || '').trim();
    if (nome) mapa[nome] = i;
  }
  return mapa;
}
  
/**
 * Reescreve a linha 1 da aba Eventos com os nomes canônicos.
 *
 * Serve para a planilha que ficou com cabeçalho de 14 nomes e linhas de 15
 * valores: os dados estão na ordem certa, só os rótulos é que não estavam.
 */
function corrigirCabecalhoEventos() {
  var aba = getAba(ABAS.EVENTOS);
  var largura = aba.getLastColumn();
  if (largura !== CABECALHO_EVENTOS.length) {
    return 'Não corrigido automaticamente: a aba tem ' + largura + ' colunas e o esperado é ' +
      CABECALHO_EVENTOS.length + '. Rode recriarEventos().';
  }
  aba.getRange(1, 1, 1, CABECALHO_EVENTOS.length).setValues([CABECALHO_EVENTOS])
    .setFontWeight('bold').setBackground('#0A0A0A').setFontColor('#EAEAEA');
  SpreadsheetApp.flush();
  return 'Cabeçalho da aba Eventos reescrito.';
}
  
/** Acrescenta ao final as colunas que o cabeçalho ainda não tem. */
function migrarCabecalho(aba, esperado) {
  var mapa = mapaColunas(aba, esperado);
  var faltando = esperado.filter(function (c) { return mapa[c] === undefined; });
  if (!faltando.length) return [];
  
  // Se os dados já têm a largura certa, o que está errado são os rótulos,
  // não a estrutura. Acrescentar colunas ao final só pioraria o desalinhamento.
  if (aba.getLastColumn() === esperado.length) {
    aba.getRange(1, 1, 1, esperado.length).setValues([esperado])
      .setFontWeight('bold').setBackground('#0A0A0A').setFontColor('#EAEAEA');
    registrar('AVISO', 'CABECALHO_REESCRITO',
      aba.getName() + ' · rótulos corrigidos: ' + faltando.join(', '));
    return faltando;
  }
  
  var inicio = aba.getLastColumn() + 1;
  aba.getRange(1, inicio, 1, faltando.length).setValues([faltando])
    .setFontWeight('bold').setBackground('#0A0A0A').setFontColor('#EAEAEA');
  registrar('AVISO', 'MIGRACAO_CABECALHO',
    aba.getName() + ' · colunas acrescentadas: ' + faltando.join(', '));
  return faltando;
}
  
function criarAbaSeFaltar(ss, nome, cabecalho) {
  var aba = ss.getSheetByName(nome);
  if (!aba) {
    aba = ss.insertSheet(nome);
  }
  if (aba.getLastRow() === 0) {
    aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho]);
  }
  aba.getRange(1, 1, 1, cabecalho.length)
    .setFontWeight('bold')
    .setBackground('#0A0A0A')
    .setFontColor('#EAEAEA');
  aba.setFrozenRows(1);
  migrarCabecalho(aba, cabecalho);
  return aba;
}
  
/** O desalinhamento da v2.1 nasceu de cabeçalho e semente com larguras
    diferentes. Esta guarda faz isso estourar na hora, não seis dias depois. */
function conferirLarguras(nomeAba, cabecalho, linhas) {
  for (var i = 0; i < linhas.length; i++) {
    if (linhas[i].length !== cabecalho.length) {
      throw new Error('Aba ' + nomeAba + ': a linha ' + (i + 1) + ' tem ' + linhas[i].length +
        ' valores, mas o cabeçalho tem ' + cabecalho.length + ' colunas.');
    }
  }
}
  
var EVENTOS_PADRAO = [
    ['E1', 1, 'Encontro online',
      'Os aspectos não artísticos da regência',
      '31/08/2026', '09:00', '11:00', 'Online',
      'Google Meet', '',
      'https://meet.google.com/srk-hhaw-bax',
      '31/08/2026 09:00', '31/08/2026 10:00',
      'Aberto ao público em geral. Disciplina e constância, musicalidade e cultura, capacidade organizacional, liderança e carisma, espírito empreendedor — o que o regente precisa antes e depois de subir ao pódio.',
      'NAO'],
    ['E2', 2, 'Primeiro encontro presencial',
      'Prática de regência com pianista',
      '08/09/2026', '17:30', '19:30', 'Presencial',
      'Centro Cultural Camargo Guarnieri',
      'Rua do Anfiteatro, 109 · Butantã',
      '',
      '08/09/2026 17:30', '08/09/2026 18:30',
      'Prática de regência com pianista correpetidor, sobre os excertos que você escolher. Cerca de 10 minutos de pódio por participante.',
      'SIM'],
    ['E3', 3, 'Segundo encontro presencial',
      'Análise do repertório da OCAM',
      '09/09/2026', '14:00', '16:00', 'Presencial',
      'Centro Cultural Camargo Guarnieri',
      'Rua do Anfiteatro, 109 · Butantã',
      '',
      '09/09/2026 14:00', '09/09/2026 15:00',
      'Análise do repertório da OCAM, com foco no primeiro movimento da Sinfonia nº 3, op. 36, de Louise Farrenc. Análise comparada de partitura e gravações. Havendo quarteto disponível, prática instrumental.',
      'NAO']
  ];
  
function semearEventos(ss) {
  var aba = ss.getSheetByName(ABAS.EVENTOS);
  if (aba.getLastRow() > 1) return;
  conferirLarguras(ABAS.EVENTOS, CABECALHO_EVENTOS, EVENTOS_PADRAO);
  aba.getRange(2, 1, EVENTOS_PADRAO.length, CABECALHO_EVENTOS.length).setValues(EVENTOS_PADRAO);
}
  
var REPERTORIO_PADRAO = [
    ['O1', 1, 'Beethoven', 'Abertura Egmont, op. 84', 'O1T1', 1, 'Introdução Sostenuto ma non troppo'],
    ['O1', 1, 'Beethoven', 'Abertura Egmont, op. 84', 'O1T2', 2, 'Transição ao Allegro'],
    ['O1', 1, 'Beethoven', 'Abertura Egmont, op. 84', 'O1T3', 3, 'Coda Allegro con brio ("Siegessymphonie")'],
  
    ['O2', 2, 'Beethoven', 'Sinfonia nº 7, op. 92', 'O2T1', 1, 'I — Poco sostenuto completo e transição ao Vivace (c. cc. 53–88)'],
    ['O2', 2, 'Beethoven', 'Sinfonia nº 7, op. 92', 'O2T2', 2, 'II — Allegretto, da abertura até o fugato'],
    ['O2', 2, 'Beethoven', 'Sinfonia nº 7, op. 92', 'O2T3', 3, 'IV — abertura e coda'],
  
    ['O3', 3, 'Stravinsky', 'Histoire du Soldat', 'O3T1', 1, 'Marche du Soldat'],
    ['O3', 3, 'Stravinsky', 'Histoire du Soldat', 'O3T2', 2, 'Petit Concert'],
    ['O3', 3, 'Stravinsky', 'Histoire du Soldat', 'O3T3', 3, 'Marche Royale'],
    ['O3', 3, 'Stravinsky', 'Histoire du Soldat', 'O3T4', 4, 'Trois Danses (Tango–Valse–Ragtime)'],
    ['O3', 3, 'Stravinsky', 'Histoire du Soldat', 'O3T5', 5, 'Danse du Diable e Marche Triomphale du Diable'],
  
    ['O4', 4, 'Schumann', 'Sinfonia nº 4, op. 120', 'O4T1', 1, 'I — introdução Ziemlich langsam e transição ao Lebhaft'],
    ['O4', 4, 'Schumann', 'Sinfonia nº 4, op. 120', 'O4T2', 2, 'Transição III → IV (Langsam → Lebhaft)'],
    ['O4', 4, 'Schumann', 'Sinfonia nº 4, op. 120', 'O4T3', 3, 'IV — coda (Schneller/Presto)']
  ];
  
function semearRepertorio(ss) {
  var aba = ss.getSheetByName(ABAS.REPERTORIO);
  if (aba.getLastRow() > 1) return;
  conferirLarguras(ABAS.REPERTORIO, CABECALHO_REPERTORIO, REPERTORIO_PADRAO);
  aba.getRange(2, 1, REPERTORIO_PADRAO.length, CABECALHO_REPERTORIO.length).setValues(REPERTORIO_PADRAO);
}
  
var CONFIG_PADRAO = [
  ['tituloEvento', 'Masterclasses de Regência Orquestral'],
  ['subtituloEvento', 'Maestro João Rocha · ECA/USP · Academia Kephra'],
  ['assinaturaEmail', 'Equipe Academia Kephra'],
  ['emailContato', 'contato@studiokephra.org'],
  ['instagramAK', 'https://www.instagram.com/academiakephra/'],
  ['instagramJR', 'https://www.instagram.com/joaorocha_conductor/'],
  ['instagramUZP', 'https://www.instagram.com/universidadezumbioficial/'],
  ['ensaioAbertoData', '25/09/2026'],
  ['ensaioAbertoHora', '19:00'],
  ['ensaioAbertoNumero', '2'],
  ['ensaioAbertoLocal', 'Universidade Zumbi dos Palmares'],
  ['ensaioAbertoEndereco', 'Avenida Santos Dumont, 843 · São Paulo'],
  ['maxPrioridades', '2'],
  ['ensaiosOcam', 'terças, quintas e sextas · Centro Cultural Camargo Guarnieri'],
  ['minutosPodio', '10'],
  ['creditoNome', 'Opus AI'],
  ['creditoUrl', 'https://opusaitech.com/'],
  ['inscricoesAbertas', 'SIM'],

  /* ---- Fase 3 · preparo da obra ---- */
  ['fase3Aberta', 'SIM'],
  ['quizMinutos', '4'],
  ['pastaPartiturasUrl', 'https://drive.google.com/drive/folders/1gcGlhPHBL_2HjpJaderVvEsuo2BbhVme'],
  ['livroAnaliseTitulo', 'Elements of Sonata Theory'],
  ['livroAnaliseAutores', 'James Hepokoski e Warren Darcy'],
  ['livroAnaliseEditora', 'Oxford University Press, 2006'],
  ['obraAnalise', 'Sinfonia nº 3, op. 36, de Louise Farrenc'],
  ['appUrlPublica', ''],
  ['segundosRetorno', '25']
];
  
/**
 * Acrescenta à aba Config as chaves que faltam, sem tocar nas existentes.
 *
 * A versão anterior só preenchia aba vazia. Como a Config já existia, toda
 * chave nova ficou de fora e o e-mail passou a cair nos valores de fallback.
 */
function semearConfig(ss) {
  var aba = ss.getSheetByName(ABAS.CONFIG);
  var existentes = {};
  
  if (aba.getLastRow() > 1) {
    var v = aba.getRange(2, 1, aba.getLastRow() - 1, 2).getValues();
    for (var i = 0; i < v.length; i++) {
      var k = String(v[i][0]).trim();
      if (k) existentes[k] = true;
    }
  }
  
  var faltando = CONFIG_PADRAO.filter(function (p) { return !existentes[p[0]]; });
  if (!faltando.length) return [];
  
  aba.getRange(aba.getLastRow() + 1, 1, faltando.length, 2).setValues(faltando);
  registrar('AVISO', 'CONFIG_COMPLETADA',
    faltando.map(function (f) { return f[0]; }).join(', '));
  return faltando.map(function (f) { return f[0]; });
}
  
/* ============================================================
   2b. RESSINCRONIZAÇÃO
   ============================================================ */
  
/**
 * As abas Eventos e Repertorio pertencem ao código, não ao usuário.
 * Quem as edita é quem edita este arquivo. Como semearEventos e
 * semearRepertorio só preenchem aba vazia, toda mudança de texto, endereço,
 * título de obra ou janela de tolerância feita depois da primeira publicação
 * ficava só no código e nunca chegava à planilha. Esta função elimina essa
 * divergência: apaga as duas abas e as reescreve a partir das constantes.
 *
 * A aba Config é tratada de outro jeito: ela tem conteúdo que você pode ter
 * ajustado à mão, então só acrescentamos o que falta. As poucas chaves que
 * governam comportamento, e não texto, são realinhadas e o relatório diz quais.
 */
var CONFIG_DO_CODIGO = ['maxPrioridades'];
  
function reescreverAba(ss, nome, cabecalho, linhas) {
  conferirLarguras(nome, cabecalho, linhas);
  
  var aba = ss.getSheetByName(nome);
  if (!aba) aba = ss.insertSheet(nome);
  aba.clear();
  
  aba.getRange(1, 1, 1, cabecalho.length).setValues([cabecalho])
    .setFontWeight('bold').setBackground('#0A0A0A').setFontColor('#EAEAEA');
  aba.getRange(2, 1, linhas.length, cabecalho.length).setValues(linhas);
  aba.setFrozenRows(1);
  
  return linhas.length;
}
  
function ressincronizarConfiguracao() {
  var ss = getSS();
  var out = ['VERSÃO: ' + VERSAO, ''];
  
  out.push('Eventos: ' + reescreverAba(ss, ABAS.EVENTOS, CABECALHO_EVENTOS, EVENTOS_PADRAO) +
    ' linhas reescritas');
  out.push('Repertorio: ' + reescreverAba(ss, ABAS.REPERTORIO, CABECALHO_REPERTORIO, REPERTORIO_PADRAO) +
    ' linhas reescritas');
  
  var acrescentadas = semearConfig(ss);
  out.push('Config: ' + (acrescentadas.length
    ? acrescentadas.length + ' chaves acrescentadas — ' + acrescentadas.join(', ')
    : 'nenhuma chave faltando'));
  
  // Chaves de comportamento voltam ao valor canônico, e o relatório diz.
  var aba = ss.getSheetByName(ABAS.CONFIG);
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, 2).getValues();
  CONFIG_DO_CODIGO.forEach(function (chave) {
    var padrao = '';
    CONFIG_PADRAO.forEach(function (p) { if (p[0] === chave) padrao = p[1]; });
    for (var i = 0; i < v.length; i++) {
      if (String(v[i][0]).trim() !== chave) continue;
      var atual = valorConfig(v[i][1]);
      if (atual !== padrao) {
        aba.getRange(i + 2, 2).setValue(padrao);
        out.push('Config: ' + chave + ' ajustado de ' + atual + ' para ' + padrao);
        registrar('AVISO', 'CONFIG_REALINHADA', chave + ': ' + atual + ' → ' + padrao);
      }
    }
  });
  
  SpreadsheetApp.flush();
  
  out.push('');
  var evs = getEventos();
  evs.forEach(function (ev) {
    out.push('  ' + ev.letra + ' · ' + ev.dataTexto + ' ' + ev.horaInicio + '–' + ev.horaFim +
      ' · aceita até ' + ev.horaLimite +
      ' · repertório: ' + (ev.temRepertorio ? 'SIM' : 'não'));
  });
  
  var janelaZero = evs.filter(function (e) { return e.horaAviso === e.horaLimite; });
  if (janelaZero.length) {
    out.push('');
    out.push('ATENÇÃO · sem janela de tolerância em: ' +
      janelaZero.map(function (e) { return e.id; }).join(', '));
  }
  
  var rep = getRepertorio();
  out.push('');
  out.push('Repertório: ' + rep.map(function (o) { return o.obra; }).join(' · '));
  
  var texto = out.join('\n');
  Logger.log(texto);
  return texto;
}
  
/* ============================================================
   3. LEITURA DE CONFIGURAÇÃO
   ============================================================ */
  
/**
 * Uma célula de data no Sheets volta como Date. String() nela produz
 * "Fri Sep 25 2026 00:00:00 GMT-0300". Uma célula só de hora volta como
 * 30/12/1899 com a hora certa — daí o "Sat Dec 30 1899" que apareceu no
 * e-mail. Formatamos cada caso no fuso da planilha.
 */
function valorConfig(v) {
  if (v instanceof Date) {
    var ano = Number(Utilities.formatDate(v, TZ, 'yyyy'));
    return ano < 1900
      ? Utilities.formatDate(v, TZ, 'HH:mm')
      : Utilities.formatDate(v, TZ, 'dd/MM/yyyy');
  }
  if (typeof v === 'number') return String(v);
  return String(v === null || v === undefined ? '' : v).trim();
}
  
function getConfig() {
  var aba = getAba(ABAS.CONFIG);
  var cfg = {};
  if (aba.getLastRow() < 2) return cfg;
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, 2).getValues();
  for (var i = 0; i < v.length; i++) {
    var chave = String(v[i][0]).trim();
    if (!chave) continue;
    cfg[chave] = valorConfig(v[i][1]);
  }
  return cfg;
}
  
/**
 * Datas sem depender do fuso do script.
 *
 * O objeto Date do Apps Script usa o fuso configurado no projeto. Se ele não
 * estiver em America/Sao_Paulo, toda a lógica de abertura e encerramento
 * desloca três horas em silêncio. Por isso não comparamos objetos Date:
 * reduzimos tudo a componentes de relógio de parede e comparamos números.
 */
function partesDeData(valor, horaFallback) {
  var y, mo, d, h = null, mi = null;
  
  if (valor instanceof Date) {
    var t = Utilities.formatDate(valor, TZ, 'yyyy-MM-dd-HH-mm').split('-');
    y = +t[0]; mo = +t[1]; d = +t[2]; h = +t[3]; mi = +t[4];
    if (h === 0 && mi === 0) { h = null; mi = null; }
  } else {
    var m = String(valor || '').trim()
      .match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\sT]+(\d{1,2}):(\d{2}))?$/);
    if (!m) return null;
    d = +m[1]; mo = +m[2]; y = +m[3];
    if (m[4] !== undefined) { h = +m[4]; mi = +m[5]; }
  }
  
  if (h === null) {
    var f = String(horaFallback || '').match(/^(\d{1,2}):?(\d{2})$/);
    if (horaFallback instanceof Date) {
      var hf = Utilities.formatDate(horaFallback, TZ, 'HH:mm').split(':');
      h = +hf[0]; mi = +hf[1];
    } else if (f) { h = +f[1]; mi = +f[2]; }
    else { h = 0; mi = 0; }
  }
  
  return { y: y, mo: mo, d: d, h: h, mi: mi };
}
  
/** yyyyMMddHHmm como número — comparável, ordenável, sem fuso. */
function carimbo(p) {
  return p.y * 100000000 + p.mo * 1000000 + p.d * 10000 + p.h * 100 + p.mi;
}
  
function agoraPartes() {
  var t = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd-HH-mm').split('-');
  return { y: +t[0], mo: +t[1], d: +t[2], h: +t[3], mi: +t[4] };
}
  
function pad2(n) { return (n < 10 ? '0' : '') + n; }
  
function horaTexto(valor) {
  if (valor instanceof Date) return Utilities.formatDate(valor, TZ, 'HH:mm');
  var m = String(valor || '').trim().match(/^(\d{1,2}):?(\d{2})$/);
  return m ? pad2(+m[1]) + ':' + m[2] : String(valor || '').trim();
}
  
/** Dia da semana via UTC, para o fuso do script não interferir. */
function diaSemanaDe(p) {
  var dia = new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay();
  return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][dia];
}
  
/** O risco real é alguém aparecer na hora errada. O horário manda. */
function periodoDoDia(hora) {
  var h = parseInt(String(horaTexto(hora)).split(':')[0], 10);
  if (isNaN(h)) return '';
  if (h < 12) return 'manhã';
  if (h < 16) return 'tarde';
  if (h < 19) return 'fim de tarde';
  return 'noite';
}
  
var MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  
function getEventos() {
  var aba = getAba(ABAS.EVENTOS);
  if (aba.getLastRow() < 2) throw new Error('A aba Eventos está vazia. Rode garantirAbasBase().');
  
  var col = mapaColunas(aba, CABECALHO_EVENTOS);
  var faltando = CABECALHO_EVENTOS.filter(function (c) { return col[c] === undefined; });
  if (faltando.length) {
    throw new Error('A aba Eventos está sem as colunas: ' + faltando.join(', ') +
      '. Rode garantirAbasBase() e preencha-as.');
  }
  
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var agora = carimbo(agoraPartes());
  var out = [];
  
  function cel(linha, nome) { return linha[col[nome]]; }
  
  for (var i = 0; i < v.length; i++) {
    var r = v[i];
    if (!String(cel(r, 'id')).trim()) continue;
  
    var horaIni = cel(r, 'horaInicio');
    var ini = partesDeData(cel(r, 'data'), horaIni);
    if (!ini) continue;
    var aviso = partesDeData(cel(r, 'avisoApos'), horaIni) || ini;
    var limite = partesDeData(cel(r, 'abertoAte'), horaIni) || ini;
  
    // aberto → iniciado (entra com ciência) → encerrado (não aceita mais)
    var estado = 'aberto';
    if (agora >= carimbo(limite)) estado = 'encerrado';
    else if (agora >= carimbo(aviso)) estado = 'iniciado';
  
    var ordem = Number(cel(r, 'ordem')) || 0;
  
    out.push({
      id: String(cel(r, 'id')).trim(),
      ordem: ordem,
      letra: String.fromCharCode(64 + (ordem || 1)),
      titulo: String(cel(r, 'titulo')).trim(),
      subtitulo: String(cel(r, 'subtitulo')).trim(),
      dataISO: ini.y + '-' + pad2(ini.mo) + '-' + pad2(ini.d),
      dataTexto: pad2(ini.d) + '/' + pad2(ini.mo),
      dataCurta: pad2(ini.d) + ' ' + MESES_CURTOS[ini.mo - 1],
      diaSemana: diaSemanaDe(ini),
      horaInicio: horaTexto(horaIni),
      horaFim: horaTexto(cel(r, 'horaFim')),
      periodo: periodoDoDia(horaIni),
      horaAviso: pad2(aviso.h) + 'h' + pad2(aviso.mi),
      horaLimite: pad2(limite.h) + 'h' + pad2(limite.mi),
      dataAviso: pad2(aviso.d) + '/' + pad2(aviso.mo),
      modalidade: String(cel(r, 'modalidade')).trim(),
      local: String(cel(r, 'local')).trim(),
      endereco: String(cel(r, 'endereco')).trim(),
      link: String(cel(r, 'link')).trim(),
      descricao: String(cel(r, 'descricao')).trim(),
      temRepertorio: String(cel(r, 'temRepertorio')).trim().toUpperCase() === 'SIM',
      estado: estado,
      disponivel: estado !== 'encerrado'
    });
  }
  
  out.sort(function (a, b) { return a.ordem - b.ordem; });
  return out;
}
  
var MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
  
function getRepertorio() {
  var aba = getAba(ABAS.REPERTORIO);
  if (aba.getLastRow() < 2) return [];
  
  var col = mapaColunas(aba, CABECALHO_REPERTORIO);
  var faltando = CABECALHO_REPERTORIO.filter(function (c) { return col[c] === undefined; });
  if (faltando.length) {
    throw new Error('A aba Repertorio está sem as colunas: ' + faltando.join(', ') + '.');
  }
  
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues();
  var mapa = {}, ordem = [];
  
  for (var i = 0; i < v.length; i++) {
    var r = v[i];
    var obraId = String(r[col.obraId]).trim();
    if (!obraId) continue;
    if (!mapa[obraId]) {
      mapa[obraId] = {
        id: obraId,
        ordem: Number(r[col.ordemObra]) || 0,
        compositor: String(r[col.compositor]).trim(),
        obra: String(r[col.obra]).trim(),
        trechos: []
      };
      ordem.push(obraId);
    }
    mapa[obraId].trechos.push({
      id: String(r[col.trechoId]).trim(),
      ordem: Number(r[col.ordemTrecho]) || 0,
      nome: String(r[col.trecho]).trim()
    });
  }
  
  var out = ordem.map(function (id) {
    mapa[id].trechos.sort(function (a, b) { return a.ordem - b.ordem; });
    return mapa[id];
  });
  out.sort(function (a, b) { return a.ordem - b.ordem; });
  return out;
}
  
/** Chamada única do cliente. Uma ida ao servidor, não quatro. */
function getDadosIniciais() {
  garantirAbasBase();
  var cfg = getConfig();
  return {
    versao: VERSAO,
    appUrl: getAppUrl(),
    config: cfg,
    eventos: getEventos(),
    repertorio: getRepertorio(),
    inscricoesAbertas: (cfg.inscricoesAbertas || 'SIM').toUpperCase() === 'SIM'
  };
}
  
/* ============================================================
   4. GRAVAÇÃO
   ============================================================ */
  
function salvarInscricao(dados) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  
    var erros = validarNoServidor(dados);
    if (erros.length) {
      return { ok: false, erros: erros };
    }
  
    var aba = getAba(ABAS.INSCRICOES);
    var id = 'MRO-' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd-HHmmss') +
      '-' + Math.floor(Math.random() * 900 + 100);
    var agora = new Date();
  
    var eventos = getEventos();
    var mapaEventos = {};
    eventos.forEach(function (ev) { mapaEventos[ev.id] = ev; });
  
    var encontrosValidos = (dados.encontros || []).filter(function (eid) {
      return mapaEventos[eid] && mapaEventos[eid].estado !== 'encerrado';
    });
  
    var linha = [
      Utilities.formatDate(agora, TZ, 'dd/MM/yyyy HH:mm:ss'),
      id,
      limpar(dados.nome),
      limpar(dados.sobrenome),
      limpar(dados.email).toLowerCase(),
      limpar(dados.emailAdicional).toLowerCase(),
      "'" + limpar(dados.whatsapp),
      limpar(dados.nascimento),
      faixaEtaria(dados.nascimento),
      limpar(dados.pais),
      "'" + limpar(dados.cep),
      limpar(dados.cidade),
      limpar(dados.estado),
      limpar(dados.conheciaTrabalho),
      limpar(dados.instrumentoPrincipal),
      (dados.outrosInstrumentos || []).join(' · '),
      (dados.professores || []).join(' · '),
      (dados.instituicoes || []).join(' · '),
      limpar(dados.experienciaRegencia),
      limpar(dados.regeGrupo),
      limpar(dados.qualGrupo),
      encontrosValidos.map(function (eid) { return mapaEventos[eid].dataTexto; }).join(' · '),
      textoPrioridade(dados.prioridades, 0),
      textoPrioridade(dados.prioridades, 1),
      textoPrioridade(dados.prioridades, 2),
      limpar(dados.interesseTransmissao),
      limpar(dados.visaoFuturo),
      dados.autorizaJR ? 'SIM' : 'NÃO',
      dados.autorizaAK ? 'SIM' : 'NÃO',
      Utilities.formatDate(agora, TZ, 'dd/MM/yyyy HH:mm') + ' · CRIADO · inscrição pública'
    ];
  
    aba.appendRow(linha);
    SpreadsheetApp.flush();
  
    // As escolhas da fase 2 vêm no mesmo pacote: uma ida ao servidor,
    // uma gravação em cada aba, um e-mail só. Duas chamadas separadas
    // produziam dois e-mails com conteúdo sobreposto.
    var prioridades = [];
    try {
      dados.protocolo = id;
      prioridades = gravarFase2(dados, mapaEventos, encontrosValidos);
    } catch (errF2) {
      registrar('ERRO', 'FASE2_NA_INSCRICAO', id + ' · ' + errF2.message);
    }
  
    var resumo = montarResumo(dados, encontrosValidos, mapaEventos, id);
    resumo.prioridades = [0, 1].map(function (i) { return textoTrecho(prioridades, i); }).filter(String);
    resumo.cienciaFarrenc = dados.cienciaFarrenc ? 'Sim' : 'Não';
    resumo.comoLevaPartitura = limpar(dados.comoLevaPartitura);
    resumo.levaInstrumento = dados.levaInstrumento ? 'Sim' : 'Não';
  
    try {
      enviarEmailConfirmacao(dados, resumo);
      registrar('INFO', 'EMAIL_ENVIADO', id + ' → ' + dados.email);
    } catch (errMail) {
      registrar('ERRO', 'EMAIL_FALHOU', id + ' · ' + errMail.message);
    }
  
    return { ok: true, id: id, resumo: resumo };
  
  } catch (err) {
    registrar('ERRO', 'SALVAR_FALHOU', err.message);
    return { ok: false, erros: ['Não foi possível gravar a inscrição: ' + err.message] };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}
  
function limpar(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 2000);
}
  
function validarNoServidor(d) {
  var erros = [];
  if (!limpar(d.nome)) erros.push('Nome é obrigatório.');
  if (!limpar(d.sobrenome)) erros.push('Sobrenome é obrigatório.');
  
  var email = limpar(d.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) erros.push('E-mail inválido.');
  
  var adicional = limpar(d.emailAdicional).toLowerCase();
  if (adicional && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(adicional)) {
    erros.push('E-mail adicional inválido.');
  }
  
  var fone = limpar(d.whatsapp).replace(/\D/g, '');
  if (fone.length < 8) erros.push('Número de WhatsApp inválido.');
  
  if (!limpar(d.instrumentoPrincipal)) erros.push('Instrumento principal é obrigatório.');
  if (!limpar(d.experienciaRegencia)) erros.push('Tempo de experiência é obrigatório.');
  
  if (!d.encontros || !d.encontros.length) erros.push('Selecione ao menos um encontro.');
  
  if (!d.autorizaJR && !d.autorizaAK) {
    // Autorização de marketing é opcional; não bloqueia.
  }
  return erros;
}
  
function faixaEtaria(nascimento) {
  var m = String(nascimento || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  var nasc = new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  var idade = Math.floor((new Date() - nasc) / (365.25 * 24 * 3600 * 1000));
  if (idade < 18) return 'até 17';
  if (idade < 25) return '18–24';
  if (idade < 35) return '25–34';
  if (idade < 45) return '35–44';
  if (idade < 60) return '45–59';
  return '60+';
}
  
function textoPrioridade(prioridades, i) {
  if (!prioridades || !prioridades[i]) return '';
  var p = prioridades[i];
  if (!p.obra) return '';
  var trechos = (p.trechos || []).join(' | ');
  return p.compositor + ' — ' + p.obra + (trechos ? ': ' + trechos : '');
}
  
function montarResumo(d, encontrosValidos, mapaEventos, id) {
  return {
    id: id,
    nomeCompleto: limpar(d.nome) + ' ' + limpar(d.sobrenome),
    email: limpar(d.email).toLowerCase(),
    emailAdicional: limpar(d.emailAdicional).toLowerCase(),
    whatsapp: limpar(d.whatsapp),
    nascimento: limpar(d.nascimento),
    localidade: [limpar(d.cidade), limpar(d.estado), limpar(d.pais)].filter(String).join(' · '),
    instrumentoPrincipal: limpar(d.instrumentoPrincipal),
    outrosInstrumentos: (d.outrosInstrumentos || []).join(' · '),
    professores: (d.professores || []).join(' · '),
    instituicoes: (d.instituicoes || []).join(' · '),
    experienciaRegencia: limpar(d.experienciaRegencia),
    regeGrupo: limpar(d.regeGrupo) + (limpar(d.qualGrupo) ? ' — ' + limpar(d.qualGrupo) : ''),
    interesseTransmissao: limpar(d.interesseTransmissao),
    visaoFuturo: limpar(d.visaoFuturo),
    autorizaJR: d.autorizaJR ? 'Sim' : 'Não',
    autorizaAK: d.autorizaAK ? 'Sim' : 'Não',
    prioridades: [],
    encontros: encontrosValidos.map(function (eid) { return mapaEventos[eid]; })
  };
}
  
/* ============================================================
   4b. FASE 2 — escolha de trechos e compromisso do dia 09
   ============================================================ */
  
function normalizarEmail(v) {
  return String(v || '').trim().toLowerCase();
}
  
/**
 * Portão de entrada. Devolve o mínimo necessário para personalizar a
 * continuação: nome e encontros já indicados. Nunca devolve telefone,
 * nascimento ou qualquer outro dado pessoal — o e-mail digitado não
 * prova identidade, então o que volta na resposta precisa ser inócuo.
 */
function buscarInscricao(email) {
  var alvo = normalizarEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(alvo)) {
    return { ok: false, erro: 'E-mail inválido.' };
  }
  
  var aba = getAba(ABAS.INSCRICOES);
  if (aba.getLastRow() < 2) return { ok: true, encontrado: false };
  
  var v = aba.getRange(2, 1, aba.getLastRow() - 1, CABECALHO_INSCRICOES.length).getValues();
  var eventos = getEventos();
  
  // Varre de baixo para cima: se houver duplicata, vale a inscrição mais recente.
  for (var i = v.length - 1; i >= 0; i--) {
    var principal = normalizarEmail(v[i][4]);
    var adicional = normalizarEmail(v[i][5]);
    if (principal !== alvo && adicional !== alvo) continue;
  
    var marcados = String(v[i][20] || '');
    var ids = eventos.filter(function (ev) {
      return marcados.indexOf(ev.dataTexto) !== -1;
    }).map(function (ev) { return ev.id; });
  
    return {
      ok: true,
      encontrado: true,
      nome: String(v[i][2] || '').trim(),
      protocolo: String(v[i][1] || '').trim(),
      encontros: ids
    };
  }
  
  return { ok: true, encontrado: false };
}
  
/** Grava a linha da Fase2. Não envia e-mail — quem envia é quem chamou. */
function gravarFase2(dados, mapa, escolhidos) {
  var prioridades = (dados.prioridades || []).filter(function (p) { return p && p.obra; });
  var aba = getAba(ABAS.FASE2);
  var agora = new Date();
  
  aba.appendRow([
    Utilities.formatDate(agora, TZ, 'dd/MM/yyyy HH:mm:ss'),
    normalizarEmail(dados.email),
    limpar(dados.nome),
    dados.origem === 'novo' ? 'Cadastro novo' : 'Inscrição existente',
    escolhidos.map(function (id) { return mapa[id].dataTexto; }).join(' · '),
    textoTrecho(prioridades, 0),
    textoTrecho(prioridades, 1),
    dados.cienciaFarrenc ? 'SIM' : 'NÃO',
    limpar(dados.comoLevaPartitura),
    dados.levaInstrumento ? 'SIM' : 'NÃO',
    limpar(dados.protocolo)
  ]);
  SpreadsheetApp.flush();
  registrar('INFO', 'FASE2_GRAVADO', normalizarEmail(dados.email) + ' · linhas: ' + aba.getLastRow());
  return prioridades;
}
  
function salvarFase2(dados) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  
    registrar('INFO', 'FASE2_RECEBIDO', JSON.stringify({
      email: dados && dados.email,
      origem: dados && dados.origem,
      encontros: dados && dados.encontros,
      prioridades: dados && dados.prioridades ? dados.prioridades.length : null,
      ciencia: dados && dados.cienciaFarrenc
    }));
  
    var email = normalizarEmail(dados.email);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return { ok: false, erros: ['E-mail inválido.'] };
    }
  
    var eventos = getEventos();
    var mapa = {};
    eventos.forEach(function (ev) { mapa[ev.id] = ev; });
  
    var escolhidos = (dados.encontros || []).filter(function (id) { return !!mapa[id]; });
    if (!escolhidos.length) {
      registrar('ERRO', 'FASE2_SEM_ENCONTROS',
        'recebidos: ' + JSON.stringify(dados.encontros) +
        ' · conhecidos: ' + eventos.map(function (e) { return e.id; }).join(','));
      return { ok: false, erros: ['Nenhum dos encontros enviados existe na aba Eventos.'] };
    }
  
    var vaiAoDois = escolhidos.some(function (id) { return mapa[id].temRepertorio; });
    var prioridades = (dados.prioridades || []).filter(function (p) { return p && p.obra; });
    if (vaiAoDois && !prioridades.length) {
      return { ok: false, erros: ['Escolha ao menos um trecho para o encontro do dia 08.'] };
    }
  
    var aba = getAba(ABAS.FASE2);
    var agora = new Date();
  
    var prioridadesGravadas = gravarFase2(dados, mapa, escolhidos);
  
    var resumo = {
      id: limpar(dados.protocolo) || 'FASE2-' + Utilities.formatDate(agora, TZ, 'yyyyMMdd-HHmmss'),
      nomeCompleto: limpar(dados.nome),
      email: email,
      emailAdicional: '',
      prioridades: [0, 1].map(function (i) { return textoTrecho(prioridadesGravadas, i); }).filter(String),
      cienciaFarrenc: dados.cienciaFarrenc ? 'Sim' : 'Não',
      comoLevaPartitura: limpar(dados.comoLevaPartitura),
      levaInstrumento: dados.levaInstrumento ? 'Sim' : 'Não',
      encontros: escolhidos.map(function (id) { return mapa[id]; })
    };
  
    try {
      enviarEmailFase2(resumo);
      registrar('INFO', 'FASE2_EMAIL', email);
    } catch (err) {
      registrar('ERRO', 'FASE2_EMAIL_FALHOU', email + ' · ' + err.message);
    }
  
    return { ok: true, id: resumo.id, resumo: resumo };
  
  } catch (err) {
    registrar('ERRO', 'FASE2_FALHOU', err.message + ' · ' + (err.stack || '').slice(0, 300));
    return { ok: false, erros: ['Não foi possível gravar: ' + err.message] };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}
  
function textoTrecho(prioridades, i) {
  if (!prioridades || !prioridades[i]) return '';
  var p = prioridades[i];
  return p.compositor + ' — ' + p.obra + (p.trecho ? ': ' + p.trecho : '');
}
  
/* ============================================================
   5. E-MAIL
   ============================================================ */
  
function escapeHtml(s) {
  return String(s === null || s === undefined ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
  
function enviarEmailConfirmacao(dados, resumo) {
  var cfg = getConfig();
  var appUrl = getAppUrl();
  
  var destinatarios = [resumo.email];
  if (resumo.emailAdicional) destinatarios.push(resumo.emailAdicional);
  
  GmailApp.sendEmail(
    destinatarios.join(','),
    'Inscrição confirmada · Masterclasses de Regência Orquestral',
    textoSimples(resumo, cfg),
    {
      htmlBody: montarHtmlEmail(resumo, cfg, appUrl, ''),
      name: cfg.assinaturaEmail || 'Equipe Academia Kephra',
      replyTo: cfg.emailContato || PADRAO.CONTATO
    }
  );
}
  
/* Tipografia do e-mail: Montserrat não carrega em cliente de e-mail.
   O manual da marca designa Arial como substituto oficial. */
var FONTE = "Arial,Helvetica,sans-serif";
  
function linhaResumo(rotulo, valor) {
  if (!valor) return '';
  return '<tr>' +
    '<td style="padding:11px 22px 11px 0;border-bottom:1px solid #E8E8E8;font:400 10.5px/1.6 ' + FONTE + ';' +
    'letter-spacing:.13em;text-transform:uppercase;color:#9A9A9A;width:36%;vertical-align:top;">' +
    escapeHtml(rotulo) + '</td>' +
    '<td style="padding:11px 0;border-bottom:1px solid #E8E8E8;font:400 14.5px/1.55 ' + FONTE + ';' +
    'color:#1A1A1A;width:64%;vertical-align:top;">' + escapeHtml(valor) + '</td>' +
    '</tr>';
}
  
/** Rubrica de seção: filete + rótulo miúdo. Nenhum ouro aqui. */
function rubrica(texto) {
  return '<div style="border-top:1px solid #DCDCDC;padding-top:13px;margin-bottom:16px;' +
    'font:400 10px/1.6 ' + FONTE + ';letter-spacing:.24em;text-transform:uppercase;color:#8A8A8A;">' +
    escapeHtml(texto) + '</div>';
}
  
/** A assinatura do e-mail: a marca de ensaio, como aparece na partitura. */
function marcaDeEnsaio(letra) {
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;"><tr>' +
    '<td width="36" height="36" align="center" valign="middle" ' +
    'style="width:36px;height:36px;background:#E0C56E;font:700 17px/36px ' + FONTE + ';' +
    'color:#0A0A0A;text-align:center;letter-spacing:.04em;">' + escapeHtml(letra) + '</td>' +
    '</tr></table>';
}
  
function botaoDiscreto(url, rotulo) {
  return '<a href="' + url + '" style="display:inline-block;padding:10px 15px;margin:0 6px 6px 0;' +
    'border:1px solid #C4C4C4;color:#2A2A2A;text-decoration:none;font:400 11.5px/1 ' + FONTE + ';' +
    'letter-spacing:.09em;">' + escapeHtml(rotulo) + '</a>';
}
  
/* Período do dia, no mesmo eixo de temperatura da plataforma.
   A cor reforça; quem carrega a informação é o horário, em corpo grande. */
var CORES_PERIODO = {
  'manhã':        { fundo: '#FFFFFF', texto: '#4A6B84', borda: '#9FB8CC' },
  'tarde':        { fundo: '#EAEAEA', texto: '#0A0A0A', borda: '#CFCFCF' },
  'fim de tarde': { fundo: '#5E7A94', texto: '#FFFFFF', borda: '#5E7A94' },
  'noite':        { fundo: '#0A0A0A', texto: '#9FB8CC', borda: '#0A0A0A' }
};
  
function seloPeriodo(ev) {
  var c = CORES_PERIODO[ev.periodo] || CORES_PERIODO['tarde'];
  return '<span style="display:inline-block;background:' + c.fundo + ';color:' + c.texto + ';' +
    'border:1px solid ' + c.borda + ';padding:4px 9px;font:700 10px/1.3 ' + FONTE + ';' +
    'letter-spacing:.16em;text-transform:uppercase;">' + escapeHtml(ev.periodo) + '</span>';
}
  
function duracaoEvento(ev) {
  function min(h) { var p = String(h).split(':'); return (+p[0]) * 60 + (+p[1]); }
  var d = min(ev.horaFim) - min(ev.horaInicio);
  if (!d || d < 0) return '';
  return d + ' minutos · ' + (ev.modalidade === 'Online' ? 'online' : 'presencial');
}
  
function blocoEvento(ev, appUrl) {
  var ics = appUrl ? appUrl + '?ics=' + encodeURIComponent(ev.id) : '';
  var gcal = urlGoogleCalendar(ev);
  
  var ondeHtml;
  if (ev.modalidade === 'Online' && ev.link) {
    ondeHtml = 'Sala no Google Meet · ' +
      '<a href="' + ev.link + '" style="color:#8A7940;text-decoration:none;font-weight:700;' +
      'letter-spacing:.12em;border-bottom:1px solid #E0C56E;">LINK</a>';
  } else if (ev.modalidade === 'Online') {
    ondeHtml = 'Online';
  } else {
    ondeHtml = escapeHtml(ev.local) + (ev.endereco ? '<br>' + escapeHtml(ev.endereco) : '');
  }
  
  return '' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;margin:0 0 26px;">' +
    '<tr>' +
    '<td width="36" valign="top" style="width:36px;padding:0 16px 0 0;">' + marcaDeEnsaio(ev.letra) + '</td>' +
    '<td valign="top">' +
  
    '<div>' + seloPeriodo(ev) +
    '<span style="font:500 10.5px/1.6 ' + FONTE + ';letter-spacing:.14em;text-transform:uppercase;' +
    'color:#9A9A9A;margin-left:8px;">' + escapeHtml(ev.dataCurta + ' · ' + ev.diaSemana) + '</span></div>' +
  
    '<div style="font:600 22px/1.25 ' + FONTE + ';color:#0A0A0A;margin-top:8px;">' +
    escapeHtml(ev.horaInicio.replace(':', 'h') + ' – ' + ev.horaFim.replace(':', 'h')) + '</div>' +
    '<div style="font:400 11.5px/1.6 ' + FONTE + ';color:#9A9A9A;margin-top:3px;">' +
    escapeHtml(duracaoEvento(ev)) + '</div>' +
  
    '<div style="font:400 15px/1.5 ' + FONTE + ';color:#1A1A1A;margin-top:9px;">' +
    escapeHtml(ev.titulo) + '</div>' +
  
    '<div style="font:400 13.5px/1.65 ' + FONTE + ';color:#5A5A5A;margin-top:5px;">' + ondeHtml + '</div>' +
  
    '<div style="font:400 11.5px/1.6 ' + FONTE + ';color:#9A9A9A;margin-top:16px;">' +
    'Se quiser, guarde na sua agenda:</div>' +
    '<div style="margin-top:8px;">' +
    (gcal ? botaoDiscreto(gcal, 'Google Agenda') : '') +
    (ics ? botaoDiscreto(ics, 'Apple, Outlook e outras') : '') +
    '</div>' +
  
    '</td></tr></table>';
}
  
/**
 * O chamado para o preparo da obra, no e-mail de confirmação.
 *
 * Sem isto a Fase 3 dependia de alguém clicar num botão na última tela do
 * cadastro — e quem acabou de se inscrever sente que acabou. O e-mail é o
 * que alcança quem já fechou a aba.
 *
 * O endereço vem de getAppUrl(), que devolve a URL da implantação por onde
 * a pessoa entrou. appUrlPublica, na Config, cobre o caso de o e-mail sair
 * fora de um pedido web, quando getAppUrl() não tem o que responder.
 */
function blocoPreparoEmail(cfg, appUrl) {
  var url = cfg.appUrlPublica || appUrl || '';
  if (!url) return '';

  return '<tr><td style="padding:30px 26px 0;">' + rubrica('Antes do dia 08') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;"><tr>' +
    '<td style="padding:26px 22px;">' +

    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.22em;' +
    'text-transform:uppercase;color:#E0C56E;">Preparo da obra</div>' +

    '<div style="font:300 19px/1.4 ' + FONTE + ';color:#EAEAEA;margin-top:12px;">' +
    'Dez perguntas antes da música.</div>' +

    '<div style="font:400 14px/1.75 ' + FONTE + ';color:#D1D1D1;margin-top:12px;">' +
    'Metodologia da Academia Kephra: toda obra que se vai reger passa primeiro ' +
    'por dez perguntas — nome, compositor, datas, estreia, o que acontecia no ' +
    'mundo, o que veio antes e o que veio depois. Nenhuma obra nasce no vácuo, ' +
    'e é desse chão que sai uma concepção sua, em vez da imitação da concepção ' +
    'de outro.</div>' +

    '<div style="font:400 14px/1.75 ' + FONTE + ';color:#9A9A9A;margin-top:12px;">' +
    'Leva poucos minutos. Ao final você recebe o resultado comentado, com as ' +
    'fontes, e o acesso à pasta com as partituras.</div>' +

    '<div style="margin-top:20px;">' +
    '<a href="' + escapeHtml(url) + '" style="display:inline-block;padding:14px 22px;' +
    'background:#E0C56E;color:#0A0A0A;text-decoration:none;font:600 12px/1 ' + FONTE + ';' +
    'letter-spacing:.14em;text-transform:uppercase;">Fazer o preparo</a></div>' +

    '<div style="font:400 12px/1.7 ' + FONTE + ';color:#8A8A8A;margin-top:14px;">' +
    'Entre com este mesmo e-mail. Mandamos um código de seis dígitos para ' +
    'confirmar que é você.</div>' +

    '</td></tr></table></td></tr>';
}

function montarHtmlEmail(r, cfg, appUrl, logoTag) {
  var contato = cfg.emailContato || PADRAO.CONTATO;
  var primeiroNome = r.nomeCompleto.split(' ')[0];
  
  var eventos = r.encontros.map(function (ev) { return blocoEvento(ev, appUrl); }).join('');
  
  var repertorio = r.prioridades.length
    ? '<tr><td style="padding:6px 26px 0;">' + rubrica('Repertório escolhido') +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
      'style="border-collapse:collapse;table-layout:fixed;">' +
      r.prioridades.map(function (p, i) {
        return linhaResumo(['Primeira', 'Segunda', 'Terceira'][i] + ' escolha', p);
      }).join('') + '</table></td></tr>'
    : '';
  
  return '' +
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light only">' +
    '</head><body style="margin:0;padding:0;background:#0A0A0A;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;">' +
    '<tr><td align="center" style="padding:22px 10px 30px;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;max-width:560px;background:#FFFFFF;">' +
  
    /* ---------- Cabeçalho ---------- */
    '<tr><td style="background:#0A0A0A;padding:36px 26px 34px;text-align:center;">' +
    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.2em;text-transform:uppercase;' +
    'color:#E0C56E;max-width:330px;margin:0 auto;">ECA/USP e Academia Kephra oferecem</div>' +
    '<div style="font:300 24px/1.35 ' + FONTE + ';color:#EAEAEA;margin-top:16px;' +
    'max-width:330px;margin-left:auto;margin-right:auto;">Masterclasses de<br>Regência Orquestral</div>' +
    '<div style="font:400 10.5px/1.6 ' + FONTE + ';letter-spacing:.22em;text-transform:uppercase;' +
    'color:#9A9A9A;margin-top:18px;">Maestro João Rocha</div>' +
    '</td></tr>' +
  
    /* ---------- Saudação ---------- */
    '<tr><td style="padding:34px 26px 0;">' +
    '<div style="font:400 19px/1.5 ' + FONTE + ';color:#0A0A0A;max-width:30ch;">' +
    escapeHtml(primeiroNome) + ', sua inscrição está garantida.</div>' +
    '<div style="font:400 15px/1.7 ' + FONTE + ';color:#5A5A5A;margin-top:12px;max-width:44ch;">' +
    'Abaixo está tudo o que você escolheu e informou.</div>' +
    '</td></tr>' +
  
    /* ---------- Faixa do comprovante ---------- */
    '<tr><td style="padding:22px 26px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;"><tr>' +
    '<td align="center" style="padding:16px 18px;font:400 11px/1.8 ' + FONTE + ';' +
    'letter-spacing:.14em;text-transform:uppercase;color:#FFFFFF;">' +
    'Guarde este e-mail<br>Ele é o seu comprovante</td>' +
    '</tr></table></td></tr>' +
  
    /* ---------- Programação ---------- */
    '<tr><td style="padding:34px 26px 0;">' + rubrica('Programação') + eventos + '</td></tr>' +
  
    repertorio +
  
    blocoPreparoEmail(cfg, appUrl) +
  
    /* ---------- Compromisso do dia 09 ---------- */
    (r.cienciaFarrenc === 'Sim'
      ? '<tr><td style="padding:24px 26px 0;">' + rubrica('Compromisso do dia 09') +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
        'style="border-collapse:collapse;background:#F4F1EA;border-left:3px solid #B08542;"><tr>' +
        '<td style="padding:16px 18px;font:400 14px/1.72 ' + FONTE + ';color:#2A2A2A;">' +
        'Você se comprometeu a estudar e analisar o primeiro movimento da ' +
        'Sinfonia nº 3, op. 36, de Louise Farrenc, com audição atenta da obra' +
        (r.comoLevaPartitura ? ', e a levar a partitura ' +
          escapeHtml(r.comoLevaPartitura.toLowerCase()) : '') + '.' +
        '</td></tr></table></td></tr>'
      : '') +
  
    /* ---------- Dados ---------- */
    '<tr><td style="padding:18px 26px 0;">' + rubrica('Seus dados') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;table-layout:fixed;">' +
    linhaResumo('Nome', r.nomeCompleto) +
    linhaResumo('E-mail', r.email) +
    linhaResumo('E-mail adicional', r.emailAdicional) +
    linhaResumo('WhatsApp', r.whatsapp) +
    linhaResumo('Nascimento', r.nascimento) +
    linhaResumo('Onde mora', r.localidade) +
    linhaResumo('Instrumento principal', r.instrumentoPrincipal) +
    linhaResumo('Outros instrumentos', r.outrosInstrumentos) +
    linhaResumo('Com quem estudou', r.professores) +
    linhaResumo('Onde estudou', r.instituicoes) +
    linhaResumo('Experiência em regência', r.experienciaRegencia) +
    linhaResumo('Rege ou já regeu', r.regeGrupo) +
    linhaResumo('Leva instrumento', r.levaInstrumento) +
    linhaResumo('Transmissão ao vivo', r.interesseTransmissao) +
    linhaResumo('Contato — João Rocha', r.autorizaJR) +
    linhaResumo('Contato — Academia Kephra', r.autorizaAK) +
    linhaResumo('Protocolo', r.id) +
    '</table></td></tr>' +
  
    /* ---------- Convite ---------- */
    '<tr><td style="padding:34px 26px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;"><tr>' +
    '<td style="padding:28px 24px;text-align:center;">' +
    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.22em;text-transform:uppercase;' +
    'color:#E0C56E;">Fica o convite</div>' +
    '<div style="font:300 18px/1.45 ' + FONTE + ';color:#EAEAEA;margin-top:14px;' +
    'max-width:320px;margin-left:auto;margin-right:auto;">Orquestra Sinfônica da<br>' +
    'Universidade Zumbi dos Palmares</div>' +
    '<div style="font:400 14px/1.75 ' + FONTE + ';color:#D1D1D1;margin-top:14px;' +
    'max-width:330px;margin-left:auto;margin-right:auto;">' +
    'Abrimos ao público o nosso ' + escapeHtml(cfg.ensaioAbertoNumero || '2') + 'º ensaio.<br>' +
    'Você é nosso convidado.</div>' +
    '<div style="font:500 15px/1.6 ' + FONTE + ';color:#EAEAEA;margin-top:18px;">' +
    escapeHtml(dataConvite(cfg.ensaioAbertoData) + ' · ' + horaConvite(cfg.ensaioAbertoHora)) + '</div>' +
    '<div style="font:400 13px/1.7 ' + FONTE + ';color:#8A8A8A;margin-top:5px;' +
    'max-width:300px;margin-left:auto;margin-right:auto;">' +
    escapeHtml(cfg.ensaioAbertoEndereco || '') + '</div>' +
    '</td></tr></table></td></tr>' +
  
    /* ---------- Assinatura ---------- */
    '<tr><td style="padding:34px 26px 0;text-align:center;">' +
    '<div style="font:400 15px/1.8 ' + FONTE + ';color:#3A3A3A;max-width:340px;margin:0 auto;">' +
    'Até lá,<br>' + escapeHtml(cfg.assinaturaEmail || 'Equipe Academia Kephra') + '</div>' +
    '<div style="font:400 13px/1.8 ' + FONTE + ';color:#8A8A8A;margin-top:14px;' +
    'max-width:330px;margin-left:auto;margin-right:auto;">' +
    'Qualquer dúvida, escreva para<br>' +
    '<a href="mailto:' + escapeHtml(contato) + '" style="color:#8A7940;text-decoration:none;' +
    'border-bottom:1px solid #DCDCDC;">' + escapeHtml(contato) + '</a></div>' +
    '</td></tr>' +
  
    /* ---------- LGPD ---------- */
    '<tr><td style="padding:30px 26px 0;">' +
    '<div style="border-top:1px solid #E8E8E8;padding-top:20px;font:400 11px/1.9 ' + FONTE + ';' +
    'color:#9A9A9A;text-align:center;max-width:300px;margin:0 auto;">' +
    'Tratamos seus dados conforme a LGPD<br>' +
    '(Lei nº 13.709/2018). Coletamos apenas o<br>' +
    'necessário e não compartilhamos com terceiros.<br>' +
    'Para acessar, corrigir ou excluir seus dados,<br>' +
    'escreva para ' + escapeHtml(contato) + '</div></td></tr>' +
  
    /* ---------- Crédito ---------- */
    '<tr><td style="padding:24px 26px 30px;text-align:center;">' +
    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.16em;text-transform:uppercase;' +
    'color:#B4B4B4;">Plataforma desenvolvida por ' +
    '<a href="' + escapeHtml(cfg.creditoUrl || 'https://opusaitech.com/') + '" ' +
    'style="color:#8A8A8A;text-decoration:none;border-bottom:1px solid #DCDCDC;">' +
    escapeHtml(cfg.creditoNome || 'Opus AI') + '</a></div>' +
    '</td></tr>' +
  
    '</table></td></tr></table></body></html>';
}
  
var MESES_LONGOS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  
var DIAS_LONGOS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado'];
  
/** "25/09/2026" → "sexta-feira, 25 de setembro". Dia da semana calculado,
    não lido da Config — uma chave a menos para ficar desatualizada. */
function dataConvite(dataBR) {
  var p = partesDeData(dataBR, '00:00');
  if (!p) return String(dataBR || '');
  var dia = new Date(Date.UTC(p.y, p.mo - 1, p.d)).getUTCDay();
  return DIAS_LONGOS[dia] + ', ' + p.d + ' de ' + MESES_LONGOS[p.mo - 1];
}
  
/** "19:00" → "19h00" */
function horaConvite(hora) {
  var m = String(hora || '').match(/^(\d{1,2}):?(\d{2})$/);
  return m ? pad2(+m[1]) + 'h' + m[2] : String(hora || '');
}
  
function textoSimples(r, cfg) {
  var linhas = [
    r.nomeCompleto.split(' ')[0] + ', sua inscrição está garantida.',
    '',
    'ENCONTROS'
  ];
  r.encontros.forEach(function (ev) {
    linhas.push('· ' + ev.titulo + ' — ' + ev.dataTexto + '/2026, ' + ev.horaInicio + '–' + ev.horaFim);
    linhas.push('  ' + (ev.modalidade === 'Online' ? (ev.link || 'Online') : ev.local));
  });
  linhas.push('');
  var urlApp = cfg.appUrlPublica || getAppUrl() || '';
  if (urlApp) {
    linhas.push('ANTES DO DIA 08 - PREPARO DA OBRA');
    linhas.push('Dez perguntas sobre a obra que voce vai reger, com resultado');
    linhas.push('comentado e acesso as partituras ao final.');
    linhas.push(urlApp);
    linhas.push('Entre com este mesmo e-mail; mandamos um codigo de seis digitos.');
    linhas.push('');
  }
  linhas.push('Protocolo: ' + r.id);
  linhas.push('');
  linhas.push(cfg.assinaturaEmail || 'Equipe Academia Kephra');
  linhas.push('Plataforma por Opus AI · https://opusaitech.com/');
  linhas.push('');
  linhas.push('Tratamos seus dados conforme a Lei nº 13.709/2018 (LGPD). Para acessar, corrigir ou excluir seus dados, escreva para ' + (cfg.emailContato || PADRAO.ADMIN_EMAIL) + '.');
  return linhas.join('\n');
}
  
function enviarEmailFase2(r) {
  var cfg = getConfig();
  var appUrl = getAppUrl();
  
  GmailApp.sendEmail(
    r.email,
    'Repertório confirmado · Masterclasses de Regência Orquestral',
    textoSimplesFase2(r, cfg),
    {
      htmlBody: montarHtmlFase2(r, cfg, appUrl),
      name: cfg.assinaturaEmail || 'Equipe Academia Kephra',
      replyTo: cfg.emailContato || PADRAO.CONTATO
    }
  );
}
  
function montarHtmlFase2(r, cfg, appUrl) {
  var contato = cfg.emailContato || PADRAO.CONTATO;
  var primeiro = String(r.nomeCompleto || '').split(' ')[0];
  
  var trechos = r.prioridades.length
    ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
      'style="border-collapse:collapse;table-layout:fixed;">' +
      r.prioridades.map(function (p, i) {
        return linhaResumo((i === 0 ? 'Primeira' : 'Segunda') + ' prioridade', p);
      }).join('') + '</table>'
    : '<div style="font:400 14px/1.7 ' + FONTE + ';color:#5A5A5A;">' +
      'Você não indicou trechos para o encontro do dia 08.</div>';
  
  var compromisso = r.cienciaFarrenc === 'Sim'
    ? '<tr><td style="padding:30px 26px 0;">' + rubrica('Compromisso do dia 09') +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
      'style="border-collapse:collapse;background:#F4F1EA;border-left:3px solid #B08542;"><tr>' +
      '<td style="padding:18px 20px;font:400 14px/1.72 ' + FONTE + ';color:#2A2A2A;">' +
      'Você se comprometeu a estudar e analisar o <strong>primeiro movimento da ' +
      'Sinfonia nº 3, op. 36, de Louise Farrenc</strong>, com audição atenta da obra, ' +
      'e a levar a partitura ' +
      (r.comoLevaPartitura ? '(' + escapeHtml(r.comoLevaPartitura.toLowerCase()) + ')' : '') +
      '.</td></tr></table></td></tr>'
    : '';
  
  return '' +
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
    '<div style="font:400 10px/1.8 ' + FONTE + ';letter-spacing:.2em;text-transform:uppercase;' +
    'color:#E0C56E;max-width:330px;margin:0 auto;">Encontros presenciais · II e III de III</div>' +
    '<div style="font:300 24px/1.35 ' + FONTE + ';color:#EAEAEA;margin-top:16px;' +
    'max-width:330px;margin-left:auto;margin-right:auto;">Seu repertório<br>está confirmado</div>' +
    '<div style="font:400 10.5px/1.6 ' + FONTE + ';letter-spacing:.22em;text-transform:uppercase;' +
    'color:#9A9A9A;margin-top:18px;">Maestro João Rocha · ECA/USP</div>' +
    '</td></tr>' +
  
    '<tr><td style="padding:34px 26px 0;">' +
    '<div style="font:400 19px/1.5 ' + FONTE + ';color:#0A0A0A;max-width:30ch;">' +
    escapeHtml(primeiro) + ', está tudo registrado.</div>' +
    '<div style="font:400 15px/1.7 ' + FONTE + ';color:#5A5A5A;margin-top:12px;max-width:44ch;">' +
    'Em princípio, haverá tempo hábil para o trabalho de um trecho por participante. ' +
    'A segunda prioridade existe para o caso de sobrar tempo ou de haver coincidência ' +
    'entre as escolhas do grupo.</div></td></tr>' +
  
    '<tr><td style="padding:30px 26px 0;">' + rubrica('Programação') +
    r.encontros.map(function (ev) { return blocoEvento(ev, appUrl); }).join('') + '</td></tr>' +
  
    '<tr><td style="padding:6px 26px 0;">' + rubrica('Trechos escolhidos') + trechos + '</td></tr>' +
  
    compromisso +
  
    '<tr><td style="padding:30px 26px 0;">' + rubrica('Orientação de preparo') +
    '<div style="font:400 14px/1.72 ' + FONTE + ';color:#2A2A2A;">' +
    'Não se espera domínio integral das obras. Espera-se preparo técnico efetivo do trecho ' +
    'escolhido — clareza quanto à forma, à harmonia e ao plano de ensaio — e capacidade de ' +
    'responder objetivamente a questões sobre a partitura, dispensando-se introduções extensas.' +
    '</div>' +
    '<div style="font:400 14px/1.72 ' + FONTE + ';color:#5A5A5A;margin-top:14px;">' +
    'Os ensaios da OCAM seguem abertos a você — ' +
    escapeHtml(cfg.ensaiosOcam || 'terças, quintas e sextas') + '. ' +
    'Recomendo fortemente o acompanhamento antes do encontro do dia 09.</div>' +
    '</td></tr>' +
  
    '<tr><td style="padding:34px 26px 0;text-align:center;">' +
    '<div style="font:400 15px/1.8 ' + FONTE + ';color:#3A3A3A;max-width:340px;margin:0 auto;">' +
    'Nos vemos lá,<br>' + escapeHtml(cfg.assinaturaEmail || 'Equipe Academia Kephra') + '</div>' +
    '<div style="font:400 13px/1.8 ' + FONTE + ';color:#8A8A8A;margin-top:14px;' +
    'max-width:330px;margin-left:auto;margin-right:auto;">Qualquer dúvida, escreva para<br>' +
    '<a href="mailto:' + escapeHtml(contato) + '" style="color:#8A7940;text-decoration:none;' +
    'border-bottom:1px solid #DCDCDC;">' + escapeHtml(contato) + '</a></div></td></tr>' +
  
    '<tr><td style="padding:26px 26px 30px;text-align:center;">' +
    '<div style="border-top:1px solid #E8E8E8;padding-top:20px;font:400 10px/1.8 ' + FONTE + ';' +
    'letter-spacing:.16em;text-transform:uppercase;color:#B4B4B4;">Plataforma desenvolvida por ' +
    '<a href="' + escapeHtml(cfg.creditoUrl || 'https://opusaitech.com/') + '" ' +
    'style="color:#8A8A8A;text-decoration:none;border-bottom:1px solid #DCDCDC;">' +
    escapeHtml(cfg.creditoNome || 'Opus AI') + '</a></div></td></tr>' +
  
    '</table></td></tr></table></body></html>';
}
  
function textoSimplesFase2(r, cfg) {
  var l = [String(r.nomeCompleto).split(' ')[0] + ', está tudo registrado.', '', 'ENCONTROS'];
  r.encontros.forEach(function (ev) {
    l.push('· ' + ev.titulo + ' — ' + ev.dataTexto + '/2026, ' +
      ev.horaInicio.replace(':', 'h') + '–' + ev.horaFim.replace(':', 'h'));
  });
  l.push('', 'TRECHOS');
  r.prioridades.forEach(function (p, i) { l.push((i + 1) + '. ' + p); });
  if (r.cienciaFarrenc === 'Sim') {
    l.push('', 'Compromisso do dia 09: estudar e analisar o primeiro movimento da Sinfonia nº 3, op. 36, de Louise Farrenc.');
  }
  l.push('', cfg.assinaturaEmail || 'Equipe Academia Kephra');
  l.push('Dúvidas: ' + (cfg.emailContato || PADRAO.CONTATO));
  return l.join('\n');
}
  
/* ============================================================
   6. CALENDÁRIO
   ============================================================ */
  
function paraUTC(dataISO, hora) {
  var p = dataISO.split('-');
  var h = String(hora).split(':');
  // São Paulo = UTC-3 fixo desde 2019 (sem horário de verão).
  var d = new Date(Date.UTC(
    parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10),
    parseInt(h[0], 10) + 3, parseInt(h[1], 10), 0
  ));
  return d;
}
  
function fmtUTC(d) {
  return Utilities.formatDate(d, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
}
  
function urlGoogleCalendar(ev) {
  var ini = fmtUTC(paraUTC(ev.dataISO, ev.horaInicio));
  var fim = fmtUTC(paraUTC(ev.dataISO, ev.horaFim || ev.horaInicio));
  var local = ev.modalidade === 'Online' ? (ev.link || 'Online') : (ev.local + (ev.endereco ? ' — ' + ev.endereco : ''));
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent('Masterclass de Regência · ' + ev.titulo) +
    '&dates=' + ini + '/' + fim +
    '&location=' + encodeURIComponent(local) +
    '&details=' + encodeURIComponent(ev.subtitulo + '\n\n' + ev.descricao + (ev.link ? '\n\n' + ev.link : ''));
}
  
function servirICS(eventoId) {
  var eventos = getEventos();
  var ev = null;
  for (var i = 0; i < eventos.length; i++) {
    if (eventos[i].id === eventoId) { ev = eventos[i]; break; }
  }
  if (!ev) {
    return ContentService.createTextOutput('Evento não encontrado.')
      .setMimeType(ContentService.MimeType.TEXT);
  }
  
  var local = ev.modalidade === 'Online' ? (ev.link || 'Online') : (ev.local + (ev.endereco ? ' — ' + ev.endereco : ''));
  var corpo = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Academia Kephra//Masterclasses de Regencia//PT-BR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:' + ev.id + '-mro@academiakephra.com',
    'DTSTAMP:' + fmtUTC(new Date()),
    'DTSTART:' + fmtUTC(paraUTC(ev.dataISO, ev.horaInicio)),
    'DTEND:' + fmtUTC(paraUTC(ev.dataISO, ev.horaFim || ev.horaInicio)),
    'SUMMARY:' + escICS('Masterclass de Regência · ' + ev.titulo),
    'LOCATION:' + escICS(local),
    'DESCRIPTION:' + escICS(ev.subtitulo + '\\n\\n' + ev.descricao),
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:' + escICS('Amanhã: ' + ev.titulo),
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:' + escICS('Em 2 horas: ' + ev.titulo),
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  
  return ContentService.createTextOutput(corpo)
    .setMimeType(ContentService.MimeType.ICAL)
    .downloadAsFile('masterclass-' + ev.id + '.ics');
}
  
function escICS(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;')
    .replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
  
/* ============================================================
   7. LOG E OPERAÇÃO
   ============================================================ */
  
function registrar(nivel, evento, detalhe) {
  try {
    var aba = getAba(ABAS.LOG);
    aba.appendRow([
      Utilities.formatDate(new Date(), TZ, 'dd/MM/yyyy HH:mm:ss'),
      nivel, evento, String(detalhe || '').slice(0, 500)
    ]);
  } catch (e) {
    Logger.log(nivel + ' · ' + evento + ' · ' + detalhe);
  }
}
  
function configurarProprietario() {
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty(PROP.SS_ID)) props.setProperty(PROP.SS_ID, PADRAO.SS_ID);
  if (!props.getProperty(PROP.ADMIN_EMAIL)) props.setProperty(PROP.ADMIN_EMAIL, PADRAO.ADMIN_EMAIL);
  if (!props.getProperty(PROP.LOGO_ID)) props.setProperty(PROP.LOGO_ID, PADRAO.LOGO_ID);
  if (!props.getProperty(PROP.HMAC_KEY)) {
    props.setProperty(PROP.HMAC_KEY, Utilities.getUuid() + Utilities.getUuid());
  }
  return 'Propriedades configuradas.';
}
  
/** Rode isto ANTES de cada publicação. */
function diagnostico() {
  var out = ['VERSÃO: ' + VERSAO];
  
  try {
    configurarProprietario();
    out.push('OK · Script Properties');
  } catch (e) { out.push('FALHA · Script Properties: ' + e.message); }
  
  try {
    out.push('OK · ' + garantirAbasBase());
  } catch (e) { out.push('FALHA · Planilha: ' + e.message); }
  
  // Cabeçalho real vs esperado — foi um desencontro aqui que quebrou a v2.1.
  try {
    [[ABAS.EVENTOS, CABECALHO_EVENTOS], [ABAS.REPERTORIO, CABECALHO_REPERTORIO],
     [ABAS.INSCRICOES, CABECALHO_INSCRICOES], [ABAS.FASE2, CABECALHO_FASE2]]
      .forEach(function (par) {
        var aba = getAba(par[0]);
        var col = mapaColunas(aba, par[1]);
        var faltam = par[1].filter(function (c) { return col[c] === undefined; });
        out.push((faltam.length ? 'FALHA' : 'OK') + ' · cabeçalho ' + par[0] +
          (faltam.length ? ' · faltam: ' + faltam.join(', ') : ''));
      });
  } catch (e) { out.push('FALHA · Cabeçalhos: ' + e.message); }
  
  try {
    var evs = getEventos();
    out.push('OK · Eventos: ' + evs.length);
    evs.forEach(function (ev) {
      out.push('     ' + ev.letra + ' · ' + ev.dataTexto + ' ' + ev.horaInicio + '–' + ev.horaFim +
        ' · ' + ev.modalidade + ' · ' + ev.estado.toUpperCase() +
        ' · repertório: ' + (ev.temRepertorio ? 'SIM' : 'não'));
    });
    var comRep = evs.filter(function (e) { return e.temRepertorio; }).length;
    var analise = evs.filter(function (e) { return !e.temRepertorio && e.modalidade === 'Presencial'; }).length;
    if (comRep !== 1 || analise !== 1) {
      out.push('  ATENÇÃO · esperado 1 encontro com repertório e 1 de análise. ' +
        'Encontrado: ' + comRep + ' e ' + analise + '. ' +
        'A tela "Você vai reger" só aparece para encontros com temRepertorio = SIM.');
    }
  } catch (e) { out.push('FALHA · Eventos: ' + e.message); }
  
  try {
    var rep = getRepertorio();
    var n = 0;
    rep.forEach(function (o) { n += o.trechos.length; });
    out.push('OK · Repertório: ' + rep.length + ' obras, ' + n + ' trechos');
  
    // A planilha guarda o conteúdo da primeira publicação? Compara com a semente.
    var desatualizado = [];
    var obrasNaPlanilha = rep.map(function (o) { return o.obra; });
    REPERTORIO_PADRAO.forEach(function (l) {
      if (obrasNaPlanilha.indexOf(l[3]) === -1 && desatualizado.indexOf(l[3]) === -1) {
        desatualizado.push(l[3]);
      }
    });
    if (desatualizado.length) {
      out.push('REVER · a aba Repertorio está com conteúdo antigo. Faltam: ' +
        desatualizado.join(' · ') + '. Rode ressincronizarConfiguracao().');
    }
  
    var evs2 = getEventos();
    var titulosPadrao = EVENTOS_PADRAO.map(function (l) { return l[2]; });
    var divergentes = evs2.filter(function (ev) { return titulosPadrao.indexOf(ev.titulo) === -1; });
    if (divergentes.length) {
      out.push('REVER · a aba Eventos está com títulos antigos: ' +
        divergentes.map(function (e) { return e.titulo; }).join(' · ') +
        '. Rode ressincronizarConfiguracao().');
    }
    var semJanela = evs2.filter(function (e) { return e.horaAviso === e.horaLimite; });
    if (semJanela.length) {
      out.push('REVER · sem janela de tolerância em ' +
        semJanela.map(function (e) { return e.id; }).join(', ') +
        ' — o encontro encerra no instante em que começa.');
    }
  } catch (e) { out.push('FALHA · Repertório: ' + e.message); }
  
  try {
    var logoId = PropertiesService.getScriptProperties().getProperty(PROP.LOGO_ID) || PADRAO.LOGO_ID;
    DriveApp.getFileById(logoId).getName();
    out.push('OK · Logo acessível no Drive');
  } catch (e) { out.push('AVISO · Logo: ' + e.message); }
  
  try {
    var cfg = getConfig();
    var criticas = ['maxPrioridades', 'ensaioAbertoData', 'ensaioAbertoHora', 'emailContato'];
    criticas.forEach(function (k) {
      var padrao = '';
      CONFIG_PADRAO.forEach(function (p) { if (p[0] === k) padrao = p[1]; });
      var atual = cfg[k] === undefined ? '(ausente)' : cfg[k];
      out.push((atual === padrao ? 'OK  ' : 'REVER') + ' · Config ' + k + ': ' + atual +
        (atual === padrao ? '' : '   (padrão: ' + padrao + ')'));
    });
  } catch (e) { out.push('FALHA · Config: ' + e.message); }
  
  try {
    out.push('OK · Cota de e-mail restante: ' + MailApp.getRemainingDailyQuota());
  } catch (e) { out.push('FALHA · Gmail: ' + e.message); }
  
  try {
    garantirAbasFase3();
    [[ABAS.ACESSO, CABECALHO_ACESSO], [ABAS.FASE3, CABECALHO_FASE3]].forEach(function (par) {
      var aba = getAba(par[0]);
      var col = mapaColunas(aba, par[1]);
      var faltam = par[1].filter(function (c) { return col[c] === undefined; });
      out.push((faltam.length ? 'FALHA' : 'OK') + ' · cabeçalho ' + par[0] +
        (faltam.length ? ' · faltam: ' + faltam.join(', ') : ''));
    });
    out.push('OK · Fase 3: ' + testarBancoQuiz().split('\n').pop());
    out.push('OK · Fase 3: ' + testarCorrecaoQuiz().split('\n').filter(String).slice(1).join(' | '));
    var cfg3 = getConfig();
    out.push((cfg3.pastaPartiturasUrl ? 'OK  ' : 'FALHA') +
      ' · Config pastaPartiturasUrl: ' + (cfg3.pastaPartiturasUrl || '(ausente)'));
    out.push((PropertiesService.getScriptProperties().getProperty(PROP.HMAC_KEY)
      ? 'OK  ' : 'FALHA') + ' · chave de assinatura dos bilhetes de sessão');
  } catch (e) { out.push('FALHA · Fase 3: ' + e.message); }

  var url = getAppUrl();
  out.push(url ? ('OK · URL: ' + url) : 'AVISO · publique antes para obter a URL');
  
  var texto = out.join('\n');
  Logger.log(texto);
  return texto;
}
  
/**
 * Recria a aba Eventos do zero, com o cabeçalho e os dados corretos.
 *
 * Use quando o cabeçalho estiver desalinhado por causa de uma versão antiga.
 * A aba Eventos é configuração, não dado de usuário — apagá-la não perde nada.
 */
function recriarEventos() {
  var ss = getSS();
  var antiga = ss.getSheetByName(ABAS.EVENTOS);
  if (antiga) {
    antiga.setName(ABAS.EVENTOS + '_antiga_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmmss'));
    antiga.hideSheet();
  }
  criarAbaSeFaltar(ss, ABAS.EVENTOS, CABECALHO_EVENTOS);
  semearEventos(ss);
  SpreadsheetApp.flush();
  
  var evs = getEventos();
  var linhas = ['Aba Eventos recriada. A antiga foi renomeada e ocultada.'];
  evs.forEach(function (ev) {
    linhas.push('  ' + ev.letra + ' · ' + ev.dataTexto + ' ' + ev.horaInicio + '–' + ev.horaFim +
      ' · repertório: ' + (ev.temRepertorio ? 'SIM' : 'não'));
  });
  var texto = linhas.join('\n');
  Logger.log(texto);
  return texto;
}
  
/**
 * Testa a gravação da Fase2 de ponta a ponta, direto no editor.
 * Devolve o que o servidor devolveria ao navegador — inclusive o erro.
 */
function testarFase2() {
  var eventos = getEventos();
  var comRep = eventos.filter(function (e) { return e.temRepertorio; })[0];
  var analise = eventos.filter(function (e) {
    return !e.temRepertorio && e.modalidade === 'Presencial';
  })[0];
  
  var linhas = ['VERSÃO: ' + VERSAO, ''];
  linhas.push('Encontro com repertório (tela "Você vai reger"): ' +
    (comRep ? comRep.id + ' · ' + comRep.dataTexto : 'NENHUM — a tela não vai aparecer'));
  linhas.push('Encontro de análise (tela do dia 09): ' +
    (analise ? analise.id + ' · ' + analise.dataTexto : 'NENHUM — a tela não vai aparecer'));
  linhas.push('');
  
  var rep = getRepertorio()[0];
  var res = salvarFase2({
    email: 'teste.fase2@studiokephra.org',
    nome: 'Teste Fase 2',
    origem: 'existente',
    protocolo: 'MRO-TESTE-FASE2',
    encontros: eventos.filter(function (e) { return e.disponivel; })
      .map(function (e) { return e.id; }),
    prioridades: rep ? [{
      compositor: rep.compositor, obra: rep.obra,
      trecho: rep.trechos[0] ? rep.trechos[0].nome : ''
    }] : [],
    cienciaFarrenc: true,
    comoLevaPartitura: 'Impressa',
    levaInstrumento: true
  });
  
  linhas.push('salvarFase2 devolveu: ' + JSON.stringify(res));
  linhas.push('');
  linhas.push(res.ok
    ? 'Gravou. Confira a última linha da aba Fase2 e apague-a depois.'
    : 'NÃO gravou. O motivo está acima e na aba Log.');
  
  var texto = linhas.join('\n');
  Logger.log(texto);
  return texto;
}
  
/** Envia um e-mail de teste para o administrador, com dados fictícios. */
function testarEmail() {
  var eventos = getEventos();
  var mapa = {};
  eventos.forEach(function (ev) { mapa[ev.id] = ev; });
  var admin = PropertiesService.getScriptProperties().getProperty(PROP.ADMIN_EMAIL) || PADRAO.ADMIN_EMAIL;
  
  var falsos = {
    nome: 'Teste', sobrenome: 'Opus AI', email: admin, emailAdicional: '',
    whatsapp: '+55 11 90000-0000', nascimento: '01/01/1995',
    cidade: 'São Paulo', estado: 'SP', pais: 'Brasil',
    instrumentoPrincipal: 'Violino', outrosInstrumentos: ['Piano'],
    professores: ['Conservatório de Tatuí'],
    experienciaRegencia: '1 a 3 anos', regeGrupo: 'Sim', qualGrupo: 'Orquestra jovem',
    interesseTransmissao: 'Sim', visaoFuturo: '',
    autorizaJR: true, autorizaAK: true,
    prioridades: [{ compositor: 'Beethoven', obra: 'Abertura Egmont, op. 84', trechos: ['Introdução Sostenuto ma non troppo'] }],
    encontros: eventos.map(function (ev) { return ev.id; })
  };
  
  var resumo = montarResumo(falsos, falsos.encontros, mapa, 'MRO-TESTE');
  enviarEmailConfirmacao(falsos, resumo);
  return 'E-mail de teste enviado para ' + admin;
}
  
  
