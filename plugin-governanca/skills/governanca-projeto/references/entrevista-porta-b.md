# Roteiro da Entrevista — Porta B

Use este roteiro quando **não existir** `SPEC.md` e for preciso construí-lo do zero.
Acontece apenas no Claude Code.

## Como conduzir

- **Uma pergunta de cada vez.** Espere a resposta antes de seguir. Para quem não programa, várias
  perguntas juntas paralisam.
- **Linguagem do dia a dia.** Traduza qualquer termo técnico na hora.
- **Não invente respostas.** Se o usuário não souber, registre como pendência no SPEC e siga.
- **Cada pergunta abaixo alimenta uma seção do template do SPEC** (`references/templates.md`).
  A coluna "→ SPEC" indica para onde a resposta vai.

## As perguntas (em ordem)

1. **"Como esse projeto se chama, e como você o descreveria numa frase só?"**
   → SPEC §1 Identidade

2. **"Quem é o responsável principal por ele?"**
   → SPEC §1 Identidade

3. **"Que problema esse projeto resolve? Pensa no incômodo real que ele tira da frente."**
   → SPEC §2 Objetivo (Problema que resolve)

4. **"Quem vai usar isso? Médicos, pacientes, alunos, a equipe interna...?"**
   → SPEC §2 Objetivo (Para quem)

5. **"Na primeira versão, o que ele precisa fazer? Liste as poucas coisas essenciais — não o sonho completo, só o mínimo que já vale a pena."**
   → SPEC §3 O que faz (v1)

6. **"Tem alguma coisa que esse projeto NÃO deve fazer, mesmo que pareça útil?"**
   → SPEC §4 Limites (Não-objetivos)

7. **"E o limite de segurança: o que ele NUNCA pode fazer?"** *(a pergunta mais importante)*
   Se a resposta vier vaga, ofereça exemplos do contexto de saúde:
   - "Nunca dar conduta ou diagnóstico clínico sem um médico no comando."
   - "Nunca expor dado de paciente a um serviço de terceiro sem avaliação legal."
   - "Nunca tomar decisão final que afete um paciente sozinho."
   → SPEC §4 Limites (Limites de segurança)

8. **"Esse projeto mexe com algum dado de pessoa? Dado de paciente, cadastro, mensagens...?"**
   → SPEC §5 Dados (Que dados toca + Sensibilidade LGPD)

9. **"Esses dados ficam guardados onde?"** (banco, planilha, serviço)
   → SPEC §5 Dados (Onde ficam — anotar o local, **nunca** valores)

10. **"Como você vai saber que esse projeto deu certo? Qual o sinal claro de sucesso?"**
    → SPEC §6 Critérios de sucesso

11. **"Você já sabe com que ferramentas isso vai ser feito?"** (ex.: Vite + React, Supabase, Vercel)
    Se não souber, tudo bem — marque como pendência.
    → SPEC §7 Restrições técnicas

12. **"Tem alguma decisão importante já tomada, ou alguma dúvida em aberto que vale registrar?"**
    → SPEC §8 Decisões & pendências

## Ao terminar

- Preencha o template do SPEC com as respostas.
- Onde faltou resposta, deixe pendência explícita em vez de inventar.
- Mostre o SPEC montado ao usuário e ajuste conforme o retorno antes de gravar.
