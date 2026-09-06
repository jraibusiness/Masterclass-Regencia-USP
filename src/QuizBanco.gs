/**
 * FASE 3 · BANCO DE PERGUNTAS — "Conhecendo a obra"
 *
 * As dez perguntas do método da Academia Kephra, uma a uma, para cada obra
 * do encontro do dia 08. O gabarito vive só aqui, no servidor: o cliente
 * recebe enunciado e opções embaralhadas, nunca a resposta.
 *
 * Por isso a correção compara TEXTO, não índice. Embaralhar deixa de exigir
 * estado de sessão, e o índice deixa de ser um vazamento.
 *
 * Conteúdo e fontes: PESQUISA-OBRAS.md. Corrigiu ali, corrija aqui.
 */

var QUIZ_VERSAO = 'Q1 · 06/09/2026';

/* Os dez eixos, na ordem do post de 18/02/2024. */
var QUIZ_EIXOS = [
  'Nome da obra',
  'Nome do(a) compositor(a)',
  'Nascimento e morte',
  'Data de composição',
  'Data de estreia',
  'Outras estreias do mesmo ano',
  'O mundo no ano da estreia',
  'A obra imediatamente anterior',
  'A obra imediatamente seguinte',
  'Local, regência e conjunto da estreia'
];

/* O que estudar quando o eixo escapou. Entra no e-mail de devolutiva. */
var QUIZ_SUGESTOES = [
  'Comece pelo rosto da obra: título original, número de opus, gênero. É o que permite pedir a parte certa ao arquivo e achar a edição certa no IMSLP.',
  'Grafias estrangeiras não são detalhe. Escrever o nome errado num programa, num e-mail para uma editora ou numa ficha técnica custa credibilidade.',
  'Situar o compositor no tempo é situar a obra: saber se ela é de juventude, de maturidade ou de despedida muda o que você espera dela.',
  'Data de composição e data de estreia raramente coincidem. A distância entre as duas costuma contar uma história — recusa, revisão, guerra, doença.',
  'A estreia é o primeiro encontro da obra com o mundo. Saber quando foi é a porta para saber como foi recebida.',
  'Nenhuma obra estreia sozinha. Ver o que mais estreou no mesmo ano mostra contra o que ela foi ouvida na época.',
  'O que acontecia fora da sala de concerto não é enfeite de nota de programa. O compositor é fruto do meio dele, e a obra também: é desse material que sai a sua concepção da peça, em vez da imitação da concepção de outro.',
  'Olhar a obra anterior mostra de onde o compositor vinha, e o que ele já tinha resolvido antes de começar esta.',
  'Olhar a obra seguinte mostra para onde ele foi. Muitas vezes a resposta a um problema deixado em aberto está na obra logo depois.',
  'Local, regente e conjunto da estreia definem o tamanho e o som que o compositor tinha na cabeça. É a informação mais prática das dez.'
];

var QUIZ_BANCO = {

  /* ==========================================================
     O1 · BEETHOVEN — Abertura Egmont, op. 84
     ========================================================== */
  O1: {
    obra: 'Abertura Egmont, op. 84',
    compositor: 'Beethoven',
    perguntas: [
      {
        n: 1, tipo: 'escolha', eixo: 0,
        enunciado: 'Qual é o nome completo da obra de onde vem esta abertura?',
        dica: 'A abertura não nasceu sozinha: ela é o primeiro de dez números.',
        opcoes: [
          'Egmont — música para a tragédia de Goethe, op. 84',
          'Egmont — ópera em três atos, op. 84',
          'Egmont — poema sinfônico, op. 84',
          'Egmont — cantata para solistas e coro, op. 84'
        ],
        certa: 'Egmont — música para a tragédia de Goethe, op. 84',
        gabarito: 'Egmont, música incidental para a tragédia de Goethe, op. 84 — dez números, dos quais a Abertura é o nº 1.',
        porque: 'Beethoven escreveu música de cena: abertura, quatro entreatos, duas canções para Clärchen, a morte de Clärchen, um melodrama e a Sinfonia da Vitória.',
        fonte: { rotulo: 'Beethoven Music Research Center', url: 'https://www.lvbeethoven.org/opus084/' }
      },
      {
        n: 2, tipo: 'digitar', eixo: 1,
        enunciado: 'Escreva o sobrenome do compositor.',
        dica: 'Beethoven só existe um. Bach, Haydn e Mozart existem aos pares — e a grafia estrangeira é parte do ofício.',
        aceita: ['beethoven', 'van beethoven', 'ludwig van beethoven', 'l van beethoven', 'l. van beethoven'],
        gabarito: 'Ludwig van Beethoven.',
        porque: 'O "van" é neerlandês, não nobiliárquico: em catálogos alemães ele entra sob B, não sob V.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/' }
      },
      {
        n: 3, tipo: 'ano', eixo: 2,
        enunciado: 'Em que ano nasceu Beethoven?',
        dica: 'A data exata do nascimento é incerta. A do batismo, não: 17 de dezembro de 1770.',
        min: 1740, max: 1820, certo: 1770, tolerancia: 2,
        gabarito: 'Batizado em 17/12/1770, em Bonn — nascimento provável em 16/12. Morreu em 26/03/1827, em Viena.',
        porque: 'Egmont é de 1810: Beethoven tinha 39 anos e já era o compositor da Eroica e do Quinto Concerto.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/' }
      },
      {
        n: 4, tipo: 'ano', eixo: 3,
        enunciado: 'Em que ano Beethoven terminou a música de Egmont?',
        dica: 'Ele começou no outono de um ano e terminou em junho do seguinte.',
        min: 1795, max: 1827, certo: 1810, tolerancia: 1,
        gabarito: 'Composta entre outubro de 1809 e meados de junho de 1810.',
        porque: 'O prazo era do teatro, não do compositor: a peça já estava em cartaz quando a música ficou pronta.',
        fonte: { rotulo: 'Beethoven Music Research Center', url: 'https://www.lvbeethoven.org/opus084/' }
      },
      {
        n: 5, tipo: 'escolha', eixo: 4,
        enunciado: 'Quando a música foi ouvida pela primeira vez, junto com a peça?',
        dica: 'A peça estreou antes da música. Atraso de compositor é assunto antigo.',
        opcoes: [
          '15 de junho de 1810, na quarta récita da peça',
          '24 de maio de 1810, na estreia da peça',
          '22 de dezembro de 1808, na Akademie do Theater an der Wien',
          '7 de maio de 1824, junto com a Nona'
        ],
        certa: '15 de junho de 1810, na quarta récita da peça',
        gabarito: '15/06/1810 — a peça estreara em 24/05/1810 sem a música, ouvida integralmente só na quarta récita.',
        porque: 'Vale como aviso: a data de estreia da obra e a da produção que a encomendou podem não ser a mesma.',
        fonte: { rotulo: 'Berliner Philharmoniker', url: 'https://www.berliner-philharmoniker.de/en/programme-notes/ludwig-van-beethoven-incidental-music-to-goethes-egmont-op-84/' }
      },
      {
        n: 6, tipo: 'multipla', eixo: 5,
        enunciado: 'O que mais aconteceu na música em 1810? Marque tudo o que for de 1810.',
        dica: 'Nenhuma obra estreia sozinha.',
        opcoes: [
          'Rossini estreia sua primeira ópera, La cambiale di matrimonio, em Veneza',
          'Nascem Chopin e Robert Schumann',
          'Beethoven escreve o Quarteto op. 95 "Serioso"',
          'Estreia a Sinfonia nº 9 de Beethoven',
          'Estreia Giselle, de Adolphe Adam',
          'Wagner e Verdi nascem'
        ],
        certas: [
          'Rossini estreia sua primeira ópera, La cambiale di matrimonio, em Veneza',
          'Nascem Chopin e Robert Schumann',
          'Beethoven escreve o Quarteto op. 95 "Serioso"'
        ],
        gabarito: 'De 1810: a estreia operística de Rossini (La cambiale di matrimonio, 03/11, Teatro San Moisè, Veneza), os nascimentos de Chopin (22/02) e Schumann (08/06) e o Quarteto op. 95. A Nona é de 1824; Giselle, de 1841; Wagner e Verdi nascem em 1813.',
        porque: 'Enquanto Beethoven fechava Egmont, a geração seguinte estava literalmente nascendo.',
        fonte: { rotulo: 'Rossini Opera Festival', url: 'https://www.rossinioperafestival.it/en/stories/la-cambiale-di-matrimonio-2/' }
      },
      {
        n: 7, tipo: 'ligar', eixo: 6,
        enunciado: 'Ligue cada fato de 1810 ao lugar onde aconteceu.',
        dica: 'Egmont é sobre resistência a uma ocupação estrangeira. O mundo de 1810 estava ocupado.',
        esquerda: ['Napoleão anexa o Reino da Holanda à França', 'A Suprema Corte julga Fletcher v. Peck', 'Os Tratados de 1810 são assinados no Rio de Janeiro'],
        direita: ['Europa', 'Estados Unidos', 'Brasil'],
        pares: [
          ['Napoleão anexa o Reino da Holanda à França', 'Europa'],
          ['A Suprema Corte julga Fletcher v. Peck', 'Estados Unidos'],
          ['Os Tratados de 1810 são assinados no Rio de Janeiro', 'Brasil']
        ],
        gabarito: 'Europa: anexação da Holanda (julho) e o casamento de Napoleão com Maria Luísa da Áustria (abril). EUA: Fletcher v. Peck e o Macon\'s Bill nº 2. Brasil: os Tratados de Aliança e Amizade e de Comércio e Navegação, assinados no Rio em 19/02/1810 por D. Rodrigo de Sousa Coutinho e Lord Strangford.',
        porque: 'Goethe escreveu sobre um conde flamengo executado por resistir à ocupação espanhola. Beethoven musicou isso com Napoleão às portas de Viena. A peça não era arqueologia.',
        fonte: { rotulo: 'Biblioteca Brasiliana Guita e José Mindlin · USP', url: 'https://digital.bbm.usp.br/handle/bbm/7405' }
      },
      {
        n: 8, tipo: 'ordenar', eixo: 7,
        enunciado: 'Coloque em ordem cronológica, da mais antiga para a mais recente.',
        dica: 'De onde Beethoven vinha quando começou Egmont.',
        itens: ['Sinfonia nº 5, op. 67', 'Concerto para piano nº 5, op. 73 "Imperador"', 'Egmont, op. 84', 'Quarteto op. 95 "Serioso"'],
        ordem: ['Sinfonia nº 5, op. 67', 'Concerto para piano nº 5, op. 73 "Imperador"', 'Egmont, op. 84', 'Quarteto op. 95 "Serioso"'],
        gabarito: 'Sinfonia nº 5 (1808) → Concerto nº 5 "Imperador" (1809) → Egmont (1809–10) → Quarteto op. 95 "Serioso" (1810).',
        porque: 'Egmont e o op. 95 são ambos em Fá menor e quase contemporâneos. Não é coincidência de tonalidade: é o mesmo Beethoven, no mesmo ano.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/' }
      },
      {
        n: 9, tipo: 'escolha', eixo: 8,
        enunciado: 'Qual destas obras Beethoven escreveu logo depois de Egmont?',
        dica: 'Mesma época, mesma tonalidade.',
        opcoes: [
          'Quarteto de cordas op. 95 "Serioso" (1810)',
          'Sinfonia nº 3 "Eroica", op. 55 (1804)',
          'Missa Solemnis, op. 123 (1823)',
          'Sonata "Patética", op. 13 (1798)'
        ],
        certa: 'Quarteto de cordas op. 95 "Serioso" (1810)',
        gabarito: 'O Quarteto op. 95 "Serioso", também em Fá menor, escrito em cerca de um mês em 1810. Na sequência vieram o Trio op. 97 "Arquiduque" (1811) e as músicas de cena op. 113 e op. 117.',
        porque: 'Egmont ocupa a fronteira entre o Beethoven "heroico" e o silêncio relativo dos anos seguintes.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/' }
      },
      {
        n: 10, tipo: 'escolha', eixo: 9,
        enunciado: 'Onde foi a estreia e quem regeu?',
        dica: 'Uma das três informações não sobreviveu. Isso também é resposta.',
        opcoes: [
          'k.k. Hofburgtheater, Viena · orquestra da corte · a regência não está documentada com segurança',
          'Theater an der Wien · orquestra da casa · regência de Beethoven',
          'Gewandhaus de Leipzig · Orquestra do Gewandhaus · regência de Mendelssohn',
          'Kärntnertortheater · orquestra da corte · regência de Umlauf'
        ],
        certa: 'k.k. Hofburgtheater, Viena · orquestra da corte · a regência não está documentada com segurança',
        gabarito: 'k.k. Hofburgtheater, Viena, com a orquestra da corte. Quem regeu a récita de 15/06/1810 não está seguramente documentado. A atriz Antonie Adamberger cantou os números de Clärchen.',
        porque: 'Nem toda estreia deixou registro de quem regeu. "Não se sabe" é uma resposta legítima quando é a resposta verdadeira — e é melhor do que repetir uma atribuição sem fonte.',
        fonte: { rotulo: 'Beethoven Music Research Center', url: 'https://www.lvbeethoven.org/opus084/' }
      }
    ]
  },

  /* ==========================================================
     O2 · BEETHOVEN — Sinfonia nº 7, op. 92
     ========================================================== */
  O2: {
    obra: 'Sinfonia nº 7, op. 92',
    compositor: 'Beethoven',
    perguntas: [
      {
        n: 1, tipo: 'escolha', eixo: 0,
        enunciado: 'Qual é a tonalidade da Sétima?',
        dica: 'Wagner chamou esta sinfonia de "a apoteose da dança". A tonalidade ajuda a entender por quê.',
        opcoes: ['Lá maior', 'Lá menor', 'Fá maior', 'Ré menor'],
        certa: 'Lá maior',
        gabarito: 'Sinfonia nº 7 em Lá maior, op. 92.',
        porque: 'Lá maior é tonalidade de cordas soltas: brilho e ressonância vêm de graça. O Allegretto em Lá menor é a sombra dentro da mesma casa.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/en/work/view/6311026614075392/Symphony+no.+7+(A+major)+op.+92' }
      },
      {
        n: 2, tipo: 'digitar', eixo: 1,
        enunciado: 'Escreva o sobrenome do compositor.',
        dica: 'Um sobrenome com duas partes. A grafia importa: é assim que você vai pedir a parte à editora.',
        aceita: ['beethoven', 'van beethoven', 'ludwig van beethoven', 'l van beethoven', 'l. van beethoven'],
        gabarito: 'Ludwig van Beethoven.',
        porque: 'Em alemão, o "van" não separa: o verbete é Beethoven, Ludwig van.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/' }
      },
      {
        n: 3, tipo: 'ano', eixo: 2,
        enunciado: 'Em que ano Beethoven morreu?',
        dica: 'Ele viveu catorze anos depois da estreia da Sétima.',
        min: 1800, max: 1860, certo: 1827, tolerancia: 2,
        gabarito: 'Batizado em 17/12/1770, em Bonn; morreu em 26/03/1827, em Viena.',
        porque: 'A Sétima é de 1812: obra de plena maturidade, não de despedida. Ainda viriam a Nona e os últimos quartetos.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/' }
      },
      {
        n: 4, tipo: 'ano', eixo: 3,
        enunciado: 'Em que ano a Sétima foi concluída?',
        dica: 'Um ano antes da estreia. O intervalo tem explicação — e ela é histórica, não artística.',
        min: 1795, max: 1827, certo: 1812, tolerancia: 1,
        gabarito: 'Composta de setembro de 1811 a cerca de abril de 1812; o autógrafo traz data de 1812.',
        porque: 'A estreia planejada em Graz não se realizou. A obra ficou um ano na gaveta até o concerto beneficente de Viena.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/en/work/view/6311026614075392/Symphony+no.+7+(A+major)+op.+92' }
      },
      {
        n: 5, tipo: 'escolha', eixo: 4,
        enunciado: 'Qual foi a data da estreia?',
        dica: 'Foi um concerto de caridade para feridos de guerra.',
        opcoes: [
          '8 de dezembro de 1813',
          '7 de maio de 1824',
          '22 de dezembro de 1808',
          '2 de abril de 1800'
        ],
        certa: '8 de dezembro de 1813',
        gabarito: '08/12/1813, em concerto beneficente para os soldados feridos na batalha de Hanau.',
        porque: 'O sucesso foi imediato e o Allegretto foi bisado na hora — mas o que arrastou o público foi a outra estreia da noite, Wellingtons Sieg.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/en/work/view/6311026614075392/Symphony+no.+7+(A+major)+op.+92' }
      },
      {
        n: 6, tipo: 'multipla', eixo: 5,
        enunciado: 'O que mais estreou em 1813? Marque tudo o que for de 1813.',
        dica: 'Um dos itens estreou na mesma noite, no mesmo palco.',
        opcoes: [
          'Wellingtons Sieg, op. 91, de Beethoven',
          'Tancredi, de Rossini, no La Fenice',
          'L\'italiana in Algeri, de Rossini, no Teatro San Benedetto',
          'A Sinfonia nº 9 de Beethoven',
          'Der Freischütz, de Weber',
          'A Sinfonia "Renana" de Schumann'
        ],
        certas: [
          'Wellingtons Sieg, op. 91, de Beethoven',
          'Tancredi, de Rossini, no La Fenice',
          'L\'italiana in Algeri, de Rossini, no Teatro San Benedetto'
        ],
        gabarito: 'De 1813: Wellingtons Sieg (08/12, no mesmo concerto), Tancredi (06/02, La Fenice, Veneza) e L\'italiana in Algeri (22/05, Teatro San Benedetto, Veneza). A Nona é de 1824; Der Freischütz, de 1821; a "Renana", de 1850. Em 1813 também nasceram Wagner e Verdi.',
        porque: 'Enquanto Beethoven regia a Sétima em Viena, Rossini, aos 21 anos, tomava a Itália. São mundos sonoros contemporâneos.',
        fonte: { rotulo: 'Rossini Opera Festival', url: 'https://www.rossinioperafestival.it/en/stories/tancredi/' }
      },
      {
        n: 7, tipo: 'ligar', eixo: 6,
        enunciado: 'Ligue cada fato de 1813 ao lugar onde aconteceu.',
        dica: 'A Sétima estreia em pleno fim das guerras napoleônicas.',
        esquerda: ['A Batalha das Nações, em Leipzig', 'A Batalha do Lago Erie, na Guerra de 1812', 'D. João inaugura o Real Teatro de São João'],
        direita: ['Europa', 'Estados Unidos', 'Brasil'],
        pares: [
          ['A Batalha das Nações, em Leipzig', 'Europa'],
          ['A Batalha do Lago Erie, na Guerra de 1812', 'Estados Unidos'],
          ['D. João inaugura o Real Teatro de São João', 'Brasil']
        ],
        gabarito: 'Europa: a Batalha das Nações em Leipzig (16–19/10/1813) e a Batalha de Vitória (21/06/1813), esta última o assunto de Wellingtons Sieg. EUA: a Guerra de 1812, com a Batalha do Lago Erie em 10/09/1813. Brasil: a inauguração do Real Teatro de São João, no Rio, em 12/10/1813 — hoje Teatro João Caetano.',
        porque: 'Enquanto Viena celebrava uma vitória militar em forma de sinfonia, o Rio ganhava seu primeiro grande teatro de corte. Os dois fatos são do mesmo outubro.',
        fonte: { rotulo: 'Brasiliana Fotográfica · Biblioteca Nacional', url: 'https://brasilianafotografica.bn.gov.br/?p=28555' }
      },
      {
        n: 8, tipo: 'ordenar', eixo: 7,
        enunciado: 'Coloque em ordem cronológica, da mais antiga para a mais recente.',
        dica: 'A Sétima não veio do nada.',
        itens: ['Sinfonia nº 6 "Pastoral", op. 68', 'Trio op. 97 "Arquiduque"', 'Sinfonia nº 7, op. 92', 'Sinfonia nº 8, op. 93'],
        ordem: ['Sinfonia nº 6 "Pastoral", op. 68', 'Trio op. 97 "Arquiduque"', 'Sinfonia nº 7, op. 92', 'Sinfonia nº 8, op. 93'],
        gabarito: '"Pastoral" (1808) → Trio "Arquiduque" (1811) → Sétima (1811–12) → Oitava (verão de 1812).',
        porque: 'A Sétima e a Oitava são gêmeas de calendário: Beethoven terminou uma e emendou a outra no mesmo ano.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/' }
      },
      {
        n: 9, tipo: 'escolha', eixo: 8,
        enunciado: 'O que Beethoven compôs imediatamente depois da Sétima?',
        dica: 'Mesmo verão.',
        opcoes: [
          'A Sinfonia nº 8, op. 93 (verão de 1812)',
          'A Sinfonia nº 9, op. 125 (1824)',
          'A Abertura Egmont, op. 84 (1810)',
          'A Missa Solemnis, op. 123 (1823)'
        ],
        certa: 'A Sinfonia nº 8, op. 93 (verão de 1812)',
        gabarito: 'A Sinfonia nº 8, op. 93, no verão de 1812; no mesmo ano, a Sonata para violino op. 96; em 1813, Wellingtons Sieg, op. 91.',
        porque: 'Depois da Oitava, Beethoven passou mais de dez anos sem escrever sinfonia. A Sétima e a Oitava fecham um ciclo.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/' }
      },
      {
        n: 10, tipo: 'ligar', eixo: 9,
        enunciado: 'Ligue cada elemento da estreia à sua descrição.',
        dica: 'A orquestra daquela noite não era uma orquestra: era um elenco.',
        esquerda: ['Local', 'Regência', 'Spalla'],
        direita: ['Sala Grande da Universidade de Viena', 'O próprio Beethoven', 'Ignaz Schuppanzigh'],
        pares: [
          ['Local', 'Sala Grande da Universidade de Viena'],
          ['Regência', 'O próprio Beethoven'],
          ['Spalla', 'Ignaz Schuppanzigh']
        ],
        gabarito: 'Sala Grande da Universidade de Viena, regência de Beethoven, spalla Ignaz Schuppanzigh — numa orquestra reunida para a ocasião, com Louis Spohr, Domenico Dragonetti, Hummel, Meyerbeer, Salieri e Moscheles entre os músicos.',
        porque: 'Quem tocava define o que era possível pedir. Uma orquestra de virtuoses voluntários aceita andamentos que uma orquestra de fosso não aceitaria.',
        fonte: { rotulo: 'Beethoven-Haus Bonn', url: 'https://www.beethoven.de/en/work/view/6311026614075392/Symphony+no.+7+(A+major)+op.+92' }
      }
    ]
  },

  /* ==========================================================
     O3 · STRAVINSKY — Histoire du Soldat
     ========================================================== */
  O3: {
    obra: 'Histoire du Soldat',
    compositor: 'Stravinsky',
    perguntas: [
      {
        n: 1, tipo: 'escolha', eixo: 0,
        enunciado: 'O que é, exatamente, a Histoire du soldat?',
        dica: 'O próprio subtítulo responde.',
        opcoes: [
          'Uma peça "lida, tocada e dançada", com texto de C. F. Ramuz',
          'Uma ópera de câmara em um ato',
          'Um balé para a companhia de Diaghilev',
          'Uma suíte orquestral sobre temas russos'
        ],
        certa: 'Uma peça "lida, tocada e dançada", com texto de C. F. Ramuz',
        gabarito: 'L\'Histoire du soldat — "lue, jouée et dansée en deux parties", texto de Charles-Ferdinand Ramuz.',
        porque: 'Não é ópera nem balé: é teatro itinerante de guerra, pensado para caber numa carroça e ser montado em qualquer praça.',
        fonte: { rotulo: 'Museum of Music History', url: 'https://momh.org.uk/exhibitions/stravinskys-the-soldiers-tale/' }
      },
      {
        n: 2, tipo: 'digitar', eixo: 1,
        enunciado: 'Escreva o sobrenome do compositor.',
        dica: 'Nome russo transliterado. Em francês, alemão e inglês ele se escreve de três jeitos — e todos são "o mesmo".',
        aceita: ['stravinsky', 'stravinski', 'strawinsky', 'strawinski', 'igor stravinsky', 'stravinskii', 'stravinsqui'],
        gabarito: 'Igor Fiódorovitch Stravinsky — Игорь Фёдорович Стравинский.',
        porque: 'Transliteração não é erro de grafia: é escolha de sistema. "Strawinsky" nas edições alemãs e "Stravinsky" nas francesas são a mesma pessoa. Já Bach, Haydn e Mozart têm homônimos de verdade na família — aí o sobrenome sozinho não basta.',
        fonte: { rotulo: 'Museum of Music History', url: 'https://momh.org.uk/exhibitions/stravinskys-the-soldiers-tale/' }
      },
      {
        n: 3, tipo: 'ano', eixo: 2,
        enunciado: 'Em que ano nasceu Stravinsky?',
        dica: 'Ele nasceu perto de São Petersburgo e morreu em Nova York, quase noventa anos depois.',
        min: 1850, max: 1920, certo: 1882, tolerancia: 2,
        gabarito: 'Nasceu em 17/06/1882 — 05/06 no calendário juliano — em Oranienbaum, perto de São Petersburgo; morreu em 06/04/1971, em Nova York.',
        porque: 'Em 1918 ele tinha 36 anos, estava exilado na Suíça, sem acesso às rendas russas e sem a máquina dos Ballets Russes. A obra é pequena porque a vida estava pequena.',
        fonte: { rotulo: 'Wikipedia · L\'Histoire du soldat', url: 'https://en.wikipedia.org/wiki/L%27Histoire_du_soldat' }
      },
      {
        n: 4, tipo: 'ano', eixo: 3,
        enunciado: 'Em que ano a obra foi composta?',
        dica: 'Composição e estreia caem no mesmo ano — e o ano é famoso por outro motivo.',
        min: 1900, max: 1940, certo: 1918, tolerancia: 0,
        gabarito: '1918 — composta e estreada no mesmo ano.',
        porque: 'Prazo curto, elenco mínimo, orçamento de mecenas. As restrições estão escritas na partitura.',
        fonte: { rotulo: 'Wikipedia · L\'Histoire du soldat', url: 'https://en.wikipedia.org/wiki/L%27Histoire_du_soldat' }
      },
      {
        n: 5, tipo: 'escolha', eixo: 4,
        enunciado: 'Qual foi a data da estreia?',
        dica: 'Setembro. Seis semanas antes do Armistício.',
        opcoes: [
          '28 de setembro de 1918',
          '29 de maio de 1913',
          '11 de novembro de 1918',
          '13 de junho de 1920'
        ],
        certa: '28 de setembro de 1918',
        gabarito: '28/09/1918, no Théâtre Municipal de Lausanne.',
        porque: 'A turnê prevista por seis teatros foi cancelada pela gripe espanhola. Por anos, a estreia foi a única apresentação.',
        fonte: { rotulo: 'RTS · Radio Télévision Suisse', url: 'https://www.rts.ch/info/culture/9858024-les-aventures-de-histoire-du-soldat-essai-documentaire-musical.html' }
      },
      {
        n: 6, tipo: 'multipla', eixo: 5,
        enunciado: 'O que mais estreou em 1918? Marque tudo o que for de 1918.',
        dica: 'Uma delas estreou no dia seguinte, em Londres.',
        opcoes: [
          'The Planets, de Holst, em audição privada no Queen\'s Hall',
          'O Castelo do Barba Azul, de Bartók, em Budapeste',
          'Il trittico, de Puccini, no Metropolitan Opera',
          'A Sagração da Primavera, de Stravinsky',
          'Pulcinella, de Stravinsky',
          'Wozzeck, de Alban Berg'
        ],
        certas: [
          'The Planets, de Holst, em audição privada no Queen\'s Hall',
          'O Castelo do Barba Azul, de Bartók, em Budapeste',
          'Il trittico, de Puccini, no Metropolitan Opera'
        ],
        gabarito: 'De 1918: The Planets (audição privada em 29/09, Queen\'s Hall, reg. Adrian Boult), O Castelo do Barba Azul (24/05, Ópera Real Húngara) e Il trittico (14/12, Metropolitan Opera). A Sagração é de 1913; Pulcinella, de 1920; Wozzeck, de 1925.',
        porque: 'The Planets estreou um dia depois da Histoire. Duas respostas opostas à mesma guerra: uma para orquestra gigantesca, outra para sete músicos.',
        fonte: { rotulo: 'Wikipedia · 1918 in music', url: 'https://en.wikipedia.org/wiki/1918_in_music' }
      },
      {
        n: 7, tipo: 'ligar', eixo: 6,
        enunciado: 'Ligue cada fato de 1918 ao lugar onde aconteceu.',
        dica: 'É o ano em que o mundo que produziu a obra acabou.',
        esquerda: ['O Armistício de 11 de novembro', 'Wilson anuncia os Catorze Pontos', 'A gripe espanhola fecha as cidades e mata o presidente eleito'],
        direita: ['Europa', 'Estados Unidos', 'Brasil'],
        pares: [
          ['O Armistício de 11 de novembro', 'Europa'],
          ['Wilson anuncia os Catorze Pontos', 'Estados Unidos'],
          ['A gripe espanhola fecha as cidades e mata o presidente eleito', 'Brasil']
        ],
        gabarito: 'Europa: o Tratado de Brest-Litovsk (03/03) e o Armistício (11/11). EUA: os Catorze Pontos de Wilson (08/01). Brasil: a gripe espanhola de outubro e novembro de 1918 — Rodrigues Alves, eleito naquele ano, não chegou a tomar posse e morreu em 16/01/1919.',
        porque: 'A mesma gripe que cancelou a turnê da Histoire na Suíça esvaziou as cidades brasileiras e matou o presidente eleito. Quem rege esta obra rege o som de um mundo que estava acabando — e isso não era notícia só na Europa.',
        fonte: { rotulo: 'Senado Federal · Arquivo S', url: 'https://www12.senado.leg.br/noticias/especiais/arquivo-s/ha-100-anos-gripe-espanhola-devastou-pais-e-matou-presidente' }
      },
      {
        n: 8, tipo: 'ordenar', eixo: 7,
        enunciado: 'Coloque em ordem cronológica, da mais antiga para a mais recente.',
        dica: 'O caminho de Stravinsky do gigantismo ao mínimo.',
        itens: ['A Sagração da Primavera', 'Renard', 'Histoire du soldat', 'Pulcinella'],
        ordem: ['A Sagração da Primavera', 'Renard', 'Histoire du soldat', 'Pulcinella'],
        gabarito: 'A Sagração (1913) → Renard (1915–16) → Histoire du soldat (1918) → Pulcinella (1919–20).',
        porque: 'Em cinco anos a orquestra encolhe de cerca de cem músicos para sete. A guerra explica parte disso; a estética, o resto.',
        fonte: { rotulo: 'Wikipedia · L\'Histoire du soldat', url: 'https://en.wikipedia.org/wiki/L%27Histoire_du_soldat' }
      },
      {
        n: 9, tipo: 'escolha', eixo: 8,
        enunciado: 'O que veio logo depois da Histoire du soldat?',
        dica: 'Ele continuou no mesmo terreno por mais um ou dois passos.',
        opcoes: [
          'Ragtime para onze instrumentos (1918) e Piano-Rag-Music (1919)',
          'O Pássaro de Fogo (1910)',
          'Sinfonia dos Salmos (1930)',
          'The Rake\'s Progress (1951)'
        ],
        certa: 'Ragtime para onze instrumentos (1918) e Piano-Rag-Music (1919)',
        gabarito: 'Ragtime para onze instrumentos, concluído em novembro de 1918, e Piano-Rag-Music (1919); depois, Pulcinella (1919–20) e as Symphonies d\'instruments à vent (1920).',
        porque: 'O ragtime das Trois Danses não foi episódio: virou assunto próprio nas duas obras seguintes.',
        fonte: { rotulo: 'Wikipedia · L\'Histoire du soldat', url: 'https://en.wikipedia.org/wiki/L%27Histoire_du_soldat' }
      },
      {
        n: 10, tipo: 'multipla', eixo: 9,
        enunciado: 'Quais destes instrumentos estão no septeto da Histoire du soldat?',
        dica: 'Sete instrumentos: em cada família, um agudo e um grave.',
        opcoes: ['Clarinete', 'Fagote', 'Cornet (trompete)', 'Trombone', 'Violino', 'Contrabaixo', 'Percussão', 'Flauta', 'Trompa', 'Piano'],
        certas: ['Clarinete', 'Fagote', 'Cornet (trompete)', 'Trombone', 'Violino', 'Contrabaixo', 'Percussão'],
        gabarito: 'Clarinete, fagote, cornet (trompete), trombone, percussão, violino e contrabaixo. A estreia foi no Théâtre Municipal de Lausanne, com regência de Ernest Ansermet, encenação de Georges Pitoëff, cenários e figurinos de René Auberjonois e mecenato de Werner Reinhart, a quem a obra é dedicada.',
        porque: 'O desenho é deliberado: um agudo e um grave em cada família — madeira, metal, corda — mais percussão. É a orquestra reduzida ao seu esqueleto.',
        fonte: { rotulo: 'Wikipedia · L\'Histoire du soldat', url: 'https://en.wikipedia.org/wiki/L%27Histoire_du_soldat' }
      }
    ]
  },

  /* ==========================================================
     O4 · SCHUMANN — Sinfonia nº 4, op. 120
     ========================================================== */
  O4: {
    obra: 'Sinfonia nº 4, op. 120',
    compositor: 'Schumann',
    perguntas: [
      {
        n: 1, tipo: 'escolha', eixo: 0,
        enunciado: 'Por que a "Quarta" de Schumann não é, de fato, a quarta?',
        dica: 'A numeração das sinfonias segue a publicação, não a composição.',
        opcoes: [
          'Foi composta em 1841, logo após a Primeira, mas só publicada em 1853',
          'Foi escrita por Clara Schumann e atribuída a Robert',
          'É um arranjo de uma sinfonia inacabada de Mendelssohn',
          'Schumann numerou as sinfonias em ordem alfabética das tonalidades'
        ],
        certa: 'Foi composta em 1841, logo após a Primeira, mas só publicada em 1853',
        gabarito: 'Sinfonia nº 4 em Ré menor, op. 120. Na versão de 1841 chamava-se Symphonistische Phantasie e era, cronologicamente, a segunda sinfonia de Schumann.',
        porque: 'Número de opus e número de sinfonia contam a história da publicação, não a da criação. Vale para quase todo o repertório.',
        fonte: { rotulo: 'Boston Symphony Orchestra', url: 'https://www.bso.org/works/schumann-symphony-no-4' }
      },
      {
        n: 2, tipo: 'digitar', eixo: 1,
        enunciado: 'Escreva o sobrenome do compositor.',
        dica: 'Duas consoantes no fim. Uma delas é dobrada — e não é o "n" que se perde por acaso.',
        aceita: ['schumann', 'robert schumann', 'r schumann', 'r. schumann'],
        gabarito: 'Robert Schumann — com dois "n".',
        porque: '"Schuman" com um "n" é outro nome (Robert Schuman, o político francês). Um "n" a menos num programa muda de pessoa.',
        fonte: { rotulo: 'Boston Symphony Orchestra', url: 'https://www.bso.org/works/schumann-symphony-no-4' }
      },
      {
        n: 3, tipo: 'ano', eixo: 2,
        enunciado: 'Em que ano nasceu Robert Schumann?',
        dica: 'No mesmo ano que Chopin. E no mesmo ano em que Beethoven escrevia Egmont.',
        min: 1780, max: 1840, certo: 1810, tolerancia: 1,
        gabarito: 'Nasceu em 08/06/1810, em Zwickau; morreu em 29/07/1856, em Endenich, hoje bairro de Bonn.',
        porque: '1810 é o ano de Egmont. Se você respondeu as duas obras, acabou de amarrar duas biografias na mesma data.',
        fonte: { rotulo: 'Boston Symphony Orchestra', url: 'https://www.bso.org/works/schumann-symphony-no-4' }
      },
      {
        n: 4, tipo: 'escolha', eixo: 3,
        enunciado: 'Como se descreve a composição desta sinfonia?',
        dica: 'São duas datas, não uma. E dez anos entre elas.',
        opcoes: [
          'Primeira versão em 1841; revista em 1851 e publicada em 1853',
          'Composta de uma vez em 1851',
          'Composta em 1841 e publicada no mesmo ano',
          'Deixada inacabada e completada por Brahms'
        ],
        certa: 'Primeira versão em 1841; revista em 1851 e publicada em 1853',
        gabarito: 'Primeira versão em 1841; revisão em 1851, em Düsseldorf; publicação em 1853 como op. 120.',
        porque: 'Existem duas partituras legítimas. Escolher entre elas é decisão sua, de regente — e a escolha muda a espessura da orquestração.',
        fonte: { rotulo: 'Boston Symphony Orchestra', url: 'https://www.bso.org/works/schumann-symphony-no-4' }
      },
      {
        n: 5, tipo: 'escolha', eixo: 4,
        enunciado: 'Quando estreou a primeira versão?',
        dica: 'Dezembro, no Gewandhaus.',
        opcoes: [
          '6 de dezembro de 1841',
          '31 de março de 1841',
          '30 de dezembro de 1852',
          '15 de maio de 1853'
        ],
        certa: '6 de dezembro de 1841',
        gabarito: '06/12/1841, no Gewandhaus de Leipzig. A versão revista estreou em 30/12/1852, em Düsseldorf; a consagração veio no Festival do Baixo Reno, em 15/05/1853.',
        porque: 'A recepção morna de 1841 fez Schumann engavetar a obra por dez anos. As outras três datas do enunciado são reais — e cada uma é de um momento diferente da mesma sinfonia.',
        fonte: { rotulo: 'Boston Symphony Orchestra', url: 'https://www.bso.org/works/schumann-symphony-no-4' }
      },
      {
        n: 6, tipo: 'multipla', eixo: 5,
        enunciado: 'O que mais aconteceu na música em 1841? Marque tudo o que for de 1841.',
        dica: '1841 foi, para Schumann, o "ano das sinfonias".',
        opcoes: [
          'Estreia a Sinfonia nº 1 "Primavera", op. 38, sob regência de Mendelssohn',
          'Estreia Giselle, de Adolphe Adam, na Ópera de Paris',
          'Schumann escreve a Ouverture, Scherzo und Finale, op. 52',
          'Estreia Tristão e Isolda, de Wagner',
          'Nasce Antonín Dvořák',
          'Estreia a Sinfonia Fantástica, de Berlioz'
        ],
        certas: [
          'Estreia a Sinfonia nº 1 "Primavera", op. 38, sob regência de Mendelssohn',
          'Estreia Giselle, de Adolphe Adam, na Ópera de Paris',
          'Schumann escreve a Ouverture, Scherzo und Finale, op. 52',
          'Nasce Antonín Dvořák'
        ],
        gabarito: 'De 1841: a "Primavera" (31/03, Gewandhaus, reg. Mendelssohn), Giselle (28/06, Ópera de Paris), a Ouverture, Scherzo und Finale op. 52 e o nascimento de Dvořák (08/09). Tristão é de 1865; a Fantástica, de 1830.',
        porque: 'Em um único ano Schumann escreveu duas sinfonias, uma obra orquestral em três peças e a fantasia que viraria o Concerto para piano. Depois de 1840, o ano dos lieder, veio o ano da orquestra.',
        fonte: { rotulo: 'Houston Symphony', url: 'https://houstonsymphony.org/schumann-symphony-4/' }
      },
      {
        n: 7, tipo: 'ligar', eixo: 6,
        enunciado: 'Ligue cada fato de 1841 ao lugar onde aconteceu.',
        dica: 'O ano em que o Brasil coroou um imperador de quinze anos.',
        esquerda: ['A Convenção dos Estreitos é assinada em Londres', 'Um presidente morre 31 dias após a posse e o vice assume', 'A sagração e coroação de D. Pedro II'],
        direita: ['Europa', 'Estados Unidos', 'Brasil'],
        pares: [
          ['A Convenção dos Estreitos é assinada em Londres', 'Europa'],
          ['Um presidente morre 31 dias após a posse e o vice assume', 'Estados Unidos'],
          ['A sagração e coroação de D. Pedro II', 'Brasil']
        ],
        gabarito: 'Europa: a Convenção dos Estreitos (13/07/1841). EUA: a morte de William Henry Harrison após 31 dias de mandato (04/04/1841), primeira sucessão presidencial da história americana, e a decisão do caso Amistad. Brasil: a sagração e coroação de D. Pedro II na Capela Imperial do Rio, em 18/07/1841, e a Lei nº 261, de 3 de dezembro de 1841.',
        porque: 'Enquanto Schumann estreava sua sinfonia em Leipzig, o Brasil encerrava o período regencial coroando um menino de quinze anos. A distância entre uma sala de concerto alemã e a Capela Imperial do Rio é menor do que parece: é o mesmo ano, e o mesmo século inquieto.',
        fonte: { rotulo: 'Museu Imperial · Ibram', url: 'https://dami.museuimperial.museus.gov.br/handle/acervo/10239' }
      },
      {
        n: 8, tipo: 'ordenar', eixo: 7,
        enunciado: 'Coloque em ordem cronológica, da mais antiga para a mais recente.',
        dica: 'Um ano de lieder, um de sinfonias, um de música de câmara.',
        itens: ['Dichterliebe, op. 48', 'Sinfonia nº 1 "Primavera", op. 38', 'Sinfonia em Ré menor, primeira versão', 'Quinteto com piano, op. 44'],
        ordem: ['Dichterliebe, op. 48', 'Sinfonia nº 1 "Primavera", op. 38', 'Sinfonia em Ré menor, primeira versão', 'Quinteto com piano, op. 44'],
        gabarito: 'Dichterliebe (1840) → "Primavera" (janeiro–março de 1841) → Sinfonia em Ré menor, 1ª versão (1841) → Quinteto op. 44 (1842).',
        porque: 'Schumann trabalhava por gêneros, um ano de cada vez. Saber em que ano você está é saber o que ele estava tentando resolver.',
        fonte: { rotulo: 'Houston Symphony', url: 'https://houstonsymphony.org/schumann-symphony-4/' }
      },
      {
        n: 9, tipo: 'escolha', eixo: 8,
        enunciado: 'O que veio logo depois, em 1842?',
        dica: 'Ele mudou de gênero outra vez.',
        opcoes: [
          'Os três Quartetos op. 41, o Quinteto op. 44 e o Quarteto com piano op. 47',
          'A Sinfonia nº 3 "Renana", op. 97',
          'O ciclo Dichterliebe, op. 48',
          'O Concerto para violoncelo, op. 129'
        ],
        certa: 'Os três Quartetos op. 41, o Quinteto op. 44 e o Quarteto com piano op. 47',
        gabarito: '1842 foi o "ano da música de câmara": os três Quartetos op. 41, o Quinteto op. 44 e o Quarteto com piano op. 47. Já antes da revisão de 1851 vinham a "Renana", op. 97, e o Concerto para violoncelo, op. 129, ambos de 1850.',
        porque: 'Se você reger a versão de 1851, o Schumann relevante não é o de 1842 — é o de Düsseldorf, dez anos mais velho e com a orquestração mais espessa.',
        fonte: { rotulo: 'Boston Symphony Orchestra', url: 'https://www.bso.org/works/schumann-symphony-no-4' }
      },
      {
        n: 10, tipo: 'ligar', eixo: 9,
        enunciado: 'Ligue cada elemento da estreia de 1841 à sua descrição.',
        dica: 'Cuidado: quem regeu a "Primavera" nove meses antes não é quem regeu esta.',
        esquerda: ['Local', 'Regência', 'Conjunto'],
        direita: ['Gewandhaus de Leipzig', 'Ferdinand David', 'Orquestra do Gewandhaus'],
        pares: [
          ['Local', 'Gewandhaus de Leipzig'],
          ['Regência', 'Ferdinand David'],
          ['Conjunto', 'Orquestra do Gewandhaus']
        ],
        gabarito: 'Gewandhaus de Leipzig, regência de Ferdinand David — spalla da casa, não Mendelssohn — com a Orquestra do Gewandhaus. A versão revista foi estreada pelo próprio Schumann, em Düsseldorf.',
        porque: 'Mendelssohn regera a "Primavera" em março e estava fora de Leipzig em dezembro. Trocar um nome pelo outro é o erro mais comum sobre esta estreia.',
        fonte: { rotulo: 'Boston Symphony Orchestra', url: 'https://www.bso.org/works/schumann-symphony-no-4' }
      }
    ]
  }
};
