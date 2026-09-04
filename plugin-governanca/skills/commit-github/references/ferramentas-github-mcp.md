# Ferramentas do conector GitHub (MCP) — referência

Mecânica detalhada do conector. A `SKILL.md` aponta para cá no momento de executar os passos. Mantém só o que a skill `commit-github` precisa na v1 (só commit: adicionar/atualizar arquivos, mais criar o repositório na primeira vez).

> **Aviso de versão:** os nomes e parâmetros abaixo valem para o conector oficial do GitHub (`github/github-mcp-server`) em meados de 2026. Conector é produto e muda. Na hora de executar, confira os nomes e parâmetros reais das ferramentas disponíveis na sessão; se algum nome divergir, use o equivalente que estiver disponível e siga a mesma lógica.

---

## Mapa: tarefa → ferramenta

| Tarefa na skill | Ferramenta do conector |
|---|---|
| Commitar **vários arquivos** num único commit | `push_files` |
| Commitar **um arquivo** | `create_or_update_file` |
| Ler um arquivo do repo (pegar conteúdo atual e o `sha`) | `get_file_contents` |
| Listar a árvore de arquivos do repo (para o modo sincronizar) | `get_repository_tree` |
| Listar os branches do repo | `list_branches` |
| Criar o repositório na primeira vez | `create_repository` |
| Ver o histórico de commits | `list_commits` / `get_commit` |

> `delete_file` e `create_branch` **existem** no conector, mas **não são usados na v1**: a skill nunca apaga (guardrail) e não cria branch de trabalho (sem fluxo de Pull Request na v1). Não chame essas duas.

---

## `push_files` — vários arquivos, um commit (caminho principal)

Use sempre que o commit toca **mais de um arquivo**. Junta tudo num commit só, o que mantém o histórico limpo.

Parâmetros principais:
- `owner` — dono do repo (pessoa ou organização).
- `repo` — nome do repositório.
- `branch` — branch de destino (vindo do Passo 0 da skill).
- `files` — lista de objetos, cada um com `path` (caminho do arquivo no repo) e `content` (o conteúdo do arquivo). É aqui que entra o conteúdo que você leu — por isso não precisa de terminal.
- `message` — a mensagem do commit (formato `rótulo: descrição`, ver SKILL.md).

## `create_or_update_file` — um arquivo só

Use quando o commit toca **um único arquivo**. Escreve (cria ou atualiza) esse arquivo com uma mensagem.

Parâmetros principais:
- `owner`, `repo`, `branch` — como acima.
- `path` — caminho do arquivo no repo.
- `content` — o conteúdo.
- `message` — a mensagem do commit.
- `sha` — **obrigatório quando é atualização** (arquivo já existe). É o identificador da versão atual do arquivo no GitHub; sem ele, atualizar falha. Pegue o `sha` com `get_file_contents` antes (ver abaixo). Para arquivo novo, não envie `sha`.

## `get_file_contents` — ler antes de escrever (idempotência + `sha`)

Serve a dois propósitos na skill:
1. **Pegar o `sha`** da versão atual de um arquivo, necessário para atualizá-lo com `create_or_update_file`.
2. **Comparar conteúdo** para a idempotência: se o conteúdo no GitHub já é idêntico ao local, **não recommite esse arquivo**.

Parâmetros: `owner`, `repo`, `path`, e opcionalmente o `ref` (branch/tag/commit; na ausência, usa o branch padrão).

## `get_repository_tree` — listar o que está no repo (modo sincronizar)

Devolve a estrutura de arquivos do repositório, de forma recursiva (entra nas subpastas). É o que permite, no **modo sincronizar**, descobrir:
- quais arquivos **já existem** no repo (para decidir adicionar vs atualizar);
- quais arquivos **existem no repo mas sumiram da pasta** local — gatilho do Trilho 2 (perguntar, nunca apagar).

## `list_branches` — conferir branches

Use no Passo 0 quando precisar confirmar qual é o branch padrão, ou checar se um branch citado nos docs do projeto realmente existe. Se o branch apontado não existir, isso cai na regra de "ambíguo/faltando → perguntar".

## `create_repository` — criar na primeira vez (Passo 0-B)

Só depois de confirmar **nome, dono e visibilidade** com a pessoa.

Parâmetros principais:
- `name` — nome do repositório (confirmado).
- `private` — **`true` por padrão.** Só use `false` (público) se a pessoa pediu explicitamente.
- `description` — opcional, uma linha sobre o projeto.
- `autoInit` — se `true`, o GitHub já cria o repo com um primeiro arquivo (um README vazio), o que evita repo "oco". Útil para garantir que o branch padrão exista antes do primeiro commit.

> Sobre o dono: dependendo do conector, o repositório é criado na conta autenticada por padrão. Para criar dentro de uma **organização** (ex.: a organização da Endolife), confirme com a pessoa e use o parâmetro de organização disponível na ferramenta — confira o nome exato do parâmetro na sessão.

---

## Comportamentos do conector que importam para a skill

- **Histórico preservado, sem force-push.** As operações de escrita do conector mantêm o histórico do Git intacto — não reescrevem o passado. Isso é bom: cada commit fica registrado, e a skill não corre o risco de apagar histórico sem querer.
- **Branch criado automaticamente** em algumas implementações quando ele não existe no momento do push. **Não dependa disso na v1**: a skill resolve o branch no Passo 0 e, se houver dúvida, pergunta. Não use esse comportamento para "criar branch nas coxas".
- **Detecção de segredos no push.** O conector pode barrar segredos que ele mesmo detecta. Trate como rede de segurança extra — a trava LGPD da skill (Trilho 3) continua sendo a principal e é mais ampla.
- **Conexão remota por OAuth.** O conector hospedado do GitHub autentica via OAuth (sem precisar colar token). Quem instala o conector já entra conectado. Nada disso é problema da skill — ela só usa as ferramentas; a autenticação é do conector.
