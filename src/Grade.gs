/* ============================================================
   GRADE DO ENCONTRO PRESENCIAL

   A ordem do dia 08 não é ordem de inscrição: os regentes estão
   agrupados por obra, para que o pianista fique dentro da mesma
   partitura, e ordenados de maior a menor experiência prévia,
   para que quem tem menos estrada assista antes de subir.

   A grade é uma tabela escrita à mão, não um cálculo. Ela vale
   para uma sessão específica, com nomes e minutos já decididos;
   um algoritmo que a gerasse seria mais código para produzir a
   mesma coisa uma vez só.
   ============================================================ */

var GRADE_E2 = {
  encontroId: 'E2',
  data: '08/09/2026',
  diaSemana: 'terça-feira',
  horaInicio: '17h30',
  horaFim: '19h30',
  chegada: '17h20',
  local: 'Centro Cultural Camargo Guarnieri',
  endereco: 'Rua do Anfiteatro, 109 · Butantã',
  mapa: 'https://www.google.com/maps/dir/?api=1&destination=Centro+Cultural+Camargo+Guarnieri%2C+Rua+do+Anfiteatro%2C+109%2C+S%C3%A3o+Paulo',
  minutosPodio: 11,
  blocos: [
    { numero: 'I',   compositor: 'Stravinsky', obra: 'Histoire du Soldat', pessoas: [
      { email: 'allan.olimpio10@gmail.com',       nome: 'Allan',        inicio: '17h36', fim: '17h47',
        trecho: 'Marche du Soldat' },
      { email: 'matheusmacedo.musico@usp.br',     nome: 'Matheus',      inicio: '17h48', fim: '17h59',
        trecho: 'Trois Danses (Tango–Valse–Ragtime)' }
    ]},
    { numero: 'II',  compositor: 'Schumann',   obra: 'Sinfonia nº 4, op. 120', pessoas: [
      { email: 'prof.thiagov@gmail.com',          nome: 'Thiago David', inicio: '18h02', fim: '18h13',
        trecho: 'I — introdução Ziemlich langsam e transição ao Lebhaft' },
      { email: 'mariahbritto01@gmail.com',        nome: 'Mariah',       inicio: '18h14', fim: '18h25',
        trecho: 'I — introdução Ziemlich langsam e transição ao Lebhaft' }
    ]},
    { numero: 'III', compositor: 'Beethoven',  obra: 'Abertura Egmont, op. 84', pessoas: [
      { email: 'henriqueribeiro@usp.br',          nome: 'Henrique',     inicio: '18h28', fim: '18h39',
        trecho: 'Introdução Sostenuto ma non troppo' },
      { email: 'melissatomas@usp.br',             nome: 'Melissa',      inicio: '18h40', fim: '18h51',
        trecho: 'Transição ao Allegro' }
    ]},
    { numero: 'IV',  compositor: 'Beethoven',  obra: 'Sinfonia nº 7, op. 92', pessoas: [
      { email: 'meenacampelo@usp.br',             nome: 'Meena',        inicio: '18h54', fim: '19h05',
        trecho: 'I — Poco sostenuto e transição ao Vivace' },
      { email: 'lucasmarquezin@outlook.com',      nome: 'Lucas',        inicio: '19h06', fim: '19h17',
        trecho: 'II — Allegretto, da abertura até o fugato' }
    ]}
  ]
};

/** Achata a grade numa lista com o bloco de cada pessoa junto. */
function pessoasDaGrade(grade) {
  var fora = [];
  grade.blocos.forEach(function (b) {
    b.pessoas.forEach(function (p, i) {
      fora.push({
        email: normalizarEmail(p.email), nome: p.nome, inicio: p.inicio, fim: p.fim,
        trecho: p.trecho, bloco: b.numero, compositor: b.compositor, obra: b.obra,
        ordemNoBloco: i + 1, totalNoBloco: b.pessoas.length
      });
    });
  });
  return fora;
}

/**
 * Manda a cada regente a sua própria linha da grade.
 * Rode à mão, uma vez, na manhã do encontro.
 */
function enviarGradeE2() {
  var cfg = getConfig();
  var lista = pessoasDaGrade(GRADE_E2);
  var enviados = 0, erros = 0, quem = [];

  for (var i = 0; i < lista.length; i++) {
    try {
      enviarGradeIndividual(lista[i], GRADE_E2, cfg);
      enviados++;
      quem.push(lista[i].inicio + ' · ' + lista[i].nome + ' <' + lista[i].email + '>');
    } catch (e) {
      erros++;
      registrar('ERRO', 'GRADE_E2', lista[i].email + ' · ' + e.message);
    }
  }

  registrar('INFO', 'GRADE_E2', 'Enviados: ' + enviados + ' · erros: ' + erros);
  return 'Grade enviada a ' + enviados + (erros ? ' · erros: ' + erros : '') +
    '\n' + quem.join('\n');
}

/** Confere a grade sem mandar nada: quem, quando, e se o e-mail bate com a planilha. */
function previewGradeE2() {
  var lista = pessoasDaGrade(GRADE_E2);
  var aba = getAba(ABAS.FASE2);
  var col = mapaColunas(aba, CABECALHO_FASE2);
  var v = aba.getLastRow() > 1
    ? aba.getRange(2, 1, aba.getLastRow() - 1, aba.getLastColumn()).getValues() : [];

  var naPlanilha = {};
  for (var k = 0; k < v.length; k++) {
    var e = normalizarEmail(v[k][col.Email]);
    if (e && String(v[k][col.Encontros]).indexOf('08/09') >= 0) naPlanilha[e] = true;
  }

  var fora = [];
  lista.forEach(function (p) {
    fora.push(p.inicio + '–' + p.fim + ' · ' + p.nome + ' · bloco ' + p.bloco +
      ' · ' + p.email + (naPlanilha[p.email] ? '' : '  ← NÃO consta no 08/09'));
    delete naPlanilha[p.email];
  });

  var sobrando = Object.keys(naPlanilha);
  if (sobrando.length) {
    fora.push('');
    fora.push('Marcados para 08/09 e fora da grade: ' + sobrando.join(', '));
  }
  return fora.join('\n');
}

function enviarGradeIndividual(p, grade, cfg) {
  var contato = cfg.emailContato || PADRAO.CONTATO;
  var assinatura = cfg.assinaturaEmail || 'Equipe Academia Kephra';
  var pasta = cfg.pastaPartiturasUrl || '';
  var F = FONTE;

  function par(t, mt) {
    return '<div style="font:400 15px/1.72 ' + F + ';color:#2A2A2A;margin-top:' +
      (mt || '0') + ';">' + t + '</div>';
  }
  function linha(rot, val) {
    return '<tr><td style="padding:7px 0;border-bottom:1px solid #E8E8E8;' +
      'font:400 12px/1.5 ' + F + ';letter-spacing:.1em;text-transform:uppercase;' +
      'color:#8A8A8A;width:38%;vertical-align:top;">' + escapeHtml(rot) + '</td>' +
      '<td style="padding:7px 0;border-bottom:1px solid #E8E8E8;' +
      'font:400 14px/1.55 ' + F + ';color:#2A2A2A;">' + val + '</td></tr>';
  }

  // Quem abre o bloco não tem a quem assistir antes; quem vem depois, tem.
  var posicao = p.ordemNoBloco === 1
    ? 'Você abre o bloco ' + p.bloco + '. Quem vem depois de você rege a mesma obra — ' +
      'o que você fizer no pódio serve de referência para o colega.'
    : 'Você rege depois de um colega que trabalha a mesma obra. Chegue cedo e assista: ' +
      'metade do aprendizado de uma masterclass acontece na plateia.';

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
    escapeHtml(p.nome) + ', você rege hoje às ' + escapeHtml(p.inicio) + '.</div>' +
    '<div style="font:400 15px/1.7 ' + F + ';color:#5A5A5A;margin-top:12px;max-width:44ch;">' +
    'A grade do encontro está fechada. Esta é a sua parte dela.</div></td></tr>' +

    /* A faixa preta é o que a pessoa precisa lembrar se não ler mais nada. */
    '<tr><td style="padding:22px 26px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#0A0A0A;"><tr>' +
    '<td align="center" style="padding:20px 18px;">' +
    '<div style="font:400 10px/1.8 ' + F + ';letter-spacing:.2em;text-transform:uppercase;' +
    'color:#E0C56E;">Seu horário de pódio</div>' +
    '<div style="font:300 30px/1.2 ' + F + ';color:#FFFFFF;margin-top:8px;">' +
    escapeHtml(p.inicio) + ' <span style="font-size:18px;color:#9A9A9A;">às ' +
    escapeHtml(p.fim) + '</span></div>' +
    '<div style="font:400 12px/1.7 ' + F + ';letter-spacing:.12em;text-transform:uppercase;' +
    'color:#9A9A9A;margin-top:8px;">' + grade.minutosPodio + ' minutos</div>' +
    '</td></tr></table></td></tr>' +

    '<tr><td style="padding:32px 26px 0;">' + rubrica('O que você vai reger') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;table-layout:fixed;">' +
    linha('Obra', escapeHtml(p.compositor) + ' — ' + escapeHtml(p.obra)) +
    linha('Excerto', escapeHtml(p.trecho)) +
    linha('Bloco', 'Bloco ' + escapeHtml(p.bloco) + ' · ' + p.ordemNoBloco + 'º de ' + p.totalNoBloco) +
    '</table></td></tr>' +

    '<tr><td style="padding:22px 26px 0;">' + par(posicao) + '</td></tr>' +

    '<tr><td style="padding:32px 26px 0;">' + rubrica('Onde e quando') +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;table-layout:fixed;">' +
    linha('Data', escapeHtml(grade.data + ' · ' + grade.diaSemana)) +
    linha('Sessão', escapeHtml(grade.horaInicio + ' às ' + grade.horaFim + ' · sem intervalo')) +
    linha('Chegada', '<b style="font-weight:700;">' + escapeHtml(grade.chegada) + '</b>') +
    linha('Local', escapeHtml(grade.local) + '<br>' + escapeHtml(grade.endereco) +
      '<br><a href="' + escapeHtml(grade.mapa) + '" style="color:#8A7940;text-decoration:none;' +
      'border-bottom:1px solid #DCDCDC;">como chegar</a>') +
    '</table></td></tr>' +

    '<tr><td style="padding:24px 26px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" ' +
    'style="border-collapse:collapse;background:#F4F1EA;border-left:3px solid #B08542;"><tr>' +
    '<td style="padding:16px 18px;font:400 14px/1.72 ' + F + ';color:#2A2A2A;">' +
    '<b style="font-weight:700;">Traga a sua partitura</b>, impressa ou no tablet. ' +
    (pasta
      ? 'As grades e as reduções para piano continuam na pasta do Drive: ' +
        '<a href="' + escapeHtml(pasta) + '" style="color:#8A7940;text-decoration:none;' +
        'border-bottom:1px solid #C9BFA6;">LINK</a>.'
      : '') +
    '<br><br><b style="font-weight:700;">Se for filmar</b>, chegue com tudo pronto — ' +
    'celular carregado, tripé montado, lugar já escolhido. Ajeitar a sala no meio da ' +
    'sessão sai do tempo de todos.' +
    '</td></tr></table></td></tr>' +

    '<tr><td style="padding:24px 26px 0;">' +
    par('A sessão está organizada por obra, e não por ordem de inscrição: o pianista fica ' +
        'dentro da mesma partitura, e o tempo que se perderia trocando de obra volta para o ' +
        'pódio. Os horários acima já contam o tempo de troca entre um regente e outro.') +
    '</td></tr>' +

    '<tr><td style="padding:34px 26px 0;text-align:center;">' +
    '<div style="font:400 15px/1.8 ' + F + ';color:#3A3A3A;max-width:340px;margin:0 auto;">' +
    'Até logo mais,<br>' + escapeHtml(assinatura) + '</div>' +
    '<div style="font:400 13px/1.8 ' + F + ';color:#8A8A8A;margin-top:14px;max-width:330px;' +
    'margin-left:auto;margin-right:auto;">Qualquer imprevisto, escreva para<br>' +
    '<a href="mailto:' + escapeHtml(contato) + '" style="color:#8A7940;text-decoration:none;' +
    'border-bottom:1px solid #DCDCDC;">' + escapeHtml(contato) + '</a></div></td></tr>' +

    '<tr><td style="padding:24px 26px 30px;text-align:center;">' +
    '<div style="border-top:1px solid #E8E8E8;padding-top:20px;font:400 10px/1.8 ' + F + ';' +
    'letter-spacing:.16em;text-transform:uppercase;color:#B4B4B4;">' +
    'Plataforma desenvolvida por <a href="' +
    escapeHtml(cfg.creditoUrl || 'https://opusaitech.com/') + '" style="color:#8A8A8A;' +
    'text-decoration:none;border-bottom:1px solid #DCDCDC;">' +
    escapeHtml(cfg.creditoNome || 'Opus AI') + '</a></div></td></tr>' +

    '</table></td></tr></table></body></html>';

  var texto = [
    p.nome + ', você rege hoje às ' + p.inicio + '.',
    '',
    'SEU HORÁRIO DE PÓDIO: ' + p.inicio + ' às ' + p.fim + ' (' + grade.minutosPodio + ' minutos)',
    '',
    'Obra: ' + p.compositor + ' — ' + p.obra,
    'Excerto: ' + p.trecho,
    'Bloco ' + p.bloco + ' · ' + p.ordemNoBloco + 'º de ' + p.totalNoBloco,
    '',
    grade.data + ' · ' + grade.diaSemana,
    grade.horaInicio + ' às ' + grade.horaFim + ' · sem intervalo',
    'Chegada: ' + grade.chegada,
    grade.local + ' — ' + grade.endereco,
    grade.mapa,
    '',
    'Traga a sua partitura, impressa ou no tablet.',
    (pasta ? 'Grades e reduções para piano: ' + pasta : ''),
    '',
    'Se for filmar, chegue com tudo pronto — celular carregado, tripé montado.',
    '',
    'Até logo mais,',
    assinatura
  ];

  MailApp.sendEmail(p.email,
    p.nome + ', você rege hoje às ' + p.inicio + ' — a sua parte da grade',
    texto.join('\n'),
    { htmlBody: html, name: assinatura, replyTo: contato });
}
