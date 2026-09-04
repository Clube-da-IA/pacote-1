# Trilhas por Stack (Bloco 4) — observability-setup

**Clube da IA · Endolife Health-Tech × Inova UNIMES**

O Bloco 4 aplica as checagens de **observabilidade específicas da stack**: onde cada **face** (vazamento e cego) cai, como **confirmar** e como **corrigir**. A skill descobre a stack pelo `SPEC.md` §7 (Restrições técnicas → Stack) e roda a trilha certa. v1 cobre **GCP** e **Supabase + Vercel + Prisma** — as duas realidades mais comuns do ecossistema (GCP de um lado; Supabase/Vercel do outro).

> Mesmo padrão dos outros blocos: **o que falharia em produção → sinal que confirma → comando/ação pra você fazer**. A skill entrega o comando; **quem roda é você**.
> Produto de nuvem muda rápido — sempre **confirme no painel/console atual**. A skill aponta o caminho, não decora o menu.

---

## Como escolher a trilha
1. Leia o SPEC §7 → Stack.
2. Bate com **GCP**? → roda a Trilha GCP.
3. Bate com **Supabase / Vercel / Prisma**? → roda a Trilha Supabase/Vercel/Prisma.
4. **Stack diferente ou não declarada?** → roda só os Blocos 1–3 (universais/de saúde) e **marca pendência**: *"stack X sem trilha específica no v1 — checagens universais aplicadas; observabilidade própria da stack fica como pendência."* **Nunca invente** o mecanismo de log/auditoria de uma stack que você não conhece.

---

## Trilha A — GCP *(Endolife hoje)*

No GCP o sistema costuma logar via **Cloud Logging**, medir via **Cloud Monitoring**, capturar exceção via **Error Reporting** e — o ponto crítico — auditar via **Cloud Audit Logs**. A face cego aqui tem uma armadilha de configuração.

### 🎯 A1 — Data Access audit logs DESLIGADO por padrão *(a lacuna nº1 do GCP — face cego)*
- **O que é:** o **Cloud Audit Logs** tem trilhas separadas. *Admin Activity* (mudou config) vem **ligado** e não desliga. Mas **Data Access** — *quem LEU/escreveu o dado* — vem **DESLIGADO por padrão** (fora do BigQuery). Ou seja: você jura que audita, mas **leitura de prontuário não é registrada**.
- **Por que é grave:** é exatamente a pergunta da face cego ("quem acessou o paciente X?") que fica sem resposta — e ninguém percebe, porque *algum* audit log aparece (o de Admin Activity).
- **Sinal que confirma:** no projeto, os *Data Access* logs (Data Read/Data Write) não estão habilitados pros serviços que tocam dado (Cloud SQL, GCS, e as APIs da app).
- **Ação de confirmação:** *IAM & Admin → Audit Logs* → ver se **Data Read/Data Write** estão marcados pros serviços sensíveis. (Atenção: Data Access audit log do GCP cobre acesso via serviços gerenciados; o acesso **dentro da sua aplicação** — usuário X leu paciente Y na sua API — ainda precisa da **tabela `audit_log`** do Bloco 2. As duas coisas se somam.)
- **Peso:** com dado real, o registro de acesso a dado sensível ausente (nem Data Access log nem tabela de auditoria) → **🔴** (face cego).

### A2 — Cloud Logging capturando payload com dado sensível *(face vazamento)*
- **O que falha:** logs de request/response ou de erro gravando corpo/parâmetro com CPF, laudo — vão parar no Cloud Logging em texto puro.
- **Sinal que confirma:** log estruturado sem raspagem; `jsonPayload` com campos sensíveis; log de erro serializando o objeto de domínio.
- **Ação:** raspar antes de logar (camada do Bloco 1.2). O GCP oferece **redação** no nível do sink (Cloud DLP / log scoping) como reforço — mas a raspagem na aplicação é a primeira linha.
- **Peso:** dado sensível em produção no Cloud Logging → 🔴 (vazamento).

### A3 — Retenção do log: bucket `_Default` (30 dias) vs. os dois relógios
- **O que é:** o Cloud Logging guarda no bucket **`_Default`** com retenção padrão de **30 dias**. Isso serve pro **relógio curto** (log operacional) — mas a **auditoria** (relógio longo) **não pode** morar só aí, senão o registro de acesso some em 30 dias.
- **Sinal que confirma:** Data Access logs (quando ligados) ficando só no `_Default`; nenhum **log bucket dedicado com retenção longa**, nem export pra BigQuery/GCS.
- **Ação:** separar os relógios — bucket de log com **retenção estendida** ou **export** (sink) da auditoria pra BigQuery/GCS com retenção alinhada à guarda do prontuário. Manter o operacional curto no `_Default`.

### A4 — Alertas + Error Reporting *(operacional)*
- **O que checar:** existe **alerting policy** no Cloud Monitoring (uptime/latência/erro) com canal de notificação? O **Error Reporting** está ligado — e sem PII nos eventos?
- **Sinal de risco:** nenhuma alert policy; Error Reporting recebendo exceção com dado sensível no contexto.
- **Ação:** criar uptime check + alert policy (queda, taxa de erro) → canal; conferir que a exceção não carrega PII.
- **Peso:** 🟠 (operacional).

> IAM: só quem precisa deve poder **ler ou apagar** logs/auditoria. Poder de sobra pra apagar audit log é um vetor de encobrimento — mas a *fragilidade de permissão* em si é assunto do `security-review`; aqui o foco é a **rastreabilidade**.

---

## Trilha B — Supabase + Vercel + Prisma

Aqui moram **duas lacunas nº1**: a auditoria **não existe por padrão** (face cego) e o Prisma **loga o valor dos parâmetros** (face vazamento). Preste atenção especial a B1 e B2.

### 🎯 B1 — A trilha de auditoria NÃO existe por padrão *(a lacuna nº1 — face cego)*
- **O que é:** Supabase e Prisma **não geram** o registro de "quem leu qual prontuário" sozinhos. O Supabase tem logs de **plataforma** (o que o Postgres/PostgREST fez), mas **não** o acesso no nível de negócio da sua app. Prisma nem isso.
- **Por que é grave:** sem construir a trilha, o sistema roda com **zero registro** de acesso a dado sensível. A face cego reprova.
- **Sinal que confirma:** nenhuma tabela `audit_log` (Bloco 2); nenhum middleware Prisma nem trigger que registre leitura.
- **Ação — as duas opções (a skill oferece o esqueleto):**
  - **Prisma middleware** (`$extends` / client extension): interceptar as queries que tocam modelos sensíveis e chamar `logAccess(...)`. Fica na app, é fácil de raspar, mas só cobre acesso que passa pelo Prisma.
  - **Trigger no Postgres** (Supabase): função + trigger que insere em `audit_log` a cada `SELECT`/`UPDATE` relevante (ou via `pgaudit` — extensão de auditoria do Postgres disponível no Supabase, para o nível de banco). Cobre acesso mesmo fora da app, mas exige cuidado pra não gravar conteúdo sensível.
- **Peso:** com dado real e nenhuma das duas → **🔴 REPROVADO** (face cego).

### 🎯 B2 — Prisma `log: ['query']` grava o valor dos parâmetros *(o trap nº1 — face vazamento)*
- **O que é:** configurar o `PrismaClient` com `log: ['query']` faz o Prisma **logar cada SQL com o valor dos parâmetros** — inclui o CPF na cláusula `WHERE`, o conteúdo no `INSERT`. Em produção, isso despeja dado de paciente no log (Vercel, stdout, onde for).
- **Por que passa batido:** parece ferramenta de debug inofensiva; muita gente deixa ligado "pra ver as queries" e esquece em produção.
- **Sinal que confirma:** `log: ['query']` (ou `['query', ...]`) no `new PrismaClient({...})`.
- **Ação de confirmação:** procurar `log:` na criação do PrismaClient. Trocar por `['warn', 'error']` em produção; se precisar de query em dev, condicionar por ambiente e **nunca** enviar pro destino de produção sem raspagem.
- **Peso:** com dado real em produção → **🔴 REPROVADO** (vazamento).

### B3 — Log da Vercel é efêmero (sem log drain) *(retenção + operacional)*
- **O que é:** os logs de runtime da Vercel são **efêmeros** — some rápido sem um **log drain** (dreno que envia o log pra um destino durável: um serviço de logs, um bucket).
- **Consequência dupla:** (a) você perde histórico operacional pra investigar; (b) **se você tiver colocado auditoria no log** (erro do Bloco 2 — auditoria deve estar em **tabela**, não em log), ela some junto.
- **Sinal que confirma:** nenhum log drain configurado; a app conta com o log da Vercel como memória de longo prazo.
- **Ação:** configurar log drain pro operacional (com retenção do relógio curto); manter a **auditoria na tabela `audit_log`**, nunca só no log efêmero.
- **Peso:** 🟠.

### B4 — Sentry (rastreio de erro) com PII *(face vazamento num terceiro)*
- **O que é:** o Sentry captura exceção com **request, body, headers, variáveis locais** — pode arrastar CPF/token/laudo pro painel, que é um **operador terceiro** (Art. 46 + contrato).
- **Sinal que confirma:** SDK do Sentry sem `beforeSend`/data scrubbing; `sendDefaultPii: true`; eventos de erro com dado sensível.
- **Ação:** ligar o **data scrubbing** (server-side scrubbing e/ou `beforeSend` que remove os campos da lista de raspagem); `sendDefaultPii: false`. Não enviar dado sensível pro Sentry.
- **Peso:** sem rastreio → 🟠; rastreio **vazando PII** em produção → 🔴 (vazamento).

### B5 — Health-check + alerta de queda *(operacional)*
- **O que checar:** existe rota `/health` (ou similar) que a Vercel/uptime monitora? Existe alerta quando cai ou a taxa de erro sobe (Vercel Monitoring, Sentry alerts, uptime externo)?
- **Sinal de risco:** sem `/health`; ninguém avisado na queda.
- **Ação:** expor `/health` que checa banco (Supabase) e storage; configurar alerta → canal.
- **Peso:** 🟠 (recomendação forte).

> Higiene que cruza com o `security-review`: *preview deployment* da Vercel apontando pro banco de produção mistura ambientes e polui logs/auditoria com dado real de teste. Se aparecer, aponte — mas a separação de ambientes é assunto do `security-review`.

---

## Nota de fronteira

Esta trilha cuida da **observabilidade** por stack. Ela **não** refaz:
- a *fragilidade de segurança* (IAM largo, RLS, segredo exposto, ambientes misturados) → `security-review` (rodou antes);
- backup/recuperação → `resilience-checkpoint` (rodou antes);
- privacidade/consentimento/CFM → `lgpd-saude-guard`;
- o que **conta como dado sensível** → referência compartilhada `lgpd-saude-guard.md`.

---

**Versão:** 1.0 · **Trilhas v1:** GCP · Supabase/Vercel/Prisma · **Lacunas priorizadas:** GCP — Data Access audit logs desligado por padrão (A1); Supabase/Vercel/Prisma — trilha de auditoria inexistente por padrão (B1) + Prisma `log:['query']` vazando parâmetro (B2). Confirme sempre no console atual — produto de nuvem muda. Novas trilhas conforme os projetos do clube pedirem.
