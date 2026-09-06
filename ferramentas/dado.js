/* DADO — dublê de google.script.run para a prévia local.
 *
 * Responde o que o servidor responderia, sem servidor. Trocar os valores
 * de FIXTURES é como você simula outra situação; a query da URL escolhe
 * entre os três caminhos:
 *
 *   previa.html                → já inscrito e com a fase 2 concluída
 *   previa.html?caso=novo      → nunca se inscreveu
 *   previa.html?caso=semfase2  → inscrito, mas ainda sem a fase 2
 *
 * Nada aqui vai para produção. É andaime.
 */
window.__chamadas = [];
var FIXTURES = {
  getDadosIniciais: {
    versao:'MRO-4.0.0 · teste', appUrl:'https://exemplo/exec',
    config:{ tituloEvento:'Masterclasses de Regência Orquestral', maxPrioridades:'2',
      emailContato:'contato@studiokephra.org', ensaioAbertoData:'25/09/2026',
      ensaioAbertoHora:'19:00', ensaioAbertoEndereco:'Av. Santos Dumont, 843',
      instagramJR:'https://x/jr', instagramAK:'https://x/ak', instagramUZP:'https://x/uzp',
      quizMinutos:'4', segundosRetorno:'5',
      pastaPartiturasUrl:'https://drive.google.com/drive/folders/ABC',
      livroAnaliseTitulo:'Elements of Sonata Theory',
      livroAnaliseAutores:'James Hepokoski e Warren Darcy',
      livroAnaliseEditora:'Oxford University Press, 2006',
      obraAnalise:'Sinfonia nº 3, op. 36, de Louise Farrenc' },
    eventos:[
      {id:'E1',ordem:1,letra:'A',titulo:'Encontro online',subtitulo:'',dataISO:'2026-08-31',dataTexto:'31/08',dataCurta:'31 AGO',diaSemana:'seg',horaInicio:'09:00',horaFim:'11:00',periodo:'manhã',horaAviso:'09h00',horaLimite:'10h00',dataAviso:'31/08',modalidade:'Online',local:'Google Meet',endereco:'',link:'https://meet',descricao:'x',temRepertorio:false,estado:'aberto',disponivel:true},
      {id:'E2',ordem:2,letra:'B',titulo:'Primeiro encontro presencial',subtitulo:'',dataISO:'2026-09-08',dataTexto:'08/09',dataCurta:'08 SET',diaSemana:'ter',horaInicio:'17:30',horaFim:'19:30',periodo:'fim de tarde',horaAviso:'17h30',horaLimite:'18h30',dataAviso:'08/09',modalidade:'Presencial',local:'Centro Cultural Camargo Guarnieri',endereco:'Rua do Anfiteatro, 109',link:'',descricao:'x',temRepertorio:true,estado:'aberto',disponivel:true},
      {id:'E3',ordem:3,letra:'C',titulo:'Segundo encontro presencial',subtitulo:'',dataISO:'2026-09-09',dataTexto:'09/09',dataCurta:'09 SET',diaSemana:'qua',horaInicio:'14:00',horaFim:'16:00',periodo:'tarde',horaAviso:'14h00',horaLimite:'15h00',dataAviso:'09/09',modalidade:'Presencial',local:'Centro Cultural Camargo Guarnieri',endereco:'Rua do Anfiteatro, 109',link:'',descricao:'x',temRepertorio:false,estado:'aberto',disponivel:true}
    ],
    repertorio:[
      {id:'O1',ordem:1,compositor:'Beethoven',obra:'Abertura Egmont, op. 84',trechos:[{id:'O1T1',ordem:1,nome:'Introdução'}]},
      {id:'O2',ordem:2,compositor:'Beethoven',obra:'Sinfonia nº 7, op. 92',trechos:[{id:'O2T1',ordem:1,nome:'I'}]}
    ],
    inscricoesAbertas:true
  },
  solicitarCodigo: { ok:true, minutos:12 },
  verificarCodigo: {
    ok:true, bilhete:'BILHETE-FALSO', encontrado:true,
    nome:'Meena', protocolo:'MRO-123', encontros:['E2','E3'],
    fase2Concluida:true,
    escolhas:['Beethoven — Sinfonia nº 7, op. 92: II — Allegretto','Beethoven — Abertura Egmont, op. 84: Introdução'],
    comoLevaPartitura:'Impressa', levaInstrumento:'NÃO',
    obrasQuiz:[{id:'O2',obra:'Sinfonia nº 7, op. 92',compositor:'Beethoven',escolhida:true},
               {id:'O1',obra:'Abertura Egmont, op. 84',compositor:'Beethoven',escolhida:true}],
    quizzesFeitos:[]
  },
  carregarQuiz: {
    ok:true, obraId:'O2', obra:'Sinfonia nº 7, op. 92', compositor:'Beethoven',
    total:6, maximo:60,
    perguntas:[
      {n:1,tipo:'escolha',eixo:'Nome da obra',enunciado:'Qual é a tonalidade?',dica:'Wagner chamou de apoteose da dança.',opcoes:['Lá menor','Lá maior','Fá maior','Ré menor']},
      {n:2,tipo:'digitar',eixo:'Compositor',enunciado:'Escreva o sobrenome.',dica:'Duas partes.'},
      {n:3,tipo:'ano',eixo:'Morte',enunciado:'Em que ano morreu?',dica:'Catorze anos depois.',min:1800,max:1860,inicial:1830},
      {n:4,tipo:'multipla',eixo:'Estreias',enunciado:'O que é de 1813?',dica:'Um estreou na mesma noite.',opcoes:['Wellingtons Sieg','Tancredi','A Nona','Der Freischütz'],minimo:1},
      {n:5,tipo:'ligar',eixo:'Mundo',enunciado:'Ligue cada fato ao lugar.',dica:'Fim das guerras napoleônicas.',esquerda:['Batalha de Leipzig','Lago Erie','Real Teatro de São João'],direita:['Brasil','Europa','Estados Unidos']},
      {n:6,tipo:'ordenar',eixo:'Antes',enunciado:'Ordene por data.',dica:'A Sétima não veio do nada.',itens:['Oitava','Pastoral','Sétima','Arquiduque']}
    ]
  },
  corrigirQuiz: {
    ok:true, obraId:'O2', obra:'Sinfonia nº 7, op. 92', compositor:'Beethoven',
    pontos:47, maximo:60, acertos:4, total:6, nome:'Meena',
    faixa:{rotulo:'Boa base',texto:'A moldura está montada.',percentual:78},
    itens:[
      {n:1,eixo:'Nome da obra',enunciado:'Qual é a tonalidade?',pontos:10,maximo:10,acertou:true,parcial:false,sua:'Lá maior',gabarito:'Lá maior.',porque:'Cordas soltas.',sugestao:'',fonte:{rotulo:'Beethoven-Haus',url:'https://www.beethoven.de/'}},
      {n:2,eixo:'Compositor',enunciado:'Escreva o sobrenome.',pontos:6,maximo:10,acertou:false,parcial:true,sua:'Beethovem',gabarito:'Ludwig van Beethoven.',porque:'O van é neerlandês.',sugestao:'Grafias estrangeiras não são detalhe.',fonte:{rotulo:'Beethoven-Haus',url:'https://www.beethoven.de/'}},
      {n:3,eixo:'Morte',enunciado:'Em que ano morreu?',pontos:0,maximo:10,acertou:false,parcial:false,sua:'1840',gabarito:'26/03/1827.',porque:'Ainda viriam a Nona.',sugestao:'Situar o compositor no tempo é situar a obra.',fonte:{rotulo:'Beethoven-Haus',url:'https://www.beethoven.de/'}},
      {n:4,eixo:'Estreias',enunciado:'O que é de 1813?',pontos:10,maximo:10,acertou:true,parcial:false,sua:'Wellingtons Sieg · Tancredi',gabarito:'Wellingtons Sieg e Tancredi.',porque:'Rossini tomava a Itália.',sugestao:'',fonte:{rotulo:'ROF',url:'https://www.rossinioperafestival.it/'}},
      {n:5,eixo:'Mundo',enunciado:'Ligue cada fato ao lugar.',pontos:10,maximo:10,acertou:true,parcial:false,sua:'Leipzig → Europa',gabarito:'Europa, EUA e Brasil.',porque:'O Rio ganhava seu teatro.',sugestao:'',fonte:{rotulo:'BN',url:'https://brasilianafotografica.bn.gov.br/'}},
      {n:6,eixo:'Antes',enunciado:'Ordene por data.',pontos:11,maximo:10,acertou:true,parcial:false,sua:'Pastoral → Arquiduque → Sétima → Oitava',gabarito:'Pastoral, Arquiduque, Sétima, Oitava.',porque:'Gêmeas de calendário.',sugestao:'',fonte:{rotulo:'Beethoven-Haus',url:'https://www.beethoven.de/'}}
    ]
  },
  registrarCiencias: { ok:true }
};

/* ?caso=novo  → nunca se inscreveu
   ?caso=semfase2 → inscrito, mas sem Fase 2 */
var CASO = (location.search.match(/caso=(\w+)/) || [])[1] || 'completo';
if (CASO === 'novo') {
  FIXTURES.verificarCodigo = { ok:true, bilhete:'B', encontrado:false, nome:'', protocolo:'',
    encontros:[], fase2Concluida:false, escolhas:[], obrasQuiz:[], quizzesFeitos:[] };
}
if (CASO === 'semfase2') {
  FIXTURES.verificarCodigo = Object.assign({}, FIXTURES.verificarCodigo, {
    fase2Concluida:false, escolhas:[], obrasQuiz:[] });
}
FIXTURES.salvarInscricao = { ok:true, id:'MRO-NOVO-1', resumo:{ id:'MRO-NOVO-1' } };
FIXTURES.salvarFase2     = { ok:true, id:'MRO-123', resumo:{ id:'MRO-123' } };

window.google = { script: { run: (function () {
  function fazer(sucesso, falha) {
    var api = {};
    ['getDadosIniciais','solicitarCodigo','verificarCodigo','carregarQuiz',
     'corrigirQuiz','registrarCiencias','salvarInscricao','salvarFase2','buscarInscricao']
      .forEach(function (nome) {
        api[nome] = function () {
          window.__chamadas.push(nome);
          var r = FIXTURES[nome] || { ok:true };
          setTimeout(function () { if (sucesso) sucesso(r); }, 10);
        };
      });
    api.withSuccessHandler = function (f) { return fazer(f, falha); };
    api.withFailureHandler = function (f) { return fazer(sucesso, f); };
    return api;
  }
  return fazer(null, null);
})() } };
