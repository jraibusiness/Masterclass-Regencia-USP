# Masterclasses de Regência Orquestral

Plataforma de inscrição, escolha de repertório e preparo de obra.
Maestro João Rocha · ECA/USP · Academia Kephra.

Google Apps Script servindo um web app de tela única, com Google Sheets como
banco. `src/` é a fonte; o editor do Apps Script é o destino.

**Versão MRO-4.0.0** · [publicar](docs/PUBLICAR.md) · [usar como template](docs/TEMPLATE.md) · [pesquisa das obras](docs/PESQUISA-OBRAS.md)

---

## As três fases

```
FASE 1 · inscrição            dados, formação, experiência, autorizações
FASE 2 · repertório           encontros, trechos a reger, compromisso do dia 09
FASE 3 · preparo da obra      dez perguntas sobre a obra, placar, partituras
```

Quem chega ao portão digita o e-mail e recebe um código de seis dígitos. A
partir daí a plataforma sabe em que ponto a pessoa está e a leva só ao que
falta:

```
portão → código ─┬─ nunca se inscreveu ──→ fase 1 → fase 2 → fase 3
                 ├─ inscrito, sem fase 2 ─→ fase 2 → fase 3
                 └─ tudo feito ───────────→ fase 3
```

---

## Fase 3 — o preparo da obra

As dez perguntas de "Conhecendo a obra", da Academia Kephra, sobre a obra que a
pessoa escolheu reger. Não é prova: é o roteiro que faz alguém chegar ao pódio
sabendo de onde a música veio.

Seis formatos de resposta — escolha única, múltipla, digitação, barra de ano,
ligação entre colunas e ordenação cronológica. Cem pontos, com crédito parcial.
Devolutiva pergunta a pergunta, com a resposta, o porquê e a fonte, na tela e
por e-mail.

**O gabarito nunca sai do servidor.** O navegador recebe as opções embaralhadas
e devolve o texto do que marcou; a correção compara texto, não índice.

---

## Acesso

O e-mail digitado é uma alegação. O código que chega nele é a prova.

- O código **nunca** é gravado em claro: a aba `Acesso` guarda o HMAC de
  `email|codigo`, para que um resumo vazado não sirva em outra conta.
- Verificado o código, o servidor emite um bilhete assinado (HMAC-SHA256, chave
  em `MRO_HMAC_KEY`). Toda função da Fase 3 começa por `exigirSessao(bilhete)`.
- Doze minutos de validade, cinco tentativas, quatro pedidos a cada quinze
  minutos, comparação em tempo constante.
- A resposta do portão é idêntica para quem está e para quem não está inscrito.
  Fosse diferente, ele viraria um verificador de quem se inscreveu.

---

## Os arquivos

| | |
|---|---|
| `Code.gs` | Núcleo: planilha com auto-cura, configuração, e-mails, calendário, log, diagnóstico |
| `Acesso.gs` | Código de seis dígitos, bilhete de sessão, situação do participante |
| `Quiz.gs` | Serve, corrige, grava e manda a devolutiva |
| `QuizBanco.gs` | As 40 perguntas, com gabarito, justificativa e fonte |
| `index.html` | Esqueleto; monta os includes |
| `Estilo.html` · `Fase3Estilo.html` | Aparência |
| `Formulario.html` · `Fase3Formulario.html` | As telas |
| `Textos.html` · `Fase3Textos.html` | Todo o conteúdo editorial. Nenhuma lógica |
| `Script.html` · `Fase3Script.html` | Navegação e lógica de tela |

A Fase 3 é destacável: vive em quatro arquivos `Fase3*` e conversa com o resto
por sete pontos. Apagar os quatro e desfazer os sete devolve a plataforma à v3.

<details>
<summary>Os sete pontos de contato em <code>Script.html</code></summary>

1. `TELAS = window.F3.telas(TELAS)` — a Fase 3 acrescenta as telas dela e
   restringe as da Fase 2 para quem já a concluiu.
2. `irPara` marca o sentido da navegação em `#palco`, para a animação.
3. `irPara` trata `selo` como tela sem topo, esconde o "voltar" no quiz e no
   placar, mostra o rodapé só nas telas de `TELAS_COM_RODAPE` e avisa
   `F3.aoEntrar(tela.id)`.
4. `avancar` consulta `F3.exigirCiencia(tela.id)`.
5. `montarPortao` chama `solicitarCodigo` em vez de `buscarInscricao`.
6. `aoCodigoVerificado(res)` — o que o portão fazia antes do código existir.
7. `montarFim` revela `#fimPreparo`; `iniciar` chama `F3.iniciar(...)`;
   `ligarEventos` liga o botão.

</details>

---

## As abas da planilha

| Aba | Colunas |
|---|---|
| `Config` | chave · valor |
| `Eventos` | id · ordem · titulo · subtitulo · data · horaInicio · horaFim · modalidade · local · endereco · link · avisoApos · abertoAte · descricao · temRepertorio |
| `Repertorio` | obraId · ordemObra · compositor · obra · trechoId · ordemTrecho · trecho |
| `Inscricoes` | 30 colunas, de Carimbo a Historico |
| `Fase2` | Carimbo · Email · Nome · Origem · Encontros · Prioridade1 · Prioridade2 · CienciaFarrenc · ComoLevaPartitura · LevaInstrumento · ProtocoloInscricao |
| `Fase3` | Carimbo · Email · Nome · Protocolo · ObraId · Obra · Pontos · Acertos · Detalhe · CienciaPartituras · CienciaSonataTheory · Versao |
| `Acesso` | Carimbo · Email · Resumo · Expira · Tentativas · Estado |
| `Log` | Carimbo · Nivel · Evento · Detalhe |

As abas se criam e se curam sozinhas: `garantirAbasBase()` acrescenta o que
falta sem tocar no que existe.

---

## Trabalhar neste repositório

```bash
node ferramentas/verificar.js     # sintaxe, banco, correção, sessão, vazamento
node ferramentas/previa.js        # monta a plataforma para abrir no navegador
open ferramentas/saida/previa.html
```

A prévia tem três caminhos, pela query da URL:

```
previa.html                 já inscrito, com a fase 2 concluída
previa.html?caso=novo       nunca se inscreveu
previa.html?caso=semfase2   inscrito, mas sem a fase 2
```

Nenhuma das duas ferramentas precisa de rede, de credencial ou de
`npm install`.

No editor do Apps Script há três funções de mesa: `diagnostico()`,
`testarBancoQuiz()` e `testarCorrecaoQuiz()`.

Publicar: veja [`docs/PUBLICAR.md`](docs/PUBLICAR.md). Um push em `main` que
toque em `src/` envia o código sozinho, depois da verificação passar.

---

Plataforma desenvolvida por [Opus AI](https://opusaitech.com/).
