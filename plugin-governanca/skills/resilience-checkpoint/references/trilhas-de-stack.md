# Trilhas por Stack (Bloco 3) — resilience-checkpoint

**Clube da IA · Endolife Health-Tech × Inova UNIMES**

O Bloco 3 aplica as checagens de **backup e recuperação específicas da stack** do projeto: como **confirmar que o backup existe** e **como restaurar**. A skill descobre a stack pelo `SPEC.md` §7 (Restrições técnicas → Stack) e roda a trilha certa. v1 cobre **GCP** e **Supabase + Vercel + Prisma** — as duas realidades mais comuns do ecossistema (GCP de um lado; Supabase/Vercel do outro).

> Mesmo padrão dos outros blocos: **o que falharia no desastre → sinal que confirma → comando/ação pra você fazer**. A skill entrega o comando; **quem roda é você**.
> Produto de nuvem muda rápido — sempre **confirme no painel/console atual**. A skill aponta o caminho, não decora o menu.

---

## Como escolher a trilha
1. Leia o SPEC §7 → Stack.
2. Bate com **GCP**? → roda a Trilha GCP.
3. Bate com **Supabase / Vercel / Prisma**? → roda a Trilha Supabase/Vercel/Prisma.
4. É um **frontend estático sem backend** (SPA/site no Vercel, Netlify, Pages — sem banco, sem storage, sem servidor)? → roda a **Trilha C**.
5. **Stack diferente ou não declarada?** → roda só o Bloco 1 (universal) e o Bloco 2, e **marca pendência**: *"stack X sem trilha específica no v1 — checagens universais aplicadas; backup/restore próprios da stack ficam como pendência."* **Nunca invente** o mecanismo de backup de uma stack que você não conhece.

---

## Trilha A — GCP *(Endolife hoje)*

No GCP, o dado costuma viver em **Cloud SQL** (banco) e **Cloud Storage / GCS** (arquivos: laudos, imagens de exame). A resiliência é confirmar backup dos dois e provar o restore.

### A1 — Cloud SQL: backup automático + PITR ligados?
- **O que checar:** o Cloud SQL tem **backups automáticos** habilitados e, idealmente, **PITR** (*point-in-time recovery* — recuperação a um instante exato, que reduz o RPO de "último backup" para "quase agora").
- **Sinal de risco:** instância com backups automáticos desligados; PITR off; retenção de backup curta demais pro RPO declarado.
- **Ação de confirmação:** no console do Cloud SQL, ver *Backups* (automáticos on, janela, retenção) e *Point-in-time recovery* (habilitado). Confirmar também a **retenção** contra o RPO/retenção do SPEC.
- **Como restaurar:** o Cloud SQL restaura de um backup ou de um instante (PITR) para uma **nova instância** — anote esse passo no `RESTORE.md`.

### A2 — Backup on-demand + export pra GCS antes de mudança grande
- **O que checar:** antes de migração de schema ou operação de risco, existe rotina de **backup sob demanda** e/ou **export do banco pra um bucket GCS**?
- **Sinal de risco:** nenhum export externo; só os backups automáticos "presos" na instância.
- **Ação:** manter export periódico pra GCS (dump que sai da instância) — é a cópia que sobrevive se a instância for perdida.

### A3 — GCS (arquivos/laudos): versioning + lifecycle + cópia fora da região
- **O que checar:** o bucket com laudos/imagens tem **object versioning** ligado (protege contra exclusão/sobrescrita) e **regras de lifecycle** (retenção/expiração coerentes)? Há cópia **fora da região** (dual/multi-region ou transfer)?
- **Sinal de risco:** bucket sem versioning (uma exclusão acidental é permanente); sem cópia fora da região.
- **Ação:** ligar versioning no bucket sensível; definir lifecycle alinhado à retenção; garantir redundância geográfica.

### A4 — Backup no mesmo projeto/região = mesmo ponto de falha
- **O que checar:** os backups vivem **só** no mesmo projeto/região da produção?
- **Sinal de risco:** projeto/região único, sem cópia externa → cai tudo junto.
- **Ação:** manter ao menos uma cópia (export/replicação) em **outra região ou conta**.
- **Peso:** com dado real, isto é o 🔴 clássico do "tinha backup mas não salvou".

> IAM: só quem precisa deve poder **ler ou apagar** backups. Uma conta com poder de sobra que apaga backup é um vetor de perda — mas a *fragilidade de permissão* em si é assunto do `security-review`; aqui o foco é a **recuperabilidade**.

---

## Trilha B — Supabase + Vercel + Prisma

Aqui mora a **lacuna nº1 de resiliência do vibe coding**: o banco costuma ter backup, mas os **arquivos no Vercel Blob não têm** — e ninguém percebe até perder. Preste atenção especial ao B3.

### B1 — Supabase: backup automático + PITR conforme o plano
- **O que checar:** o Supabase faz **backup diário automático** nos planos pagos (com janela de retenção), e oferece **PITR** como add-on (RPO fino). O **plano free normalmente não inclui backup automático** — confirme o plano do projeto.
- **Sinal de risco:** projeto em free tier sem nenhum backup; PITR off num sistema que precisa de RPO curto; retenção do backup abaixo do declarado.
- **Ação de confirmação:** no painel do Supabase → *Database → Backups* (ver backups diários e retenção) e *Point-in-Time Recovery*. Se o plano não cobre, planejar backup externo (B5).
- **Como restaurar:** o Supabase restaura de um backup diário ou de um instante (PITR) pelo painel — anote no `RESTORE.md`.

### B2 — Prisma: migrations versionadas = recuperação do schema
- **O que é:** as **migrations do Prisma** (pasta `prisma/migrations`) são a receita que reconstrói a **estrutura** do banco. Versionadas no git, elas são metade da recuperação (a estrutura); a outra metade é o backup dos **dados**.
- **Sinal de risco:** migrations não versionadas, ou schema alterado "na mão" fora das migrations (o restore não reproduz o estado real).
- **Ação:** manter `prisma/migrations` versionado e o schema como fonte da verdade. (Isto entra no **esqueleto recuperável** que a skill oferece commitar.)

### B3 — Vercel Blob SEM backup automático *(a lacuna que mais some — trate como prioridade)*
- **O que é:** o **Vercel Blob** guarda arquivos (aqui: laudos, imagens de exame). Ele **não faz backup automático nem versioning por padrão** — se um arquivo é apagado ou sobrescrito, **não há de onde restaurar**.
- **Por que é grave:** o time protege o banco (que tem backup) e esquece que os **arquivos de paciente** estão sem rede. Uma classe inteira de dado real fica irrecuperável.
- **Sinal que confirma:** arquivos de exame no Vercel Blob e **nenhuma rotina** no repo que espelhe o Blob pra outro destino.
- **Ação de confirmação:** procurar no repo um job/cron/rotina que copie o Blob pra fora. Se não achar → é o achado.
- **Correção:** implementar um **espelho** do Blob — rotina que copia os arquivos pra um bucket com versioning **noutra conta/região** (ex.: um GCS ou S3), com retenção alinhada à do prontuário.
- **Peso:** com dado real, arquivos no Blob sem backup → **🔴 REPROVADO** (perda permanente).

### B4 — Backup no mesmo projeto Supabase = mesmo ponto de falha
- **O que checar:** os backups do banco vivem **só** dentro do mesmo projeto Supabase?
- **Sinal de risco:** nenhuma cópia baixada pra fora do projeto → se o projeto for perdido/suspenso, backup vai junto.
- **Ação:** manter uma **cópia externa** periódica (ver B5), fora do projeto Supabase.

### B5 — `pg_dump` como rede de segurança externa + como restaurar
- **O que é:** um **dump** do Postgres (via `pg_dump`) é uma cópia completa que **sai** do Supabase e pode ser guardada, cifrada, em outro destino. É o backup "à prova de perda do projeto".
- **Ação de confirmação:** existe rotina de dump externo periódico? Onde o dump é guardado (cifrado, fora do projeto)?
- **Comando pra VOCÊ rodar** (a skill **não** executa — e o dump tem dado real, então **não vai pro git**, vai pro destino seguro):
  ```
  # backup (rode você, e guarde o arquivo cifrado FORA do git):
  pg_dump "$DATABASE_URL" -Fc -f backup_clinica_AAAA-MM-DD.dump

  # restore num banco de teste (drill) ou num novo banco:
  pg_restore -d "$DATABASE_URL_DESTINO" --clean --no-owner backup_clinica_AAAA-MM-DD.dump
  ```
  Use o restore acima num ambiente **isolado** pra fazer o **drill** (A1.7/B) e registrar a data no `RESTORE.md`.

### B6 — Preview/deploy da Vercel apontando pro banco de produção
- **O que checar:** um *preview deployment* usa o **mesmo banco de produção**? Isso mistura ambientes e pode causar alteração/perda de dado real por um teste.
- **Sinal de risco:** preview com a `DATABASE_URL` de produção.
- **Ação:** separar o banco de preview do de produção (também é higiene de segurança — cruza com o `security-review`).

---

## Trilha C — Frontend estático sem backend *(SPA que gera documento no navegador)*

Nasceu de um caso real: um app de **prévia de reembolso** é um SPA no Vercel que gera PDF no
navegador e **não guarda nada** — sem banco, sem storage de arquivos, sem servidor. Rodar aqui a
Trilha B produzia só "não se aplica".

**O que muda de perspectiva:** nesta stack **não há dado de paciente em repouso para perder**. A
arquitetura *já elimina* a classe de risco que normalmente reprova este portão — e isso merece ser
dito ao responsável, não passar batido. O que ainda pode ser perdido é **o acervo** (o código e,
sobretudo, os dados de referência curados: tabelas de honorários, textos de TCLE, kits de OPME) e a
**capacidade de reconstruir e republicar**.

> ⚠️ **Cuidado para não afrouxar demais.** "Sem backend" não é passe livre: quase sempre existe uma
> porta por onde dado sensível **sai** do app (download de arquivo, exportação, PDF). O ponto de
> guarda apenas se **mudou de lugar** — foi do servidor para a máquina de quem baixou. É lá que a
> checagem tem de olhar (C4 e C5).

### C1 — O acervo tem cópia fora da máquina de trabalho?
- **O que é o acervo:** o repositório — código **e** os dados de referência curados, que costumam
  ser o ativo mais caro do projeto (meses de curadoria clínica/jurídica).
- **O que falha no desastre:** o único lugar onde o trabalho existe é o notebook de quem programa.
  Disco falha, notebook é roubado, e o acervo vai junto.
- **Sinal que confirma:** `git log <remoto>/<branch>..HEAD` mostra commits não enviados; o último
  commit no remoto está semanas atrás; ou não existe remoto configurado.
- **Ação de confirmação:** conferir commits pendentes e a data do último push.
- **Peso:** trabalho não enviado → 🟠 (não é dado de paciente; é o acervo). **Sem remoto nenhum →
  também 🟠, mas trate como prioridade máxima da lista.**

### C2 — O "backup" é um `git push` manual — e isso é frágil por natureza
- **O que falha:** o backup que depende de alguém lembrar acaba não acontecendo. É o modo de falha
  mais comum e mais silencioso deste tipo de projeto.
- **Sinal que confirma:** ausência de CI; histórico com lacunas longas entre pushes.
- **Ação:** declarar o **RPO em dias de trabalho** ("faço push ao menos uma vez por dia em que
  mexer no projeto") — é o que torna a disciplina mensurável em vez de intenção.
- **Recomendação:** CI (ex.: GitHub Action com testes + build) a cada push, para que o deploy
  automático não publique código quebrado. Afeta o **RTO**, não o backup.

### C3 — O repositório é autossuficiente? *(o drill desta trilha)*
- **O que é:** um clone limpo, numa máquina sem nada instalado, precisa reconstruir o app inteiro.
- **O que falha:** fontes, logos, favicons ou assets que só existem na máquina de origem, ou
  arquivo de build gerado à mão e nunca versionado. Descobre-se no pior momento.
- **Drill (barato e conclusivo — rode de verdade):**
  ```
  git clone <repo> /tmp/drill && cd /tmp/drill
  npm ci && npm test && npm run build
  ```
  Depois **confira o conteúdo do diretório de build**: os binários (fontes, imagens de marca)
  precisam estar lá. Registre a data no `RESTORE.md`.
- **Peso:** clone que não builda → 🟠 e vira prioridade; clone que builda → 🟢 com data registrada.

### C4 — Onde vão parar os arquivos que o app gera? *(o achado que esta trilha existe para pegar)*
- **O que é:** app sem backend costuma **entregar** arquivos — PDF, exportação, relatório. Em saúde,
  esse arquivo é registro médico-legal e cai na obrigação de guarda do prontuário.
- **O que falha:** o app não retém cópia (ótimo para privacidade) e, a partir do download, **o
  portão não enxerga mais nada**. Se ninguém declarou onde esses arquivos são arquivados, a
  obrigação de guarda continua valendo e não há sistema responsável por ela.
- **Sinal que confirma:** SPEC §5 descreve bem o "não guardamos nada", mas **não diz onde o
  documento emitido é arquivado, por quem, nem por quanto tempo**.
- **Ação:** exigir a declaração no SPEC — **onde**, **quem responde** e **por quanto tempo**, com a
  base legal. Baseline de referência de prontuário: 20 anos (**não cravar** — Regra de ouro).
- **Peso:** ⚠️ revisão humana. Fecha quando o responsável declara; a conformidade do arquivo em si
  fica **fora** do escopo deste portão, e o relatório deve dizer isso com todas as letras.

### C5 — O backup pessoal das máquinas está copiando dado sensível sem ninguém perceber?
- **O que falha:** os arquivos baixados (PDF, exportação, rascunho) caem na pasta de Downloads. Se a
  máquina tem **Time Machine, iCloud, Google Drive ou OneDrive** ligados — o padrão —, cada arquivo
  vira uma cópia automática que ninguém planejou, fora da política de descarte.
- **A consequência concreta:** a pessoa apaga o arquivo como manda a regra, mas o backup guardou uma
  cópia; meses depois o dado da paciente continua lá.
- **Sinal que confirma:** existe fluxo de exportação/download de arquivo com dado pessoal e nenhuma
  orientação sobre backup das máquinas.
- **Ação:** decidir conscientemente — excluir a pasta do backup, usar pasta dedicada fora dele, ou
  aceitar e documentar. **Decisão do responsável**, mas tomada de olhos abertos.
- **Peso:** ⚠️ revisão humana.

### C6 — A publicação é reconstruível a partir do repositório?
- **O que checar:** a configuração de build (`vercel.json`/`netlify.toml`) está versionada? Quantas
  variáveis de ambiente existem e onde estão guardadas? O deploy sai do git?
- **Sinal de risco:** configuração só no painel do provedor; variáveis de ambiente sem
  `config-template` (só os nomes) e sem cofre.
- **Nota:** um app **BYOK** (a chave é da pessoa, digitada na hora) costuma ter **zero** variável de
  ambiente — aí o `config-template.env` é desnecessário e a recuperação fica trivial. Diga isso no
  relatório: é um ponto forte da arquitetura, não uma lacuna.
- **Peso:** config versionada + deploy pelo git → 🟢; painel como fonte da verdade → 🟠.

### C7 — Dá para voltar uma versão? *(rollback)*
- **O que checar:** dá para reverter um deploy ruim rápido (`git revert` + push, ou promover um
  deployment anterior no painel)?
- **Por que importa aqui:** sem banco, o rollback é **a** operação de recuperação mais provável no
  dia a dia — mais provável que qualquer restore.
- **Ação:** escrever os dois caminhos no `RESTORE.md`.

### Não se aplica nesta trilha (diga isso no relatório, não deixe em silêncio)
- **B1/B4/B5** (backup e PITR do banco): não há banco.
- **B3** (Vercel Blob sem backup — a lacuna nº 1 da Trilha B): não há upload de arquivo.
- **B6** (preview apontando para o banco de produção): não há banco.
- Dizer explicitamente o que **não** se aplica evita que o 🟢 pareça descuido.

---

## Nota de fronteira

Esta trilha cuida do **backup e da recuperação** por stack. Ela **não** refaz:
- a *fragilidade de segurança* (IAM largo, RLS, segredo exposto) → `security-review` (rodou antes);
- privacidade/consentimento/CFM → `lgpd-saude-guard`;
- o que **conta como dado sensível** → referência compartilhada `lgpd-saude-guard.md`.

---

**Versão:** 1.1 · **Trilhas:** GCP · Supabase/Vercel/Prisma · Frontend estático sem backend · **Lacunas priorizadas:** Vercel Blob sem backup (B3) e destino dos arquivos gerados por app sem backend (C4). Confirme sempre no console atual — produto de nuvem muda. Novas trilhas conforme os projetos do clube pedirem.
