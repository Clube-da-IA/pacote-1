# Template — `SPEC.md`

Este é o documento que a `spec-builder` produz e que a `governanca-projeto` adota depois (Porta A).
Os dois usam o mesmo molde de assuntos, para a dupla encaixar sem atrito.

> **Como preencher:** uma seção por vez, com as respostas da ideação. Onde faltou definição, **marque
> pendência explícita** em vez de inventar (ex.: `- Pendência: definir critério de sucesso`). Mantenha
> a linguagem clara: um membro não-técnico precisa conseguir ler.

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

## Assuntos que um bom SPEC precisa cobrir (checklist)

Mesmo que o usuário organize de outro jeito, garanta que estes temas apareçam em algum lugar:
identidade · objetivo · o que faz (v1) · **o que NÃO faz / limites de segurança** · dados e
sensibilidade LGPD · critérios de sucesso · restrições técnicas · decisões e pendências.
