# Referência — lgpd-saude-guard

## Padrões de detecção e mapeamento normativo

> **Nota de versão (reconciliação v1.1).** Este é o *arquivo-fonte* dos padrões de detecção do
> `lgpd-saude-guard` (regex + mapeamento LGPD/CFM). É distinto da referência **distilada**
> `lgpd-saude-guard.md`, que viaja dentro das skills-portão e carrega a lista de consumidoras.
> Ambos ficam na **geração v1.1 (Jul/2026)**, mantidos em par. Nesta revisão os padrões de
> detecção não mudaram de conteúdo — apenas o selo de versão foi alinhado.

---

## 🔴 CRÍTICO — Bloqueia/Marca para revisão mandatória

Dados que violam LGPD Art. 9º (dados sensíveis de saúde) ou CFM 2.454 (rastreabilidade/consentimento).

### (1) CPF / CNPJ real de paciente

| Campo | Padrão | Exemplo válido | Norma | Ação |
|-------|--------|---|------|------|
| **Regex** | `\b\d{3}\.\d{3}\.\d{3}-\d{2}\b` ou `\b\d{11}\b` | `123.456.789-00` ou `12345678900` | LGPD Art. 9º | ❌ Mover para .env ou usar fictício |
| **Tipo** | Identificador único | `cpf: "12345678901"` | Lei 12.862/2013 | Nunca em repo |
| **Contexto** | Email de paciente | `joana.silva@gmail.com` (pessoal real) | LGPD Art. 5º | ✅ Pseudonimizar se em teste |

**Recomendação:**
```javascript
// ❌ Errado
const patient = { cpf: "12345678901", name: "Joana Silva" };

// ✅ Correto (fictício para teste)
const patient = { cpf: "00000000001", name: "Paciente Fictício 1" };

// ✅ Correto (produção)
const patient = { cpfHash: process.env.PATIENT_CPF_HASH, nameEncrypted: process.env.PATIENT_NAME_ENC };
```

---

### (2) Laudo clínico com identificação de paciente

| Campo | Padrão | Exemplo | Norma | Ação |
|-------|--------|---------|------|------|
| **Regex** | `(Paciente\|Diagnóstico\|Anamnese).*?(nome\|CPF\|email)` | `Paciente Joana Silva, 32a, com endometriose grau IV` | LGPD Art. 9º + Lei 12.842/2013 (sigilo médico) | ❌ Validar assinatura médica + consentimento |
| **Tipo** | Diagnóstico vinculado a PII | Qualquer laudo PDF/texto com nome real | CFM 2.454 Art. 3º (rastreabilidade) | Documentar quem assinou, quando, contexto |
| **Contexto** | Arquivo de teste com laudo real | `src/reports/laudo-joana.pdf` | CFM 2.454 Art. 4º (responsabilidade) | Usar anonimizado ou labeling "TEST ONLY" |

**Recomendação:**
```javascript
// ❌ Errado (produção real em repositório)
const laudo = `
  Paciente: Joana Silva (CPF: 123.456.789-00)
  Diagnóstico: Endometriose grau IV
  Tratamento recomendado: Cirurgia...
`;

// ✅ Correto (fictício com labels)
const laudoTest = `
  [TEST DATA — FICTIONAL PATIENT]
  Paciente: Paciente Teste 001
  Diagnóstico: Endometriose (exemplo)
  ...
`;

// ✅ Correto (produção — assinatura + consentimento documentado)
const laudoProd = {
  patientUUID: "uuid-anonimizado",
  diagnóstico: "...",
  assinado_por: "Dr. Nome (CRM XXXXX)",
  data_assinatura: "2026-06-29T10:00Z",
  consentimento_arquivo: "consent-uuid-XXX",
};
```

---

## 🟡 AVISO — Documenta, não bloqueia (mas precisa de justificativa)

Credenciais e configurações que violam LGPD Art. 32 (segurança) se expostas.

### (3) Credencial de banco/API em código

| Campo | Padrão | Exemplo | Norma | Ação |
|-------|--------|---------|------|------|
| **Regex** | `(DATABASE_URL\|API_KEY\|SECRET_KEY\|PASSWORD).*?=.*?[a-z0-9]{8,}` | `DATABASE_URL=postgres://user:pass@prod.db.com` | LGPD Art. 32 (segurança técnica) | ⚠️ Mover para .env ou AWS Secrets |
| **Tipo** | Credencial hardcoded | `const apiKey = "sk-1234567890abcdef";` | Lei 12.965/2014 (Marco Civil) | Nunca em código público |
| **Contexto** | .env.production commitado | `.env.production` com valores reais | LGPD Art. 32 | Usar .gitignore, .env.example |

**Recomendação:**
```javascript
// ❌ Errado
const db = require('pg').Pool;
const pool = new db({
  connectionString: 'postgres://admin:senha123@prod-db.example.com:5432/agenda-da-clinica'
});

// ✅ Correto
require('dotenv').config();
const pool = new db({
  connectionString: process.env.DATABASE_URL
});

// .env.local (nunca commitar)
// DATABASE_URL=postgres://admin:senha123@prod-db.example.com:5432/agenda-da-clinica

// .env.example (sim, commitar)
// DATABASE_URL=postgres://user:password@host:5432/database
```

---

### (4) URL de servidor de produção em código/comentário

| Campo | Padrão | Exemplo | Norma | Ação |
|-------|--------|---------|------|------|
| **Regex** | `https?://(api-\|prod\|production\|live)[a-z0-9.-]+\.com` | `https://api-prod.agenda-da-clinica.com` | LGPD Art. 32 (infraestrutura) | ⚠️ Usar variável de ambiente |
| **Tipo** | Hardcoded endpoint | `const endpoint = "https://prod.example.com/api";` | CFM 2.454 Art. 5º (auditabilidade) | Facilita rastreamento não autorizado |
| **Contexto** | Comentário TODO | `// TODO: chamar https://api-prod.agenda-da-clinica.com/laudo` | — | Remover antes de push |

**Recomendação:**
```javascript
// ❌ Errado
const API_URL = "https://api-prod.agenda-da-clinica.com";
fetch(`${API_URL}/pacientes/${id}`);

// ✅ Correto
const API_URL = process.env.API_URL || "https://api-staging.agenda-da-clinica.com";
fetch(`${API_URL}/pacientes/${id}`);

// .env
// API_URL=https://api-prod.agenda-da-clinica.com (local)
```

---

## 🟢 OK — Passa (sem ação)

### (5) Dado fictício / de teste

| Campo | Padrão | Exemplo | Norma | Ação |
|-------|--------|---------|------|------|
| **Regex** | `(fictício\|test\|exemplo\|mock\|dummy)` (case-insensitive) | `"Paciente Fictício 1"`, `test@example.com` | LGPD Art. 5º (finalidade) | ✅ OK — claramente não é real |
| **Tipo** | Email de exemplo | `user@example.com`, `demo@test.com` | — | Reconhecido como não-real |
| **Contexto** | Arquivo de teste | `src/mocks/patient-sample.js` | — | Naturalizado se em `/tests` |

---

### (6) Nome só (sem diagnóstico/contexto clínico)

| Campo | Padrão | Exemplo | Norma | Ação |
|-------|--------|---------|------|------|
| **Regex** | Nome próprio SEM contexto clínico | `"João da Silva"` (isolado) | LGPD Art. 4º (proporcionalidade) | ✅ OK — sem contexto sensível |
| **Tipo** | Nome em lista de contato | `const team = ["João da Silva", "Maria Santos"];` | — | Não é PII de paciente |
| **Contexto** | Comentário / exemplo genérico | `// ex: Silva, J. da` | — | Documentação é OK |

**Nota:** Se o nome vier com diagnóstico/email/CPF, sobe para 🔴 CRÍTICO.

---

## 📋 Mapeamento regulatório

### LGPD (Lei Geral de Proteção de Dados — Lei 13.709/2018)

| Artigo | Princípio | Aplicação na skill | Achado tipo |
|--------|-----------|-------------------|-------------|
| **Art. 5º** | Finalidade | Dados processados só para motivo explícito | Credenciais hardcoded (sem justificativa) |
| **Art. 9º** | Dado sensível | Dado de saúde requer consentimento explícito + TCLE | CPF/email/laudo real de paciente |
| **Art. 14** | Consentimento | Sem consentimento explícito = ilegal | Laudo sem assinatura / contexto clínico |
| **Art. 32** | Segurança | Medidas técnicas para proteger dados | Credenciais em código / URL hardcoded |

**Conclusão:** Qualquer achado 🔴 ou 🟡 toca pelo menos um artigo.

---

### CFM 2.454/2026 (Regulação de IA em medicina)

| Artigo | Princípio | Aplicação na skill | Achado tipo |
|--------|-----------|-------------------|-------------|
| **Art. 2º** | Responsabilidade médica | Médico é responsável por decisão com IA | Laudo gerado sem assinatura |
| **Art. 3º** | Rastreabilidade | Sistema deve permitir auditar quem fez o quê | Credencial anônima / log sem PII médica |
| **Art. 4º** | Consentimento informado | Paciente consente uso de IA no tratamento | Laudo real sem TCLE documentado |
| **Art. 5º** | Transparência | Avisar paciente que IA está envolvida | Sistema automático sem disclosure |

**Conclusão:** Qualquer laudo em repo exige validação de responsabilidade médica + documentação.

---

## 🎯 Checklist de ação

### Ao encontrar 🔴 CRÍTICO

- [ ] Verificar se é dado real ou fictício (contexto de teste)
- [ ] Se real: mover para .env, AWS Secrets, ou remover do repo
- [ ] Se fictício: labeling claro ("TEST", "MOCK", "FICTIONAL")
- [ ] Para laudos: documentar assinatura médica + data + consentimento
- [ ] Rodar skill de novo para confirmar remoção

### Ao encontrar 🟡 AVISO

- [ ] Documentar por que está ali (comentário de justificativa)
- [ ] Se URL/credencial: priorizar movimento para .env antes de próximo merge
- [ ] Se em .env commitado: mover para .env.local + .gitignore
- [ ] Rever com gestor de segurança antes de produção

### Para 🟢 OK

- [ ] Nada a fazer — skill confirmou que está seguro

---

## 📞 Suporte

**Dúvida sobre um achado?**
- Conversa com o revisor + responsável de segurança do projeto
- Documentar decisão no commit/PR para rastreabilidade

**Falso positivo?**
- Abrir issue com amostra (sem expor valores reais)
- Sugerir novo padrão ou exceção para a skill

---

**Versão:** 1.1.0  
**Última atualização:** 2026-07-02  
**Fonte:** LGPD (Lei 13.709/2018), CFM 2.454/2026, Lei 12.842/2013 (sigilo médico), Lei 12.965/2014 (Marco Civil)
