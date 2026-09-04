# Critérios e Checagens (Blocos 1–3) — observability-setup

**Clube da IA · Endolife Health-Tech × Inova UNIMES**

Catálogo das checagens de observabilidade. Bloco 1 é universal (qualquer stack); Blocos 2 e 3 são a camada de saúde e a operacional. O Bloco 4 (trilha por stack) fica em `trilhas-de-stack.md`.

> Mesmo padrão dos irmãos do pipeline: **o que falharia em produção → sinal que confirma → comando/ação pra você fazer**. A skill **nunca roda o comando** nem altera código — ela aponta e te entrega.

**Base regulatória (o "porquê"):**
- **LGPD Art. 37** — o controlador deve manter **registro das operações de tratamento**. É o alicerce da **trilha de auditoria**: sem registro de quem acessou dado sensível, você não presta contas.
- **LGPD Art. 15/16** — término do tratamento e **eliminação** dos dados. É o alicerce da **retenção de log**: guardar log além do necessário é passivo, não virtude.
- **LGPD Art. 46** — segurança dos dados; um log que vaza CPF é uma falha de segurança por si só.
- **CFM 2.454/2026** — accountability e prontuário (o médico responde; o acesso ao dado tem que ser auditável).
- **Boas práticas de logging (OWASP)** — a categoria de **falhas de logging e monitoramento** do Top 10 (a mesma que o `security-review` usa) + o princípio **o-que-logar / o-que-nunca-logar**: identificadores e conteúdo sensível ficam **fora** do log.

---

## As duas faces (fio condutor do veredito)

Antes dos blocos, a ideia que organiza tudo. Um sistema de saúde tem **duas obrigações opostas** sobre o mesmo dado:

- **Face vazamento** — o dado sensível **não pode entrar** no log. (Bloco 1.)
- **Face cego** — o **acesso** ao dado **tem que ficar registrado**. (Bloco 2.)

Uma protege o paciente **do** log; a outra usa um registro **para** proteger o paciente. Cada uma reprova sozinha. O Bloco 3 (operacional) e o Bloco 4 (stack) sustentam as duas, mas não reprovam por conta própria (salvo quando uma escolha de stack **é** o vazamento — ex.: `log: ['query']`).

---

## Bloco 1 — Logs sem vazamento (universal) · face vazamento

### 1.1 — Existe logging estruturado?
- **O que é:** *log estruturado* = evento gravado como dado organizado (campos: hora, nível, rota, id), não texto solto. Facilita filtrar e — o que importa aqui — **raspar** campos sensíveis de forma confiável.
- **O que falha:** `console.log` espalhado com string concatenada mistura dado sensível no meio do texto; não dá pra raspar direito nem investigar sob pressão.
- **Sinal que confirma:** só `console.log`/`print` cru; nenhum logger (pino, winston, structlog, Cloud Logging client) configurado.
- **Ação:** adotar um logger estruturado como ponto único de saída de log (é onde a raspagem se encaixa — 1.2).

### 1.2 — Existe camada de raspagem de PII antes de gravar?
- **O que é:** *raspagem / redação de PII* = tirar (ou mascarar) os campos sensíveis **antes** de o evento virar log. PII = dado pessoal; PHI = dado de saúde. A regra do clube: **logar o ID do recurso, nunca o conteúdo**.
- **O que falha:** sem essa camada, qualquer objeto logado (um `user`, um `request.body`, um erro com o registro anexo) carrega CPF, e-mail, laudo pro log.
- **Sinal que confirma:** logger sem lista de redação; objetos de domínio logados inteiros; nenhum filtro/serializer que mascare campos.
- **Ação:** definir a **lista de campos raspados** (ver esqueleto abaixo) no serializer do logger. Fonte do que é sensível: § Categorias de Dados da `lgpd-saude-guard.md`.
- **Peso:** ausência da camada → 🟠 (a skill oferece o esqueleto). Um caso **concreto** de dado sensível caindo no log de produção → 🔴 (é a face vazamento consumada — ver 1.3).

### 1.3 — Algum log grava o corpo/parâmetro cru?
- **O que falha:** o vazamento clássico não é um `console.log('cpf', cpf)` óbvio — é o **framework** logando por baixo: o valor dos parâmetros da query, o corpo do request, o payload do erro.
- **Sinal que confirma:** logging de `request.body`/`req.query` sem filtro; ORM configurado pra logar query com valor (o caso `Prisma log: ['query']` — Bloco 4/B); handler de erro que serializa o objeto inteiro.
- **Ação de confirmação:** procurar onde entra corpo/parâmetro no log e conferir se passa pela raspagem.
- **Peso:** com **dado real em produção**, um caminho desses gravando dado sensível → **🔴 REPROVADO**. Em dev local / dado fictício → 🟠.

### 1.4 — Qual a retenção do log operacional? *(relógio curto)*
- **O que é:** *retenção* = por quanto tempo o log é guardado antes de ser apagado. Aqui **menos é mais**.
- **A tensão (importante):** log operacional (erro, latência, debug) guardado **pra sempre** vira **passivo** de LGPD — mesmo raspado, retém rastro (ids, padrões de acesso). A minimização (Art. 15) e a eliminação (Art. 16) pedem prazo curto. Baseline de referência: **~30–90 dias**.
- **Sinal que confirma:** retenção de log "eterna"/indefinida; nenhuma política de expiração; bucket/índice de log sem lifecycle.
- **Ação:** declarar a retenção do log no SPEC §5 e configurar expiração. **Nunca invente** o número — se ausente, pendência.
- **Peso:** retenção indefinida → 🟠 (sinaliza como risco de minimização). Não declarada → 🟠 pendência.

> A retenção da **auditoria** é o relógio **oposto** (longo) e vive no Bloco 2.4 — não confundir os dois.

---

## Bloco 2 — Trilha de auditoria de acesso (camada de saúde) · face cego · **o coração**

O que separa esta skill de um "setup de logs" genérico: num sistema de paciente, você precisa **provar quem acessou o quê**. Isso é a trilha de auditoria — e é diferente do log operacional.

### 2.1 — Existe trilha de auditoria de acesso a dado sensível?
- **O que é:** um registro dedicado de **quem** (ator) acessou **qual** dado sensível (prontuário, laudo, paciente), **quando**, com **qual ação** (leu / escreveu / exportou / apagou) e **de onde** (IP/sessão). Não é o log de erro — é o registro de acesso.
- **O que falha em produção:** sem ela, num pedido de titular ("quero saber quem viu meu prontuário"), numa suspeita de acesso indevido ou numa auditoria, **você não tem resposta**. É falha de accountability.
- **Sinal que confirma:** nenhuma tabela `audit_log`/`access_log`; nenhum middleware/trigger que registre leitura de dado sensível; a "auditoria" existe só como log de erro (que não cobre *leitura* bem-sucedida).
- **Ação de confirmação:** procurar tabela/rotina de auditoria e o gancho que a alimenta.
- **Peso:** com **dado real em produção**, ausência de trilha → **🔴 REPROVADO** (face cego). Dev local / fictício → 🟠.
- **Norma:** LGPD Art. 37.

### 2.2 — A trilha é append-only?
- **O que é:** *append-only* = só **adiciona** registros; ninguém **edita** nem **apaga**. Uma auditoria que pode ser alterada não prova nada — o suspeito apagaria o próprio rastro.
- **Sinal que confirma:** o papel da aplicação tem permissão de `UPDATE`/`DELETE` na tabela de auditoria; a trilha é uma coluna mutável numa tabela de domínio.
- **Ação:** revogar `UPDATE`/`DELETE` da trilha pro papel da app (só `INSERT`/`SELECT`); idealmente tabela separada. (Entra no esqueleto abaixo.)
- **Peso:** trilha mutável → 🟠 (enfraquece, mas ainda registra); com dado real e trilha trivialmente apagável pela app, trate como próximo de 🔴 (a prova não se sustenta).

### 2.3 — A trilha é completa (o quê, quem, quando, ação, de onde)?
- **O que falha:** uma trilha que registra "houve acesso" mas não **quem** ou não **qual paciente** não responde a pergunta que importa.
- **Sinal que confirma:** faltam campos-chave (ator, resource_id, ação); não cobre **exportação** (o acesso mais sensível — dado saindo do sistema).
- **Ação:** completar os campos (ver schema no esqueleto); garantir que **export** é registrado.
- **Cuidado (cruza com a face vazamento):** a trilha guarda o **id** do recurso, **nunca o conteúdo**. Um `audit_log` que grava o texto do laudo no campo `meta` virou vazamento. Raspar também aqui.
- **Peso:** trilha incompleta → 🟠.

### 2.4 — A retenção da auditoria está declarada? *(relógio longo)*
- **A tensão:** oposta à do log. A auditoria é registro de accountability atado à **guarda do prontuário** — prazo **longo**. Baseline de referência: **20 anos, não cravado** (exceção de obrigação legal do próprio Art. 16, que permite guardar além do término quando a lei exige).
- **Sinal que confirma:** SPEC §5 não declara a retenção da auditoria; ou a auditoria é apagada junto com o log operacional (relógio curto aplicado ao registro errado).
- **Ação:** declarar a retenção da auditoria no SPEC **com base legal**.
- **Regra da skill:** **20 anos como baseline de referência**, mas **não crava no veredito**. Não declarada → **⚠️ revisão humana**. Declarada **abaixo** do baseline de guarda → **⚠️ revisão humana** (não reprova sozinha, não inventa número). Quem decide é o responsável clínico/jurídico.

---

## Bloco 3 — Operacional: alertas, erros e saúde *(nunca bloqueia sozinho)*

Cega pra saúde do sistema não é vazamento nem falha de auditoria — então **não reprova**. Mas sem isso você descobre que caiu pelo paciente reclamando.

### 3.1 — Existe alerta de queda / taxa de erro?
- **O que é:** *alerta* = aviso automático (e-mail, Slack, PagerDuty) quando uma métrica passa do limite (sistema fora do ar, erro subindo, latência alta).
- **Sinal que confirma:** nenhuma *alert policy*; ninguém definido pra receber; monitoramento existe mas sem gatilho.
- **Ação:** configurar ao menos "sistema caiu" e "taxa de erro alta" → canal + responsável.
- **Peso:** 🟠 (recomendação forte).

### 3.2 — Existe rastreio de erro — e ele raspa PII?
- **O que é:** *rastreio de erro* (Sentry, Cloud Error Reporting) captura exceções com contexto (stack, request) pra você depurar.
- **Cuidado (cruza com face vazamento):** essas ferramentas capturam **corpo, headers, variáveis** — e podem arrastar CPF/token/laudo pro painel de erro, que é um **terceiro** (Art. 46 + contrato de operador). Ligar o **data scrubbing** (ex.: `beforeSend` no Sentry) não é opcional em saúde.
- **Sinal que confirma:** Sentry/errors sem scrubbing; PII visível em eventos de erro.
- **Ação:** ligar o scrubbing; não enviar dado sensível pro serviço de erro.
- **Peso:** sem rastreio → 🟠. Rastreio **com PII vazando** em produção → escala pra 🔴 (é a face vazamento num terceiro).

### 3.3 — Existe health-check e métrica básica?
- **O que é:** *health-check* = endpoint (ex.: `/health`) que responde "estou de pé" (e checa dependências: banco, storage). *Métrica* = número acompanhado no tempo (latência, throughput, erro).
- **Sinal que confirma:** sem `/health`; sem dashboard/métrica mínima.
- **Ação:** expor `/health` que verifica as dependências; ligar um dashboard básico na plataforma.
- **Peso:** **recomendação** — não muda o veredito; entra no relatório.

---

## Bloco 5 — Confirmação dos 3 testes de navegador (pós-deploy) *(recomendação forte)*

O `security-review` **descreve** os 3 testes manuais de navegador (Bloco 0 daquela skill) enquanto o sistema ainda está em desenvolvimento. Aqui, no **pós-deploy** — com o app **de fato no ar** — é a hora de **confirmar** que eles foram rodados no ambiente real e que o resultado ficou **registrado** (é o que "observabilidade" pede: prova de que a checagem aconteceu). Este bloco **não substitui** o `security-review`; ele **fecha o laço** garantindo que os três não ficaram no papel.

Não reprova sozinho por conta própria (é operacional/rastreabilidade), **exceto** quando o próprio teste no ar revela um vazamento/furo com dado real — aí escala pela mesma régua das duas faces.

### 5.1 — Variáveis de ambiente no navegador (rodou? passou?)
- **O que confirmar no ar:** abrir o app em produção, `F12` → **Sources** → busca global por `SK_`, `KEY`, `SECRET`, `TOKEN`, `API_KEY`. Nenhuma chave de serviço com valor real pode aparecer.
- **Sinal de problema:** chave real no bundle de produção → é **vazamento em produção** → escala pra 🔴 (face vazamento, mesma régua do log que vaza CPF).
- **Registro esperado:** resultado (data + ✅/🔴) anotado no `OBSERVABILITY.md` ou no `security-review-report.md`.

### 5.2 — Autenticação sobrevive à limpeza dos dados do site (rodou? passou?)
- **O que confirmar no ar:** logar em produção, excluir todos os dados do site (cadeado da URL → **Gerenciar dados de sites**, ou DevTools → Application → Clear site data), recarregar. Tem que **deslogar** e bloquear as páginas privadas.
- **Sinal de problema:** continua logado / abre área privada (prontuário) após limpar → controle de acesso só no cliente → 🔴 (dado de paciente acessível de forma indevida em produção).
- **Registro esperado:** resultado anotado.

### 5.3 — Rate limit no login (rodou? existe?)
- **O que confirmar no ar:** errar a senha várias vezes seguidas no login de produção. Tem que **travar** (bloqueio/atraso/CAPTCHA). Lembrete do clube: rate limit **precisa ter sido pedido** — se não foi, provavelmente não existe.
- **Sinal de problema:** nunca trava → login exposto a força bruta contra a conta de admin → 🟠 (recomendação forte; vira 🔴 se houver conta admin com dado real e nenhum outro freio como MFA).
- **Registro esperado:** resultado anotado; se faltar rate limit, abrir a tarefa de implementá-lo.

> **Fronteira:** aqui a skill **confirma que os 3 rodaram e registra o resultado** — o catálogo detalhado (passo-a-passo, correção, norma) mora no `security-review` § Bloco 0. Um resultado 🔴 no ar deve **voltar** pro `security-review` como achado explorável.

---

## A regra do veredito (detalhe)

O eixo são as **duas faces**: *"o dado sensível não entra no log?"* (vazamento) **e** *"o acesso ao dado fica registrado?"* (cego).

| Situação | Face | Veredito |
|----------|------|----------|
| Dado sensível **entrando no log** em produção (inclui `log:['query']`, request.body cru, Sentry sem scrubbing) | Vazamento | 🔴 REPROVADO |
| Acesso a dado sensível em produção **sem trilha de auditoria** | Cego | 🔴 REPROVADO |
| Trilha existe mas **mutável** (app apaga) num sistema com dado real | Cego | próximo de 🔴 (a prova não se sustenta) |
| Sem camada de raspagem, mas sem caso concreto de vazamento ainda | Vazamento | 🟠 RESSALVAS |
| Trilha **incompleta** (falta campo, não cobre export) | Cego | 🟠 RESSALVAS |
| Retenção do log indefinida / retenção da auditoria não declarada | — | 🟠 (auditoria → ⚠️ revisão humana) |
| Sem alerta / sem rastreio de erro | Operacional | 🟠 RESSALVAS |
| Projeto **dev local / sem dado real** com lacunas | ambas | 🟠 RESSALVAS (nada real a expor ainda — resolver antes do go-live) |
| Raspagem no lugar **+** trilha com substância **+** dois relógios declarados | ambas | 🟢 APROVADO |
| Sem dashboard / sem drill de auditoria | — | não muda o veredito — **recomendação** |

**Princípio:** basta **uma** das faces falhar com dado real pra reprovar — como basta uma tabela exposta pra reprovar no `security-review`. As duas são independentes: dá pra ter auditoria impecável e ainda vazar CPF no log, e vice-versa.

---

## O esqueleto de observabilidade (o que a skill grava com seu ok)

Quando falta, a skill **oferece** commitar via GitHub MCP — **só o esqueleto, nunca log real nem dashboard**:

**1. Schema da trilha de auditoria + migration** (append-only):
```sql
-- Trilha de auditoria: quem acessou qual dado sensível, quando.
-- append-only: só INSERT/SELECT pro papel da app (sem UPDATE/DELETE).
CREATE TABLE audit_log (
  id           bigserial   PRIMARY KEY,
  occurred_at  timestamptz NOT NULL DEFAULT now(),
  actor_id     text        NOT NULL,   -- quem (usuário/serviço)
  actor_role   text,                   -- papel (médico, recepção...)
  action       text        NOT NULL,   -- leu | escreveu | exportou | apagou
  resource     text        NOT NULL,   -- tipo: prontuario | laudo | paciente
  resource_id  text        NOT NULL,   -- QUAL registro (id) — NUNCA o conteúdo
  ip           inet,                   -- de onde
  session_id   text,
  meta         jsonb                   -- contexto extra, SEM dado sensível
);
-- trava append-only (ajuste o nome do papel da sua app):
-- REVOKE UPDATE, DELETE ON audit_log FROM app_role;
```

**2. Gancho que escreve na trilha** — `src/audit.ts` (ou trigger no banco): função única `logAccess({ actorId, action, resource, resourceId, ip })` chamada nos pontos que tocam dado sensível. (Detalhe por stack — Prisma middleware / trigger Supabase / equivalente GCP — em `trilhas-de-stack.md`.)

**3. Camada de raspagem** — `src/log-redact.ts`, a lista do que **nunca** vai pro log:
```
# Raspar/mascarar ANTES de logar (fonte: lgpd-saude-guard.md § Categorias):
REDACT = [
  "cpf","rg","cnh","email","telefone","endereco","nome","data_nascimento",
  "diagnostico","medicacao","prontuario","laudo","senha","token","authorization"
]
# Regra de ouro: logar o resource_id, NUNCA o conteúdo. Mascarar o resto.
```

**4. `OBSERVABILITY.md`** (runbook), com este esqueleto:
```markdown
# OBSERVABILITY — [projeto]
> Como a gente enxerga o sistema vivo — sem expor dado de paciente.

## Onde os sinais vivem (só o LOCAL, nunca credencial/valor)
- Logs: [plataforma — ex.: Cloud Logging / Vercel / Sentry] · retenção: [X dias]
- Métricas/dashboards: [onde]
- Alertas: [canal] · quem recebe: [papel]

## O que NUNCA entra no log
- CPF, laudo, diagnóstico, e-mail, token... (ver lista de raspagem)

## Trilha de auditoria (quem-leu-o-quê)
- Tabela: audit_log (append-only)
- Como responder "quem acessou o paciente X": [query/local]
- Retenção da auditoria: [prazo] · base legal: [citar]

## Retenção — dois relógios
- Log operacional: [curto — ex.: 30–90d] · base: minimização (LGPD 15/16)
- Auditoria: [longo] · base: guarda de prontuário (baseline ref. 20 anos)

## Alertas ativos
- [nome] → [quando dispara] → [quem recebe]

## Health-check
- Endpoint: [/health] · verifica: [banco, storage...]

## Testes de segurança no navegador (3 do clube) — última rodada
> Catálogo/passo-a-passo: security-review § Bloco 0. Aqui só o registro do resultado no ar.
- B0.1 Env em DevTools→Sources (SK_/KEY/SECRET/TOKEN): [✅/🔴] · data: [ ]
- B0.2 Auth sobrevive a limpar dados do site: [✅/🔴] · data: [ ]
- B0.3 Rate limit no login (travou após N erros?): [✅/🔴/faltando] · data: [ ]
```

**5. Template de alerta/health-check** — `monitoring/alerts.example.yml` com os **nomes** das políticas e das variáveis (DSN, webhook) **sem valores**.

> **Log real e dashboard NUNCA entram nesse commit.** Eles vivem na plataforma (Cloud Logging, Vercel, Sentry). O que sobe é estrutura e runbook, sem um dado de paciente sequer.

---

## Nota de fronteira

Esta referência cuida de **logs sem vazamento, trilha de auditoria, alertas e retenção**. Ela **não** refaz:
- qualidade de código / domínio clínico → `quality-validator`;
- consentimento/finalidade/privacidade → `lgpd-saude-guard`;
- **controle** de acesso (a pessoa errada entra?) → `security-review` (aqui é a **rastreabilidade** do acesso);
- backup/recuperação → `resilience-checkpoint` (rodou antes);
- o que **conta como dado sensível** → vem da referência compartilhada `lgpd-saude-guard.md`.

---

**Versão:** 1.0 · **Base:** LGPD Art. 37, 15/16, 46 + CFM 2.454/2026 + guarda de prontuário (baseline 20 anos, não cravado) + boas práticas de logging (OWASP). Novas checagens conforme os projetos do clube pedirem.
