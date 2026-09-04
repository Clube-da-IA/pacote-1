---
name: resilience-checkpoint
description: Portão de resiliência (backup + recuperação) para SaaS de saúde do Clube da IA. USE ESTA SKILL quando o usuário disser "rodar resilience-checkpoint", "checar backup", "tem plano de recuperação?", "e se o banco cair?", "posso ir pro deploy? checa backup", ou quando um projeto de saúde com dado real estiver perto do deploy e precisar provar que sobrevive a um desastre. Roda no Claude Code, lê o repo via GitHub MCP, depois do security-review e antes do observability-setup. É híbrida — verifica a postura de backup e restore E, com seu ok, commita o esqueleto recuperável (schema, migrations, config sem valores, RESTORE.md) via MCP; o dump real nunca vai pro git por causa da LGPD, vira comando pra você rodar. Emite veredito APROVADO / RESSALVAS / REPROVADO pela recuperabilidade — dado real sem backup recuperável reprova; dev local ou lacuna teórica só ressalva. Checa retenção médico-legal e trilha por stack. Nunca roda comando nem altera código sozinha. Ferramenta de visibilidade para revisão humana.
license: MIT
metadata:
  version: 1.2.0
  author: Clube da IA × Endolife Health-Tech
  pipeline-position: 7
---

# resilience-checkpoint

**Portão de resiliência para projetos de saúde digital.**

Este é o portão que pensa **no dia em que der ruim**. Enquanto o `quality-validator` pergunta *"está bem construído?"*, o `lgpd-saude-guard` pergunta *"respeita a lei de dados?"* e o `security-review` pergunta *"dá pra invadir?"*, aqui a pergunta é uma só: **"se o banco cair, o servidor pegar fogo ou alguém apagar a tabela errada, você consegue trazer o dado do paciente de volta?"**.

> **Termo rápido:** *checkpoint de resiliência* = a checagem de que o projeto **sobrevive a um desastre**. *Backup* = a cópia de segurança dos dados. *Recuperação (restore)* = trazer essa cópia de volta pra dentro do sistema. *RPO* = quanto de dado você aceita perder (ex.: "no máximo as últimas 24h"). *RTO* = em quanto tempo você precisa estar no ar de novo (ex.: "até 4h"). O portão **não faz o dump dos seus dados nem roda comando** — ele lê a planta do projeto, aponta onde a recuperação falharia e te entrega o comando pra você confirmar. A única coisa que ele **grava** é o *esqueleto recuperável* (veja abaixo), e só **com o seu ok**.

---

## O que faz

Percorre o repositório (via GitHub MCP), detecta a stack e se há dado real em produção, roda uma **checagem de resiliência em 3 blocos**, classifica cada achado pela **chance real de você perder o dado num desastre**, e produz:

1. **Relatório no chat** — vê na hora, com o veredito.
2. **Arquivo `resilience-checkpoint-report.md`** — histórico, dashboard, evidência.

Além disso, é **híbrida**: depois de verificar, se faltar o runbook de restauração ou o esqueleto no repo, ela **oferece** gravar esse esqueleto pra você — schema, migrations, `config-template` (só os nomes das variáveis, nunca os valores) e um `RESTORE.md`. **Só grava com seu ok**, e **só o esqueleto**: o dump real dos dados (que carrega CPF e laudo) **nunca vai pro git** — isso violaria a trava de LGPD. Pro dump real, ela te entrega o comando pra **você** rodar num destino seguro.

Para cada achado entrega o padrão do clube: **o que falharia no desastre → sinal que confirma → comando/ação pra você fazer**. A skill **nunca altera o código** e **nunca executa comando** (nem `pg_dump`, nem `gcloud`, nem git CLI) — ela lê, raciocina e te entrega o comando. Você decide.

**Base regulatória** (o "porquê" das checagens): **LGPD Art. 46** (segurança dos dados, que inclui prevenir perda acidental), a **obrigação médico-legal de guarda do prontuário** (baseline de referência: 20 anos), e as boas práticas de backup/restore. Detalhe completo em `references/criterios-e-checagens.md`.

---

## Quando usar

- ✅ **Antes do deploy** de um projeto de saúde (é o portão que garante que dá pra voltar depois de um desastre).
- ✅ **Dentro do Claude Code**, com o projeto aberto.
- ✅ **Depois** do `security-review` (ataque) e **antes** do `observability-setup` (rastreabilidade).
- ✅ Sempre que a arquitetura de dados mudou (novo banco, novo storage de arquivos, mudou onde o dado vive).

**Não use:**
- ❌ Para mudança trivial (typo, comentário, ajuste de texto).
- ❌ Automaticamente — **só por pedido do usuário** (é um portão que você aciona de propósito; e ele **grava** coisa no repo, então nunca dispara sozinho).
- ❌ Para revisar qualidade (isso é `quality-validator`), privacidade/consentimento (`lgpd-saude-guard`) ou simular ataque (`security-review`).

---

## Como funciona

### 1. Leitura do projeto
- Conecta ao repo GitHub (MCP) e lê os arquivos.
- Busca as referências: **`SPEC.md`** (contrato — em especial §5 Dados e §7 Stack), **`README.md`** (onde as coisas moram) e **`CLAUDE.md`** (regras).
- Consulta a referência compartilhada **`references/lgpd-saude-guard.md`** para saber o que é dado sensível (§ Categorias de Dados) e os itens de retenção/eliminação do checklist LGPD.

### 2. Detecção de contexto
- **Há dado real em produção?** Lê o SPEC §5. Se **sim**, uma falha de backup pesa como 🔴 (perda real). Se é **dev local / dado fictício**, o risco cai. Se o SPEC **não diz**, marca pendência — não chuta.
- **Qual stack?** Lê o SPEC §7 (Restrições técnicas → Stack). Há trilha para **GCP**, para **Supabase + Vercel + Prisma** e para **frontend estático sem backend** (SPA/site sem banco — Trilha C). Se o SPEC não declara, **infere do `package.json`/configs e marca pendência** — não inventa.

### 3. Checagem em 3 blocos
- **Bloco 1 — Backup + Recuperação** (universal): os dados reais têm backup? É automático e com frequência declarada? Vive **fora do ponto de falha da produção** (outra região/conta/projeto)? Está **cifrado**? Existe `RESTORE.md` com substância? **RPO/RTO** declarados? (Drill de restore registrado = **recomendação**, não derruba o veredito.)
- **Bloco 2 — Retenção médico-legal + LGPD** (camada de saúde): o backup tem **cara dupla** — é o ativo que você não pode perder **e** um passivo de dado sensível. Checa: retenção **declarada no SPEC com base legal**; se está **abaixo do mínimo** → manda pra revisão humana (baseline 20 anos de prontuário); **eliminação/descarte seguro** documentado; backup **cifrado, com acesso restrito e local documentado** (nunca o valor).
- **Bloco 3 — Trilha por stack** (auto-selecionada): como **confirmar que o backup existe** e **como restaurar** na stack detectada. GCP; Supabase/Vercel/Prisma (aqui mora a lacuna nº1 — o **Vercel Blob não tem backup automático**); frontend estático sem backend (onde a lacuna é outra: **para onde vão os arquivos que o app entrega**).

Catálogo completo (com o padrão *sinal → comando* de cada checagem) em `references/criterios-e-checagens.md` (Blocos 1 e 2) e `references/trilhas-de-stack.md` (Bloco 3).

### 4. Veredito por recuperabilidade
Cada achado é classificado pela **chance real de perder o dado num desastre** (ver regra abaixo), e o portão fecha com um veredito único.

### 5. Ação com seu ok (o lado híbrido)
Se faltar `RESTORE.md` ou o esqueleto não estiver versionado, a skill **oferece** commitar o **esqueleto recuperável** via MCP (schema, migrations, `config-template` sem valores, `RESTORE.md`). Ela **mostra o que vai subir e espera seu ok** — nunca commita sozinha, e **nunca sobe o dump real dos dados**.

### 6. Saída
Relatório no chat + arquivo `resilience-checkpoint-report.md`.

---

## O veredito

O portão sempre termina com **um** destes três carimbos. A regra que decide qual é a **recuperabilidade** — herdada da lógica de gravidade que o clube já usa no `lgpd-saude-guard` e no `security-review`:

| Veredito | Quando | Símbolo |
|----------|--------|---------|
| **REPROVADO** | Há dado **real de paciente em produção** sem backup recuperável — ou o backup vive no **mesmo ponto de falha** da produção (mesma região/projeto que cai junto). O desastre significaria **perda permanente** de dado real. | 🔴 |
| **APROVADO COM RESSALVAS** | Tem backup, mas com lacuna: RPO/RTO indefinidos, `RESTORE.md` ausente, retenção não declarada ou abaixo do mínimo (→ revisão humana), cifragem/local não documentados, esqueleto não versionado. Projeto em **dev local / sem dado real** cai aqui por padrão. | 🟠 |
| **APROVADO** | Backup dos dados reais **fora do ponto de falha** + `RESTORE.md` com substância + backup **cifrado e com local documentado**. (Drill de restore registrado = recomendado, não obrigatório.) | 🟢 |

> **"Recuperável"** = você consegue, de fato, trazer o dado real de volta depois de um desastre — não é só ter um arquivo chamado *backup*. Backup que você nunca restaurou é esperança, não plano.

**REPROVADO não é ordem, é sinal.** A skill nunca bloqueia sozinha — ela mostra, com clareza, que aquilo **não deveria ir pro deploy assim**. Quem decide é você.

---

## Decisão compreensível (princípio inegociável)

Este portão existe para que **você** decida — e você é médico, não programador. A decisão só é verdadeiramente sua se o risco chegar **compreensível**. Portanto, toda vez que esta skill te apresenta algo para decidir (um veredito 🔴/🟠, um item de ⚠️ revisão humana, ou um "posso gravar o esqueleto recuperável?"), ela é **obrigada** a:

1. **Traduzir cada termo técnico no ponto da decisão** — mesmo que já o tenha explicado antes. Nunca "PITR desabilitado" sozinho; sempre *"o PITR (point-in-time recovery — a capacidade de voltar o banco de dados a um instante exato do passado) não está habilitado"*.
2. **Dizer a consequência concreta, não a categoria** — não "RPO indefinido"; e sim *"se o banco cair agora, você pode perder tudo que foi digitado desde o último backup — até 24 horas de prontuários, sem volta"*. Traduza o risco para o consultório.
3. **Oferecer analogia ou exemplo** quando o conceito for abstrato — o "e se der ruim" na linguagem de quem cuida do paciente, não de quem administra servidor.
4. **Separar fato de suposição** — se o veredito depende de algo que o SPEC não declara (o RPO, a retenção), diga isso abertamente; não decida no lugar do humano.

**Teste da regra:** se, depois de ler o achado, você não consegue explicar o risco com as suas próprias palavras, a skill **falhou** e deve reescrever mais claro. Esta regra vale **acima da concisão** — melhor um parágrafo a mais do que uma decisão tomada no escuro.

---

## Saída — dois formatos

### 1. Relatório no chat

```
🛟 resilience-checkpoint — Backup & Recuperação
─────────────────────────────────────────
📁 Projeto: clinica-app  ·  Stack: Supabase + Vercel + Prisma
🗄️ Dado real em produção: sim  ·  Arquivos: 63

VEREDITO: 🔴 REPROVADO
Motivo: os exames de paciente vivem no Vercel Blob, que não
tem backup — um desastre significa perda permanente.

─────────────────────────────────────────
BLOCO 1 — Backup + Recuperação
  🟢 Postgres com backup automático diário (Supabase Pro) ligado.
  🟠 RESSALVA · RESTORE.md ausente
     Não há runbook de restauração — ninguém sabe o passo a
     passo sob pressão. (a skill oferece gerar, ver abaixo)
  🟠 RESSALVA · RPO/RTO não declarados no SPEC §5
     → Ação: declarar quanto de dado pode perder (RPO) e em
       quanto tempo precisa voltar (RTO).

BLOCO 2 — Retenção médico-legal + LGPD
  ⚠️ REVISÃO HUMANA · Retenção não declarada
     O SPEC §5 não diz por quanto tempo o prontuário é guardado.
     Baseline de referência: 20 anos. Não vou cravar número.
     → Ação: declarar a retenção no SPEC com a base legal.
  🟢 Backup do Postgres cifrado em repouso; local no README.

BLOCO 3 — Trilha Supabase/Vercel/Prisma
  🔴 CRÍTICO · Vercel Blob sem backup (perda permanente)
     Os arquivos de exame vivem no Vercel Blob, que não faz
     backup automático. Perdeu, perdeu.
     → Confirmar: procurar job/rotina que espelhe o Blob pra
       outro destino. Não achei nenhum no repo.
     → Correção: espelhar o Blob (ex.: rotina que copia pra um
       bucket com versioning noutra conta/região).
  🟠 RESSALVA · PITR (point-in-time recovery) não habilitado
     no Supabase — só o backup diário. RPO real = até 24h.

─────────────────────────────────────────
AÇÃO DISPONÍVEL (com seu ok)
Faltam no repo o RESTORE.md e o config-template. Posso gerar
e commitar via GitHub MCP:
  • RESTORE.md ....... runbook de restauração (onde o backup
                       vive, passo a passo, quem aciona, RTO)
  • config-template.env  só os NOMES das variáveis, sem valores
  • schema + migrations  (Prisma) — já versionados ✓
Quer que eu suba? O dump real dos dados NÃO entra aqui (LGPD).

PARA CORRIGIR (prioridade)
  1. Dar backup ao Vercel Blob (hoje é o furo que reprova).
  2. Declarar RPO/RTO e a retenção no SPEC.
  3. Gerar o RESTORE.md (posso fazer agora).
  4. (recomendado) Ligar o PITR e rodar um drill de restore.

Relatório completo: resilience-checkpoint-report.md
Próximo portão (após corrigir): observability-setup
```

### 2. Arquivo `resilience-checkpoint-report.md`

```markdown
# resilience-checkpoint — Backup & Recuperação · [projeto]

Data: 2026-07-01 · Stack: Supabase + Vercel + Prisma · Dado real: sim
Arquivos: 63

## Veredito: 🔴 REPROVADO
Dado real de paciente (exames no Vercel Blob) sem backup recuperável.

## Dashboard

| Bloco | Sev | Onde | Achado | Norma | Perda real? | Status |
|-------|-----|------|--------|-------|-------------|--------|
| Stack | 🔴 | Vercel Blob | Sem backup dos exames | LGPD 46 | Sim (perda permanente) | ⏳ |
| Backup | 🟠 | repo | RESTORE.md ausente | boa prática | Não (mas cega) | ⏳ |
| Backup | 🟠 | SPEC §5 | RPO/RTO indefinidos | boa prática | Risco | ⏳ |
| Retenção | ⚠️ | SPEC §5 | Retenção não declarada | CFM/LGPD | Revisão humana | ⏳ |

## Achado 🔴 (1) — Vercel Blob sem backup
- **O que falha no desastre:** o Blob não tem backup automático; se o arquivo some (erro, exclusão, incidente), não há de onde restaurar.
- **Sinal que confirma:** nenhuma rotina no repo espelha o Blob pra outro destino.
- **Ação de confirmação:** revisar jobs/cron e a doc de infra atrás de um espelho do Blob.
- **Norma:** LGPD Art. 46 (segurança — prevenir perda dos dados).
- **Correção:** espelhar o Blob pra um bucket com versioning em outra conta/região.

## Retenção — ⚠️ revisão humana
- O SPEC §5 não declara o prazo de guarda. **Baseline de referência: 20 anos de prontuário.**
- A skill **não crava número**: declare a retenção no SPEC com a base legal citada. Se o valor declarado ficar abaixo do mínimo, este item volta como revisão humana.

## Checklist de ação
- [ ] Dar backup ao Vercel Blob (bloqueia o deploy)
- [ ] Declarar RPO, RTO e retenção (com base legal) no SPEC
- [ ] Gerar e versionar o RESTORE.md + config-template
- [ ] (recomendado) Habilitar PITR e registrar um drill de restore
- [ ] Rodar a skill de novo após corrigir

---
**Próximo passo:** resolver o 🔴 antes do deploy, depois seguir para `observability-setup`.
```

---

## Regra de ouro: nunca inventar critério de resiliência

Se o SPEC **não diz** o RPO/RTO esperado, o prazo de retenção, ou o que é dado real vs. fictício, o portão **pergunta ou marca como pendência explícita** — nunca chuta. Em especial o **prazo de retenção**: a skill carrega **20 anos como baseline de referência** do prontuário, mas **não crava esse número no veredito** — ela exige que o SPEC declare a retenção com a base legal e manda pra **revisão humana** o que estiver abaixo. Melhor um *"isto está indefinido, confirme"* do que um veredito baseado em suposição.

Exemplo:
> ⚠️ Pendência: o SPEC não declara o RPO. Sem isso, não dá pra dizer se o backup diário (perda de até 24h) é aceitável ou não. **Declare o RPO no SPEC §5 antes de decidir o deploy.**

---

## Fronteira (o que este portão NÃO faz)

- ❌ Não valida qualidade de código nem domínio clínico → isso é `quality-validator`.
- ❌ Não audita consentimento, finalidade nem privacidade → isso é `lgpd-saude-guard`.
- ❌ Não simula ataque nem procura vulnerabilidade → isso é `security-review` (que roda antes).
- ❌ Não configura logs nem monitoramento → isso é `observability-setup` (que roda depois).
- ❌ Não executa `pg_dump`, `gcloud`, backup nem restore de verdade — entrega o comando pra **você** rodar.
- ❌ **Nunca sobe o dump real dos dados pro git** (CPF/laudo) — só o esqueleto sem dados. O dump vai pra destino seguro, fora do git.
- ❌ Não commita sozinha — o esqueleto só sobe **com seu ok**.

Consome (não reescreve) a referência compartilhada `lgpd-saude-guard.md` para saber o que é dado sensível e os itens de retenção/eliminação.

---

## Como usar

**Passo 1 — Chamar a skill** (no Claude Code, projeto aberto):
```
"Roda o resilience-checkpoint — checa backup e recuperação antes do deploy."
```
Variações: *"tem plano de recuperação?"*, *"e se o banco cair, dá pra voltar?"*, *"posso ir pro deploy? checa o backup"*.

**Passo 2 — A skill lê e checa:** conecta no repo, detecta stack e se há dado real, roda os 3 blocos.

**Passo 3 — Você revisa:** lê o veredito no chat, abre o `resilience-checkpoint-report.md`, **roda os comandos de confirmação** dos achados 🔴 (ex.: conferir se o backup realmente existe e restaura).

**Passo 4 — Aceita a ação (opcional):** se a skill ofereceu gerar o `RESTORE.md` + esqueleto, você dá o ok e ela commita via MCP (mostra depois a mensagem e os arquivos).

**Passo 5 — Corrige e roda de novo** (a skill é idempotente — rodar de novo é seguro). Commit das correções via `commit-github`.

**Passo 6 — Segue o pipeline:** com veredito 🟢 (ou ressalvas aceitas), aciona `observability-setup`.

---

## Convenções

- **Decisão compreensível (inegociável):** todo termo técnico (RPO, RTO, PITR, restore) explicado na primeira vez **e reexplicado no ponto de decisão** (ver seção "Decisão compreensível"); nenhum veredito 🔴/🟠 ou ⚠️ chega ao humano sem a tradução do termo e a consequência concreta.
- **Idioma:** PT-BR, acessível — todo termo técnico (RPO, RTO, PITR, restore) explicado na primeira vez.
- **Sem terminal no fluxo:** lê via GitHub MCP; não roda `pg_dump`, `gcloud` nem git CLI. Comandos de confirmação e de backup são pra você rodar.
- **Nunca expõe valor de segredo** — aponta arquivo, linha e tipo, nunca o valor. O `config-template` leva só os **nomes** das variáveis.
- **Humanocêntrico:** você sempre decide; a skill é "olha aqui".
- **Idempotente:** rodar de novo não duplica alertas; antes de dizer "faltando", procura na pasta inteira (o `RESTORE.md` pode se chamar `RECOVERY.md` ou estar em `docs/`).
- **Efeito colateral controlado:** escreve o `resilience-checkpoint-report.md` sempre; o esqueleto recuperável **só com seu ok**; o dump real **nunca**.

---

## Instalação

1. Empacote a pasta `resilience-checkpoint/` como `.skill` via `package_skill.py` (a pasta `evals/` fica de fora do pacote).
2. Configurações / Customize → Skills → enviar o `.skill`.
3. Disponível em Chat, Claude Code e Cowork. (Este portão foi pensado para rodar no **Claude Code**, com o repo conectado.)

Sem dependências: é uma skill de análise + commit via MCP — não roda código, não precisa de Node nem de pacote nenhum.

---

## Próximas skills do pipeline

Depois de `resilience-checkpoint` aprovada:
1. **observability-setup** — rastreabilidade + alertas pós-deploy (sem expor PII).
2. **hangar-sync** — fecha o ciclo (arquivo).

E então: empacotar as 8 skills + `lgpd-saude-guard.md` (referência compartilhada) + conector GitHub num **plugin único do Clube da IA**.

---

**Versão:** 1.2.0
**Última atualização:** 2026-08-22
**Responsável:** Clube da IA × Endolife Health-Tech
