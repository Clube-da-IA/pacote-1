---
name: quality-validator
description: Audita código, arquitetura e domínio clínico de projetos vibe coding. Use quando terminar mudanças substanciais e quiser revisar qualidade (padrão de código, estrutura arquitetural, precisão clínica) ANTES de passar por segurança/LGPD. Roda no Claude Code, lê o repo do projeto via GitHub MCP, compara vs SPEC.md, gera relatório de issues por severidade, prepara draft para lgpd-saude-guard. Portão de revisão humana — você revisa antes de seguir pra segurança.
---

# Quality Validator

Auditor de qualidade técnica e domínio para projetos vibe coding do Clube da IA. Funciona como **portão de revisão** antes da auditoria de segurança/LGPD.

## Quando usar

- ✅ Após mudanças **substanciais** no projeto (novo módulo, refatoração, features clínicas)
- ✅ **Dentro do Claude Code**, com o projeto aberto
- ✅ **Antes** de acionar `lgpd-saude-guard`
- ✅ Como etapa de verificação + validação humana

**Não use:** 
- Para mudanças triviais (typo, comentário)
- Automaticamente (só por demanda do usuário)

---

## O que a skill faz

### Leitura do Projeto
1. Conecta ao repo GitHub (MCP) — lê arquivos automaticamente
2. Busca referências do projeto:
   - `SPEC.md` (contrato do projeto)
   - `README.md` (arquitetura proposta)
   - `CLAUDE.md` (regras do projeto)
3. Detecta mudanças:
   - Se houver commits novos → audita só o diff (mudanças)
   - Se não houver commits → audita todo o projeto

### Auditoria em 3 Categorias

#### **A — Code Quality**
Padrão, legibilidade, documentação

- Nomenclatura (variáveis, funções, classes seguem convenção?)
- Estrutura do código (modularização, não spaghetti?)
- Documentação inline (comentários úteis e corretos?)
- Português (docs e comments sem erros?)
- Complexidade (funções muito grandes? lógica clara?)

#### **B — Architecture**
Estrutura técnica e padrões

- Segue a proposta do SPEC.md?
- Separação de responsabilidades (frontend/backend/dados isolados?)
- Padrões de segurança arquitetural (não expõe chaves hardcoded, senhas, configs?)
- Escalabilidade (consegue crescer? dependências bem gerenciadas?)
- Padrões do clube (estrutura padrão Governança adotada?)

#### **C — Medical Domain** *(se aplicável)*
Precisão clínica e conformidade

- Conteúdo clínico correto (informações médicas conforme ESHRE/CFM/literatura)?
- Referências (citações de fontes confiáveis?)
- Avisos de responsabilidade ("não substitui consulta médica"?)
- Conduta médica (evita dar diagnóstico direto? direciona pra profissional?)
- Dados clínicos identificados (mesmo anonimizados, estão documentados?)

### Output — Dois Formatos

#### **1. Relatório no Chat (Markdown Estruturado)**

```markdown
## 📋 Quality Validator — Relatório Completo

### 📊 Resumo
- **Código analisado:** X arquivos, Y linhas
- **Issues encontradas:** N total
- **Severidade máxima:** [🔴 CRÍTICO / 🟠 ALTO / 🟡 MÉDIO / 🟢 BAIXO]

---

## A — Code Quality

### 🔴 CRÍTICO
- [arquivo.py:42] Variável sem tipo definido; risco de erro em produção

### 🟡 MÉDIO
- [documento.md:15] Português — "funçao" deveria ser "função"
- [helpers.js:8] Função muito grande (120 linhas); quebra em menores

### 🟢 BAIXO
- [config.js:3] Comentário faltando; explique o porquê desta config

---

## B — Architecture

### 🔴 CRÍTICO
- Dados clínicos tocam network sem criptografia em trânsito
- Configuração de banco de dados não segue padrão (hardcoded em dev.py)

### 🟠 ALTO
- Separação de responsabilidades: frontend chama diretamente a base (deveria ir por API)

---

## C — Medical Domain

### 🟠 ALTO
- Diagnóstico de "endometriose" foi mencionado sem referência clínica
- Sugira ESHRE 2022 ou CFM/FEBRASGO

---

## 🔐 Próximo Passo: lgpd-saude-guard

Com base nesta revisão, **estes pontos críticos precisam de auditoria LGPD:**

**Dados Clínicos Encontrados:**
- Identificadores de paciente em `pacientes.csv` (mesmo que fictício em dev)
- Historial clínico estruturado em `schema.sql`

**Pontos Críticos (LGPD — revise depois):**
- 🔴 Dados clínicos sem criptografia em trânsito
- 🟠 Configuração de acesso ao banco visível em código

**Sugestão:** Após revisar e corrigir acima, acione `lgpd-saude-guard` pro audit profundo.
```

#### **2. Arquivo Markdown (Dashboard Visual)**

`quality-validator-report.md` (criado automaticamente):

```markdown
# Quality Validator — Dashboard

| Categoria | Severidade | Arquivo | Linha | Issue | Status |
|-----------|-----------|---------|-------|-------|--------|
| Code Quality | 🔴 CRÍTICO | arquivo.py | 42 | Variável sem tipo | ⏳ Pendente |
| Code Quality | 🟡 MÉDIO | documento.md | 15 | Português — "funçao" | ⏳ Pendente |
| Architecture | 🔴 CRÍTICO | dev.py | — | DB config hardcoded | ⏳ Pendente |
| Medical | 🟠 ALTO | protocolo.md | 8 | Falta referência ESHRE | ⏳ Pendente |

**Total:** 4 issues | **Críticos:** 2 | **Bloqueadores:** Sim
```

### Filosofia

- **Flexível:** Aprende do projeto (lê SPEC, README, estrutura) — não usa checklist rígido
- **Humana:** Você revisa antes de prosseguir — skill só sugere
- **Contextual:** Se não tiver referência, pergunta ("tem um SPEC.md?")
- **Pré-LGPD:** Prepara o terreno para segurança/privacidade (não substitui)

---

## Como usar

### Passo 1: Chamar a skill

No Claude Code (com projeto aberto):

```
"Valida o projeto — code quality, arquitetura e domínio clínico."
```

Ou variações:
- "Faz uma revisão de qualidade"
- "Audita código e arquitetura"
- "Quality check no projeto"

### Passo 2: A skill conecta e lê

Automaticamente:
1. Busca repo no GitHub (MCP)
2. Lê SPEC.md, README.md, CLAUDE.md (se existirem)
3. Detecta mudanças (diff vs último commit)
4. Audita as 3 categorias

### Passo 3: Você revisa

- Lê o relatório no chat
- Vê o dashboard (arquivo .md)
- Ajusta código conforme necessário
- Commita mudanças (`commit-github`)

### Passo 4: Aciona LGPD

Após estar satisfeito:

```
"Aciona lgpd-saude-guard com o relatório acima"
```

---

## Severidades — O que significam

| Nível | Símbolo | Quando | Ação |
|-------|---------|--------|------|
| **CRÍTICO** | 🔴 | Quebra o projeto ou viola segurança/LGPD | **Corrigir antes de deploy** |
| **ALTO** | 🟠 | Risco técnico ou qualidade severa | **Corrigir antes de LGPD** |
| **MÉDIO** | 🟡 | Afeta manutenibilidade | **Considerar correção** |
| **BAIXO** | 🟢 | Nice-to-have | **Opcional** |

---

## Decisão compreensível (princípio inegociável)

Este portão existe para que **você** decida o que corrigir — e você é médico, não programador. Cada issue que a skill te apresenta para decidir (um achado 🔴 crítico, 🟠 alto, ou um ponto que vai pro `lgpd-saude-guard`) tem de chegar **compreensível**:

1. **Traduza cada termo técnico no ponto da decisão** — mesmo que já tenha aparecido antes. Nunca "sem criptografia em trânsito" sozinho; sempre *"o dado clínico trafega sem criptografia em trânsito (sem o cadeado HTTPS que embaralha a informação no caminho)"*.
2. **Diga a consequência concreta, não a categoria** — não "issue de arquitetura A"; e sim *"quem estiver na mesma rede Wi-Fi do consultório consegue ler o dado do paciente enquanto ele viaja"*.
3. **Ofereça analogia ou exemplo** quando o conceito for abstrato — o risco em linguagem de quem cuida do paciente, não de quem escreve código.
4. **Separe fato de suposição** — se a severidade depende de algo que o SPEC não declara, diga isso; não crave por conta própria.

**Teste da regra:** se, depois de ler o relatório, você não consegue explicar o risco com as suas próprias palavras, a skill **falhou** e deve reescrever mais claro. Vale **acima da concisão** — melhor um parágrafo a mais do que uma decisão tomada no escuro.

---

## Referências Internas

A skill consulta automaticamente (se existir no projeto):

- **`SPEC.md`** — "O que o projeto faz" (valida se código segue)
- **`README.md`** — "Como roda" (valida se arquitetura bate)
- **`CLAUDE.md`** — "Regras do projeto" (valida se padrões seguem)
- **`lgpd-saude-guard.md`** (referência compartilhada) — flags de sensibilidade

Se não encontrar, pergunta:
> "Não achei SPEC.md. Tem briefing do projeto? Me manda?"

---

## Limitações (por design)

- ❌ Não valida design/UI (isso é feito em projeto paralelo)
- ❌ Não substitui teste automatizado (valida que existe, não escreve)
- ❌ Não faz deploy (só revisão)
- ❌ Não audita segurança profunda (isso é `lgpd-saude-guard`)
- ❌ Não deleta/modifica código sozinha (só sugere)

---

## Próximas Skills

Depois de `quality-validator` aprovada:
1. **lgpd-saude-guard** — Segurança + privacidade + compliance
2. **resilience-checkpoint** — Backup + plano de recuperação
3. **observability-setup** — Rastreabilidade + alertas

---

## Convenções

- **Decisão compreensível (inegociável):** todo termo técnico explicado na primeira vez **e reexplicado no ponto de decisão** (ver seção "Decisão compreensível"); nenhuma issue 🔴/🟠 chega ao humano sem a tradução do termo e a consequência concreta.
- **Linguagem:** PT-BR, acessível
- **Sem terminal:** Roda no Claude Code, lê via GitHub MCP
- **Humanocêntrico:** Você decide o que fazer com as sugestões
- **Flexível:** Se o projeto é diferente, aprende do contexto
