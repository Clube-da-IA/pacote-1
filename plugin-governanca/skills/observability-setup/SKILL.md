---
name: observability-setup
description: Portão de rastreabilidade pós-deploy (observabilidade) para SaaS de saúde do Clube da IA. USE ESTA SKILL quando o usuário disser "rodar observability-setup", "tem trilha de auditoria?", "como sei quem acessou o prontuário?", "meu log tá vazando CPF?", "posso ir pro deploy? checa observabilidade", ou quando um projeto de saúde perto do deploy precisar enxergar o sistema vivo sem expor dado de paciente. Roda no Claude Code, lê o repo via GitHub MCP, depois do resilience-checkpoint e antes do hangar-sync. É híbrida — verifica logs, trilha de auditoria e alertas E, com seu ok, monta o esqueleto (logging com raspagem de PII, schema de auditoria, template de alerta sem valores, OBSERVABILITY.md) via MCP; logs reais e dashboards nunca vão pro git. Veredito de duas faces — dado sensível vazando no log de produção, ou acesso a dado sem trilha de auditoria, reprova; furo teórico ou dev local só ressalva. Checa retenção em dois relógios e trilha por stack. Nunca roda scanner nem altera código.
license: MIT
metadata:
  version: 1.2.0
  author: Clube da IA × Endolife Health-Tech
  pipeline-position: 8
---

# observability-setup

**Portão de rastreabilidade pós-deploy para projetos de saúde digital.**

Este é o portão que pensa **no sistema já no ar**. Enquanto o `security-review` pergunta *"dá pra invadir?"* (o **controle** de acesso) e o `resilience-checkpoint` pergunta *"se cair, eu volto?"* (a **recuperação**), aqui a pergunta tem duas metades: **"enquanto o sistema roda, eu enxergo o que acontece — e consigo provar quem acessou o prontuário — sem deixar o dado do paciente vazar pro próprio log?"**.

> **Termo rápido:** *observabilidade* = conseguir **enxergar por dentro** do sistema em funcionamento. Ela se apoia em quatro peças: *log* (registro de eventos — o "diário de bordo" do sistema), *métrica* (número ao longo do tempo — quão rápido, quantos erros), *alerta* (o aviso que dispara quando algo passa do limite) e *trilha de auditoria* (**audit trail** — o registro de **quem acessou qual dado, quando**). O portão **não roda scanner nem altera código** — ele lê a planta do projeto, aponta onde a rastreabilidade falharia e te entrega o comando pra você confirmar. A única coisa que ele **grava** é o *esqueleto de observabilidade* (veja abaixo), e só **com o seu ok**.

---

## O que faz

Percorre o repositório (via GitHub MCP), detecta a stack e se há dado real em produção, roda uma **checagem em 5 blocos**, classifica cada achado pela lógica de **duas faces** (vazamento e cego — ver O veredito), e produz:

1. **Relatório no chat** — vê na hora, com o veredito.
2. **Arquivo `observability-setup-report.md`** — histórico, dashboard, evidência.

Além disso, é **híbrida**: depois de verificar, se faltar a trilha de auditoria ou o runbook, ela **oferece** gravar o **esqueleto de observabilidade** pra você — logging estruturado com camada de raspagem de PII, o schema da tabela de auditoria + migration + o gancho que escreve nela, um template de alerta/health-check (só os **nomes**, nunca os valores) e um `OBSERVABILITY.md`. **Só grava com seu ok**, e **só o esqueleto**: os **logs reais** e os **dashboards** (que carregam ou refletem CPF e laudo) **nunca vão pro git** — vivem na plataforma (Cloud Logging, Vercel, Sentry). Isso violaria a trava de LGPD.

Para cada achado entrega o padrão do clube: **o que falharia em produção → sinal que confirma → comando/ação pra você fazer**. A skill **nunca altera o código** e **nunca executa comando** (nem `gcloud`, nem `grep`, nem git CLI) — ela lê, raciocina e te entrega o comando. Você decide.

**Base regulatória** (o "porquê" das checagens): **LGPD Art. 37** (registro das operações de tratamento — o alicerce da trilha de auditoria), **Art. 15/16** (término e eliminação — o alicerce da retenção de log), **CFM 2.454/2026** (accountability), e as boas práticas de logging (OWASP — falhas de logging/monitoramento + o que nunca logar). Detalhe completo em `references/criterios-e-checagens.md`.

---

## Quando usar

- ✅ **No deploy (ou logo depois)** de um projeto de saúde — é o portão que garante que você **enxerga o sistema vivo e prova conformidade com o tempo**.
- ✅ **Dentro do Claude Code**, com o projeto aberto.
- ✅ **Depois** do `resilience-checkpoint` (recuperação) e **antes** do `hangar-sync` (arquivo).
- ✅ Sempre que mudou quem acessa dado sensível, como o sistema loga, ou entrou uma ferramenta nova de monitoramento (Sentry, etc.).

**Não use:**
- ❌ Para mudança trivial (typo, comentário, ajuste de texto).
- ❌ Automaticamente — **só por pedido do usuário** (é um portão que você aciona de propósito; e ele **grava** coisa no repo, então nunca dispara sozinho).
- ❌ Para revisar qualidade (`quality-validator`), privacidade/consentimento (`lgpd-saude-guard`), simular ataque (`security-review`) ou checar backup (`resilience-checkpoint`).

---

## Como funciona

### 1. Leitura do projeto
- Conecta ao repo GitHub (MCP) e lê os arquivos.
- Busca as referências: **`SPEC.md`** (contrato — em especial §5 Dados e §7 Stack), **`README.md`** (onde as coisas moram) e **`CLAUDE.md`** (regras).
- Consulta a referência compartilhada **`references/lgpd-saude-guard.md`** para saber o que é dado sensível (§ Categorias de Dados) — é a lista do que **nunca pode entrar no log**.

### 2. Detecção de contexto
- **Há dado real em produção?** Lê o SPEC §5. Se **sim**, um log que vaza dado ou a ausência de auditoria pesam como 🔴 (dano real). Se é **dev local / dado fictício**, o risco cai. Se o SPEC **não diz**, marca pendência — não chuta.
- **Qual stack?** Lê o SPEC §7 (Restrições técnicas → Stack). v1 tem trilha para **GCP** e para **Supabase + Vercel + Prisma**. Se o SPEC não declara, **infere do `package.json`/configs e marca pendência** — não inventa.

### 3. Checagem em 5 blocos
- **Bloco 1 — Logs sem vazamento** (universal): o sistema tem **logging estruturado**? Existe **camada de raspagem** que tira CPF, laudo, e-mail, token do log **antes** de gravar? Algum log grava o corpo/parâmetro cru de request/query? Qual a **retenção do log** (o *relógio curto* — veja abaixo)? Esta é a **face vazamento** do veredito.
- **Bloco 2 — Trilha de auditoria de acesso** (camada de saúde — **o coração**): existe registro **append-only** (só adiciona, nunca edita/apaga) de **quem** acessou **qual** dado sensível, **quando**, com **qual ação** (leu/escreveu/exportou) e **de onde**? A retenção dessa trilha é o *relógio longo*. Esta é a **face cego** do veredito.
- **Bloco 3 — Operacional: alertas, erros e saúde** (nunca bloqueia): tem **alerta** pra quando o sistema cai ou a taxa de erro sobe? Tem **rastreio de erro** (ex.: Sentry) — e ele **também** está raspando PII? Tem **health-check** (endpoint que diz "estou de pé") e alguma **métrica** básica?
- **Bloco 4 — Trilha por stack** (auto-selecionada): onde cada face cai na stack detectada. GCP; Supabase/Vercel/Prisma (aqui moram as duas lacunas nº1 — ver `references/trilhas-de-stack.md`).
- **Bloco 5 — Confirmação dos 3 testes de navegador** (pós-deploy): agora que o app está **no ar**, confirma que os **3 testes manuais do clube** (definidos no `security-review` § Bloco 0) foram **rodados no ambiente real** e que o resultado ficou **registrado** — (1) variáveis de ambiente em DevTools→Sources, (2) autenticação após limpar dados do site, (3) rate limit no login. Recomendação forte; se o teste no ar revelar vazamento/furo com dado real, escala pela régua das duas faces. Detalhe em `references/criterios-e-checagens.md` § Bloco 5.

Catálogo completo (com o padrão *sinal → comando* de cada checagem) em `references/criterios-e-checagens.md` (Blocos 1–3 e Bloco 5) e `references/trilhas-de-stack.md` (Bloco 4).

### 4. Veredito de duas faces
Cada achado é classificado por **duas faces** (vazamento e cego — ver regra abaixo), e o portão fecha com um veredito único.

### 5. Ação com seu ok (o lado híbrido)
Se faltar a trilha de auditoria, a camada de raspagem ou o `OBSERVABILITY.md`, a skill **oferece** commitar o **esqueleto de observabilidade** via MCP. Ela **mostra o que vai subir e espera seu ok** — nunca commita sozinha, e **nunca sobe log real nem dashboard**.

### 6. Saída
Relatório no chat + arquivo `observability-setup-report.md`.

---

## O veredito

O portão sempre termina com **um** destes três carimbos. A diferença pras irmãs é que aqui **duas coisas diferentes reprovam** — as **duas faces**. A régua de gravidade é a mesma que o clube já usa no `lgpd-saude-guard` e no `security-review`:

| Veredito | Quando | Símbolo |
|----------|--------|---------|
| **REPROVADO** | **Face vazamento** — dado sensível (CPF, laudo, diagnóstico) **entrando no log em produção**. É um vazamento novo, pela mesma régua da `lgpd-saude-guard`. **OU Face cego** — acesso a dado sensível em produção **sem trilha de auditoria**. Você não consegue provar quem leu o prontuário (falha de *accountability*, LGPD Art. 37). | 🔴 |
| **APROVADO COM RESSALVAS** | Raspagem de PII com furo **teórico** ou só em **dev local**; trilha de auditoria existe mas **incompleta** (falta um campo, não cobre *export*); **sem alerta** ou **sem rastreio de erro**; log com retenção **"eterna"/indefinida** (risco de minimização). Projeto em **dev local / sem dado real** cai aqui por padrão. | 🟠 |
| **APROVADO** | Logs com raspagem de PII no lugar **+** trilha de auditoria **com substância** (quem-o quê-quando-ação-de onde, append-only) **+** retenção declarada nos dois relógios. (Alerta e dashboard = recomendados; *drill de auditoria* testado = recomendado, não obrigatório.) | 🟢 |

> **As duas faces, em uma frase:** a *face vazamento* é "o dado não pode **entrar** no log"; a *face cego* é "o **acesso** ao dado tem que **ficar** registrado". Uma protege o paciente do log; a outra usa o log pra proteger o paciente. Um sistema de saúde precisa das duas.

> **"Trilha com substância"** = você consegue, de fato, reconstruir *quem acessou o paciente X e quando* — não é só existir uma tabela chamada `log`. Um *drill de auditoria* (ensaio: "consigo mesmo responder essa pergunta?") é a prova; entra como **recomendação**.

**REPROVADO não é ordem, é sinal.** A skill nunca bloqueia sozinha — ela mostra, com clareza, que aquilo **não deveria ir pro deploy assim**. Quem decide é você.

---

## Retenção — dois relógios opostos

Diferente das irmãs, aqui a retenção corre em **dois sentidos**, e isso é fácil de errar:

- **Log operacional** (erro, latência, debug) → **relógio curto** (~30–90 dias de referência). Aqui **menos é mais**: guardar log operacional pra sempre é **risco** de LGPD (minimização/eliminação, Art. 15/16), não virtude — mesmo raspado, o log retém rastro. Retenção "eterna"/indefinida → 🟠 (sinaliza como risco).
- **Trilha de auditoria** (quem-leu-o-quê) → **relógio longo**. É registro de *accountability*, atado à **guarda do prontuário** (baseline de referência: **20 anos, não cravado**), sob a exceção de obrigação legal do próprio Art. 16.

A skill **não crava prazo** — ela exige que o **SPEC declare os dois**, com base legal. Não declarado → 🟠 pendência. Auditoria **abaixo** do baseline de guarda → **⚠️ revisão humana** (o prazo é decisão do responsável clínico/jurídico, não da skill).

---

## Decisão compreensível (princípio inegociável)

Este portão existe para que **você** decida — e você é médico, não programador. A decisão só é verdadeiramente sua se o risco chegar **compreensível**. Portanto, toda vez que esta skill te apresenta algo para decidir (um veredito 🔴/🟠, um item de ⚠️ revisão humana, ou um "posso gravar o esqueleto de observabilidade?"), ela é **obrigada** a:

1. **Traduzir cada termo técnico no ponto da decisão** — mesmo que já o tenha explicado antes. Nunca "trilha append-only ausente" sozinho; sempre *"não existe a trilha de auditoria append-only (um registro que só adiciona, nunca deixa editar nem apagar) de quem acessou cada prontuário"*.
2. **Dizer a consequência concreta, não a categoria** — não "falha na face cego"; e sim *"se uma paciente perguntar 'quem viu meu prontuário?', hoje você não tem como responder — e a LGPD exige que você tenha"*. Traduza o risco para o consultório.
3. **Oferecer analogia ou exemplo** quando o conceito for abstrato — o "e se der ruim" na linguagem de quem cuida do paciente, não de quem administra servidor.
4. **Separar fato de suposição** — se o veredito depende de algo que o SPEC não declara (a retenção dos dois relógios), diga isso abertamente; não decida no lugar do humano.

**Teste da regra:** se, depois de ler o achado, você não consegue explicar o risco com as suas próprias palavras, a skill **falhou** e deve reescrever mais claro. Esta regra vale **acima da concisão** — melhor um parágrafo a mais do que uma decisão tomada no escuro.

---

## Saída — dois formatos

### 1. Relatório no chat

```
🔭 observability-setup — Rastreabilidade pós-deploy
─────────────────────────────────────────
📁 Projeto: clinica-app  ·  Stack: Supabase + Vercel + Prisma
🗄️ Dado real em produção: sim  ·  Arquivos: 71

VEREDITO: 🔴 REPROVADO (as duas faces)
Motivo: o log de produção grava o CPF do paciente (face
vazamento) E não há trilha de quem acessa o prontuário
(face cego) — dois furos que reprovam sozinhos.

─────────────────────────────────────────
BLOCO 1 — Logs sem vazamento (face vazamento)
  🔴 CRÍTICO · Prisma com log: ['query'] em produção
     O log grava o VALOR dos parâmetros — inclui CPF e
     dados do laudo em texto puro. É um vazamento.
     → Confirmar: procurar `log: ['query']` no
       PrismaClient. Achei em src/db.ts:12.
     → Correção: trocar por log de nível 'warn'/'error'
       e passar por um logger com raspagem.
  🟠 RESSALVA · Sem camada de raspagem de PII
     Não há redação de campos sensíveis antes de logar.
     (a skill oferece gerar o esqueleto, ver abaixo)

BLOCO 2 — Trilha de auditoria (face cego)
  🔴 CRÍTICO · Sem trilha de auditoria de acesso
     Nenhuma tabela/rotina registra quem leu qual
     prontuário. Não dá pra provar acesso (LGPD Art. 37).
     → Confirmar: procurar tabela audit_log / middleware
       Prisma / trigger. Não achei nenhum.
     → Correção: criar a trilha append-only (a skill
       oferece o schema + o gancho, ver abaixo).

BLOCO 3 — Operacional: alertas, erros, saúde
  🟠 RESSALVA · Sentry sem data scrubbing
     O Sentry captura corpo/headers — pode arrastar CPF/
     token pro painel de erro.
     → Ação: ligar o scrubbing (beforeSend) no Sentry.
  🟠 RESSALVA · Sem alerta de queda / taxa de erro
     Ninguém é avisado se o sistema cair.

BLOCO 4 — Trilha Supabase/Vercel/Prisma
  🟠 RESSALVA · Log da Vercel é efêmero (sem log drain)
     Sem drain, o histórico some em ~1h.
  ⚠️ REVISÃO HUMANA · Retenção não declarada (2 relógios)
     O SPEC §5 não diz a retenção do log nem da auditoria.
     Log: baseline ~30–90d. Auditoria: baseline 20 anos.
     Não vou cravar número.

BLOCO 5 — Confirmação dos 3 testes de navegador (no ar)
  ⏳ A CONFIRMAR · Rode agora no app em produção e anote:
     (1) F12 → Sources → buscar SK_,KEY,SECRET,TOKEN
         → nenhuma chave real pode aparecer
     (2) Excluir dados do site → recarregar
         → tem que deslogar e bloquear a área privada
     (3) Errar a senha várias vezes → tem que travar
     Sem registro do resultado, os 3 ficam pendentes aqui.
     Achado 🔴 no ar volta pro security-review.

─────────────────────────────────────────
AÇÃO DISPONÍVEL (com seu ok)
Faltam no repo a trilha de auditoria, a raspagem e o
runbook. Posso gerar e commitar via GitHub MCP:
  • prisma/migrations/..._audit_log  schema append-only
  • src/audit.ts ....... gancho que escreve na trilha
  • src/log-redact.ts .. lista de campos raspados
  • OBSERVABILITY.md ... onde os sinais vivem, 2 relógios
Quer que eu suba? Log real e dashboard NÃO entram (LGPD).

PARA CORRIGIR (prioridade)
  1. Tirar o CPF do log (log: ['query']) — face vazamento.
  2. Criar a trilha de auditoria — face cego.
  3. Ligar o scrubbing do Sentry.
  4. Declarar os 2 relógios de retenção no SPEC.
  5. Rodar e registrar os 3 testes de navegador (Bloco 5).
  6. (recomendado) Ligar alerta de queda + drill de auditoria.

Relatório completo: observability-setup-report.md
Próximo portão (após corrigir): hangar-sync
```

### 2. Arquivo `observability-setup-report.md`

```markdown
# observability-setup — Rastreabilidade pós-deploy · [projeto]

Data: 2026-07-02 · Stack: Supabase + Vercel + Prisma · Dado real: sim
Arquivos: 71

## Veredito: 🔴 REPROVADO (duas faces)
Log de produção grava CPF (vazamento) + sem trilha de auditoria (cego).

## Dashboard

| Bloco | Face | Sev | Onde | Achado | Norma | Status |
|-------|------|-----|------|--------|-------|--------|
| 1 | Vazamento | 🔴 | src/db.ts:12 | Prisma log:['query'] grava CPF | LGPD 15/46 | ⏳ |
| 1 | Vazamento | 🟠 | repo | Sem camada de raspagem | boa prática | ⏳ |
| 2 | Cego | 🔴 | repo | Sem trilha de auditoria | LGPD 37 | ⏳ |
| 3 | — | 🟠 | Sentry | Sem data scrubbing | LGPD 46 | ⏳ |
| 3 | — | 🟠 | infra | Sem alerta de queda | boa prática | ⏳ |
| 4 | — | ⚠️ | SPEC §5 | Retenção (2 relógios) não declarada | LGPD 15/16 | ⏳ |
| 5 | Vazamento | ⏳ | app no ar | Teste B0.1 env em Sources — a rodar/registrar | OWASP A02/A04 | ⏳ |
| 5 | Cego | ⏳ | app no ar | Teste B0.2 auth pós-limpeza — a rodar/registrar | OWASP A01/A07 | ⏳ |
| 5 | — | ⏳ | app no ar | Teste B0.3 rate limit no login — a rodar/registrar | OWASP A07 | ⏳ |

## Achado 🔴 (1) — Prisma log:['query'] em produção
- **O que falha em produção:** o log grava o valor dos parâmetros — CPF e conteúdo do laudo em texto puro. Qualquer um com acesso ao log lê dado de paciente.
- **Sinal que confirma:** `log: ['query']` no PrismaClient (src/db.ts:12).
- **Ação de confirmação:** conferir a config do PrismaClient e o destino do log.
- **Norma:** LGPD Art. 15/46 (não expor dado sensível; segurança).
- **Correção:** log de nível 'warn'/'error'; nunca 'query' em produção; passar por logger com raspagem.

## Achado 🔴 (2) — Sem trilha de auditoria de acesso
- **O que falha em produção:** não há registro de quem leu qual prontuário. Num pedido de titular ou numa auditoria, você não consegue provar o acesso.
- **Sinal que confirma:** nenhuma tabela `audit_log`, middleware Prisma ou trigger.
- **Ação de confirmação:** procurar tabela/rotina de auditoria no repo.
- **Norma:** LGPD Art. 37 (registro das operações) + accountability CFM.
- **Correção:** trilha append-only (schema + gancho no esqueleto abaixo).

## Retenção — ⚠️ revisão humana (dois relógios)
- O SPEC §5 não declara os prazos. **Log operacional: baseline ~30–90 dias** (minimização). **Auditoria: baseline 20 anos** (guarda de prontuário).
- A skill **não crava número**: declare os dois no SPEC com a base legal. Abaixo do baseline volta como revisão humana.

## Checklist de ação
- [ ] Tirar o CPF do log (bloqueia — face vazamento)
- [ ] Criar a trilha de auditoria (bloqueia — face cego)
- [ ] Ligar o data scrubbing do Sentry
- [ ] Declarar os 2 relógios de retenção (com base legal) no SPEC
- [ ] Configurar log drain (Vercel) + alerta de queda
- [ ] **B0.1** Testar no navegador em produção: F12 → Sources → buscar `SK_`,`KEY`,`SECRET`,`TOKEN` — nenhuma chave real; registrar resultado
- [ ] **B0.2** Testar no navegador em produção: excluir dados do site + recarregar → tem que deslogar/bloquear área privada; registrar resultado
- [ ] **B0.3** Testar no navegador em produção: errar a senha várias vezes → tem que travar (rate limit); se faltar, abrir tarefa de implementação; registrar resultado
- [ ] (recomendado) Drill de auditoria: reconstruir "quem acessou o paciente X"
- [ ] Rodar a skill de novo após corrigir

---
**Próximo passo:** resolver os 🔴 antes de considerar o deploy fechado, depois seguir para `hangar-sync`.
```

---

## Regra de ouro: nunca inventar critério de observabilidade

Se o SPEC **não diz** a retenção esperada (dos dois relógios), o que é dado real vs. fictício, ou quem pode acessar dado sensível, o portão **pergunta ou marca como pendência explícita** — nunca chuta. Em especial os **prazos de retenção**: a skill carrega **~30–90 dias (log)** e **20 anos (auditoria)** como baselines de referência, mas **não crava esses números no veredito** — ela exige que o SPEC declare com a base legal e manda pra **revisão humana** o que estiver abaixo. Melhor um *"isto está indefinido, confirme"* do que um veredito baseado em suposição.

Exemplo:
> ⚠️ Pendência: o SPEC não declara a retenção da trilha de auditoria. Sem isso, não dá pra dizer se apagar a auditoria após 1 ano é aceitável ou uma violação da guarda do prontuário. **Declare a retenção no SPEC §5 com a base legal antes de decidir o deploy.**

---

## Fronteira (o que este portão NÃO faz)

- ❌ Não valida qualidade de código nem domínio clínico → isso é `quality-validator`.
- ❌ Não audita consentimento, finalidade nem privacidade → isso é `lgpd-saude-guard`.
- ❌ Não simula ataque nem procura vulnerabilidade → isso é `security-review`. **Fronteira fina:** o `security-review` cuida do **controle** de acesso (a pessoa errada consegue entrar?); aqui a gente cuida da **rastreabilidade** do acesso (a gente registrou quem entrou e o que tocou?).
- ❌ Não checa backup nem recuperação → isso é `resilience-checkpoint` (que roda antes).
- ❌ Não executa `gcloud`, `grep`, scanner nem git CLI — entrega o comando pra **você** rodar.
- ❌ **Nunca sobe log real nem dashboard pro git** (carregam/refletem CPF e laudo) — só o esqueleto sem dados. Log e dashboard vivem na plataforma.
- ❌ Não commita sozinha — o esqueleto só sobe **com seu ok**.

Consome (não reescreve) a referência compartilhada `lgpd-saude-guard.md` para saber o que é dado sensível (a lista do que nunca pode entrar no log).

---

## Como usar

**Passo 1 — Chamar a skill** (no Claude Code, projeto aberto):
```
"Roda o observability-setup — checa logs e auditoria antes de fechar o deploy."
```
Variações: *"tem trilha de auditoria?"*, *"como sei quem acessou o prontuário?"*, *"meu log tá vazando CPF?"*, *"posso fechar o deploy? checa a observabilidade"*.

**Passo 2 — A skill lê e checa:** conecta no repo, detecta stack e se há dado real, roda os 5 blocos.

**Passo 3 — Você revisa:** lê o veredito no chat, abre o `observability-setup-report.md`, **roda os comandos de confirmação** dos achados 🔴 (ex.: conferir a config do log, procurar a tabela de auditoria).

**Passo 4 — Aceita a ação (opcional):** se a skill ofereceu gerar o esqueleto de observabilidade (auditoria + raspagem + `OBSERVABILITY.md`), você dá o ok e ela commita via MCP (mostra depois a mensagem e os arquivos).

**Passo 5 — Corrige e roda de novo** (a skill é idempotente — rodar de novo é seguro). Commit das correções via `commit-github`.

**Passo 6 — Segue o pipeline:** com veredito 🟢 (ou ressalvas aceitas), aciona `hangar-sync` — o portão que fecha o ciclo.

---

## Convenções

- **Decisão compreensível (inegociável):** todo termo técnico (log, trilha de auditoria, append-only, raspagem de PII, log drain, health-check) explicado na primeira vez **e reexplicado no ponto de decisão** (ver seção "Decisão compreensível"); nenhum veredito 🔴/🟠 ou ⚠️ chega ao humano sem a tradução do termo e a consequência concreta.
- **Idioma:** PT-BR, acessível — todo termo técnico (log, métrica, alerta, trilha de auditoria, append-only, raspagem/redação de PII, log drain, health-check) explicado na primeira vez.
- **Sem terminal no fluxo:** lê via GitHub MCP; não roda `gcloud`, `grep` nem git CLI. Comandos de confirmação são pra você rodar.
- **Nunca expõe valor de segredo** — aponta arquivo, linha e tipo, nunca o valor. O template de alerta leva só os **nomes** das variáveis (DSN, webhook), sem valores.
- **Humanocêntrico:** você sempre decide; a skill é "olha aqui".
- **Idempotente:** rodar de novo não duplica alertas; antes de dizer "faltando", procura na pasta inteira (a trilha pode se chamar `access_log`, o runbook pode estar em `docs/`).
- **Efeito colateral controlado:** escreve o `observability-setup-report.md` sempre; o esqueleto de observabilidade **só com seu ok**; log real e dashboard **nunca**.

---

## Instalação

1. Empacote a pasta `observability-setup/` como `.skill` via `package_skill.py` (a pasta `evals/` fica de fora do pacote).
2. Configurações / Customize → Skills → enviar o `.skill`.
3. Disponível em Chat, Claude Code e Cowork. (Este portão foi pensado para rodar no **Claude Code**, com o repo conectado.)

Sem dependências: é uma skill de análise + commit via MCP — não roda código, não precisa de Node nem de pacote nenhum.

---

## Próximas skills do pipeline

Depois de `observability-setup` aprovada:
1. **hangar-sync** — fecha o ciclo (arquivo). É a **última** skill do pipeline.

E então: empacotar as 8 skills + `lgpd-saude-guard.md` (referência compartilhada) + conector GitHub num **plugin único do Clube da IA** para os 10 membros, em 1 instalação.

---

**Versão:** 1.1.0
**Última atualização:** 2026-07-03
**Responsável:** Clube da IA × Endolife Health-Tech
