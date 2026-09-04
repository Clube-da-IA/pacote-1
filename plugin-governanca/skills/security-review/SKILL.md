---
name: security-review
description: Portão de segurança adversarial (simulação de ataque à arquitetura) para SaaS de saúde do Clube da IA. USE ESTA SKILL quando o usuário disser "rodar security-review", "revisão de segurança", "simular ataque", "testar vulnerabilidade", "checar segurança antes do deploy", "pentest do projeto", ou quando um projeto de saúde estiver perto do deploy e precisar da revisão adversarial que os portões anteriores não fazem. Roda no Claude Code, lê o repo via GitHub MCP, depois do lgpd-saude-guard e antes do resilience-checkpoint. Pensa como atacante sobre a arquitetura e a IA (OWASP Web Top 10:2025 + OWASP LLM Top 10:2025 + LGPD Art. 46), com trilha por stack (GCP; Supabase/Vercel/Prisma). Emite veredito APROVADO / RESSALVAS / REPROVADO pela regra de exploitabilidade — explorável em produção com dado real reprova; dev local ou teórico só ressalva. Nunca altera código nem roda scanners — entrega comandos pra você confirmar. Ferramenta de visibilidade para revisão humana.
license: MIT
metadata:
  version: 1.2.0
  author: Clube da IA × Endolife Health-Tech
  pipeline-position: 6
---

# security-review

**Portão de segurança adversarial para projetos de saúde digital.**

Este é o portão que pensa **como um atacante**. Enquanto o `quality-validator` pergunta *"está bem construído?"* e o `lgpd-saude-guard` pergunta *"respeita a lei de dados?"*, aqui a pergunta é uma só: **"dá pra invadir ou vazar dado de paciente?"**.

> **Termo rápido:** *simulação de ataque* aqui = **raciocínio adversarial sobre a planta do projeto** (estilo mesa de guerra). O portão lê o código, traça o caminho que um atacante seguiria até o vazamento e aponta onde ele conseguiria entrar. Ele **não dispara ataque de verdade** — porque a regra do clube é "sem terminal" e porque rodar ataque real contra um sistema com dado de paciente é inseguro por princípio. O valor está em achar o buraco lendo a planta, não em explodir a casa pra provar.

---

## O que faz

Percorre o repositório (via GitHub MCP), detecta a stack e se o projeto usa IA, roda uma **simulação de ataque em blocos** contra a arquitetura (começando pelo **Bloco 0 — os 3 testes manuais de navegador do clube**, que entram sempre), classifica cada achado pela chance real de exploração, e produz:

1. **Relatório no chat** — vê na hora, com o veredito.
2. **Arquivo `security-review-report.md`** — histórico, dashboard, evidência.

Para cada achado entrega o padrão do clube: **o que o atacante tenta → sinal que confirma → comando pra você rodar** e confirmar você mesmo. A skill **nunca altera o código** e **nunca executa scanner** — ela lê, raciocina e te entrega o comando. Você decide.

**Base regulatória** (o "porquê" dos testes): OWASP Web Top 10:2025, OWASP LLM Top 10:2025, e **LGPD Art. 46** — que exige segurança *desde a concepção* do produto, ou seja, a própria lei brasileira descreve um portão pré-deploy. Detalhe completo em `references/criterios-e-testes.md`.

---

## Quando usar

- ✅ **Antes do deploy** de um projeto de saúde (é a última checagem adversarial antes de ir pro ar).
- ✅ **Dentro do Claude Code**, com o projeto aberto.
- ✅ **Depois** do `lgpd-saude-guard` (privacidade) e **antes** do `resilience-checkpoint` (backup).
- ✅ Sempre que a arquitetura mudou de forma relevante (novo endpoint, nova integração, mexeu na IA).

**Não use:**
- ❌ Para mudança trivial (typo, comentário, ajuste de texto).
- ❌ Automaticamente — **só por pedido do usuário** (é um portão que você aciona de propósito).
- ❌ Para revisar qualidade de código ou domínio clínico (isso é `quality-validator`) ou consentimento/privacidade (isso é `lgpd-saude-guard`).

---

## Como funciona

### 1. Leitura do projeto
- Conecta ao repo GitHub (MCP) e lê os arquivos.
- Busca as referências do projeto: **`SPEC.md`** (contrato), **`README.md`** (arquitetura), **`CLAUDE.md`** (regras).
- Consulta a referência compartilhada **`references/lgpd-saude-guard.md`** para saber quais dados são sensíveis (§ Categorias de Dados) e as bandeiras vermelhas de bloqueio.

### 2. Detecção de contexto
- **Qual stack?** Lê o SPEC §7 (Restrições técnicas → Stack). v1 tem trilha para **GCP** e para **Supabase + Vercel + Prisma**. Se o SPEC não declara a stack, **infere do `package.json`/configs e marca como pendência** — não inventa.
- **Toca IA?** Se o SPEC menciona IA/LLM/agente/assistente de IA, ou se o código chama um modelo, faz RAG ou usa ferramentas (tool calling), o **Bloco 2 roda**. Se não, marca "não aplicável".

### 3. Detecção de mudanças
- Se há commits novos → simula ataque só sobre o diff (o que mudou).
- Se não há → revisa a arquitetura inteira.

### 4. Simulação de ataque — os blocos
- **Bloco 0 — Testes manuais no navegador** (sempre presentes): os **3 testes do clube** que você roda no browser com o app no ar — (B0.1) variáveis de ambiente vazando em **Sources** do DevTools, (B0.2) autenticação que sobrevive à limpeza dos dados do site, (B0.3) **rate limit** no login (o que você tem que **pedir** pra ser implementado). O relatório **sempre** lista os três, cada um com ✅/🔴/⏳. Catálogo em `references/criterios-e-testes.md` § Bloco 0.
- **Bloco 1 — AppSec universal** (qualquer stack): as categorias do OWASP Web Top 10:2025 viradas em pergunta de atacante. Controle de acesso quebrado (#1), configuração insegura (#2), cadeia de suprimentos, injeção, criptografia, autenticação, logging.
- **Bloco 2 — IA/agentes** (se toca LLM): OWASP LLM Top 10:2025. Injeção de prompt (#1), vazamento de info sensível, excesso de agência, vazamento do system prompt, saída não tratada.
- **Bloco 3 — trilha por stack** (auto-selecionada): os vetores de vazamento específicos da stack detectada.

Catálogo completo (com o padrão *atacante → sinal → comando* de cada teste) em `references/criterios-e-testes.md` (Blocos 1 e 2) e `references/trilhas-de-stack.md` (Bloco 3).

### 5. Veredito por exploitabilidade
Cada achado é classificado pela **chance real de exploração** (ver regra abaixo), e o portão fecha com um veredito único.

### 6. Saída
Relatório no chat + arquivo `security-review-report.md`.

---

## O veredito

O portão sempre termina com **um** destes três carimbos. A regra que decide qual é a **exploitabilidade** — herdada da lógica de gravidade que o clube já usa no `lgpd-saude-guard`:

| Veredito | Quando | Símbolo |
|----------|--------|---------|
| **REPROVADO** | Há ao menos uma falha **explorável em produção, com dado real** (ex.: RLS desligada numa tabela de pacientes no ar) | 🔴 |
| **APROVADO COM RESSALVAS** | As falhas restantes só valem em **dev local** ou são **teóricas** (sem caminho real até o dado); ou são melhorias recomendadas | 🟠 |
| **APROVADO** | Nenhuma falha explorável encontrada nos blocos aplicáveis | 🟢 |

> **"Explorável"** = dá pra um atacante usar aquilo de fato pra invadir ou vazar — não é só risco no papel.

**REPROVADO não é ordem, é sinal.** A skill nunca bloqueia sozinha nem mexe no código — ela mostra, com clareza, que aquilo **não deveria ir pro deploy assim**. Quem decide é você.

---

## Decisão compreensível (princípio inegociável)

Este portão existe para que **você** decida — e você é médico, não programador. A decisão só é verdadeiramente sua se o risco chegar **compreensível**. Portanto, toda vez que esta skill te apresenta algo para decidir (um veredito 🔴/🟠, um item de ⚠️ revisão humana, ou um "posso gravar o esqueleto?"), ela é **obrigada** a:

1. **Traduzir cada termo técnico no ponto da decisão** — mesmo que já o tenha explicado antes. Nunca "RLS desligada" sozinho; sempre *"a RLS (Row Level Security — a trava do banco de dados que decide quais linhas cada usuário pode ver) está desligada"*.
2. **Dizer a consequência concreta, não a categoria** — não "falha A01"; e sim *"qualquer pessoa com o link público consegue baixar a lista inteira de pacientes"*. Traduza o risco para o consultório.
3. **Oferecer analogia ou exemplo** quando o conceito for abstrato — o "e se der ruim" na linguagem de quem cuida do paciente, não de quem administra servidor.
4. **Separar fato de suposição** — se o veredito depende de algo que o SPEC não declara, diga isso abertamente; não decida no lugar do humano.

**Teste da regra:** se, depois de ler o achado, você não consegue explicar o risco com as suas próprias palavras, a skill **falhou** e deve reescrever mais claro. Esta regra vale **acima da concisão** — melhor um parágrafo a mais do que uma decisão tomada no escuro.

---

## Saída — dois formatos

### 1. Relatório no chat

```
🎯 security-review — Simulação de Ataque
─────────────────────────────────────────
📁 Projeto: clinica-app  ·  Stack: Supabase + Vercel + Prisma
🤖 Usa IA: sim (Bloco 2 rodou)  ·  Arquivos: 63

VEREDITO: 🔴 REPROVADO
Motivo: 1 falha explorável em produção com dado de paciente.

─────────────────────────────────────────
BLOCO 0 — Testes manuais no navegador (os 3 do clube)
  🔴 FALHOU · B0.1 Variável de ambiente no navegador
     Busca por `SK_` em DevTools→Sources achou uma chave
     de serviço (sk_live_...) no bundle do front. Pública
     pra qualquer visitante → roubo de env.
     → Rode: F12 → Sources → Ctrl+Shift+F → `SK_`,`KEY`.
  ✅ PASSOU · B0.2 Autenticação x limpar dados do site
     Após excluir dados do site e recarregar, desloga e
     bloqueia a área privada. Trava está no servidor. OK.
  ⏳ A RODAR · B0.3 Rate limit no login
     Não achei rate limit no código do login. LEMBRE: isso
     precisa ser PEDIDO — se você não pediu, não existe.
     → Rode: erre a senha várias vezes; nunca trava = sem limite.

BLOCO 1 — AppSec (OWASP Web Top 10:2025)
  🔴 CRÍTICO · Controle de acesso (A01)
     /app/api/laudos/[id]/route.ts:14 — endpoint não checa
     dono; trocar o id na URL devolve laudo de outro paciente.
     → Confirmar: abrir /api/laudos/<id-alheio> logado como outro usuário.

BLOCO 2 — IA/agentes (OWASP LLM Top 10:2025)
  🟠 RESSALVA · Excesso de agência (LLM06)
     O assistente de IA pode disparar e-mail sem confirmação humana.
     → Sugestão: human-in-the-loop em ações sensíveis.

BLOCO 3 — Trilha Supabase/Vercel/Prisma
  🔴 CRÍTICO · RLS desligada (vazamento nº1)
     Tabela `pacientes` sem Row Level Security → a anon key
     (pública no frontend) lê o banco inteiro.
     → Confirmar em 30s:
       curl 'https://<projeto>.supabase.co/rest/v1/pacientes?select=*' \
         -H "apikey: <ANON_KEY>"
       Resposta segura = []. Se vier dado, está exposto.
     → Ou rode o Security Advisor no painel do Supabase.

─────────────────────────────────────────
PARA CORRIGIR (prioridade)
  1. Tirar a chave `sk_live_` do front (B0.1) e rotacionar.
  2. Ligar RLS em `pacientes` e escrever a política de acesso.
  3. Checar dono no endpoint /api/laudos/[id].
  4. Pedir/implementar rate limit no login (B0.3) e rodar o teste.
  5. (ressalva) Pôr confirmação humana nas ações do assistente de IA.

RODE VOCÊ MESMO NO NAVEGADOR (os 3 testes do clube)
  B0.1 F12 → Sources → buscar SK_, KEY, SECRET, TOKEN
  B0.2 Excluir dados do site → recarregar → tem que deslogar
  B0.3 Errar a senha várias vezes → tem que travar

Relatório completo: security-review-report.md
Próximo portão (após corrigir): resilience-checkpoint
```

### 2. Arquivo `security-review-report.md`

```markdown
# security-review — Simulação de Ataque · [projeto]

Data: 2026-07-01 · Stack: Supabase + Vercel + Prisma · IA: sim
Arquivos: 63

## Veredito: 🔴 REPROVADO
1 falha explorável em produção com dado real.

## Dashboard

| Bloco | Sev | Onde | Falha | Norma | Explorável? | Status |
|-------|-----|------|-------|-------|-------------|--------|
| B0.1 navegador | 🔴 | bundle do front | Env `sk_live_` visível em Sources | OWASP A02/A04 / LGPD 46 | Sim (prod, dado real) | ⏳ |
| B0.2 navegador | 🟢 | rotas privadas | Auth sobrevive à limpeza do site | OWASP A01/A07 | Não | ✅ |
| B0.3 navegador | 🟠 | login | Sem rate limit (precisa ser pedido) | OWASP A07 | A confirmar no browser | ⏳ |
| Stack | 🔴 | tabela `pacientes` | RLS desligada | OWASP A01 / LGPD 46 | Sim (prod, dado real) | ⏳ |
| AppSec | 🔴 | api/laudos/[id]:14 | Acesso sem checar dono | OWASP A01 | Sim (prod) | ⏳ |
| IA | 🟠 | sofia/agent.ts | Ação sem human-in-the-loop | OWASP LLM06 | Teórico | ⏳ |

## Achado 🔴 (1) — RLS desligada em `pacientes`
- **O que o atacante faz:** usa a anon key (pública por design no frontend) pra ler a tabela inteira.
- **Sinal que confirma:** o `curl` abaixo devolve linhas em vez de `[]`.
- **Comando pra você rodar:**
  `curl 'https://<projeto>.supabase.co/rest/v1/pacientes?select=*' -H "apikey: <ANON_KEY>"`
- **Norma:** OWASP A01:2025 (Broken Access Control) + LGPD Art. 46 (medidas de segurança).
- **Correção:** `ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;` + política que limita cada usuário aos seus dados.

## Checklist de ação
- [ ] **B0.1** Rodar no navegador: F12 → Sources → buscar `SK_`,`KEY`,`SECRET`,`TOKEN` — nenhuma chave real pode aparecer
- [ ] **B0.2** Rodar no navegador: excluir dados do site + recarregar — tem que deslogar e bloquear a área privada
- [ ] **B0.3** Rodar no navegador: errar a senha várias vezes — tem que travar (e **pedir** rate limit se não existir)
- [ ] Ligar RLS em toda tabela com dado de paciente
- [ ] Checar dono em endpoints que recebem id na URL
- [ ] Human-in-the-loop nas ações da IA
- [ ] Rodar a skill de novo após corrigir

---
**Próximo passo:** resolver os 🔴 antes do deploy, depois seguir para `resilience-checkpoint`.
```

---

## Regra de ouro: nunca inventar critério de segurança

Se o SPEC **não diz** o que é dado real vs. fictício, ou qual é o modelo de acesso esperado, o portão **pergunta ou marca como pendência explícita** — nunca chuta. Melhor um "isto está indefinido, confirme" do que um veredito baseado em suposição.

Exemplo:
> ⚠️ Pendência: o SPEC não diz se `pacientes.csv` é dado real ou fictício. Se for real, o achado de RLS vira 🔴 REPROVADO; se for fictício de teste, vira 🟠 ressalva. **Confirme antes de decidir o deploy.**

---

## Fronteira (o que este portão NÃO faz)

- ❌ Não valida qualidade de código nem domínio clínico → isso é `quality-validator`.
- ❌ Não audita consentimento, finalidade nem privacidade → isso é `lgpd-saude-guard` (que roda antes).
- ❌ Não faz backup nem plano de recuperação → isso é `resilience-checkpoint` (que roda depois).
- ❌ Não altera, deleta ou corrige código — só aponta e sugere.
- ❌ Não executa scanner, ataque real nem git CLI — entrega o comando pra **você** rodar.

Consome (não reescreve) a referência compartilhada `lgpd-saude-guard.md` para saber o que é dado sensível e quais são as bandeiras vermelhas.

---

## Como usar

**Passo 1 — Chamar a skill** (no Claude Code, projeto aberto):
```
"Roda o security-review — simula ataque na arquitetura antes do deploy."
```
Variações: *"revisão de segurança do projeto"*, *"testa as vulnerabilidades"*, *"pode ir pro deploy? checa segurança"*.

**Passo 2 — A skill lê e simula:** conecta no repo, detecta stack e uso de IA, roda os blocos aplicáveis.

**Passo 3 — Você revisa:** lê o veredito no chat, abre o `security-review-report.md`, **roda os comandos de confirmação** dos achados 🔴.

**Passo 4 — Corrige e roda de novo** (a skill é idempotente — rodar de novo é seguro). Commit das correções via `commit-github`.

**Passo 5 — Segue o pipeline:** com veredito 🟢 (ou ressalvas aceitas), aciona `resilience-checkpoint`.

---

## Convenções

- **Decisão compreensível (inegociável):** todo termo técnico explicado na primeira vez **e reexplicado no ponto de decisão** (ver seção "Decisão compreensível"); nenhum veredito 🔴/🟠 ou ⚠️ chega ao humano sem a tradução do termo e a consequência concreta.
- **Idioma:** PT-BR, acessível — todo termo técnico explicado na primeira vez.
- **Sem terminal no fluxo:** lê via GitHub MCP; não roda scanner nem git CLI. Comandos de confirmação são pra você.
- **Nunca expõe valor de segredo** — aponta arquivo, linha e tipo, nunca o valor.
- **Humanocêntrico:** você sempre decide; a skill é "olha aqui".
- **Idempotente:** rodar de novo não duplica alertas.
- **Efeito colateral mínimo:** só escreve o `security-review-report.md`; não commita sozinha.

---

## Instalação

1. Empacote a pasta `security-review/` como `.skill` via `package_skill.py`.
2. Configurações / Customize → Skills → enviar o `.skill`.
3. Disponível em Chat, Claude Code e Cowork. (Este portão foi pensado para rodar no **Claude Code**, com o repo conectado.)

Sem dependências: é uma skill de análise, não roda código — não precisa de Node nem de pacote nenhum.

---

## Próximas skills do pipeline

Depois de `security-review` aprovada:
1. **resilience-checkpoint** — backup + plano de recuperação.
2. **observability-setup** — rastreabilidade + alertas (sem expor PII).
3. **hangar-sync** — fecha o ciclo (arquivo).

---

**Versão:** 1.1.0
**Última atualização:** 2026-07-03
**Responsável:** Clube da IA × Endolife Health-Tech
