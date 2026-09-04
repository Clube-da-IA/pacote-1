# Templates — Sistema de Documentação do Clube da IA

Este arquivo guarda os modelos que a skill `governanca-projeto` escreve. Copie o bloco
correspondente e preencha/adapte. Mantenha o idioma em PT-BR.

## Índice
1. O sistema de 4 documentos (resumo de para que serve cada um)
2. Template — `SPEC.md` (o contrato completo)
3. Stub — `TASKS.md`
4. Stub — `HANDOFF.md`
5. Stub — `README.md`
6. Trecho — `CLAUDE.md`

---

## 1. O sistema de 4 documentos

Cada documento responde a uma pergunta diferente. Juntos, eles evitam que o projeto perca o fio.

- **SPEC.md** — *o que é, para quem e o que NUNCA pode fazer.* O contrato / fonte da verdade.
- **TASKS.md** — *o que falta fazer.* O SPEC quebrado em passos, com status.
- **HANDOFF.md** — *onde paramos.* Estado atual, decisões e próximo passo (para retomar sem perder o fio).
- **README.md** — *como rodar e usar.* Setup, deploy e onde as coisas moram (sem senhas — só *onde* ficam).

O `CLAUDE.md` é um quinto arquivo, de natureza diferente: são as **regras que o Claude Code lê
automaticamente** toda vez que abre o projeto.

---

## 2. Template — `SPEC.md`

> **Como usar este template:** ele tem dois usos.
> - **Porta B (SPEC do zero) ou rascunho bagunçado:** use como **molde** — preencha seção por seção.
> - **Porta A (SPEC já existe e é coerente):** use como **checklist de assuntos** — confira se o SPEC cobre cada tema *em algum lugar*, na estrutura própria dele. **Não force** o SPEC do projeto a virar este formato; um bom SPEC com outra organização está certo.

Este é o centro de tudo. Não deixe seção vazia sem marcar como pendência.

```markdown
# SPEC — [Nome do Projeto]
> Fonte da verdade. Atualize aqui antes de mudar o rumo.

## 1. Identidade
- Nome:
- Em uma frase:
- Responsável:

## 2. Objetivo
- Problema que resolve:
- Para quem:

## 3. O que faz (v1)
-

## 4. O que NÃO faz (limites)
- Não-objetivos:
- Limites de segurança (ex.: "nunca dá conduta clínica"):

## 5. Dados
- Que dados toca:
- Sensibilidade (LGPD):
- Onde ficam (apontar local, nunca valores):
- O que é anonimizado:

## 6. Critérios de sucesso
-

## 7. Restrições técnicas
- Stack:
- Plataformas:
- Dependências-chave:

## 8. Decisões & pendências
- [data] Decisão:
- Pendência:

## 9. Metadados
- Versão do SPEC:   · Data:   · Status:
```

---

## 3. Stub — `TASKS.md`

Esqueleto vazio. O detalhe entra conforme o projeto andar.

```markdown
# TASKS — [Nome do Projeto]
> O SPEC quebrado em passos. Status: ⬜ a fazer · 🔄 em andamento · ✅ concluído

## Agora
- ⬜

## Próximas
- ⬜

## Concluídas
-
```

---

## 4. Stub — `HANDOFF.md`

Serve para retomar o trabalho sem reler tudo. Atualizado ao fim de cada sessão.

```markdown
# HANDOFF — [Nome do Projeto]
> Onde paramos. Atualize ao encerrar cada sessão de trabalho.

## Estado atual
-

## Últimas decisões
- [data]

## Próximo passo
-
```

---

## 5. Stub — `README.md`

Como rodar e onde as coisas moram. **Nunca** colocar valores de senha/chave aqui.

```markdown
# [Nome do Projeto]

[Uma frase: o que é.]

## Como rodar
1.

## Deploy
-

## Onde as coisas moram
- Código:
- Banco de dados:
- Credenciais (apenas ONDE, nunca o valor):
```

---

## 6. Trecho — `CLAUDE.md`

Cole isto no `CLAUDE.md` de cada projeto. São as regras que o Claude Code lê sempre, sozinho.

```markdown
# Regras do projeto (lidas automaticamente pelo Claude Code)

## Governança — fazer primeiro
Antes de qualquer trabalho substantivo, verifique se existem e estão coerentes:
SPEC.md, TASKS.md, HANDOFF.md, README.md.
Se algum faltar ou estiver desatualizado, rode a skill `governanca-projeto` antes de seguir.

## Manutenção contínua
Conforme o projeto evolui, mantenha SPEC / TASKS / HANDOFF atualizados.
Ao encerrar uma sessão, atualize o HANDOFF.md: estado atual, decisões e próximo passo.

## Travas (LGPD / saúde)
Nunca colar dado real de paciente nem valor de senha/chave no contexto ou no código.
Documentar apenas ONDE esses dados/segredos ficam.

## Idioma
Todo o trabalho e a documentação em Português do Brasil.
```
