# Pacote de Funcionalidades nº 1 · Clube da IA

**Governança de projetos de saúde digital, da ideia ao arquivo.**
Endolife Health-Tech × Inova UNIMES

Este repositório reúne as duas peças do primeiro pacote do clube. Elas funcionam separadas, mas
foram feitas para andar juntas: a primeira te acompanha **enquanto** você constrói um projeto; a
segunda guarda o resultado **depois** que ele fica pronto.

| | Peça | O que é | Onde vive |
|---|---|---|---|
| **1** | [**Plugin de Governança**](plugin-governanca/) | 9 skills que levam um projeto da ideia até o arquivo, com portões de qualidade, LGPD/CFM, segurança, backup e observabilidade. | Claude Desktop |
| **2** | [**HANGAR**](hangar/) | App local onde cada projeto seu vira uma "nave", com arquitetura, custo e o que precisa de reparo. | Uma pasta no seu computador |

---

## Baixar e instalar

Os pacotes prontos ficam em **[`downloads/`](downloads/)**:

| Arquivo | Guia |
|---|---|
| `clube-ia-governanca-1.3.1.zip` | [INSTALL.md](plugin-governanca/INSTALL.md) — 6 passos |
| `HANGAR-kit.zip` | [README do HANGAR](hangar/README.md) |

**Comece pela peça 1** — é a que você usa no dia a dia e leva uns 5 minutos. Não precisa instalar
as duas no mesmo dia.

---

## O pipeline, em ordem de uso

| # | Skill | Quando entra |
|---|-------|--------------|
| 1 | `spec-builder` | Tenho uma ideia e quero transformar em documento |
| 2 | `governanca-projeto` | Vou começar e preciso organizar a pasta do projeto |
| 3 | `commit-github` | Quero salvar e versionar o trabalho |
| 4 | `quality-validator` | Terminei uma etapa e quero revisar a qualidade |
| 5 | `lgpd-saude-guard` | Checar LGPD e CFM 2.454 antes de seguir |
| 6 | `security-review` | Testar se dá para invadir, antes do deploy |
| 7 | `resilience-checkpoint` | E se o banco cair? Tenho backup que funciona? |
| 8 | `observability-setup` | Já está no ar — quem acessou o prontuário? |
| 9 | `hangar-sync` | Projeto pronto: cataloga a "nave" no HANGAR |

As de **4 a 8** são **portões**: mostram o risco e **você decide**. Não travam nada sozinhas.

---

## O princípio que rege tudo

> **Decisão compreensível.** Em todo ponto onde o humano decide, o risco chega traduzido: cada
> termo técnico explicado no próprio ponto e a consequência dita em linguagem de consultório.
> O público é o médico, não o programador. Se a pessoa não entende o risco, o portão não cumpriu
> sua função — e isso vale **acima da concisão**.

É a regra nº 0, transversal às 9 skills. Um relatório incompreensível é defeito da skill, não de
quem lê.

---

## Avisos honestos

**Desenvolvido e testado no macOS.** O HANGAR traz um iniciador para Windows
(`Iniciar-HANGAR.bat`), escrito com o mesmo cuidado, **mas ainda não testado numa máquina Windows
de verdade**. O plugin não tem esse problema: roda igual nos dois sistemas.

**O HANGAR abre uma janela de Terminal — e isso é normal.** Ela precisa ficar aberta enquanto o app
roda, porque ela *é* o motor. Está explicado no README dele.

**Nada aqui guarda segredo.** Nem senha, nem chave de API, nem dado de paciente. Nos campos de
chave anota-se apenas **onde** ela mora, nunca o valor. É uma trava de projeto, não uma
recomendação — e vale tanto para as skills quanto para o HANGAR.

**Os exemplos são fictícios.** As naves de exemplo do HANGAR e os casos citados nas skills foram
generalizados de propósito: descrevem arquétipos de projeto (app com banco, SPA sem backend, agente
local), não sistemas reais.

---

## Estrutura

```
plugin-governanca/     código-fonte das 9 skills + manifestos do plugin
  ├── skills/
  ├── .claude-plugin/
  ├── INSTALL.md       guia de instalação (6 passos)
  └── CHANGELOG.md     histórico de versões
hangar/                código-fonte do app HANGAR
downloads/             os dois pacotes prontos para instalar
```

---

## Versões

| Peça | Versão |
|---|---|
| Plugin `clube-ia-governanca` | **1.3.1** |
| HANGAR | **0.2** |

Ao mudar algo no plugin: suba o número em `plugin.json` **e** em `marketplace.json` (iguais) e
registre no `CHANGELOG.md`. `fix` → patch, `feat` → minor, quebra → major.

---

*Clube da IA · Endolife Health-Tech × Inova UNIMES*
