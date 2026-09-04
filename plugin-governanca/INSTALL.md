# Como instalar o plugin do Clube da IA

**Para os membros do clube.** Você vai instalar **um pacote só** que traz as **9 skills** do
pipeline de governança. Leva uns 5 minutos e não exige saber programar.

> **Três palavras que aparecem aqui.**
> **Skill** = uma folha de instruções que o Claude segue quando você pede.
> **Plugin** = a embalagem que junta várias skills num pacote só.
> **Instalar** = colocar essa embalagem dentro do seu Claude, uma vez, para as skills ficarem
> disponíveis sempre.

---

## Antes de começar

- **Claude Desktop** instalado (Mac ou Windows) e você logado na sua conta.
- O arquivo **`clube-ia-governanca-1.3.1.zip`**, que o Gui te enviou.
  Guarde numa pasta que você ache fácil (Downloads serve).
- **Não descompacte o arquivo.** Ele entra no Claude do jeito que está, zipado.

---

## Instalação (6 passos)

**1.** Abra o **Claude Desktop**.

**2.** Vá em **Configurações** (o ícone de engrenagem) → aba **Plugins**.

**3.** Procure a seção **Personal plugins** (plugins pessoais) e clique no botão **“+”**.

**4.** Escolha a opção de **enviar/subir um pacote** (aparece como *Upload*, e o pacote fica
listado depois sob o nome **“My Uploads”**). Selecione o arquivo
**`clube-ia-governanca-1.3.1.zip`**.

**5.** O plugin **`clube-ia-governanca`** aparece na lista. Deixe-o **ativado**.

**6.** **Feche e reabra o Claude Desktop.** Isso faz as skills carregarem.

> A tela do Claude Desktop muda de tempos em tempos. Se algum nome de botão estiver diferente do
> que está escrito aqui, procure pelo que for mais parecido — a sequência (Configurações → Plugins
> → “+” → enviar o pacote) continua a mesma. Na dúvida, chame no grupo.

---

## Como saber se deu certo

Abra uma conversa nova e escreva:

```
Quais skills do clube-ia-governanca você tem disponíveis?
```

Ele deve listar as **9**:

`spec-builder` · `governanca-projeto` · `commit-github` · `quality-validator` ·
`lgpd-saude-guard` · `security-review` · `resilience-checkpoint` · `observability-setup` ·
`hangar-sync`

Se aparecerem as 9, acabou.

---

## Um cuidado que evita dor de cabeça

**Instale o plugin por um caminho só.** Se você já tinha alguma dessas skills instalada
**avulsa** (uma a uma, fora do plugin), **desative as avulsas** em **Configurações → Skills**.

O motivo é prático: com a mesma skill instalada duas vezes, o Claude pode rodar a versão velha
sem avisar, e você não tem como saber qual das duas respondeu. Uma origem só = nenhuma dúvida.

---

## Para que serve cada skill

O pipeline vai da ideia até o arquivo. Você não precisa decorar — é só pedir pelo nome quando
chegar o momento.

| # | Skill | Quando usar |
|---|-------|-------------|
| 1 | `spec-builder` | Tenho uma ideia e quero transformar em documento |
| 2 | `governanca-projeto` | Vou começar o projeto e preciso organizar a pasta |
| 3 | `commit-github` | Quero salvar/versionar o trabalho no GitHub |
| 4 | `quality-validator` | Terminei uma etapa e quero revisar a qualidade |
| 5 | `lgpd-saude-guard` | Checar LGPD e CFM 2.454 antes de seguir |
| 6 | `security-review` | Testar se dá para invadir, antes do deploy |
| 7 | `resilience-checkpoint` | E se o banco cair? Tenho backup que funciona? |
| 8 | `observability-setup` | Já está no ar — quem acessou o prontuário? |
| 9 | `hangar-sync` | Projeto pronto: catalogar como “nave” no HANGAR |

Os de número **4 a 8** são **portões**: eles te mostram o risco e **você decide**. Eles não
travam nada sozinhos, e são feitos para explicar o risco em português de consultório — se algum
deles te devolver algo que você não entendeu, isso é um defeito da skill, não seu. Avise no grupo.

---

## Quando sair uma versão nova

O Gui manda um `.zip` novo com o número maior (por exemplo `1.4.0`). Para atualizar:
**remova o plugin antigo** em Configurações → Plugins e **instale o novo pacote** pelos mesmos
6 passos. O sistema de plugins ainda não atualiza sozinho.

Confira o número da versão que você tem na própria tela de Plugins, ao lado do nome.

---

## Se der problema

1. **As skills não aparecem** → feche o Claude Desktop **por completo** e abra de novo.
   O passo 6 é o mais esquecido.
2. **O Claude usou uma versão que não é a que instalei** → provavelmente há uma cópia avulsa
   ativa. Veja *“Um cuidado que evita dor de cabeça”* acima.
3. **Não achei o botão “+”** → confirme que está na seção **Personal plugins**, não na lista de
   plugins já instalados.
4. **Qualquer outra coisa** → manda print da tela no grupo do clube. Não fique travado.

---

**Versão do pacote:** 1.3.1 · **Clube da IA — Endolife Health-Tech × Inova UNIMES**
