# Clube da IA — Pipeline de Governança (plugin)

**Endolife Health-Tech × Inova UNIMES** · versão do plugin **1.3.0**

Um pacote que instala, de uma vez, as **9 skills** do pipeline de governança de projetos de
saúde digital do clube. **Esta versão é para uso pessoal** — o seu Claude Desktop, a sua conta.
O objetivo agora é **validar o pacote na prática** (vibe coding no um projeto piloto, via Cowork)
antes de escrever o manual de instalação para os 10 membros.

> **Termo rápido.** *Skill* = folha de instruções reutilizável. *Plugin* = embalagem que junta
> várias skills num pacote só. *Marketplace* = a "vitrine" (um repositório GitHub) de onde o
> Desktop instala o plugin.

---

## Princípio inegociável — decisão compreensível

Onde o pipeline pede que **o humano decida** (todo veredito de portão, todo ⚠️ revisão humana,
todo "posso gravar o esqueleto?"), a informação sobre o risco tem de chegar **compreensível** —
cada termo técnico traduzido no próprio ponto da decisão e a **consequência concreta** dita em
linguagem de consultório, não de servidor. O público é o médico, não o programador. Se o humano
não entende o risco, o portão não cumpriu sua função — e isso vale **acima da concisão**. É a
regra nº 0, transversal às 9 skills: nenhuma decisão do dono do projeto deve ser tomada no escuro.

---

## O pipeline (ordem de uso)

| # | Skill | Momento | Onde roda |
|---|-------|---------|-----------|
| 1 | `spec-builder` | ideação — produz o SPEC | Chat |
| 2 | `governanca-projeto` | kickoff — adota o SPEC e monta o repo | Claude Code |
| 3 | `commit-github` | durante o build — versiona no GitHub | Cowork/Chat |
| 4 | `quality-validator` | portão — revisão de código/arquitetura/clínico | Claude Code |
| 5 | `lgpd-saude-guard` | portão — LGPD + CFM 2.454 | Claude Code |
| 6 | `security-review` | portão — ataque à arquitetura + IA (OWASP) | Claude Code |
| 7 | `resilience-checkpoint` | portão — backup + recuperação | Claude Code |
| 8 | `observability-setup` | portão pós-deploy — logs + trilha de auditoria | Claude Code |
| 9 | `hangar-sync` | fecha o ciclo — cataloga a "nave" no HANGAR | Cowork |

A referência transversal **`lgpd-saude-guard.md`** viaja *dentro* de cada skill-portão (cópia
verbatim em `references/`). Nesta versão **todas as cópias estão na v1.1** (hash único). O
arquivo-fonte dos padrões de detecção (`lgpd-saude-guard/lgpd-saude-guard-reference.md`) foi
reconciliado para a mesma geração **v1.1.0**.

---

## Estrutura do pacote

```
clube-ia-governanca/               ← isto vira a RAIZ do repositório GitHub
├── .claude-plugin/
│   ├── plugin.json        ← manifesto (só metadados)
│   └── marketplace.json   ← vitrine (self-reference "./")
├── skills/                ← as 9 skills, cada uma com seu SKILL.md
│   ├── spec-builder/  ...  ├── observability-setup/  └── hangar-sync/
├── CHANGELOG.md
└── README.md
```

> Regra do formato: **só os manifestos ficam em `.claude-plugin/`.** As `skills/` ficam na raiz.
> É o erro nº 1 de quem monta plugin — aqui já está certo. As pastas `evals/` das skills ficaram
> **fora** do pacote (convenção do clube).

> **Sem `.mcp.json` nesta versão.** Como o GitHub já está conectado na sua conta, o plugin não
> precisa trazer o próprio servidor — as skills usam a conexão que você já tem. O conector volta
> (documentado abaixo) quando o pacote for para os membros.

---

## Regra de ouro: **um canal só** (senão o plugin duplica)

O Desktop identifica o plugin por **marketplace + nome**. Instalar o *mesmo* plugin por **dois
caminhos diferentes** cria **duas entradas** em Configurações, as 9 skills passam a existir em
dobro, e **não dá para saber qual versão rodou**. Foi exatamente o que aconteceu entre julho e
agosto de 2026:

| Canal | Como entrou | Versão que ficou parada |
|---|---|---|
| marketplace `clube-da-ia-governancia` | repositório GitHub | 1.1.0 (03/07) |
| marketplace `My Uploads` | upload manual do pacote | 1.2.0 (23/07) |

Como a 1.2.0 foi empacotada **sem passar pelo GitHub**, o repositório nunca a recebeu — e a
pasta-fonte local, que espelha o GitHub, também não. Resultado: três versões diferentes vivas ao
mesmo tempo, e o risco de reempacotar por cima e **regredir** as skills.

**A regra, daqui pra frente:** o **repositório GitHub é o único canal**. Toda mudança entra por
commit, e a instalação sai sempre do marketplace do repo. Nada de upload manual em paralelo.

---

## Como instalar (seu Desktop, uma vez)

O fluxo pessoal do Desktop instala plugin **a partir de um repositório GitHub** — não há upload
de pasta/ZIP no fluxo pessoal. Então o caminho é: subir esta pasta para um repo → conectar o repo
→ instalar.

**1. Publicar num repo (pode ser privado).** Suba o **conteúdo desta pasta para a raiz** de
`Clube-da-IA/pacote-1` (a raiz do repo deve conter `.claude-plugin/`, `skills/`,
`README.md`). O campo `repository` do `plugin.json` já está preenchido com essa URL.

**2. Garantir o app do GitHub no repo.** Para o Desktop sincronizar, o **Claude GitHub App**
precisa estar instalado nesse repositório (repo privado é suportado com `source` de caminho
relativo, que é o caso — `"./"`).

**3. Adicionar o marketplace.** No Desktop: **Customize → aba Plugins → seção *Personal
plugins* → botão "+" → "Add marketplace" → "Add from a repository"** e apontar para o repo.

**4. Instalar o plugin.** Ainda em Plugins, na aba de descoberta, instalar **`clube-ia-governanca`**
(escopo de usuário). Ele traz as 9 skills.

**5. Evitar duplicata (importante).** Duas fontes de duplicata, e as duas precisam ser fechadas:
- as 9 skills **avulsas** (fora do plugin), se ainda estiverem ativas em **Configurações → Skills**;
- **qualquer segunda entrada do próprio plugin** vinda de outro marketplace (ver *Regra de ouro*).
Deixe ativa **uma** origem só.

**6. Recarregar e testar.** Recarregar os plugins (ou reabrir o Desktop) e rodar o pipeline no
**Cowork** sobre o projeto **um app de dados clínicos**.

> A UI do Desktop muda com frequência — os rótulos acima batem com a documentação atual, mas
> confirme na hora se algum nome estiver diferente.

---

## Quando for distribuir para os membros (depois)

Aí sim vale reintroduzir o **conector GitHub embutido**, para o membro que não tem GitHub
conectado. Adicionar na raiz do plugin um `.mcp.json` (o token vem de variável de ambiente —
o valor **nunca** entra no arquivo nem no repo):

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "GITHUB_PERSONAL_ACCESS_TOKEN", "ghcr.io/github/github-mcp-server"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}" }
    }
  }
}
```

Cada membro ainda precisa de **Docker rodando + o próprio token** — o plugin não carrega
credencial de ninguém (confirme o bloco contra o servidor GitHub MCP que já funciona). Distribuição
para o clube inteiro (Team/Enterprise) também pode usar *Organization settings → Plugins*, com
sync de repositório ou upload de ZIP no fluxo administrativo.

> **Antes de distribuir:** o guardrail do `hangar-sync` fixa hoje um **caminho absoluto desta
> máquina** (`/Users/<seu-usuario>/...`) para achar o `dados-hangar.json`. Funciona no uso
> pessoal; para os 10 membros, generalizar — manter a regra ("nunca dentro da pasta do projeto;
> na dúvida, pare e pergunte") sem fixar o caminho de um usuário.

---

## Estado nesta versão (honesto)

- **9/9 skills** empacotadas. Referência compartilhada alinhada em **v1.1** (5 cópias, hash único);
  arquivo-fonte reconciliado para **v1.1.0**.
- **Princípio 0 "decisão compreensível"** aplicado às 9 skills (v1.1.0): o risco chega ao humano
  traduzido no ponto da decisão, com a consequência concreta.
- **Os 3 testes manuais de navegador** (v1.2.0) como checagem formal: **Bloco 0** no
  `security-review` (chave vazando no bundle, autenticação que sobrevive à limpeza do site, rate
  limit no login) e **Bloco 5** no `observability-setup`, que confirma no pós-deploy que os três
  foram rodados **no ar** e registrados.
- **Trilha C — frontend estático sem backend** (v1.3.0) no `resilience-checkpoint`: para SPA que
  não guarda nada, o risco muda de lugar — o que se perde é o **acervo**, e a pergunta que importa
  é **para onde vão os arquivos que o app entrega** (C4) e o backup pessoal que os copia sem
  ninguém ver (C5).
- **Deriva entre fonte, repo e pacote fechada** (v1.3.0): as 9 skills, as `references/` e o
  histórico de releases foram reconciliados a partir da cópia mais nova de cada um. Detalhe no
  `CHANGELOG.md`.
- **Pendências herdadas do RASTREADOR — não bloqueiam o teste, mas valem fechar antes do manual dos
  membros:** teste ao vivo de `spec-builder` e da Porta B de `governanca-projeto`. (Os portões
  `security-review`, `resilience-checkpoint` e `observability-setup` já foram testados ponta a
  ponta contra o um app de dados clínicos.)

---

## Versionar daqui pra frente

Ao mudar algo: suba o número em `plugin.json` **e** em `marketplace.json` (iguais) e registre no
`CHANGELOG.md`. `fix` → patch, `feat` → minor, quebra → major. Reinstalar puxa a versão nova
(o sistema de plugins ainda não tem atualização automática).

**E commite sempre no GitHub** — é o canal único (ver *Regra de ouro*). Pacote empacotado fora do
repo vira uma versão órfã que ninguém consegue reconciliar depois.
