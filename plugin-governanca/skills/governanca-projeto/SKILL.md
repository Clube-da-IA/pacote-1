---
name: governanca-projeto
description: >-
  Estabelece e mantém a governança de um projeto do Clube da IA (Endolife Health-Tech × Inova UNIMES):
  revisa a pasta, garante o padrão de documentação com o SPEC.md no centro, cria os documentos que
  faltam e commita no GitHub. USE ESTA SKILL sempre que o usuário disser: "rodar governança",
  "kickoff do projeto", "iniciar projeto novo", "organizar a documentação", "criar o SPEC",
  "padronizar a pasta", "montar a governança", "auditar o projeto", "fazer o setup de governança",
  ou quando começar a trabalhar num projeto (Agenda da Clínica, HANGAR, Boletim Semanal, etc.) e os
  documentos-base (SPEC.md, TASKS.md, HANDOFF.md, README.md, CLAUDE.md) estiverem ausentes ou
  desatualizados. Também dispare quando o CLAUDE.md de um projeto pedir para "rodar governanca-projeto
  antes de seguir". É uma skill de PORTÃO: só o usuário aciona de propósito, porque ela escreve
  arquivos e faz commit (tem efeito colateral).
---

# Governança de Projeto — Clube da IA

## O que esta skill faz e por quê

Esta é a **primeira coisa que se roda num projeto**. Ela garante que todo projeto do clube nasça (ou se ajuste) com a mesma espinha dorsal de documentação, com o `SPEC.md` no centro como **fonte da verdade** — o contrato que diz *o que o projeto é, para quem, e o que ele NUNCA pode fazer*.

O princípio por trás disso (vale entender, não só obedecer): num time pequeno e que está aprendendo, o que mais custa caro é perder o fio — esquecer onde parou, mudar de rumo sem registrar, ou começar a programar sem saber o limite de segurança. Os documentos resolvem isso. O agente (Claude Code) lê esses arquivos automaticamente e trabalha dentro do combinado, em vez de improvisar.

> **Termos rápidos** (porque nem todo membro do clube programa):
> - **SPEC** = especificação. O documento-contrato do projeto.
> - **Stub** = esqueleto vazio de um documento, com os títulos prontos para preencher depois.
> - **MCP** = a "tomada padrão" que deixa o agente falar com o GitHub sem você abrir terminal.
> - **Commit** = salvar uma versão no GitHub, com uma etiqueta explicando o que mudou.
> - **Idempotente** = rodar de novo é seguro: a skill checa o que já existe e só mexe no que falta.

## Regras inquebráveis (leia antes de tudo)

1. **Idioma: sempre Português do Brasil.** Todos os documentos e toda a conversa, em PT-BR natural.

2. **Diagnostique antes de agir; respeite o que já existe.** Esta skill é acionada num momento específico: o projeto está **no início** (Porta A, recém-saído do chat com um SPEC) ou **nem começou** (Porta B, só uma ideia). Mas a pasta pode já ter material bom — inclusive em projetos que amadureceram. Então a postura é de **médico que examina antes de receitar**: primeiro olhe tudo e entenda o que já está lá; só depois mexa, e só no que falta. Num projeto já bem documentado, a saída certa é um **relatório curto** ("está coerente; duas observações") — não uma enxurrada de arquivos novos. Criar um stub vazio ao lado de um documento rico que já existe é um erro, não uma ajuda.

3. **Trava de LGPD/segredos — embutida e inegociável, com bom senso de gravidade.** Nunca peça, escreva ou commite **dado real de paciente** nem **segredo de produção** (chave de API real, senha de banco em produção, token de acesso). Documente apenas **onde** essas coisas ficam (ex.: "as credenciais ficam nas variáveis de ambiente do Vercel"), nunca o valor. Mas calibre a reação pela gravidade:
   - **Dado real de paciente, ou segredo de produção** → **pare, avise e não commite** até resolver. Inegociável.
   - **Credencial descartável de desenvolvimento local** (ex.: usuário/senha de um banco Docker que só roda na máquina, dado de teste fictício) → **apenas avise** no relatório final, sem travar. Em projeto no início, esses placeholders de dev são normais e inofensivos; bloquear o commit por causa deles atrapalha mais do que protege.

   Por que essa distinção importa: a skill aparece quando o projeto é imaturo, e projeto imaturo está cheio de senha-de-mentira de dev. Tratar tudo como ameaça máxima geraria alarme falso constante e ensinaria o usuário a ignorar o aviso — exatamente o oposto do objetivo.

4. **Só o usuário aciona.** Esta skill escreve arquivos e commita — tem efeito colateral. Não rode por conta própria nem como auto-disparo de ambiente. Se um `CLAUDE.md` pedir para rodá-la, confirme com o usuário antes.

5. **Decisão compreensível — inegociável.** Todo aviso, pendência ou pergunta que você devolve ao usuário para ele decidir vem em linguagem leiga: traduza cada termo técnico no próprio ponto e diga a consequência concreta (não "credencial de dev no arquivo X" sozinho, mas *"está a senha do banco de testes que roda só na sua máquina; se fosse a de produção, seria vazamento — por isso só aviso, não travo"*). O público é o médico, não o programador — se ele não entende o risco, não consegue decidir. Vale acima da concisão do relatório.

## Como a skill decide o caminho: as duas portas

Logo no começo, **olhe a pasta do projeto** e decida sozinho qual porta seguir:

- **Porta A — já existe `SPEC.md`.** É o fluxo normal: o usuário chega do chat com o SPEC pronto (a skill `spec-builder` produz isso, ou ele escreveu à mão). A skill **adota** esse SPEC, confere se cobre os assuntos essenciais e garante que os papéis de documentação ao redor estejam cobertos — sem reformatar nem duplicar o que já está bom.

- **Porta B — não existe `SPEC.md`.** O projeto veio de uma ideia solta, sem contrato. A skill **entrevista** o usuário em linguagem simples para construir o SPEC do zero. *(A entrevista acontece apenas no Claude Code.)*

Anuncie qual porta detectou, em uma frase, antes de seguir. Ex.: *"Encontrei um SPEC.md já existente — vou pela Porta A: conferir o que já existe e completar só o que faltar."*

---

## PORTA A — adotar um SPEC existente

**Objetivo:** validar o SPEC que já existe e garantir que a documentação ao redor cubra o essencial — **sem reformatar nem duplicar** o que já está bom.

1. **Leia o `SPEC.md` e use o template como checklist de *assuntos*, não como molde de formato.** O template em `references/templates.md` lista os assuntos que um bom SPEC precisa cobrir: identidade, objetivo, o que faz, **o que NÃO faz / limites de segurança**, dados e sensibilidade LGPD, critérios de sucesso, restrições técnicas, decisões e pendências. Sua pergunta é *"esse SPEC cobre esses assuntos em algum lugar?"* — não *"ele tem as minhas seções com os meus títulos na minha ordem?"*. Um SPEC com estrutura própria, rica e coerente está **certo**; respeite-a.

2. **Aponte só lacunas reais de conteúdo, e não invente.** Se um assunto essencial estiver de fato ausente (ex.: o SPEC não diz em lugar nenhum o que o projeto NUNCA pode fazer), **pergunte ao usuário** — uma pergunta de cada vez, em linguagem simples. Nunca preencha limites de segurança ou critérios de sucesso por conta própria; é decisão dele. Diferença de gravidade: para a **Fase 0–1** de um projeto, basta o SPEC ter identidade, objetivo, limites de segurança e a sensibilidade dos dados; o resto pode ficar como pendência marcada.

3. **Só reorganize um SPEC fino ou bagunçado.** Se o SPEC for um rascunho curto e desordenado, aí sim ajude a estruturá-lo seguindo o template, preservando todo o conteúdo. **Se já for um documento maduro, não toque na estrutura** — no máximo sugira (sem aplicar) um ajuste pontual, e só se agregar valor real.

4. **Verifique os outros documentos pelo *papel* que cumprem, não pelo nome exato.** Antes de declarar qualquer coisa "faltando", procure na pasta inteira (inclusive subpastas como `tasks/`, `docs/`) por um arquivo que já faça o trabalho:
   - **Lista de tarefas** (papel do TASKS): um `TASKS.md`, mas também um `tasks/todo.md`, `TODO.md`, um board — qualquer coisa que rastreie o que falta fazer.
   - **Estado/continuidade** (papel do HANDOFF): um `HANDOFF.md` em qualquer pasta, ou notas de "onde paramos".
   - **Como rodar** (papel do README): um `README.md`.
   - **Regras do agente**: um `CLAUDE.md` (cheque também as pastas-pai — pode haver um herdado).

   **Se o papel já está cumprido, não crie stub** — apenas confira coerência com o SPEC e relate divergências. **Crie um stub somente para o papel que estiver genuinamente ausente.** Exemplo real: um projeto com `tasks/todo.md` + `tasks/HANDOFF.md` já tem tarefas e continuidade cobertas; criar `TASKS.md` e `HANDOFF.md` vazios na raiz só polui.

5. **Monte o relatório de diagnóstico** (ver "Fechamento"). Em projeto maduro, o resultado típico é "tudo coerente, nada a criar, X observações". Em projeto no início, é "criei o que faltava".


---

## PORTA B — construir o SPEC por entrevista

**Objetivo:** transformar uma ideia solta num `SPEC.md` completo, sem exigir que o usuário saiba escrever especificação.

**Onde:** apenas no Claude Code.

1. **Conduza a entrevista** seguindo o roteiro em `references/entrevista-porta-b.md`. Regras da entrevista:
   - **Uma pergunta de cada vez.** Espere a resposta antes da próxima. Avalanche de perguntas trava quem não é técnico.
   - **Linguagem do dia a dia.** Em vez de "quais são os não-objetivos do escopo", pergunte "tem alguma coisa que esse projeto **não** deve fazer, mesmo que pareça útil?".
   - **Insista com carinho nos limites de segurança.** A pergunta "o que esse projeto NUNCA pode fazer?" é a mais importante de todas em contexto de saúde. Se a resposta for vaga, ajude com exemplos do domínio (ex.: "nunca dar conduta clínica sem médico", "nunca expor dado de paciente a serviço de terceiro").

2. **Monte o `SPEC.md`** preenchendo o template (`references/templates.md`) com as respostas. Onde o usuário não souber responder, deixe a seção marcada como pendência explícita (ex.: `- Pendência: definir critério de sucesso`) em vez de inventar.

3. **Mostre o SPEC montado** e peça confirmação. Ajuste conforme o retorno.

4. **Crie os stubs** de `TASKS.md`, `HANDOFF.md`, `README.md` e o `CLAUDE.md` (modelos em `references/templates.md`) — mas, mesmo aqui, antes de criar cada um, confira se algum arquivo já cumpre aquele papel (ver Porta A, passo 4) e não duplique.

5. Siga para a seção **"Fechamento"** abaixo.

---

## Fechamento (vale para as duas portas)

1. **Varra segredos e dados sensíveis em tudo que examinou — não só no que vai gravar.** Numa auditoria, o valor está em enxergar o repositório inteiro. Aplique a regra de gravidade (Regra inquebrável nº 3):
   - achou **dado real de paciente** ou **segredo de produção** → **pare, avise e não commite** até resolver;
   - achou **credencial de dev local / dado de teste fictício** → **registre como aviso** no relatório e siga normalmente.

2. **Grave apenas o que faltava.** Não reescreva documentos que já existem e estão coerentes. Crie só os stubs dos papéis genuinamente ausentes e, na Porta B, o `SPEC.md` montado. Se nada faltou, não grave nada.

3. **Se gravou algo, commite no GitHub via MCP, direto** (sem pedir ok — preferência do usuário). Use a conexão GitHub do MCP para criar/atualizar os arquivos; **não use terminal nem git pela linha de comando**. Mensagem curta e clara, padrão `docs: ...`. Exemplos:
   - `docs: estabelece governança inicial (SPEC + stubs faltantes + CLAUDE.md)`
   - `docs: adiciona CLAUDE.md de governança ao repositório`
   Se **nada** foi gravado, não há commit.

4. **Entregue o relatório de diagnóstico.** Sempre — mesmo quando não gravou nada. Estrutura curta:
   - **Porta detectada** (A ou B) e por quê.
   - **O que já existe e está coerente** (papéis cobertos: SPEC, tarefas, handoff, README, regras).
   - **O que foi criado** (se algo) + a mensagem do commit.
   - **Avisos** (ex.: credencial de dev local encontrada no doc X — sugestão de mover para `.env`).
   - **Pendências do SPEC** que dependem de decisão do usuário.

   Em projeto maduro, esse relatório provavelmente diz "nada a criar; tudo coerente; 1 aviso". Isso é sucesso, não falha.

## Quando rodar de novo (auditoria periódica)

Como a skill diagnostica antes de agir e não duplica papéis, rodá-la num projeto já organizado é seguro e serve de **auditoria**: confere se os documentos seguem coerentes com o estado atual, sinaliza segredos que vazaram para a documentação, e completa só o que faltar. Sem medo de bagunçar o que está pronto.

## Arquivos de apoio desta skill

Leia sob demanda, quando o passo pedir:
- `references/templates.md` — o template do `SPEC.md`, os stubs dos quatro documentos e o trecho do `CLAUDE.md`. **Leia ao chegar no momento de criar ou conferir qualquer documento.**
- `references/entrevista-porta-b.md` — o roteiro de perguntas da entrevista. **Leia apenas quando entrar na Porta B.**
