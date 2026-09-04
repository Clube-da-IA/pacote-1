# LGPD & Saúde — Guarda-Chuva de Referência

**Clube da IA · Endolife Health-Tech × Inova UNIMES**

> Documento de referência compartilhado. Consultado por: `quality-validator`, `security-review`, `resilience-checkpoint`, `observability-setup`.
> Não é uma skill, é um arquivo. Cada skill o lê conforme necessário.

---

## 🔐 Categorias de Dados (por risco)

### 🔴 **CRÍTICO — Nunca em plaintext**
- CPF, RG, CNH (identificadores)
- Prontuário médico completo
- Diagnósticos
- Medicações ativas
- Histórico de cirurgias
- Dados genéticos
- Biometria (fotos, impressão digital)

**Regra:** Criptografar em repouso + SSL/TLS em trânsito + acesso por role-based

### 🟠 **ALTO — Sem exposição pública**
- Email (pode ser PII)
- Telefone (pode ser PII)
- Endereço completo
- Data de nascimento
- Dados de consentimento (quanto consentiu, pra quê)

**Regra:** Não expor em logs públicos, APIs, ou histórico de erro

### 🟡 **MÉDIO — Cuidado com agregação**
- Idade (sem DOB)
- Sexo/gênero
- Região geográfica (sem endereço)
- Tipo de procedimento (sem prontuário)

**Regra:** Anonimizado por padrão em testes/dev

---

## 📋 Checklist LGPD (Lei 14.724/2022 + ESHRE)

- [ ] Titular do dado **consentiu explicitamente** (por escrito)?
- [ ] Finalidade está **documentada** (pra quê o dado é usado)?
- [ ] Dado é **minimizado** (só o necessário)?
- [ ] Armazenamento está **criptografado** (em repouso)?
- [ ] Trânsito está **seguro** (SSL/TLS)?
- [ ] Acesso tem **rastreabilidade** (quem tocou, quando)?
- [ ] Existe **plano de retenção** (quanto tempo guarda)?
- [ ] Há **direito ao esquecimento** documentado (como deleta)?
- [ ] **Terceiros** (APIs, cloud) têm contrato de processamento?
- [ ] Existe **Responsável Técnico** nomeado (quem responde)?

---

## ⚠️ Bandeiras Vermelhas (achados críticos em quality-validator)

`quality-validator` deve pausar e marcar como **CRÍTICO** se encontrar:

- ❌ Senha/chave/token em código
- ❌ URL de BD sem criptografia
- ❌ Dados de paciente real em teste/dev
- ❌ Arquivo `.env` commitado
- ❌ CPF/Email em plaintext
- ❌ Histórico clínico acessível sem autenticação
- ❌ Log público com PII
- ❌ Dependência desconhecida (pacote-fantasma)

**Ação automática:** Marcar como bloqueador LGPD

---

## 🏥 Regulamentos Específicos da Saúde

### CFM Resolution 2.454/2026 (IA em Medicina)
- ✅ IA pode **auxiliar** decisão clínica
- ❌ IA **nunca** substitui médico
- ✅ Médico responsável aprova saída clínica
- ❌ Sem autonomia em diagnóstico/conduta

### ESHRE 2022 (Endometriose)
- Sempre citar quando usar critério de estágio
- Explicar diferença: estadiamento ≠ prognóstico
- Avisar: "Classificação clínica, não define gravidade de sintomas"

### Lei 14.324/2022 (Endometriose no Brasil)
- Direito a diagnóstico precoce
- Acesso a tratamento pelo SUS
- Informação sobre direitos reprodutivos

---

## 🔄 Fluxo de Dados Clínicos (Padrão Endolife)

```
Paciente
   ↓
[Coleta — consentimento escrito]
   ↓
Servidor Local (criptografado)
   ↓
[Processamento — MD responsável valida]
   ↓
Anonimizado (se saindo da clínica)
   ↓
[Terceiros — contrato de processamento]
   ↓
Fim de vida útil → Destruição segura
```

**Princípio:** Local-first, MD-gated, auditable

---

## 🛡️ Responsabilidades por Skill

| Skill | O que valida | Responsável por |
|-------|---|---|
| `quality-validator` | Bandeiras vermelhas óbvias | Encontrar código exposto |
| `lgpd-saude-guard` | Auditoria completa | Classificar risco, plano correção |
| `security-review` | Penetration logic | Falhas arquitetural |
| `resilience-checkpoint` | Backup + recuperação | Provar que o dado volta após desastre |
| `observability-setup` | Logs + auditoria | Não expor PII em monitoramento |

---

## 📞 Escalação

**Se `quality-validator` encontrar 🔴 CRÍTICO:**
1. Marca como bloqueador
2. Dispara `lgpd-saude-guard` automático
3. Sugere parar tudo e corrigir

**Se `lgpd-saude-guard` encontrar risco alto:**
1. Recomenda **pausa** antes de deploy
2. Sugere envolver legal/compliance (se produção)
3. Fornece plano de correção priorizado

---

## 📚 Referências (sempre citar)

- **LGPD (Lei 13.709/2018)** — Lei geral de proteção de dados
- **Lei 14.724/2022** — Endometriose no Brasil
- **CFM Resolution 2.454/2026** — IA em Medicina
- **ESHRE 2022** — European guidelines (referência internacional)
- **FEBRASGO** — Sociedade Brasileira (padrão local)

---

## 🔗 Como esta referência é usada

**Em quality-validator:**
```
"Se encontrou dados clínicos, consulte lgpd-saude-guard.md § Categorias de Dados"
```

**Em lgpd-saude-guard:**
```
"Use o checklist completo da seção LGPD Checklist"
```

**Em security-review:**
```
"Valide contra as Bandeiras Vermelhas"
```

---

**Versão:** 1.1  
**Data:** Jul 2026  
**Status:** Referência Live  
**Próxima revisão:** Set 2026 (conforme mudanças legais/ESHRE)
