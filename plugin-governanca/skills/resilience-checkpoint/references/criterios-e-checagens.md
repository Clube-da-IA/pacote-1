# Critérios e Checagens (Blocos 1 e 2) — resilience-checkpoint

**Clube da IA · Endolife Health-Tech × Inova UNIMES**

Catálogo das checagens de resiliência. Bloco 1 é universal (qualquer stack); Bloco 2 é a camada de saúde. O Bloco 3 (trilha por stack) fica em `trilhas-de-stack.md`.

> Mesmo padrão dos irmãos do pipeline: **o que falharia no desastre → sinal que confirma → comando/ação pra você fazer**. A skill **nunca roda o comando** — ela aponta e te entrega.

**Base regulatória (o "porquê"):**
- **LGPD Art. 46** — o controlador deve adotar medidas de segurança que protejam os dados de *situações acidentais* (perda, destruição). Ou seja: não ter backup de dado de paciente é, por si só, uma fragilidade de segurança pela lei.
- **LGPD Art. 16** — término do tratamento e eliminação dos dados; conversa direto com o prazo de retenção.
- **Guarda do prontuário** — obrigação médico-legal com **baseline de referência de 20 anos**. A skill usa isso como referência, **não** crava número no veredito (ver Regra de ouro na SKILL.md).

---

## Bloco 1 — Backup + Recuperação (universal)

### 1.1 — Existe backup dos dados reais?
- **O que falha no desastre:** sem backup, qualquer perda (falha de disco, exclusão errada, incidente) é definitiva.
- **Sinal que confirma:** SPEC/README/infra não mencionam backup; nenhum job, cron, snapshot ou serviço de backup configurado; banco sem backup automático ligado.
- **Ação pra você:** confirmar no painel/console da stack se o backup está de fato ligado (o Bloco 3 dá o caminho por stack).
- **Peso:** se **há dado real em produção** e não há backup → 🔴. Dev local / dado fictício → 🟠.

### 1.2 — É automático e com frequência declarada?
- **O que falha:** backup manual que depende de alguém lembrar acaba não acontecendo; e sem frequência definida você não sabe quanto perderia.
- **Sinal que confirma:** backup só manual, ou frequência não declarada no SPEC §5.
- **Ação:** declarar a frequência e, de preferência, automatizar (o backup nativo da stack).

### 1.3 — O backup vive FORA do ponto de falha da produção?
- **O que é:** *ponto de falha* = o lugar que, se cair, derruba tudo junto. Backup guardado **no mesmo servidor/projeto/região** da produção cai junto no desastre — não é rede de segurança, é ilusão.
- **O que falha:** região/conta fora do ar → produção **e** backup somem ao mesmo tempo.
- **Sinal que confirma:** backup no mesmo projeto/região; cópia única, sem réplica em outro destino.
- **Ação:** manter ao menos uma cópia em **outra região/conta/destino**.
- **Peso:** dado real em produção com backup no mesmo ponto de falha → 🔴 (é o caso clássico de "tinha backup" que não salva).

### 1.4 — O backup está cifrado (em repouso)?
- **O que falha:** o backup carrega o banco inteiro (CPF, laudo). Um backup em claro que vaza é um prontuário vazado.
- **Sinal que confirma:** dump/export sem cifragem; bucket de backup sem criptografia; cópia em disco/pen-drive sem proteção.
- **Ação:** cifrar em repouso (a maioria das nuvens faz por padrão — confirmar); nunca guardar dump em claro.
- **Norma:** LGPD Art. 46. (Ver categorias 🔴/🟠 na referência compartilhada `lgpd-saude-guard.md`.)

### 1.5 — Existe `RESTORE.md` com substância?
- **O que é:** o *runbook de restauração* — o passo a passo de como trazer o backup de volta, escrito **antes** do desastre, pra ninguém improvisar sob pressão.
- **O que falha:** tem backup mas ninguém sabe restaurar; a pessoa que sabia saiu; sob estresse, erros.
- **Sinal que confirma:** não há `RESTORE.md` (procurar também `RECOVERY.md`, `docs/restore*`); ou existe mas é vazio/genérico.
- **Substância mínima** (o que o `RESTORE.md` precisa ter): **onde o backup vive**, **passo a passo** do restore, **quem aciona**, **estimativa de RTO**, e (recomendado) **data do último drill**.
- **Ação:** a skill **oferece gerar** o `RESTORE.md` (esqueleto abaixo) e commitar com seu ok.
- **Peso:** ausência → 🟠 (não reprova, mas cega o time).

### 1.6 — RPO e RTO estão declarados?
- **O que é:** *RPO* = quanto de dado você aceita perder (janela desde o último backup); *RTO* = em quanto tempo precisa voltar ao ar. São a **meta** contra a qual se mede o plano.
- **O que falha:** sem RPO/RTO, não dá pra dizer se o backup diário (perda de até 24h) é aceitável ou um problema — vira opinião.
- **Sinal que confirma:** SPEC §5 sem RPO/RTO.
- **Ação:** declarar RPO e RTO no SPEC. **Nunca invente** os números — se ausentes, marque pendência.
- **Peso:** ausência → 🟠 (+ pendência explícita).

### 1.7 — O restore já foi testado? *(recomendação, não bloqueia)*
- **O que é:** *drill de restore* = ensaio de restauração num ambiente de teste, pra provar que o backup realmente volta.
- **Por que importa:** "backup que você nunca restaurou é esperança, não plano." Backup corrompido só aparece na hora do desastre.
- **Sinal que confirma:** nenhum registro de drill (data, resultado) no `RESTORE.md` ou na doc.
- **Ação:** rodar um drill num ambiente isolado e **registrar a data**. A skill entrega o comando de restore por stack (Bloco 3).
- **Peso:** **recomendação** — a barra do clube é pragmática (backup + `RESTORE.md` já aprova). A ausência de drill **entra como recomendação no relatório**, não derruba o veredito.

---

## Bloco 2 — Retenção médico-legal + LGPD (camada de saúde)

O que separa esta skill de um checador de backup genérico: num sistema de paciente, **o backup tem cara dupla**.

- **É o ativo que você não pode perder** → tudo do Bloco 1.
- **É um passivo de dado sensível** → o backup é o banco inteiro numa cópia; ele mesmo precisa de cifragem, acesso restrito e um prazo de guarda coerente com a lei.

### 2.1 — A retenção está declarada no SPEC, com base legal?
- **O que é:** *retenção* = por quanto tempo o dado (e seus backups) é guardado antes do descarte.
- **A tensão:** a LGPD (Art. 16) pede **não guardar além do necessário**, mas a guarda do prontuário é uma **obrigação legal** que pode exigir guardar por muito tempo. Retenção **curta demais** = você perde registro que a lei exige; **longa demais sem descarte** = passivo de dado.
- **Sinal que confirma:** SPEC §5 não declara prazo de retenção; ou declara sem citar a base legal.
- **Ação:** declarar a retenção no SPEC **com a base legal citada**.
- **Regra da skill (importante):** a skill carrega **20 anos como baseline de referência** do prontuário, mas **não crava esse número no veredito**. Se o SPEC não declara → **⚠️ revisão humana**. Se declara um prazo **abaixo** do mínimo citado → **⚠️ revisão humana** (não reprova sozinha, não inventa número). Quem decide o prazo é o responsável clínico/jurídico.

### 2.2 — A eliminação/descarte seguro está documentada?
- **O que é:** o "outro lado" da retenção — como o dado é **destruído com segurança** no fim da vida útil (inclui o direito ao esquecimento).
- **Sinal que confirma:** não há política de descarte; backups antigos acumulam sem prazo; "direito ao esquecimento" no checklist LGPD sem procedimento.
- **Ação:** documentar como e quando o dado (e os backups) são eliminados com segurança.
- **Referência:** § "Fluxo de Dados Clínicos" da `lgpd-saude-guard.md` termina em *"Fim de vida útil → Destruição segura"* — é exatamente isto.

### 2.3 — O backup é tratado como dado sensível?
- **O que falha:** o time protege o banco de produção mas esquece que o **backup** é a mesma coisa numa cópia — e às vezes menos protegida.
- **Sinal que confirma:** backup sem cifragem (ver 1.4); acesso ao backup não restrito; local do backup não documentado.
- **Ação:** cifrar, restringir acesso e **documentar o local** do backup no README (o **local**, nunca o valor/credencial — regra do clube).

---

## A regra do veredito (detalhe)

O eixo é **recuperabilidade**: *"você consegue trazer o dado real de volta depois de um desastre?"*.

| Situação | Veredito |
|----------|----------|
| Dado real em produção **sem** backup recuperável | 🔴 REPROVADO |
| Backup existe mas **no mesmo ponto de falha** da produção | 🔴 REPROVADO |
| Uma classe de dado real (ex.: arquivos de exame) **sem** backup, mesmo com o banco protegido | 🔴 REPROVADO |
| Backup ok, mas falta `RESTORE.md` / RPO / RTO / cifragem documentada | 🟠 RESSALVAS |
| Retenção não declarada ou abaixo do mínimo citado | ⚠️ revisão humana (fica dentro do 🟠) |
| Projeto **dev local / sem dado real** com lacunas de backup | 🟠 RESSALVAS (nada real a perder ainda — resolver antes do go-live) |
| Backup fora do ponto de falha + `RESTORE.md` com substância + cifrado + local documentado | 🟢 APROVADO |
| Drill de restore não registrado | não muda o veredito — entra como **recomendação** |

**Princípio:** basta **uma** classe de dado real de produção sem recuperação pra reprovar — como basta uma tabela de paciente exposta pra reprovar no `security-review`. A cópia que cai junto com a produção **não conta** como backup.

---

## O esqueleto recuperável (o que a skill grava com seu ok)

Quando falta, a skill **oferece** commitar via GitHub MCP — **só o esqueleto, nunca os dados**:

**1. `RESTORE.md`** (runbook), com este esqueleto:
```markdown
# RESTORE — [projeto]
> Como trazer o sistema de volta depois de um desastre.

## Onde o backup vive
- Banco: [apontar o local — ex.: backups automáticos do <serviço>, região X]
- Arquivos: [apontar o local]
- (só o LOCAL, nunca a credencial/valor)

## Passo a passo do restore
1.
2.

## Quem aciona
- Responsável: [nome/papel] · Contato: [canal]

## Metas
- RPO (quanto se aceita perder):
- RTO (em quanto tempo voltar):

## Último drill de restore
- Data: [—] · Resultado: [—]
```

**2. `config-template.env`** — só os **nomes** das variáveis, para reconstruir a config depois:
```
# Preencha os valores no ambiente seguro. NUNCA commite valores reais.
DATABASE_URL=
BLOB_STORE_TOKEN=
# ...os nomes que o projeto usa
```

**3. Schema + migrations** — se ainda não versionados, apontar pra versioná-los (ex.: as migrations do Prisma; o SQL do schema). É o que reconstrói a **estrutura** do banco.

> O **dump real dos dados** (com CPF/laudo) **nunca** entra nesse commit. Ele vai pra um destino seguro fora do git — a skill entrega o comando pra **você** rodar (Bloco 3).

---

## Nota de fronteira

Esta referência cuida de **backup, recuperação e retenção**. Ela **não** refaz:
- qualidade de código / domínio clínico → `quality-validator`;
- consentimento/finalidade/privacidade → `lgpd-saude-guard`;
- ataque/vulnerabilidade → `security-review` (roda antes);
- logs/monitoramento → `observability-setup` (roda depois);
- o que **conta como dado sensível** → vem da referência compartilhada `lgpd-saude-guard.md`.

---

**Versão:** 1.0 · **Base:** LGPD Art. 16 e 46 + guarda de prontuário (baseline 20 anos, não cravado) + boas práticas de backup/restore. Novas checagens conforme os projetos do clube pedirem.
