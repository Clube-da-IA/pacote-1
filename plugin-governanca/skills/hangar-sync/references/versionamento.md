# Carimbar a versão — semver sem git tag

A `hangar-sync` fecha uma etapa do projeto **carimbando uma versão**. A lógica é a de sempre (Semantic Versioning), herdada da `controle-de-missoes` — mas o carimbo **não é uma git tag**.

## Por que não git tag

A convenção travada do clube é **sem terminal**: o plugin roda igual nos 10 membros, e `git tag` fragmenta isso (depende do terminal, do estado local do repo, de quem rodou). Então a versão vira **arquivo + campo na ficha**, que qualquer um lê sem terminal:

1. `VERSION` na raiz do projeto — uma linha, ex.: `v0.4.0`.
2. `CHANGELOG.md` na raiz do projeto — o que mudou, por versão.
3. `git.ultimaVersao` na **nave** do HANGAR — o mesmo número, pra aparecer na Baia.

Se o Dr. quiser uma release/tag de verdade no GitHub depois, isso é um passo **manual** dele (ou da `commit-github`) — não é trabalho desta skill.

## Como decidir o próximo número

Formato `vMAJOR.MINOR.PATCH` (ex.: `v0.4.0`). Olhe o que mudou desde a última versão (o `CHANGELOG.md` antigo, o `VERSION` antigo, ou o `git.ultimaVersao` da nave, se já existir):

| Mudou o quê | Sobe qual parte | Exemplo |
|---|---|---|
| Primeira vez que a nave é catalogada | começa em `v0.1.0` | — → `v0.1.0` |
| Correção / ajuste sem recurso novo (`fix`) | **PATCH** | `v0.4.0` → `v0.4.1` |
| Recurso novo compatível (`feat`) | **MINOR** (zera patch) | `v0.4.1` → `v0.5.0` |
| Quebra algo / muda contrato (`!` ou `BREAKING CHANGE`) | **MAJOR** (zera minor e patch) | `v0.5.0` → `v1.0.0` |

Enquanto o projeto é `v0.x`, ele ainda é "antes do 1.0" — mudança que quebraria pode subir só o MINOR, mas **diga isso no relatório** pra não surpreender.

**Nunca invente o histórico.** Se não dá pra saber o que mudou desde a última versão (sem changelog, sem pistas), **pergunte** ao Dr. qual foi a natureza da mudança (correção? recurso? quebra?) em vez de chutar o número. Uma pergunta de cada vez.

## Formato do CHANGELOG.md

Se o projeto ainda não tem, crie; se tem, **acrescente no topo** (não reescreva o histórico):

```markdown
# CHANGELOG — [Nome do Projeto]

## v0.5.0 — 2026-07-02
### Adicionado
- Painel de custos por serviço.
### Corrigido
- Régua de RAM que dava falso positivo.

## v0.4.0 — 2026-06-15
- ...
```

Mantenha as datas em `AAAA-MM-DD` e a entrada mais nova em cima. O mesmo número vai pro `VERSION`, pro `CHANGELOG.md` e pro `git.ultimaVersao` da nave — os três sempre iguais.
