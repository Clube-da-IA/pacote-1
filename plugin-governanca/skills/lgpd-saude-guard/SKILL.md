---
name: lgpd-saude-guard
description: Portão de segurança e conformidade regulatória (LGPD + CFM 2.454/2026) para projetos de saúde digital do Clube da IA. USE ESTA SKILL quando o usuário disser "rodar lgpd-saude-guard", "auditar LGPD", "checar segurança do projeto", "revisar dados sensíveis", "auditoria de conformidade", "verificar CFM 2.454", ou quando precisar escanear um repositório em busca de CPF/email real de paciente, laudos clínicos, credenciais e URLs de produção antes de commitar. Roda no Claude Code, após quality-validator e antes de commit-github. Detecta padrões de risco, classifica por gravidade (crítico/aviso/ok), mapeia para artigos da LGPD e da Resolução CFM 2.454, e gera relatório Markdown mais resumo inline. Ferramenta de visibilidade para revisão humana, não bloqueador automático.
license: MIT
metadata:
  version: 1.1.0
  author: Clube da IA x Endolife Health-Tech
  pipeline-position: 5
---

# lgpd-saude-guard

**Portão de segurança e conformidade regulatória para projetos de saúde digital.**

Roda após revisão de qualidade, antes de commit, e audita a pasta do projeto em busca de dados sensíveis (PII de paciente, laudos clínicos, credenciais) mapeando violações potenciais de **LGPD** (Lei Geral de Proteção de Dados) e **CFM 2.454/2026** (regulação de IA em medicina).

---

## O que faz

Percorre os arquivos do projeto, detecta padrões de risco (CPF, email de paciente, laudo clínico, credenciais, URLs de produção), classifica por gravidade, mapeia para normas regulatórias, e produz:

1. **Relatório Markdown** (`_lgpd-security-audit.md`) — histórico, evidência
2. **Resumo inline** no Claude Code — vê na hora, sem abrir arquivo

Nada bloqueia automaticamente — é ferramenta de **visibilidade para o revisor** decidir. O Plugin como um todo é o portão.

---

## Quando usar

- Após `quality-validator` rodar ✅
- Antes de `commit-github` ir embora ✅
- Sempre que a pasta toca dados de paciente ou credenciais
- Em cada iteração do projeto (idempotente — rodar de novo é seguro)

---

## Como usar

### No Claude Code

```
/lgpd-saude-guard [caminho-da-pasta]
```

Exemplo:
```
/lgpd-saude-guard ./src
```

### Saída esperada

**Tela (inline):**
```
lgpd-saude-guard — Auditoria LGPD/CFM 2.454
─────────────────────────────────────────
📁 Pasta: ./src
🔍 Arquivos escaneados: 47
⏱️  Duração: 2.3s

ACHADOS:
─────────────────────────────────────────
🔴 CRÍTICO (2):
  • src/models/patient.js:12 — CPF real detectado
  • src/reports/laudo.js:45 — Laudo clínico (identifica paciente)

🟡 AVISO (3):
  • src/config.js:8 — URL de produção em comentário
  • src/db/connection.js:3 — DATABASE_URL em código
  • .github/workflows/deploy.yml:21 — API_KEY em secret?

🟢 OK (42):
  • Arquivos de teste, docs, código limpo

RECOMENDAÇÕES:
─────────────────────────────────────────
1. src/models/patient.js:12 → Mover CPF para variável de ambiente (.env)
2. src/reports/laudo.js:45 → Avaliar se dados reais de prod ou teste fictício
3. Credenciais em src/config.js → Usar AWS Secrets Manager ou similar

Relatório completo: _lgpd-security-audit.md
```

**Arquivo** (`_lgpd-security-audit.md`):
```markdown
# Auditoria LGPD/CFM 2.454 — [projeto]

Data: 2026-06-29 14:32 UTC
Pasta: ./src
Arquivos: 47 | Duração: 2.3s

## Resumo

| Categoria | Qtd | Ação |
|-----------|-----|------|
| 🔴 Crítico | 2 | Revisar antes de commit |
| 🟡 Aviso | 3 | Documentar / mitigar |
| 🟢 OK | 42 | Passou |

## Achados Críticos

### (1) src/models/patient.js:12
- **Padrão:** CPF válido (11 dígitos)
- **Linha:** `cpf: "12345678901"`
- **Norma:** LGPD Art. 9º (dado sensível)
- **CFM 2.454:** Rastreabilidade comprometida se PII real em código
- **Recomendação:** Mover para .env.local; usar dado fictício em repo

### (2) src/reports/laudo.js:45
- **Padrão:** Laudo clínico com identificação de pessoa
- **Amostra:** "Paciente Joana Silva, 32a, endometriose grau IV..."
- **Norma:** LGPD Art. 9º + Lei 12.842/2013 (sigilo médico)
- **CFM 2.454:** Responsabilidade médica — quem gerou este laudo? Assinado?
- **Recomendação:** Se teste, usar "Paciente Fictício" / caso real, validar assinatura médica

## Achados Aviso

### (3) src/config.js:8
- **Padrão:** URL de servidor de produção
- **Linha:** `// TODO: chamar https://api-prod.agenda-da-clinica.com`
- **Norma:** LGPD Art. 32 (segurança da infraestrutura)
- **Recomendação:** Usar variável de ambiente; remover URLs hardcoded

## Checklist de ação

- [ ] Revisar achados críticos com responsável de segurança
- [ ] Mover credenciais para .env / AWS Secrets
- [ ] Validar dados reais vs fictício
- [ ] Confirmar assinaturas médicas em laudos
- [ ] Rodar skill de novo após correções

---

**Próximo passo:** Resolver todos os itens 🔴 antes de `commit-github`.
```

---

## Decisão compreensível (princípio inegociável)

Esta skill entrega achados para **você** decidir o que fazer — e você é médico, não programador. Cada achado (um 🔴 crítico, um 🟡 aviso, uma dúvida de "é dado real ou fictício?") tem de chegar **compreensível**:

1. **Traduza cada termo técnico no ponto do achado** — mesmo que já tenha aparecido antes. Nunca "DATABASE_URL exposta" sozinho; sempre *"a DATABASE_URL (o endereço + senha que abre o banco de dados inteiro) está escrita no código"*.
2. **Diga a consequência concreta, não só o artigo da lei** — não apenas "LGPD Art. 9º"; e sim *"esse CPF de paciente está escrito no código; se for pro GitHub, fica exposto a qualquer um com acesso ao repositório — é vazamento de dado de saúde"* (e cite o artigo em seguida).
3. **Ofereça exemplo** quando o risco for abstrato — o risco em linguagem de consultório.
4. **Separe fato de suposição** — quando não dá pra saber se é dado real ou de teste, diga isso e **pergunte**, em vez de cravar a gravidade sozinha.

**Teste da regra:** se, depois de ler o achado, você não consegue explicar o risco com as suas próprias palavras, a skill **falhou** e deve reescrever mais claro. Vale **acima da concisão** — melhor um parágrafo a mais do que uma decisão tomada no escuro.

---

## Padrões detectados

Veja **lgpd-saude-guard-reference.md** para:
- Lista completa de padrões (regex + exemplos)
- Mapeamento LGPD/CFM 2.454
- Recomendações por tipo de achado

---

## Convenções

- **Decisão compreensível (inegociável)** — todo termo técnico explicado na primeira vez **e reexplicado no ponto do achado** (ver seção "Decisão compreensível"); nenhum 🔴/🟡 chega ao humano sem a tradução do termo e a consequência concreta.
- **Nunca expõe valor real do segredo** — só apontar linha, padrão, tipo
- **Idempotente** — rodar de novo é seguro, não duplica alertas
- **Contextual** — código em `/src` é prod-adjacent; `/tests` é dev
- **Humble** — revisor humano sempre decide; skill é "olha aqui"

---

## Instalação

1. Copie a pasta `lgpd-saude-guard/` (com SKILL.md, detector.js, reference.md)
2. Empacote como `.skill` via `package_skill.py`
3. Customize → Skills → enviar `.skill`
4. Disponível em Chat, Claude Code, Cowork

---

## Dependências

- Node.js 18+
- Sem pacotes npm (stdlib só — `fs`, `path`, `crypto`)

---

## Troubleshooting

**"Não detectou meu CPF"**
- Verificar formato (ex.: `12345678901` vs `123.456.789-01`)
- Skill busca padrões válidos (11 dígitos ou com máscara)

**"Muito barulho de avisos"**
- Normalizando — achados em `/tests` aparecem como "info", não "aviso"
- Revisor filtra o que importa

**"Quero excluir uma pasta"**
- Editar `detector.js`: adicionar pasta à lista `IGNORE_PATHS`

---

**Versão:** 1.1.0  
**Última atualização:** 2026-07-03  
**Responsável:** Clube da IA × Endolife Health-Tech
