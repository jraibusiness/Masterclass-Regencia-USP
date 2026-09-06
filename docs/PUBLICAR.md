# Publicar

O projeto no Apps Script é
[`1uGRi3ta…kGypN`](https://script.google.com/home/projects/1uGRi3tagktIa1TsvmqCXjU54gM4Ci5nG7_F9yYvl0Ww98rJNl2kXGypN),
e está declarado em `.clasp.json`. Este repositório é a fonte; o editor do
Apps Script é o destino.

---

## Por que uma API key não serve

A Apps Script API **não aceita API key**. Ela responde, literalmente:

> `401 · API keys are not supported by this API. Expected OAuth2 access token
> or other authentication credentials that assert a principal.`

Faz sentido: uma API key identifica um *projeto*, não uma *pessoa*. Escrever
no seu projeto do Apps Script é agir em seu nome — mexer no seu Drive, no seu
Gmail, na sua planilha. Isso exige credencial de usuário, OAuth 2.0, com o
escopo `script.projects`.

Chave do Google AI Studio, em particular, é do Generative Language API — a do
Gemini. Não tem relação nenhuma com o Apps Script.

O caminho é o `clasp`, que faz o login OAuth uma vez e guarda um *refresh
token*. É esse token que vai para o segredo do GitHub.

---

## Uma vez só: ligar o repositório ao projeto

### 1 · Habilitar a API no seu usuário

<https://script.google.com/home/usersettings> → **Google Apps Script API: ligada**.

Sem isso, todo comando do clasp devolve `User has not enabled the Apps Script API`.

### 2 · Autenticar na sua máquina

```bash
npm install -g @google/clasp@2.4.2
clasp login
```

Abre o navegador, você autoriza, e o token fica em `~/.clasprc.json`.

Sem navegador na máquina (servidor, container):

```bash
clasp login --no-localhost
```

Ele imprime uma URL; você abre onde tiver navegador, autoriza, e cola o código
de volta no terminal.

### 3 · Conferir que a ligação está de pé

```bash
git clone https://github.com/jraibusiness/masterclass-regencia-usp
cd masterclass-regencia-usp
clasp status        # deve listar os arquivos de src/
```

### 4 · Guardar a credencial no GitHub

```bash
cat ~/.clasprc.json
```

Copie **o conteúdo inteiro**, incluindo as chaves, e crie o segredo:

`Settings → Secrets and variables → Actions → New repository secret`

- **Name:** `CLASPRC_JSON`
- **Secret:** o JSON colado

> Esse arquivo é uma credencial de verdade: quem o tiver pode escrever nos seus
> projetos do Apps Script. Ele nunca entra no repositório — o `.gitignore` já o
> bloqueia. Se vazar, revogue em
> <https://myaccount.google.com/permissions>, removendo o acesso do "clasp", e
> refaça o `clasp login`.

Pronto. A partir daqui, **todo push em `main` que toque em `src/` publica**.

---

## O dia a dia

```bash
node ferramentas/verificar.js     # antes de qualquer coisa
git add -A && git commit -m "..."
git push                          # a Action publica sozinha
```

Ou, da sua máquina, sem passar pelo GitHub:

```bash
clasp push --force
```

Para ver o desenho sem publicar nada:

```bash
node ferramentas/previa.js
open ferramentas/saida/previa.html
```

---

## Enviar código ≠ publicar versão

São dois atos distintos, e a diferença importa quando tem gente usando:

| | O que faz | Quem vê |
|---|---|---|
| `clasp push` | Atualiza o código do projeto | Ninguém, até você implantar |
| `clasp deploy` | Cria uma nova implantação | Quem abrir a URL da implantação nova |
| Implantação `@HEAD` | Aponta sempre para o código atual | Muda no instante do push |

A Action faz **push** a cada commit em `main`. A implantação nova só acontece se
você rodar o fluxo à mão, em `Actions → Publicar no Apps Script → Run workflow`,
marcando "Criar também uma nova implantação".

Se a URL que você distribuiu é a de uma implantação `@HEAD` (o padrão do "Testar
implantação"), então o push já muda o que as pessoas veem. Confira em
`Implantar → Gerenciar implantações` antes de mexer em dia de evento.

---

## Depois do primeiro envio, no editor

Rode nesta ordem, uma vez:

1. `configurarProprietario()` — garante `MRO_HMAC_KEY`. Sem ela, nenhum bilhete
   de sessão é emitido e ninguém entra.
2. `garantirAbasBase()` — cria as abas que faltam e completa a Config.
3. `diagnostico()` — leia o relatório inteiro. Ele confere cabeçalhos, eventos,
   repertório, banco de perguntas, correção, a pasta de partituras, a chave de
   assinatura e a cota de e-mail.

E confira à mão: a pasta em `pastaPartiturasUrl` precisa estar liberada para
"qualquer pessoa com o link".

---

## Quando der errado

| Mensagem | O que é |
|---|---|
| `User has not enabled the Apps Script API` | Falta o passo 1 |
| `Invalid credentials` / `invalid_grant` | O token expirou ou foi revogado. Refaça o `clasp login` e atualize o segredo |
| `Falta o segredo CLASPRC_JSON` | O segredo não foi criado, ou foi criado com outro nome |
| `Script API daily limit exceeded` | Muitos pushes no dia. Espere |
| A Action passa mas nada muda no navegador | Você fez push sem implantar, e a URL distribuída é de uma implantação fixa |
