# Usar como template noutro projeto

A plataforma foi escrita para ser copiada. A ideia é simples e vale a pena
dizê-la antes das instruções:

> **Nada de específico de um evento vive no código.** Datas, locais, textos,
> repertório e ajustes moram em abas da planilha. Trocar de projeto é trocar o
> conteúdo das abas — não é reescrever o `Code.gs`.

Onde essa separação não se sustentou, está marcado abaixo com honestidade.

---

## O mapa

| Camada | Arquivo | Muda a cada projeto? |
|---|---|---|
| Núcleo — planilha, e-mail, calendário, log | `Code.gs` | Quase nada |
| Acesso por código de seis dígitos | `Acesso.gs` | Nada |
| Motor do quiz — servir, corrigir, gravar | `Quiz.gs` | Nada |
| **Conteúdo do quiz** | `QuizBanco.gs` | **Tudo** |
| Esqueleto da página | `index.html` | Nada |
| Aparência | `Estilo.html`, `Fase3Estilo.html` | Só se a marca mudar |
| Telas | `Formulario.html`, `Fase3Formulario.html` | Se as perguntas do cadastro mudarem |
| **Todo o texto** | `Textos.html`, `Fase3Textos.html` | **Tudo** |
| Navegação e lógica de tela | `Script.html`, `Fase3Script.html` | Quase nada |

E na planilha:

| Aba | O que guarda | De quem é |
|---|---|---|
| `Config` | Título, contatos, redes, prazos, links | Sua. Edite à vontade |
| `Eventos` | As datas, locais, horários e janelas | Do código — `EVENTOS_PADRAO` |
| `Repertorio` | Obras e trechos | Do código — `REPERTORIO_PADRAO` |
| `Inscricoes`, `Fase2`, `Fase3` | O que as pessoas responderam | Delas |
| `Acesso` | Resumos dos códigos de seis dígitos | Da máquina |
| `Log` | O que aconteceu | Da máquina |

`Eventos` e `Repertorio` pertencem ao código porque quem as edita é quem edita
o arquivo. `ressincronizarConfiguracao()` apaga as duas e as reescreve a partir
das constantes — é o comando para usar depois de mudar datas ou repertório.

---

## O passo a passo

### 1 · Duplicar

Use este repositório como template no GitHub (`Use this template`), ou copie
`src/` e `ferramentas/` para um repositório novo.

No Apps Script, crie um projeto novo e ponha o `scriptId` dele em `.clasp.json`.
Crie uma planilha nova e ponha o id dela em `PADRAO.SS_ID`, no `Code.gs`.

### 2 · Trocar a identidade

Em `Code.gs`, no topo:

```js
var VERSAO = 'SEU-PROJETO-1.0.0 · dd/mm/aaaa';
var PROP   = { SS_ID: 'SEU_SS_ID', ADMIN_EMAIL: 'SEU_ADMIN_EMAIL', … };
var PADRAO = { SS_ID: '…', ADMIN_EMAIL: '…', CONTATO: '…', LOGO_ID: '…' };
```

Os nomes em `PROP` são chaves das Script Properties. Troque o prefixo `MRO_`
pelo do seu projeto para dois projetos não brigarem pela mesma propriedade.

### 3 · Trocar os eventos e o repertório

`EVENTOS_PADRAO` e `REPERTORIO_PADRAO`, no `Code.gs`. As colunas estão
documentadas em `CABECALHO_EVENTOS` e `CABECALHO_REPERTORIO`.

Três campos de `Eventos` merecem atenção, porque governam comportamento e não
texto:

- `avisoApos` — a partir daqui o encontro aparece como "já começou" e pede
  ciência de quem se inscrever.
- `abertoAte` — a partir daqui ele não aceita mais ninguém.
- `temRepertorio` — `SIM` faz aparecer a tela de escolha de trechos.

Se `avisoApos` e `abertoAte` forem iguais, não existe janela de tolerância: o
encontro encerra no instante em que começa. O `diagnostico()` avisa.

Depois de mudar: `ressincronizarConfiguracao()`.

### 4 · Trocar os textos

`Textos.html` e `Fase3Textos.html` são objetos literais, sem lógica nenhuma. A
tela lê por `data-t="caminho.da.chave"`. Trocar o texto não exige tocar em
nenhuma outra coisa.

Convenção da casa, que vale a pena manter: `olho` é o rótulo miúdo em
maiúsculas; `titulo`, a frase grande; `apoio`, o parágrafo; `nota`, a ressalva
pequena.

### 5 · Trocar as perguntas

`QuizBanco.gs`. A estrutura de uma pergunta:

```js
{
  n: 1,                       // número, 1 a 10
  tipo: 'escolha',            // ver a tabela abaixo
  eixo: 0,                    // índice em QUIZ_EIXOS
  enunciado: '…',             // a pergunta
  dica: '…',                  // uma ou duas linhas, no máximo
  /* campos do tipo */
  gabarito: '…',              // a resposta, por extenso
  porque: '…',                // por que ela importa para quem rege
  fonte: { rotulo: '…', url: 'https://…' }
}
```

| `tipo` | Campos próprios | Como pontua |
|---|---|---|
| `escolha` | `opcoes[]`, `certa` | Tudo ou nada |
| `multipla` | `opcoes[]`, `certas[]` | Acertos sobre certas, menos erros sobre distratores |
| `digitar` | `aceita[]` | Cheio se bate; 60% com uma letra errada |
| `ano` | `min`, `max`, `certo`, `tolerancia` | 100% exato · 70% dentro da tolerância · 30% perto |
| `ligar` | `esquerda[]`, `direita[]`, `pares[][]` | Proporcional aos pares certos |
| `ordenar` | `itens[]`, `ordem[]` | Proporcional às posições certas |

Duas regras que o motor impõe e você não precisa se preocupar em respeitar:

1. **O gabarito não sai do servidor.** O navegador recebe as opções
   embaralhadas e devolve o *texto* do que marcou. A correção compara texto,
   nunca índice. É por isso que embaralhar não exige guardar estado de sessão.
2. **`aceita[]` normaliza sozinho** — caixa, acento e pontuação. Escreva as
   variantes legítimas de grafia, não as variantes de digitação.

Rode `node ferramentas/verificar.js` depois de mexer. Ele confere que todo
gabarito está entre as opções, que os dez eixos estão cobertos e que toda
pergunta tem fonte citável.

### 6 · Trocar a marca

`Estilo.html`, no `:root`. São seis variáveis que carregam a identidade:

```css
--onyx: #0A0A0A;  --onyx-2: #16161A;  --onyx-3: #232328;
--alabastro: #EAEAEA;  --ouro: #E0C56E;  --prata: #D1D1D1;
```

O ouro tem um papel exclusivo: a marca de ensaio e o que está selecionado. Se
ele começar a aparecer em texto corrido, a hierarquia se perde.

---

## O que ainda não é genérico

Dito sem rodeio, para você não descobrir no meio de outro projeto:

- **A Fase 2 é deste evento.** Escolher trechos, o compromisso do dia 09, como
  levar a partitura — está em `Formulario.html` e nos validadores do
  `Script.html`. Noutro projeto, essas telas saem ou viram outra coisa.
- **Os dez eixos do quiz são de obra musical.** O motor serve para qualquer
  conteúdo de dez perguntas, mas `QUIZ_EIXOS` e `QUIZ_SUGESTOES` falam de
  compositor e estreia.
- **Os e-mails têm o desenho da Academia Kephra.** O HTML está em `Code.gs`,
  `Acesso.gs` e `Quiz.gs`, escrito em tabelas porque cliente de e-mail não
  entende layout moderno. Trocar cor e texto é fácil; trocar a estrutura, não.
- **`Fase3Script.html` fala com `Script.html` por sete pontos.** Estão listados
  no README. Enquanto esses sete existirem, a Fase 3 é destacável: apagar os
  quatro arquivos `Fase3*` e as sete emendas devolve a plataforma à v3.

---

## O que vale copiar mesmo mudando tudo

Três decisões que custaram caro para chegar aqui e que se repetem em qualquer
projeto deste feitio:

1. **Ler a planilha por nome de coluna, nunca por posição.** Uma coluna nova no
   meio desloca tudo em silêncio — nada estoura, e o dado errado começa a ser
   gravado. `mapaColunas()` resolve isso.
2. **Comparar datas por componentes de relógio de parede, não por objeto
   `Date`.** O fuso do projeto e o da planilha podem divergir, e a lógica de
   abertura e encerramento desloca três horas sem avisar. `partesDeData()` e
   `carimbo()` reduzem tudo a número comparável.
3. **Verificar antes de publicar, sempre no mesmo lugar.** `diagnostico()` no
   editor, `ferramentas/verificar.js` no terminal e na Action. Um relatório que
   ninguém precisa interpretar é o que faz a checagem realmente acontecer.
