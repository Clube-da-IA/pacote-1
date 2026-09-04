---
name: hangar-sync
description: Skill que fecha o ciclo do Clube da IA — cataloga um projeto pronto como uma nave no HANGAR (app local) e carimba a versão. USE ESTA SKILL quando o usuário disser "rodar hangar-sync", "estacionar no hangar", "catalogar o projeto", "adicionar a nave", "atualizar o hangar" ou "fechar a versão do projeto", ou quando um projeto terminou uma etapa e precisa virar uma nave no dados-hangar.json. Roda no Cowork, lê o blueprint do projeto (pasta local por padrão, ou repo GitHub) e faz merge por id direto no dados-hangar.json no disco — backup antes, escrita atômica, preservando as outras naves. Herda semver (feat vira minor, fix vira patch, BREAKING vira major) e grava VERSION e CHANGELOG no projeto, sem git tag. Só o esqueleto limpo entra — nunca segredo de produção nem dado real de paciente (trava de LGPD). NÃO é portão nem dá veredito — é ação de arquivo, com um checklist leve "pronto pra reutilizar" que informa, não bloqueia. Efeito colateral — só roda por pedido e mostra depois o que gravou.
license: MIT
metadata:
  version: 1.1.0
  author: Clube da IA × Endolife Health-Tech
  pipeline-position: 9
---

# hangar-sync

**A skill que estaciona a missão no hangar.** É a **última** do pipeline de governança do clube. As oito anteriores constroem, revisam e blindam o projeto; esta pega o projeto pronto (ou uma etapa dele) e o **cataloga como uma nave no HANGAR**, carimbando a versão — pra você ver toda a frota num lugar só e poder **clonar/reaproveitar** entre os 10 membros.

> **Termo rápido:** o **HANGAR** é um app local (roda na máquina, sem nuvem) onde **cada projeto é uma "nave"**. A frota inteira mora num arquivo, o **`dados-hangar.json`** — a **fonte única da verdade** que o app lê e escreve. Uma **nave** é a ficha técnica de um projeto (arquitetura, banco, infra, custo, saúde). **Catalogar** = encaixar/atualizar essa ficha no arquivo. **Semver** (versão semântica) = numerar versões com significado (`v1.2.3`). **Blueprint / esqueleto** = a planta limpa do projeto, **sem** dados nem segredos reais — é o que se clona.

> Esta skill **grava arquivos** (o `dados-hangar.json` e, no projeto, o `VERSION`/`CHANGELOG.md`). Por isso ela **só roda quando você pede** — nunca sozinha — e **mostra depois** o que gravou.

---

## O que faz

Pega **um projeto** (uma pasta local no workspace, por padrão; ou um repositório no GitHub, se você apontar), lê o **blueprint** dele, e faz três coisas que somam um ato só — *estacionar a nave*:

1. **Carimba a versão** — decide o próximo número por semver e grava `VERSION` + `CHANGELOG.md` **no projeto** (sem git tag). Detalhe em `references/versionamento.md`.
2. **Cataloga no HANGAR** — monta a **nave** (a ficha de ~16 campos) e faz **merge por `id`** direto no `dados-hangar.json`: se a nave já existe, atualiza; se não, acrescenta. **Backup antes, escrita atômica, as outras naves intactas.** Formato da ficha em `references/esquema-da-nave.md`.
3. **Leva o custo declarado** — preenche a lista `custos[]` da nave **com o que o projeto declara**. O **HANGAR** é quem soma e mostra o painel — a conta é do app. O que o projeto não declara fica **em branco / pendência** pra você preencher no app; a skill **não chuta** valor.

E entrega:

- **Relatório no chat** — o que foi catalogado (o quê, versão, custo, onde caiu na frota), na hora.
- **Arquivo `hangar-sync-report.md`** — o mesmo, pra histórico.

**Não é um portão.** Não dá veredito 🔴/🟠/🟢. No fim, mostra um **checklist leve "pronto pra reutilizar?"** que **informa, não bloqueia** (ver Saída).

---

## Quando usar

- ✅ **Quando um projeto termina uma etapa** e você quer registrá-lo/atualizá-lo na frota — "estacionar no hangar".
- ✅ **No Cowork**, com o HANGAR e o projeto na sua máquina (é a única skill do pipeline que roda **contra o app de verdade**).
- ✅ **Depois** do `observability-setup` (o último portão), fechando o ciclo — mas serve pra qualquer projeto seu, mesmo fora do pipeline de saúde.
- ✅ Quando você quer **carimbar uma versão** do projeto sem mexer com git no terminal.

**Não use:**
- ❌ **Automaticamente.** Ela grava arquivos — **só dispara quando você pede**.
- ❌ Pra revisar qualidade (`quality-validator`), privacidade (`lgpd-saude-guard`), simular ataque (`security-review`), checar backup (`resilience-checkpoint`) ou observabilidade (`observability-setup`). Ela **não julga** o projeto — só o **arquiva**.
- ❌ Pra subir dado real ou segredo de produção pra lugar nenhum (ver Trava de LGPD).

---

## Como funciona

### 1. Ler o projeto (a fonte)
- **Padrão:** você aponta uma **pasta local** dentro do workspace (ex.: `Endolife/Agenda da Clínica/`). A skill lê o **`SPEC.md`** (em especial §1 Identidade, §3 O que faz, §5 Dados, §7 Stack, §9 Metadados), o `README.md`, o `package.json` e as configs de infra.
- **Opcional:** se você apontar um **repositório GitHub**, ela lê os mesmos arquivos via conector.
- **Reconhecer papéis, não nomes fixos:** procure na pasta inteira (inclui subpastas como `tasks/`, `docs/`) antes de dizer que algo falta.

### 2. Achar a nave (merge por `id`)
- Deriva o `id` do nome do projeto (ex.: `Agenda da Clínica` → `agenda-da-clinica`).
- Abre o `dados-hangar.json` e procura uma nave com esse `id`. Achou → é **atualização**; não achou → é **nave nova**. Isso torna a skill **idempotente**: rodar de novo é seguro, não duplica.

### 3. Carimbar a versão
- Decide o próximo número por semver (ver `references/versionamento.md`). Se não dá pra saber o que mudou, **pergunta** — não chuta.
- Grava `VERSION` + `CHANGELOG.md` **no projeto** e usa o mesmo número em `git.ultimaVersao` da nave.

### 4. Montar a nave
- Preenche os ~16 campos a partir do blueprint, seguindo `references/esquema-da-nave.md`. Cada campo ou vem **declarado** ou fica **vazio + pendência** — nunca inventado.
- Aplica a **trava de LGPD** ao montar (ver abaixo): a ficha guarda **onde** as chaves moram e o **nível** de sensibilidade, **nunca o valor** nem dado real.

### 5. Encaixar no catálogo (a gravação)
- Escreve a nave montada num arquivo temporário e chama `scripts/merge_nave.py`, que faz o encaixe seguro: **backup** (`dados-hangar.backup.json`), **escrita atômica** (`.tmp` → rename), atualiza `atualizadoEm`, preserva as outras naves. Só grava **com seu ok**.

### 6. Relatar
- Mostra o resumo no chat e escreve o `hangar-sync-report.md`, terminando com o checklist "pronto pra reutilizar?".

---

## A nave e a versão (referências)

O detalhe fino mora em duas referências — leia-as ao rodar:

- **`references/esquema-da-nave.md`** — os 16 campos, de onde tirar cada um, os enums (status, CI/CD 0–4, isolamento) e um exemplo real da frota.
- **`references/versionamento.md`** — a lógica semver e o formato de `VERSION`/`CHANGELOG.md`.

---

## Trava de LGPD — o que NUNCA entra na nave

O HANGAR existe pra **clonar e reaproveitar** projetos entre os 10 membros. Então o que se cataloga é o **esqueleto limpo**, não o dado. A trava de gravidade do clube (definida em `references/lgpd-saude-guard.md`) vale aqui:

- **Bloqueia (para, avisa, não grava):** se, ao ler o projeto, você encontrar **dado real de paciente** (CPF, prontuário, diagnóstico) ou **segredo de produção** (chave, token, senha) que iriam parar na ficha — **não escreva o valor na nave.** A nave registra só **onde** a coisa mora ("variáveis de ambiente no Vercel") e o **nível** de sensibilidade (`banco.sensibilidadeLGPD`).
- **Só avisa:** credencial de **dev local** ou dado de **teste fictício** — não bloqueia, mas anota a observação.
- **Sempre** documenta **onde** segredos/dados ficam, nunca o valor. É a mesma filosofia das skills-irmãs ("nunca sobe dump/log/dashboard real — só o esqueleto").

A skill **consome** (não reescreve) a referência compartilhada `references/lgpd-saude-guard.md` pra saber o que conta como dado sensível.

---

## Não é um portão

As irmãs julgam (🔴 reprova / 🟠 ressalva / 🟢 aprova). **Esta não.** É uma **ação de arquivo**. No máximo, ela fecha o relatório com um checklist que **informa, não bloqueia** — pra você saber se a nave está boa pra ser clonada por outro membro:

**Pronto pra reutilizar?** (marca o que achou, sem travar)
- [ ] Tem `SPEC.md` (o contrato)?
- [ ] Tem `README.md` (como rodar)?
- [ ] Se é projeto do pipeline de saúde — passou pelos portões (`quality-validator` → `lgpd-saude-guard` → `security-review` → `resilience-checkpoint` → `observability-setup`)?
- [ ] A ficha ficou sem campo "a confirmar" pendente?

Faltou algo? A skill **cataloga mesmo assim** e só **aponta** o que dá pra melhorar. Ela nunca segura o arquivamento.

---

## Saída — dois formatos

### 1. Relatório no chat
Curto e direto, logo depois de gravar:

```
🛰️ Nave estacionada no HANGAR

• Projeto: Agenda da Clínica  (id: agenda-da-clinica)
• Ação: atualizada  (já existia na frota)
• Versão carimbada: v0.4.0 → v0.5.0  (feat: painel de custos)
   → gravei VERSION e CHANGELOG.md no projeto
• Custo declarado: R$ 100/mês (Vercel Pro)  — o HANGAR soma no painel
• Frota: 9 naves (inalterada — foi atualização)
• Backup: dados-hangar.backup.json  ·  atualizadoEm: 2026-07-02

⚠️ Pendências (não bloqueiam):
   - Custo do Supabase não declarado no SPEC — preencha no app (Editar).

✅ Pronto pra reutilizar? SPEC ✓ · README ✓ · portões ✓ · 1 campo a confirmar
```

### 2. Arquivo `hangar-sync-report.md`
O mesmo conteúdo, pra histórico: o que mudou na ficha, o número de versão e por quê, o que ficou pendente, e o checklist. Serve de trilha do que foi arquivado e quando.

---

## Regra de ouro: nunca inventar

Se o projeto **não declara** o custo, o volume (usuários, storage, requests), a versão, a sensibilidade LGPD ou a stack, a skill **deixa o campo vazio e marca pendência** — nunca chuta. É o ponto mais tentador de inventar número (custo, principalmente). Melhor uma ficha honesta com buracos apontados do que uma ficha "completa" com dados fabricados. O Dr. preenche o que falta no próprio app (botão Editar).

Exemplo:
> ⚠️ Pendência: o SPEC não declara o custo mensal do banco. Deixei `custos[]` só com o que estava declarado (Vercel). Preencha o resto no app pra o painel do HANGAR somar certo — não vou chutar um valor.

---

## Fronteira (o que esta skill NÃO faz)

- ❌ Não julga o projeto (qualidade, privacidade, ataque, backup, observabilidade) — isso são as oito skills anteriores. Ela **arquiva**, não aprova.
- ❌ Não faz git tag nem release no GitHub — carimba `VERSION`/`CHANGELOG.md` + o campo da nave. Tag de verdade é passo manual seu.
- ❌ Não sobe o `dados-hangar.json` pro GitHub — isso é o ritual de **Exportar → `commit-github`**, que você aciona à parte. Ela mexe no **arquivo local**.
- ❌ **Nunca grava dado real de paciente nem segredo de produção** na nave (trava de LGPD).
- ❌ Não roda sozinha e não grava sem seu ok.

---

## Como usar

**Passo 1 — Chamar a skill** (no Cowork, com o HANGAR e o projeto na máquina):
```
"Roda o hangar-sync — estaciona o Agenda da Clínica no hangar e fecha a versão."
```
Variações: *"cataloga esse projeto no hangar"*, *"atualiza a nave do Agenda da Clínica"*, *"registra o projeto no hangar e carimba a versão"*.

**Passo 2 — Apontar a fonte:** diga qual **pasta** (ou repo) é o projeto, e onde está o **`dados-hangar.json`** (por padrão, na pasta do HANGAR no workspace).

> **⚠️ CAMINHO CANÔNICO DO CATÁLOGO (não erre o destino):** o `dados-hangar.json` mora **na pasta do HANGAR**
> do workspace da pessoa (tipicamente `.../Endolife/Hangar/dados-hangar.json`), e é **esse** o `--catalog` que
> vai pro `merge_nave.py`. **Nunca** grave o catálogo dentro da pasta do projeto que está sendo catalogado
> (ex.: não é `MeuProjeto/dados-hangar.json`) — esse é o erro que apaga a nave das outras naves. Confirme o caminho
> **com a pessoa** na primeira vez e reutilize o mesmo depois. Se você não encontrar o arquivo, **PARE e
> pergunte** — não crie um novo em outro lugar. Confirme que o merge caiu nesse caminho antes de dizer "pronto".

**Passo 3 — A skill lê e monta:** blueprint → nave → próximo número de versão. Ela te mostra o rascunho da ficha e a versão proposta **antes** de gravar.

**Passo 4 — Você dá o ok:** com o ok, ela grava `VERSION`/`CHANGELOG.md` no projeto e faz o merge no `dados-hangar.json` (backup + atômico). Mostra depois o que gravou.

**Passo 5 — Ver no app:** abra/recarregue o HANGAR (`npm run dev`) — a nave aparece/atualiza na Baia, e o painel de custos soma o que foi declarado.

**Passo 6 — Versionar o hangar (opcional):** no app, **Exportar**; depois `commit-github` pra guardar o `dados-hangar.json` no GitHub.

---

## Convenções

- **Decisão compreensível (inegociável):** as pendências e o rascunho da nave que você mostra ao humano vêm em linguagem leiga — cada termo técnico (semver, blueprint, merge, escrita atômica, sensibilidade LGPD) traduzido no ponto e o porquê importa dito de forma concreta. Ele é médico, não programador; só decide (o que preencher, o que aprovar) o que entende.
- **Idioma:** PT-BR, acessível — todo termo técnico (nave, catálogo, semver, blueprint, merge, escrita atômica, idempotente) explicado na primeira vez, inclusive no relatório.
- **Sem terminal no fluxo de git:** nada de `git tag`/`git CLI`. A gravação de arquivo local usa o `scripts/merge_nave.py` (é o "ajudante de salvar" seguro), não git.
- **Fonte única da verdade:** só existe um `dados-hangar.json`. Merge **por `id`**, nunca duplica, nunca reescreve as outras naves.
- **Idempotente:** rodar de novo no mesmo projeto **atualiza** a mesma nave — é seguro.
- **Nunca expõe valor de segredo** nem grava dado real — aponta **onde** mora e o **nível**, nunca o valor.
- **Humanocêntrico:** mostra o rascunho e a versão **antes** de gravar; você decide. Efeito colateral **só com seu ok**, e **mostra depois** o que fez.
- **Nunca inventa** custo, versão, volume ou sensibilidade — campo vazio + pendência.

---

## Instalação

1. Empacote a pasta `hangar-sync/` como `.skill` com o `package_skill.py` (a pasta `evals/` fica **de fora** do pacote).
2. Configurações / Customize → Skills → enviar o `.skill`.
3. Disponível em Chat, Claude Code e Cowork. **Esta skill foi pensada pra rodar no Cowork**, onde o HANGAR e os projetos estão na máquina.

Dependência: só o **Python 3** (padrão no Cowork) pra rodar o `merge_nave.py`. Não precisa de Node nem de pacote extra — o app HANGAR roda à parte.

---

## Fim do pipeline

`hangar-sync` é a **skill #9 — a última**. Com ela pronta e testada, o conjunto fecha:

> Empacotar as **8 skills de governança + a `hangar-sync` + a referência compartilhada `lgpd-saude-guard.md` (v1.1) + o conector GitHub** num **plugin único do Clube da IA**, pros 10 membros instalarem de uma vez só.

---

**Versão:** 1.1.0
**Última atualização:** 2026-07-03
**Responsável:** Clube da IA × Endolife Health-Tech
