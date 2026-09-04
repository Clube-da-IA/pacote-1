# Roteiro de Ideação — spec-builder

Conduza no Chat, **uma pergunta de cada vez**. Para cada fase: faça a pergunta, ouça, e use os
**ganchos de ideação** para ajudar a pensar antes de seguir. Os ganchos são opcionais — use quando
agregarem; nunca decida pelo usuário.

A coluna "→ SPEC" indica para qual seção do template (`references/template-spec.md`) a resposta vai.

---

## Fase 1 — A ideia

1. **"Como o projeto se chama e como você o resumiria numa frase?"** → §1 Identidade
2. **"Quem é o responsável principal?"** → §1 Identidade
3. **"Que problema real ele resolve? Qual o incômodo que ele tira da frente?"** → §2 Objetivo
4. **"Quem vai usar? Paciente, equipe clínica, aluno, pesquisador, uso interno?"** → §2 Objetivo

**Ganchos:** se a frase-resumo vier vaga ou com duas ideias coladas, ajude a separar ("parece que tem
duas coisas aqui: A e B — qual é o coração da v1?"). Se o "para quem" e o "problema" não conversarem,
aponte com gentileza.

---

## Fase 2 — Escopo da v1

5. **"Na primeira versão, o que ele precisa fazer? Liste só o essencial — o mínimo que já vale a pena, não o sonho completo."** → §3 O que faz (v1)
6. **"Tem algo que ele NÃO deve fazer, mesmo que pareça útil agora?"** → §4 Limites (não-objetivos)

**Ganchos (corte de escopo — onde você mais agrega):** ideia nova quase sempre vem grande demais.
Se a lista da v1 tiver muitos itens, proponha separar "v1 mesmo" de "fica para depois". Lembre que
cada item vira trabalho; uma v1 enxuta chega ao ar e ensina mais que um plano gigante que nunca sai.
Ofereça a divisão, mas deixe o usuário escolher onde corta.

---

## Fase 3 — Segurança e dados (a mais importante)

7. **"O que esse projeto NUNCA pode fazer?"** *(insista aqui)* → §4 Limites (segurança)
   Se a resposta vier vaga, ofereça exemplos do domínio para escolher/adaptar:
   - "Nunca dar conduta ou diagnóstico clínico sem um médico no comando."
   - "Nunca expor dado de paciente a serviço de terceiro sem aval legal."
   - "Nunca tomar decisão final que afete um paciente sozinho."
8. **"Ele mexe com dado de pessoa? Paciente, cadastro, mensagens, respostas de formulário?"** → §5 Dados
9. **"Qual a sensibilidade desses dados? Tem dado de saúde (sensível pela LGPD)?"** → §5 Dados (sensibilidade)
10. **"Onde esses dados vão ficar guardados?"** (banco, planilha, serviço) → §5 Dados (onde ficam — local, nunca valores)

**Ganchos:** em qualquer projeto que toque paciente, levante a LGPD você mesmo, mesmo que o usuário
não cite. Se ele descrever algo que cruza um limite que ele próprio acabou de definir, aponte na hora.
Nunca peça nem registre o valor de uma senha/chave ou um dado real de paciente — só a sensibilidade e o local.

---

## Fase 4 — Sucesso e restrições

11. **"Como você vai saber que deu certo? Qual o sinal claro de sucesso?"** → §6 Critérios de sucesso
12. **"Já sabe com que ferramentas vai ser feito?"** (ex.: Next.js, Supabase, Vercel) → §7 Restrições técnicas

**Ganchos:** se o critério de sucesso vier como adjetivo ("ser bom", "ser rápido"), ajude a torná-lo
observável ("o que dá pra medir ou ver?"). Se não souber a stack, tudo bem — vira pendência, não trava.

---

## Fase 5 — Decisões e pendências

13. **"Tem decisão importante já tomada, ou dúvida em aberto que vale registrar?"** → §8 Decisões & pendências

**Ganchos:** releia mentalmente a conversa e traga para cá o que ficou "no ar" — toda pergunta que o
usuário respondeu com "ainda não sei" deve aparecer como pendência explícita no SPEC.

---

## Ao terminar

- Preencha o template com as respostas; marque pendências onde faltou definição.
- Mostre o SPEC e itere até o usuário aprovar.
- Entregue como arquivo `SPEC.md` e aponte o próximo passo: rodar a `governanca-projeto` no Claude Code.
