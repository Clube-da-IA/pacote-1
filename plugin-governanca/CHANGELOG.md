# Changelog — clube-ia-governanca

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/) · versionamento semântico.

## [1.3.1] — 2026-08-30

### Adicionado
- **`INSTALL.md` — guia de instalação para os 10 membros.** Escrito para quem não programa, no
  mesmo princípio das skills (termo traduzido no ponto, consequência concreta): pré-requisitos,
  6 passos, como conferir que deu certo, o que fazer quando der problema, e a tabela de "qual
  skill usar em que momento". Diz explicitamente que os portões 4–8 **mostram o risco e você
  decide** — e que um portão incompreensível é defeito da skill, não do leitor.
- **Pacote distribuível** gerado em `dist/clube-ia-governanca-<versão>.zip` (fora do git, via
  `.gitignore`), com a raiz **plana** — `.claude-plugin/` e `skills/` no topo do arquivo, igual ao
  layout do repositório. Não leva `.mcp.json` nem `.DS_Store`.
- **`.gitignore`**: `dist/`, `.DS_Store` e `.mcp.json` (o conector local nunca entra no pacote).

### Corrigido
- **Guardrail do `hangar-sync` agora é portátil.** A versão recuperada na 1.3.0 fixava o caminho
  absoluto da máquina do autor (`/Users/<seu-usuario>/...`) e afirmava que o catálogo fica "SEMPRE" ali —
  o que **quebraria a skill para todos os 10 membros**, cuja máquina não tem esse caminho. A regra
  que importa foi preservada e generalizada: o `dados-hangar.json` mora na **pasta do HANGAR do
  workspace da pessoa**, **nunca** dentro da pasta do projeto que está sendo catalogado; confirmar
  o caminho com a pessoa na primeira vez, e **parar e perguntar** se não encontrar. Fecha a
  pendência aberta na 1.3.0.
- `plugin.json` e `marketplace.json` → **1.3.1**.

### Nota de operação
- O botão **"Atualizar"** do plugin instalado fica apagado enquanto o **marketplace** não
  ressincroniza com o repositório: o Desktop compara a versão instalada com a **última versão que
  ele conhece** do marketplace, e essa leitura ficou congelada em 03/07 (1.1.0). Quem atualiza é o
  **marketplace**, não o plugin — ressincronizar/reconectar o marketplace destrava o botão.

## [1.3.0] — 2026-08-25

> **Nota de numeração.** A entrada antes registrada aqui como `[1.1.0] — 2026-08-22` estava
> **mal numerada**: o repositório não sabia que os pacotes **1.1.0 (03/07)** e **1.2.0 (23/07)** já
> existiam, porque o histórico deles nunca tinha sido trazido para este `CHANGELOG.md`. O trabalho
> daquela entrada (Trilha C) na verdade se apoia **em cima da 1.2.0** — por isso ele foi renumerado
> e incorporado nesta release, junto com a reconciliação que fechou a deriva. As entradas
> **1.0.1**, **1.1.0** e **1.2.0** abaixo foram recuperadas do `CHANGELOG.md` do pacote instalado.

### Corrigido / reconciliado
- **Fim da deriva entre a pasta-fonte e o plugin empacotado.** As **8 skills** restantes estavam
  atrasadas em relação ao plugin instalado e seriam **regredidas** no próximo empacotamento. Cada
  `SKILL.md` foi comparado com o do pacote **1.2.0** (o mais novo instalado) e reconciliado:
  `commit-github` (234→239), `governanca-projeto` (131→133), `hangar-sync` (214→219),
  `lgpd-saude-guard` (191→205), `observability-setup` (313→345), `quality-validator` (241→255),
  `security-review` (249→291), `spec-builder` (74→76 linhas).
  - Recuperado nas 8: o princípio **"Decisão compreensível"** (v1.1.0) — que faltava em todas.
  - Recuperado em `security-review` e `observability-setup`: o **Bloco 0** (os 3 testes manuais de
    navegador) e o **Bloco 5** (confirmação pós-deploy), da v1.2.0.
- **Referências (`references/`) também tinham deriva** — ao contrário do que se supôs na
  reconciliação anterior, elas **não** estavam todas idênticas. Reconciliados três arquivos:
  `lgpd-saude-guard/lgpd-saude-guard-reference.md` (1.0.0 → 1.1.0),
  `observability-setup/references/criterios-e-checagens.md` (+ Bloco 5) e
  `security-review/references/criterios-e-testes.md` (+ Bloco 0).
- **Correção de rota do `hangar-sync` recuperada.** O bloco **"⚠️ CAMINHO CANÔNICO DO CATÁLOGO"**
  existia **só** na cópia instalada da 1.1.0 (arquivo com data de **12/07**, posterior ao
  empacotamento de 06/07): foi um conserto aplicado direto no plugin instalado que **nunca voltou
  para a fonte** e, por isso, se perdeu ao empacotar a 1.2.0. Ele foi trazido de volta — é o
  guardrail que impede o merge de gravar o `dados-hangar.json` **dentro da pasta do projeto que
  está sendo catalogado**, e manda **parar e perguntar** se o catálogo não for encontrado.
- **`plugin.json`**: `version` 1.0.0 → 1.3.0 e campo **`repository`** finalmente preenchido
  (pendência aberta desde a 1.0.0). **`marketplace.json`**: 1.0.0 → 1.3.0.
- **Histórico de releases restaurado** — as entradas 1.0.1, 1.1.0 e 1.2.0 estavam só no pacote.

### Verificado
- `resilience-checkpoint` **não** foi tocado: a cópia local (v1.2.0, com a Trilha C) é a mais nova,
  à frente do pacote — inclusive `references/trilhas-de-stack.md` (v1.1 local vs v1.0 no pacote).
- Após a reconciliação, a pasta-fonte difere do pacote 1.2.0 **apenas** nos pontos pretendidos:
  `resilience-checkpoint` (à frente) e o guardrail recuperado do `hangar-sync`.

### Pendência aberta
- O caminho do catálogo no guardrail do `hangar-sync` é **absoluto e específico desta máquina**
  (`/Users/<seu-usuario>/...`). Funciona para o uso pessoal; **antes de distribuir aos 10 membros**,
  vale generalizar (manter a regra "nunca dentro da pasta do projeto — na dúvida, pare e pergunte"
  sem fixar o caminho de um usuário).

### Adicionado
- **`resilience-checkpoint` v1.2.0 — Trilha C: Frontend estático sem backend**
  (`references/trilhas-de-stack.md` v1.1). Nasceu de um caso real: a **Prévia de Reembolso**
  (SPA sem backend) é um SPA no Vercel que gera PDF no navegador e não guarda nada — rodar a Trilha B ali
  produzia só "não se aplica", e o portão não tinha o que dizer.
  - **A virada de perspectiva:** sem backend, **não há dado de paciente em repouso para perder** —
    a arquitetura já elimina a classe de risco que reprova o portão, e isso precisa ser dito ao
    responsável. O que ainda se perde é o **acervo** (código + dados de referência curados) e a
    capacidade de reconstruir e republicar.
  - **A lacuna que a trilha existe para pegar (C4):** app sem backend **entrega** arquivos (PDF,
    exportação). O ponto de guarda não sumiu — **mudou de lugar**, do servidor para a máquina de
    quem baixou. Se ninguém declarou onde esses documentos são arquivados, a obrigação de guarda do
    prontuário continua valendo sem sistema responsável por ela.
  - **C5** cobre o efeito colateral que quase ninguém vê: Time Machine/iCloud/Drive copiando
    automaticamente os arquivos baixados para um backup pessoal fora da política de descarte.
  - **C3** define o drill barato e conclusivo desta stack: `git clone` limpo → `npm ci` → testes →
    build, conferindo se os binários (fontes, marca) vieram junto.
  - C1 (acervo com cópia fora da máquina), C2 (`git push` manual e o RPO em dias de trabalho),
    C6 (publicação reconstruível; nota sobre BYOK dispensar `config-template`) e C7 (rollback como
    a operação de recuperação mais provável no dia a dia).
  - A trilha exige **dizer no relatório o que não se aplica** (B1/B3/B4/B5/B6), para que o 🟢 não
    pareça descuido.

### Alterado
- `resilience-checkpoint/SKILL.md` → v1.2.0: passo de detecção de stack e descrição do Bloco 3
  agora citam a Trilha C.

### Alterado
- `resilience-checkpoint/SKILL.md` → v1.2.0: passo de detecção de stack e descrição do Bloco 3
  agora citam a Trilha C.

## [1.2.0] — 2026-07-23

### Adicionado
- **Os 3 testes manuais de navegador do clube** entraram como checagem formal em duas skills-portão:
  1. **Variáveis de ambiente vazando no navegador** — DevTools → aba **Sources** → busca por
     `SK_`/`KEY`/`SECRET`/`TOKEN`; nenhuma chave de serviço real pode aparecer no bundle do front.
  2. **Autenticação sobrevive à limpeza dos dados do site** — excluir os dados do site + recarregar
     tem que **deslogar** e bloquear as páginas privadas (prova que a trava está no servidor, não no cliente).
  3. **Rate limit no login** — errar a senha várias vezes tem que **travar**; lembrete de que rate limit
     **precisa ser pedido de propósito** (não vem de fábrica, nenhuma IA implementa sozinha).
- `security-review`: novo **Bloco 0 — Testes manuais no navegador** em `references/criterios-e-testes.md`
  (padrão atacante → sinal → passo-a-passo → correção → norma, mapeado a OWASP A01/A02/A04/A07 + LGPD 46);
  os três passam a aparecer **sempre** no relatório e no checklist do `SKILL.md`, cada um com ✅/🔴/⏳.
- `observability-setup`: novo **Bloco 5 — Confirmação dos 3 testes de navegador (pós-deploy)** em
  `references/criterios-e-checagens.md`; como este portão roda com o app **no ar**, ele confirma que os
  três foram **executados no ambiente real** e **registra o resultado** (novo slot no runbook `OBSERVABILITY.md`).
  Um 🔴 encontrado no ar escala pela régua das duas faces e volta para o `security-review`.

### Alterado
- `metadata.version` de `security-review` e `observability-setup` → 1.2.0.
- `plugin.json` e `marketplace.json` → **1.2.0**.

## [1.1.0] — 2026-07-03

### Adicionado
- **Princípio 0 — "Decisão compreensível" (inegociável):** em todo ponto de decisão humana
  (veredito de portão, ⚠️ revisão humana, "ação com seu ok"), o risco é reexplicado em linguagem
  leiga, com cada termo técnico traduzido no próprio ponto e a **consequência concreta** dita em
  linguagem de consultório — mesmo que o termo já tenha sido explicado antes. O público é o médico,
  não o programador; se ele não entende o risco, o portão não cumpriu sua função (vale acima da
  concisão). Seção nova "Decisão compreensível" nas 5 skills-portão (`quality-validator`,
  `lgpd-saude-guard`, `security-review`, `resilience-checkpoint`, `observability-setup`); regra
  correspondente nas 4 restantes (`spec-builder`, `governanca-projeto`, `commit-github`,
  `hangar-sync`); subseção nova no README.

### Alterado
- `metadata.version` das skills-portão versionáveis (`lgpd-saude-guard`, `security-review`,
  `resilience-checkpoint`, `observability-setup`) e da `hangar-sync` → 1.1.0; `commit-github` → v1.2
  (versão interna).
- `plugin.json` e `marketplace.json` → **1.1.0**.

## [1.0.1] — 2026-07-02

### Alterado
- **Build de uso pessoal** (Claude Desktop / conta única). `.mcp.json` **removido** do pacote —
  as skills usam a conexão GitHub já existente na conta; o conector fica documentado no README
  para a futura versão dos membros.
- README reescrito para o cenário pessoal, com o fluxo real de instalação no Desktop
  (Customize → Plugins → Add marketplace a partir de repositório GitHub) e o passo de
  **desativar as 9 skills avulsas** para evitar duplicata no teste.

### Reconciliado
- `lgpd-saude-guard/lgpd-saude-guard-reference.md` (arquivo-fonte dos padrões de detecção)
  alinhado de **1.0.0 → 1.1.0**, datado 2026-07-02, com nota distinguindo-o da referência
  distilada `lgpd-saude-guard.md` (ambos na geração v1.1). Conteúdo dos padrões inalterado.

## [1.0.0] — 2026-07-02

### Adicionado
- Primeiro empacotamento do pipeline completo como **plugin único** do Clube da IA.
- As 9 skills de governança, na ordem de uso:
  `spec-builder`, `governanca-projeto`, `commit-github`, `quality-validator`,
  `lgpd-saude-guard`, `security-review`, `resilience-checkpoint`,
  `observability-setup`, `hangar-sync`.
- Conector **GitHub MCP** embutido (`.mcp.json`), com token lido de variável de ambiente.
- `marketplace.json` self-reference para instalação em 1 passo pelos 10 membros.

### Corrigido / reconciliado
- Referência compartilhada `lgpd-saude-guard.md` alinhada para **v1.1** nas três skills que
  ainda carregavam v1.0 (`quality-validator`, `security-review`, `resilience-checkpoint`).
  As 5 cópias das consumidoras passam a ser idênticas.

### Excluído do pacote
- Pastas `evals/` das skills (convenção do clube — teste não entra no pacote distribuído).

### Pendências conhecidas (não bloqueiam instalação)
- Teste ponta a ponta de `security-review`, `resilience-checkpoint` e `observability-setup`.
- Teste ao vivo de `spec-builder` e da Porta B (entrevista) de `governanca-projeto`.
- Campo `repository` do `plugin.json` a preencher com a URL do repo do clube.
