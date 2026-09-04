# lgpd-saude-guard — Skill #5 do Pipeline Clube da IA

**Portão de segurança e conformidade regulatória para projetos de saúde digital.**

Detecta violações de **LGPD** (Lei Geral de Proteção de Dados) e **CFM 2.454/2026** (regulação de IA em medicina) em repositórios, mapeando dados sensíveis, credenciais e laudos clínicos.

---

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- Claude Desktop (Chat + Claude Code + Cowork)

### Passos

1. **Copie a pasta `lgpd-saude-guard/`** para um local seguro (ex.: `~/claude-skills/`)

   ```bash
   cp -r lgpd-saude-guard ~/claude-skills/
   ```

2. **Empacote como `.skill`** usando `package_skill.py` (ou ferramenta equivalente)

   ```bash
   cd ~/claude-skills/lgpd-saude-guard
   python3 package_skill.py .
   ```

   Isso gera `lgpd-saude-guard.skill`.

3. **Instale no Claude Desktop**

   - Abra Claude Desktop
   - Vá para **Customize → Skills**
   - Clique **"+ Add Skill"** (ou upload)
   - Selecione `lgpd-saude-guard.skill`
   - Confirme e reinicie

4. **Confirme a instalação**

   No Chat ou Claude Code, você verá `/lgpd-saude-guard` disponível.

---

## 🚀 Uso

### No Claude Code

Quando estiver dentro de um projeto (ex.: Agenda da Clínica), rode:

```
/lgpd-saude-guard ./src
```

Ou simplesmente:

```
/lgpd-saude-guard
```

(Vai default para `.` — pasta atual)

### Saída esperada

**Na tela (inline):**
```
lgpd-saude-guard — Auditoria LGPD/CFM 2.454
───────────────────────────────────────────
📁 Pasta: ./src
🔍 Arquivos escaneados: 47
⏱️  Achados: 5

ACHADOS:
───────────────────────────────────────────
🔴 CRÍTICO (2):
  • src/models/patient.js:12 — CPF ou CNPJ real
  • src/reports/laudo.js:45 — Laudo clínico com identificação

🟡 AVISO (3):
  • src/config.js:8 — URL de servidor de produção
  • src/db/connection.js:3 — Credencial de banco/API
  • .github/workflows/deploy.yml:21 — Credencial de banco/API

🟢 OK: 42 achados (naturalizado)

RECOMENDAÇÕES:
───────────────────────────────────────────
1. Mover para .env ou AWS Secrets Manager; usar .gitignore
2. Usar variável de ambiente (process.env.API_URL)
3. Validar assinatura médica + consentimento; usar fictício se teste

📄 Relatório completo: _lgpd-security-audit.md
```

**Arquivo gerado:**
- `_lgpd-security-audit.md` — Relatório detalhado com mapeamento LGPD/CFM

---

## 🎯 Workflow esperado

```
quality-validator (revisão de código)
    ↓ [tudo OK?]
lgpd-saude-guard (auditoria LGPD/CFM) ← VOCÊ ESTÁ AQUI
    ↓ [resolver achados críticos?]
commit-github (versionamento)
    ↓
[Deploy/Merge]
```

### Checklist antes de commit

- [ ] Rodou `lgpd-saude-guard`
- [ ] Todos os 🔴 CRÍTICO foram resolvidos
- [ ] 🟡 AVISO foram documentados/mitigados
- [ ] Relatório `_lgpd-security-audit.md` revisto
- [ ] Pronto para `commit-github`

---

## 📋 Padrões detectados

Veja **lgpd-saude-guard-reference.md** para lista completa:

### 🔴 CRÍTICO (Bloqueia revisão)
- **CPF / CNPJ real** → LGPD Art. 9º (dado sensível)
- **Laudo clínico com identificação** → LGPD Art. 9º + CFM 2.454 (responsabilidade médica)

### 🟡 AVISO (Documenta, não bloqueia)
- **Credencial de banco/API em código** → LGPD Art. 32 (segurança)
- **URL de produção hardcoded** → LGPD Art. 32 + CFM Art. 5º (auditabilidade)

### 🟢 OK (Passa)
- **Dado fictício/teste** → Naturalizado
- **Nome sem contexto clínico** → Sem sensibilidade

---

## 🔧 Customização

### Adicionar novo padrão

Edite `detector.js` na seção `PATTERNS`:

```javascript
const PATTERNS = {
  CRÍTICO: [
    {
      id: 'seu-id-novo',
      name: 'Descrição',
      regex: /seu-regex/gi,
      norma: 'LGPD Art. X ou CFM Art. Y',
      recomendacao: 'O que fazer',
      severidade: 'crítico',
    },
  ],
};
```

### Excluir uma pasta de scan

Edite `IGNORE_PATHS`:

```javascript
const IGNORE_PATHS = [
  'node_modules',
  'minha-pasta-segura', // Novo
];
```

---

## 🐛 Troubleshooting

**"Comando não encontrado: `/lgpd-saude-guard`"**
- Confirme que a skill foi instalada (Customize → Skills)
- Reinicie o Claude Desktop
- Tente em um chat novo

**"Arquivo não encontrado"**
- Certifique-se de que a pasta existe: `ls -la ./src`
- Use caminho relativo: `/lgpd-saude-guard ./src` ou `/lgpd-saude-guard ../`

**"Muitos avisos"**
- Isso é esperado — quer dizer que há dados sensíveis
- Revisor filtra o que importa
- Use o relatório `.md` para documentação

**"Falso positivo"**
- Abra issue com amostra (sem expor valores reais)
- Sugerir novo padrão para a skill

---

## 📞 Suporte

- **Dúvida?** Fale com o responsável de segurança do projeto
- **Bug?** Reportar no repositório com amostra (anonymizado)
- **Sugestão?** Contribuir via GitHub (PR)

---

## 📚 Referências

- **LGPD:** Lei 13.709/2018 — Lei Geral de Proteção de Dados
- **CFM 2.454/2026:** Regulação de IA em medicina (Conselho Federal de Medicina)
- **Lei 12.842/2013:** Sigilo médico
- **Lei 12.965/2014:** Marco Civil da Internet
- **Portaria SCTIE/MS nº 41/2025:** Protocolo SUS

---

**Versão:** 1.0.0  
**Skill #5 do Pipeline Clube da IA**  
**Endolife Health-Tech × Inova UNIMES**
