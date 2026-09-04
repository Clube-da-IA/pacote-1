# A ficha da nave — de onde vem cada campo

Esta é a referência que a `hangar-sync` consulta na hora de montar a nave. **Não invente o formato** — ele é o mesmo que o app HANGAR lê e escreve. A frota inteira mora num arquivo com esta casca:

```json
{ "base": "Santos", "versaoDados": "0.1", "atualizadoEm": "2026-07-02", "naves": [ /* ...as naves... */ ] }
```

Cada projeto é **uma nave** dentro de `naves[]`. O encaixe é **por `id`**: se já existe uma nave com aquele `id`, a skill **atualiza** aquela; se não, **acrescenta** — nunca duplica, nunca mexe nas outras.

> **Regra de ouro (repetida aqui de propósito):** todo campo abaixo ou vem **declarado** no projeto (SPEC, README, configs) ou fica **em branco / marcado como pendência** pro Dr. preencher no app (botão Editar). A skill **não chuta** custo, versão, volume nem sensibilidade. Melhor um campo vazio e honesto do que um número inventado.

---

## Os 16 campos (na ordem da ficha)

| Campo | Tipo | De onde tirar no projeto |
|---|---|---|
| `id` | texto, sem espaço | apelido único. Deriva do nome do projeto/pasta/repo (ex.: `Agenda da Clínica` → `agenda-da-clinica`, `Boletim Semanal` → `ai-health-digest`). É a **chave do merge**. |
| `nome` | texto | SPEC §1 Identidade → Nome. Como aparece na Baia. |
| `tipo` | texto curto | categoria. Padrões vistos na frota: `App · Saúde`, `Agente · VPS`, `Automação`, `Conteúdo`. Deriva do §2 Objetivo + §7 Stack. |
| `status` | enum | ver **Status** abaixo. Deriva do §9 Metadados (Status) + estado real. |
| `descricao` | uma frase | SPEC §1 "Em uma frase" ou §2 Problema que resolve. |
| `arquitetura` | `{ resumo, mermaid }` | `resumo` = §3/§7 em prosa curta. `mermaid` = o mapa caixas-e-setas em texto Mermaid (o app desenha). Se o projeto não tem, monte um simples a partir do §7 Stack. |
| `stack` | `{ frontend, backend, banco, hospedagem, servicos[], modelosIA[] }` | **SPEC §7 Stack** — a fonte principal. `servicos[]` e `modelosIA[]` são listas (ex.: Sentry, Vercel Blob / GPT-4, Claude). |
| `autenticacao` | `{ metodo, ondeMoramAsChaves, observacao }` | §7 + README. ⚠️ `ondeMoramAsChaves` diz **ONDE** a chave mora ("variáveis de ambiente no Vercel"), **nunca o valor**. `observacao` reforça isso. |
| `banco` | `{ tipo, ondeMora, dados, sensibilidadeLGPD, backup }` | §5 Dados + §7. `sensibilidadeLGPD` = `alta`/`media`/`baixa`, **declarada no §5** (não deduza sozinho o nível se o SPEC não disser — marque pendência). |
| `infra` | `{ vpsServidor, docker, dominio, comoPublica }` | §7 + README + configs. `docker` = true/false. `comoPublica` = a frase de deploy (ex.: "git push na main → deploy automático no Vercel"). Sem servidor → `vpsServidor: "—"`. |
| `cicd` | `{ nivel, automatico[], manual[] }` | `nivel` 0–4 (ver **Escada de CI/CD**). `automatico[]`/`manual[]` = o que roda sozinho vs. na mão. Deriva de configs de CI (`.github/workflows`, Vercel) + README. |
| `recursos` | `{ cpu, ram, armazenamento, nota }` | §7 + configs de infra. Serverless → `cpu: "serverless"`. `nota` = observação honesta de uso/folga. |
| `custos` | lista de `{ servico, valorMensal, moeda }` | **só o que o projeto declara.** Um item por serviço pago (ex.: `{servico:"Vercel Pro", valorMensal:100, moeda:"BRL"}`). Nada declarado → lista vazia + pendência. O HANGAR soma e mostra o painel — **a conta é do app, não da skill**. |
| `isolamento` | `{ tipo, motivo }` | `tipo` = `compartilhado` ou `doca-propria`. Ver **Régua de isolamento**. `motivo` = a justificativa em prosa. |
| `git` | `{ repo, fluxo, producao, ultimaVersao }` | README + §7. `ultimaVersao` = a versão que a skill **carimba** (ver `versionamento.md`). `repo` aponta o repositório (sem token). |
| `saude` | `{ dividaTecnica, bugsConhecidos[], ultimaInspecao }` | §8 Decisões & pendências + TASKS/HANDOFF. `ultimaInspecao` = data (hoje, se a skill acabou de olhar). |
| `diario` | lista de `{ data, nota }` | decisões e aprendizados (§8, HANDOFF). Ao catalogar, **acrescente** uma entrada curta do tipo "catalogado no HANGAR — v0.X" com a data — não apague o histórico. |

---

## Status (enum fechado)

Use exatamente um destes (o app mapeia cada um numa cor de luz):

- `operacional` — no ar e saudável.
- `manutencao` — no ar, mas com reparo pendente.
- `em-solo` — parado/fora do ar de propósito.
- `em-construcao` — ainda sendo feito.
- `arquivada` — encerrado, guardado por histórico.

Deriva do §9 Metadados (Status) do SPEC + do estado real que você observou. Se o SPEC não diz e não dá pra saber, use `em-construcao` e marque a dúvida no relatório.

## Escada de CI/CD (`cicd.nivel` = 0 a 4)

| Nível | Significa |
|---|---|
| 0 | Sobe tudo na mão. |
| 1 | `git push` publica sozinho. |
| 2 | Robôs checam o código antes de publicar. |
| 3 | Testes automáticos barram código quebrado. |
| 4 | Pipeline completo (preview, testes, deploy, desfazer). |

Leia os workflows de CI e o README pra classificar. Na dúvida entre dois níveis, escolha o **menor** e diga por quê — é mais honesto.

## Régua de isolamento (`isolamento.tipo`)

Sugira `doca-propria` quando **qualquer** um for verdade: `banco.sensibilidadeLGPD` = `alta`, **ou** precisa ficar de pé 24/7, **ou** tem tráfego alto, **ou** as dependências brigam com as de outro projeto. Senão, `compartilhado`. Escreva o gatilho no `motivo` (ex.: "Dados de saúde (LGPD alta) — não compartilha ambiente"). Projeto de saúde do clube quase sempre cai em `doca-propria` pela primeira regra.

---

## Exemplo real (recortado da frota — o `agenda-da-clinica`)

Serve de molde de forma e tom. **Repare:** a chave nunca aparece — só onde mora; e `sensibilidadeLGPD` é `alta` porque o §5 declara dado de paciente.

```json
{
  "id": "agenda-da-clinica",
  "nome": "Agenda da Clínica",
  "tipo": "App · Saúde",
  "status": "manutencao",
  "descricao": "Painel clínico de endometriose — triagem e acompanhamento de paciente.",
  "arquitetura": { "resumo": "Frontend React no Vercel fala com o banco Supabase...", "mermaid": "graph LR; U[Paciente] --> APP[App React]; APP --> SB[(Supabase)]" },
  "stack": { "frontend": "React", "backend": "Funções serverless (Vercel)", "banco": "Supabase (Postgres)", "hospedagem": "Vercel", "servicos": ["Vercel"], "modelosIA": ["—"] },
  "autenticacao": { "metodo": "Login por e-mail e senha (Supabase Auth)", "ondeMoramAsChaves": "Variáveis de ambiente no Vercel; .env local NÃO versionado", "observacao": "Nunca colar chave de verdade aqui — só anotar onde ela mora." },
  "banco": { "tipo": "Postgres (Supabase)", "ondeMora": "Nuvem Supabase (região US)", "dados": "Cadastro de pacientes e respostas de triagem", "sensibilidadeLGPD": "alta", "backup": "Backup diário automático do Supabase" },
  "infra": { "vpsServidor": "—", "docker": false, "dominio": "app.endolife.com.br", "comoPublica": "git push na main → deploy automático no Vercel" },
  "cicd": { "nivel": 2, "automatico": ["deploy no push", "preview por branch"], "manual": ["migrations do banco"] },
  "recursos": { "cpu": "serverless", "ram": "serverless", "armazenamento": "~2 GB no Supabase", "nota": "Escala sozinho; sem servidor pra dimensionar." },
  "custos": [ { "servico": "Vercel Pro", "valorMensal": 100, "moeda": "BRL" } ],
  "isolamento": { "tipo": "doca-propria", "motivo": "Dados de saúde (LGPD alta) — não compartilha ambiente com mais nada." },
  "git": { "repo": "github.com/SEU_USUARIO/agenda-da-clinica (privado)", "fluxo": "github-flow", "producao": "Branch main publicada no Vercel", "ultimaVersao": "v0.4" },
  "saude": { "dividaTecnica": "Média — faltam testes automáticos", "bugsConhecidos": ["..."], "ultimaInspecao": "2026-06-01" },
  "diario": [ { "data": "2026-05-20", "nota": "Escolhi Supabase pra não administrar banco de dados na mão." } ]
}
```

Campos que o projeto **não declarou** (custo real, versão, repo exato) já entraram como **estimativa a confirmar** em naves anteriores — o Dr. corrige no app. Prefira deixar vazio e apontar a pendência a preencher com chute.
