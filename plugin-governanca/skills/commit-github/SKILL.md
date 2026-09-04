---
name: commit-github
description: Salva (commita) e versiona arquivos de um projeto direto no GitHub pelo conector MCP, sem terminal. USE quando a pessoa pedir para commitar, salvar no GitHub, versionar, "subir os arquivos pro repo", "manda isso pro GitHub", "guarda essa versão", "faz um commit", "atualiza o repositório" — inclusive quando ela só descrever o desejo de gravar o trabalho no GitHub sem usar a palavra "commit". Cobre três coisas — sincronizar uma pasta local com o repositório (commitando só o que mudou), commitar arquivos avulsos que a pessoa apontar, e criar o repositório na primeira vez. NÃO dispare sozinha — como grava coisas no GitHub (efeito colateral), só roda quando a pessoa pede de propósito — nunca por iniciativa própria, nunca como passo automático de outra tarefa.
---

<!-- versão: 1.2 — ver "Changelog" no fim do arquivo -->

# commit-github

Salva versões do trabalho de um projeto no GitHub, pelo conector, sem nenhum terminal.

> **Glossário rápido** (esta skill é usada por gente que não programa — explique cada termo na primeira vez que ele aparecer, inclusive nos avisos que você escrever para a pessoa):
> - **Commit**: salvar uma "foto" de um ou mais arquivos no GitHub, com uma frase curta dizendo o que mudou. O GitHub guarda cada commit no histórico.
> - **Repositório (repo)**: a pasta-mãe do projeto lá no GitHub.
> - **Branch**: uma linha de versões dentro do repo. A principal quase sempre se chama `main`.
> - **Conector (MCP)**: a ponte que liga este assistente ao GitHub. É por ela que tudo acontece aqui.
> - **Push**: o ato de enviar os arquivos do commit para o GitHub.

> **Princípio inegociável — decisão compreensível.** Quando um guardrail te faz **parar e perguntar** (repo/branch ambíguo, arquivo que sumiu, candidato a segredo), a pergunta chega à pessoa em linguagem leiga: o termo técnico traduzido ali mesmo e a **consequência concreta** dita sem jargão (ex.: não "trato como removido?", mas *"se eu tratar o arquivo X como removido, ele some do repositório no GitHub — mantenho ou removo?"*). Ela é médica, não programadora — só decide bem o que entende. Reescreva até ficar claro; vale acima da concisão.

---

## Quando rodar (e quando não rodar)

Rode **só quando a pessoa pedir** para salvar/commitar/versionar o trabalho no GitHub. Como esta skill grava coisas (tem efeito colateral), ela nunca age sozinha: não commite "de bônus" ao terminar outra tarefa, nem porque pareceu uma boa ideia. Se a pessoa não pediu para commitar, não commite.

Quando ela pedir, você commita **direto, sem pedir autorização** — e **mostra depois** a mensagem e os arquivos que entraram. A confiança é por padrão; a transparência vem logo atrás, no relatório. As únicas coisas que te fazem **parar e perguntar antes** são os guardrails de segurança descritos abaixo (repo/branch indefinido, risco de apagar algo, dado sensível). Fora deles, siga em frente.

## Princípio central

Tudo passa pelo conector do GitHub. **Nunca** use terminal nem comandos `git` — eles não estão disponíveis aqui e não são o caminho.

O detalhe que faz isso funcionar sem terminal: o conector envia o **conteúdo** de cada arquivo, não um "diff" (a diferença) calculado no disco. Então você não precisa de `git status` para saber o que mudou — você commita exatamente os arquivos que tem em mãos: ou os que a pessoa apontou, ou os que você leu da pasta do projeto.

**Idempotência** (rodar de novo é seguro): se um arquivo já está no GitHub com conteúdo idêntico, não recommite. Rodar a skill duas vezes sem nenhuma mudança não deve gerar commit nenhum — apenas avise que não havia o que salvar.

As ferramentas exatas do conector (qual usar para cada coisa, com quais parâmetros) estão em `references/ferramentas-github-mcp.md`. Leia esse arquivo quando for executar os passos.

---

## Passo 0 — Descobrir onde commitar (repo + branch)

Antes de qualquer coisa, saiba **em qual repositório e em qual branch** o commit vai cair. Não chute.

1. **Procure no projeto.** Repo e branch costumam estar escritos no `README.md` ou no `CLAUDE.md` do projeto, na parte de "onde as coisas moram". Use o que estiver lá.
2. **Branch padrão.** Se o projeto disser o repo mas não o branch, use o branch padrão do repositório (quase sempre `main`).
3. **Sempre conte onde caiu.** No relatório final, diga explicitamente o repo e o branch usados — assim a pessoa nunca fica na dúvida de para onde o trabalho foi.
4. **Ambíguo ou faltando → pergunte.** Se você não conseguir determinar com segurança o repo ou o branch (não está nos docs, ou há mais de um candidato), **pare e pergunte** em vez de adivinhar. Mandar trabalho pro lugar errado é pior do que uma pergunta a mais.
5. **Repo não existe →** vá para o Passo 0-B.

### Passo 0-B — Criar o repositório na primeira vez

Se o repositório apontado ainda não existe no GitHub, **dois caminhos** dependendo de como a pessoa pediu:

#### Caminho A — Pedido explícito de criar

A pessoa disse claramente "cria o repo", "manda esse projeto pro GitHub pela primeira vez", "inicia o git deste projeto", ou equivalente. Intenção clara → você age, com inferências razoáveis:

- **Nome**: deduza da pasta-raiz do projeto, ou do que aparece no `CLAUDE.md`/`SPEC.md`/`README.md`. Não pergunte.
- **Dono**: se algum doc do projeto diz (`endolife-health/X` no CLAUDE.md, por exemplo), use. Se há um único candidato no histórico, use. **Só pergunte se houver ambiguidade real** entre conta pessoal e organização — essa decisão tem peso (billing, acesso de membros, LGPD), não chute.
- **Visibilidade**: **privado, sempre**. No relatório final, avise: *"Criei como privado. Me diga se quer público que eu ajusto a visibilidade depois."* Não pergunte no meio do fluxo.

#### Caminho B — Pedido implícito (descobriu durante um "commita")

A pessoa só pediu para commitar, e você descobriu que não há repositório. Criar repo é uma surpresa → **pare e confirme uma vez**, com proposta já formada:

> *"Não encontrei repositório configurado para este projeto. Quer que eu crie um novo no GitHub? Sugiro: nome `[deduzido]`, dono `[deduzido]`, privado. Confirma ou ajusta?"*

Uma pergunta, com default sensato. A pessoa responde uma linha e você segue.

#### Initial commit (vale para os dois caminhos)

Faça o **primeiro commit com os arquivos do projeto local**, respeitando:

- **`.gitignore` se existir** na pasta local: ignore o que ele manda ignorar.
- **`.gitignore` não existe**: crie um básico antes de commitar, cobrindo o óbvio do tipo de projeto: `node_modules/`, `.env`, `.env.local`, `__pycache__/`, `*.pyc`, `.DS_Store`, `dist/`, `build/`, `.next/`, `.vercel/`. Esse `.gitignore` entra junto no initial commit.
- **Trava LGPD do Trilho 3 segue valendo** — ela varre antes do commit e bloqueia se achar dado sensível grave, mesmo no initial commit.

Mensagem do initial commit: `inicia: estrutura inicial do projeto` (rótulo `inicia:` — ver Passo 3).

**Atenção ao branch vazio (aprendido em teste real):** `push_files` precisa de um branch que **já exista**. Um repo recém-criado sem nada não tem branch, então um `push_files` direto **falha**. Dois jeitos de resolver:

- **Recomendado:** crie o repo com `autoInit: true` (o GitHub já cria o branch padrão com um README). Em seguida, o `push_files` sobe todos os arquivos de uma vez — o `README.md` real do projeto sobrescreve o gerado.
- **Alternativa:** crie com `autoInit: false` e faça o **primeiro arquivo** com `create_or_update_file` (isso inicializa o branch), e o **restante** com `push_files`.

**Importação inicial muito grande:** se o projeto tem centenas de arquivos ou vários MB (ex.: `package-lock.json`, binários, seeds grandes), subir tudo pelo conector é impraticável — o conteúdo de cada arquivo passa pelo contexto do agente. Nesse caso, oriente a pessoa a fazer a **primeira carga por fora** (git push / Claude Code) e use a skill para os **commits do dia a dia** (o que ela faz bem). Não tente despejar um tree gigante num único `push_files`.

---

## Passo 1 — Decidir o modo: sincronizar a pasta ou arquivos apontados

Esta skill trabalha de dois jeitos. Escolha pelo que a pessoa disse:

- **A pessoa nomeou arquivos ou pastas específicos** ("commita o `SPEC.md` e a pasta `tasks/`") → **modo avulso**.
- **A pessoa não especificou** ("salva isso no GitHub", "commita o que mudou") → **modo sincronizar**.

### Modo sincronizar (padrão)

A pessoa tem uma pasta local que espelha o repositório. Sua tarefa:

1. Leia os arquivos da pasta local.
2. Compare com o que já está no repositório (no GitHub).
3. Commite **só os arquivos novos ou alterados**. Não recommite o que está idêntico (idempotência).
4. No relatório, liste o que entrou, separando **adicionados** de **atualizados**.
5. Se nada mudou, diga que não havia o que commitar — e pare.

Antes de commitar, passe pelos guardrails do Passo 2 (eles são onde o "sincronizar" pode precisar parar e perguntar).

### Modo avulso

A pessoa nomeou o que quer salvar. Empurre **exatamente esses arquivos/pastas**, sem varrer o resto do projeto. Mesmo assim, passe os arquivos pela trava de dado sensível (Passo 2, Trilho 3) antes de commitar.

---

## Passo 2 — Os três trilhos de segurança

Toda decisão de segurança cai em um de três trilhos. **Eles não se misturam**: um commit comum não vira interrogatório, e um risco real não passa batido.

### Trilho 1 — Commit normal: siga direto

Adicionar arquivo novo ou atualizar arquivo existente é o caso comum. Faça **direto, sem pedir ok**. A transparência vem no relatório (Passo 3), não numa pergunta antes.

### Trilho 2 — Risco de apagar algo: pare e pergunte

Na v1, **esta skill nunca apaga arquivo do repositório**. Deletar é destrutivo e surpreendente — se um dia for preciso, a gente abre essa porta de propósito, com cuidado. Por enquanto, a skill só **adiciona e atualiza**.

Por isso, três situações **não viram ação automática — viram pergunta**:

- **Arquivo sumiu.** No modo sincronizar, se um arquivo existe no repositório mas não está mais na pasta local, **não apague e não ignore calado**. Avise e pergunte, mais ou menos assim: *"O arquivo `X.md` está no repositório mas não está mais na sua pasta. Mantenho ele no repositório, ou você confirma que quer removê-lo?"* Uma divergência escondida entre a pasta e o repo é exatamente o que queremos evitar.
- **Renomear ou mover** (parece "apagou o antigo + criou um novo"). A skill não tem como saber sozinha se foi um rename intencional ou um arquivo que virou lixo. Então **pergunte** antes de tratar o arquivo antigo como removido.
- **Mudança em massa suspeita.** Se de repente há dezenas ou centenas de arquivos para commitar, ou a pasta local claramente não bate com o repositório, **pare e confirme** — pode ser pasta ou repositório errado. (Diagnosticar antes de agir: um susto desses quase sempre é engano de caminho.)

### Trilho 3 — Trava LGPD por gravidade: o trilho mais importante

Antes de commitar qualquer coisa, **varra o conteúdo dos arquivos** procurando dado sensível. A reação depende da **gravidade**:

**GRAVE → BLOQUEIA** (para tudo, avisa, **não commita nada**):
- **Dado real de paciente**: nome de pessoa junto de informação clínica, CPF, número de prontuário, laudo ou exame identificado — qualquer coisa que ligue uma pessoa real a um dado de saúde.
- **Segredo de produção**: uma chave ou credencial de um sistema que está **no ar, valendo de verdade** (o sistema que pacientes ou clientes usam).

**LEVE → SÓ AVISA** (não bloqueia o commit, mas **registra o aviso no relatório**):
- Credencial de **ambiente de desenvolvimento local** (a sua máquina de testes).
- Dado de teste **fictício**, exemplo, placeholder.

**Regras que valem para os dois níveis:**
- **Documente ONDE, nunca o VALOR.** Diga em qual arquivo e, se der, em qual linha o dado está — **mas nunca repita o valor em si** no aviso. Reescrever uma senha ou um CPF dentro de um alerta é vazá-lo de novo.
- **Na dúvida, trate como grave e pergunte.** Esta é a regra de ouro: a skill **não inventa** o nível de risco. Quando ela encontra algo que **parece** uma credencial mas não consegue dizer se é de produção ou de dev (uma chave tem a mesma cara nos dois casos), ela **pergunta** — e a pergunta chega em linguagem leiga, dizendo a consequência concreta: *"Achei o que parece uma credencial no arquivo `X`, linha `Y`. Ela abre um sistema que está no ar (produção) ou é só de teste na sua máquina? Se for de produção e isso for pro GitHub, é vazamento."* — e só decide bloquear ou avisar depois da resposta. Dado de paciente, por outro lado, é dado de paciente em qualquer cenário: na dúvida sobre paciente, **bloqueie**.

> Nota: o próprio conector do GitHub já vem bloqueando alguns segredos detectados no momento do push. Isso é uma rede de segurança **extra**, mas não substitui esta trava — a nossa é mais ampla, porque pega dado de paciente, e não só credencial.

---

## Passo 3 — Escrever a mensagem do commit

Como você commita sem pedir ok, **é você quem escreve a mensagem** — a frase que descreve a mudança e fica gravada no histórico. Padrão da casa: **rótulo em português + descrição natural**.

Formato: `rótulo: descrição curta no presente`

Conjunto de rótulos (pode ser ajustado por projeto, mas comece com estes):
- `inicia:` — primeiro commit do projeto, ou criação de uma estrutura nova grande.
- `documento:` — mudou um documento ou texto (SPEC, README, conteúdo).
- `recurso:` — adicionou uma funcionalidade ou código novo.
- `correção:` — consertou algo que estava errado.
- `ajuste:` — mudança pequena ou de manutenção (renomear, limpar, reorganizar).

**Exemplos:**

Mudança: primeiro commit do projeto inteiro
Mensagem: `inicia: estrutura inicial do projeto`

Mudança: adicionei a seção de dados no SPEC
Mensagem: `documento: adiciona seção de dados no SPEC`

Mudança: criei a tela de login
Mensagem: `recurso: adiciona tela de login`

Mudança: corrigi o link quebrado no README
Mensagem: `correção: conserta link quebrado no README`

Mudança: renomeei variáveis e limpei comentários
Mensagem: `ajuste: renomeia variáveis e limpa comentários`

Escreva a descrição em português, com verbo no presente e curta. Se um commit reúne vários arquivos sobre **um mesmo tema**, use uma mensagem que resuma o tema. Se as mudanças não têm relação entre si, prefira separar em commits diferentes (cada um com sua mensagem) — ou, se for tudo de uma vez mesmo, descreva o conjunto com honestidade.

### De onde vem a descrição (o "o quê")

Muitas vezes a pessoa pede "commita o `SPEC.md`" sem dizer **o que** mudou. Você ainda precisa preencher a descrição. Siga esta ordem:

1. **A pessoa disse o que mudou?** Use isso. ("Adicionei a seção de dados" → `documento: adiciona seção de dados ao SPEC`.)
2. **Não disse → deduza da diferença.** Você **já buscou a versão atual** do arquivo no GitHub para checar idempotência (`get_file_contents`). Aproveite: compare a versão antiga com a nova e resuma a mudança em poucas palavras. Esse é o caminho normal — sai uma descrição precisa sem custar uma pergunta.
3. **Não dá para resumir com clareza?** Cai no **genérico honesto**. Isso vale quando a mudança é grande/difusa demais para uma frase, **ou** quando é arquivo novo (não há versão anterior para comparar). Aí use algo direto e verdadeiro, sem inventar detalhe: `documento: atualiza SPEC.md` (arquivo existente) ou `documento: adiciona SPEC.md` (arquivo novo).

A regra por trás: **deduza quando der, nunca invente, nunca trave**. Um resumo impreciso é pior do que um genérico honesto — na dúvida entre detalhar errado e ser genérico, seja genérico. E não transforme isso numa pergunta a cada commit: perguntar "o que mudou?" só se justifica se a pessoa pedir mensagens mais caprichadas; o padrão é deduzir ou ser genérico, sem atrito.

---

## Passo 4 — Relatório pós-commit (sempre)

Depois de commitar, **mostre à pessoa**, em linguagem simples:

- A **mensagem** (ou mensagens) que você usou.
- A **lista de arquivos** que entraram, separando os **adicionados** dos **atualizados**.
- O **repositório e o branch** onde o commit caiu.
- Se **criou o repositório agora**, avise que ele ficou **privado** e ofereça mudar para público se a pessoa quiser.
- Os **avisos da trava LGPD nível leve**, se houve algum (lembrando: o local, nunca o valor).
- O **link do commit**, se o conector devolver um.

Se **nada foi commitado**, diga claramente o porquê: ou não havia mudança (idempotência), ou algo foi bloqueado pela trava de dado sensível. A pessoa nunca deve ficar sem saber o que aconteceu.

---

## Resumo: quando parar e perguntar

Você age direto na maioria dos casos. Pare e pergunte **só** quando:

- O **repo ou o branch** está ambíguo ou faltando (Passo 0).
- O **repositório não existe** (Passo 0-B): se o pedido de criar foi **explícito** (Caminho A), aja com inferências e só pergunte o **dono** se houver ambiguidade real entre conta pessoal e organização; se foi **implícito** (Caminho B, descoberto durante um "commita"), faça **uma** pergunta de confirmação com a proposta já formada (nome, dono, privado).
- Um arquivo **sumiu**, foi **renomeado/movido**, ou há uma **mudança em massa suspeita** (Trilho 2).
- Há **dado sensível grave**, ou um **candidato a segredo** que você não consegue classificar como produção ou dev (Trilho 3).

Em toda pergunta desses guardrails, aplique o **princípio da decisão compreensível** (topo do arquivo): traduza o termo técnico ali mesmo e diga a consequência concreta, para a pessoa decidir entendendo. Em todo o resto: commite, e conte depois.

---

## Changelog

### v1.2
- **Princípio "decisão compreensível"** tornado explícito (regra nº 0 do plugin, v1.1.0): toda pergunta de guardrail (Passo 0, Trilhos 2 e 3) chega à pessoa com o termo técnico traduzido no ponto e a consequência concreta dita sem jargão. A pergunta do candidato a segredo (Trilho 3) foi reescrita nesse formato.

### v1.1
- **Passo 0-B reescrito** com dois caminhos: **A (pedido explícito de criar)** — deduz nome/dono, cria privado por padrão e só pergunta o dono em caso de ambiguidade real; **B (pedido implícito)** — uma única pergunta de confirmação com proposta já formada. Acaba com o interrogatório de três perguntas da v1.
- **Initial commit explícito**: respeita `.gitignore` se existir, e cria um `.gitignore` básico (Node/Python) antes de subir se não existir — evita commitar `node_modules`, `.env`, `dist/` etc. Usa `push_files` (vários arquivos, um commit).
- **Correção pós-teste (um app de dados clínicos):** `push_files` exige branch existente — num repo vazio ele falha. A skill agora orienta `autoInit: true` (ou semear o 1º arquivo com `create_or_update_file`) antes do `push_files`. Também alerta que importação inicial muito grande (centenas de arquivos / vários MB) deve ir por git/Claude Code, não pelo conector.
- **Novo rótulo `inicia:`** no Passo 3, para o primeiro commit do projeto.
- **Passo 4 e Resumo** atualizados para refletir o novo fluxo (aviso de "criei como privado" e os Caminhos A/B).
- Trava LGPD (Trilho 3) **inalterada** — continua varrendo e bloqueando antes de qualquer commit, inclusive o inicial.

### v1.0
- Versão inicial: modo sincronizar + modo avulso, três trilhos de segurança, Passo 0-B conservador (sempre pergunta nome/dono/visibilidade).
