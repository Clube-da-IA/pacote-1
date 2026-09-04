# 🛸 HANGAR — a sala de controle dos seus projetos

**Cada projeto seu é uma "nave".** O HANGAR mostra, num lugar só, tudo que faz cada uma voar:
arquitetura, onde moram as chaves, banco de dados, servidores, custo por mês e o que precisa de reparo.

- Roda **só no seu computador** — sem nuvem, sem mensalidade, seus dados não saem daqui.
- Feito para **quem não é programador**: tudo em português, com explicações ⓘ em linguagem de gente.
- Projeto do **Clube da IA** · Endolife Health-Tech × Inova UNIMES.

> **Faz parte do Pacote de Funcionalidades nº 1 do Clube da IA.** O HANGAR é a última etapa do
> pipeline de governança: a skill **`hangar-sync`**, que vem no plugin `clube-ia-governanca`,
> cataloga um projeto pronto aqui dentro e carimba a versão dele. Você pode usar o HANGAR sozinho,
> sem o plugin — mas os dois foram feitos para andar juntos.

> ⚠️ **Desenvolvido e testado no macOS.** O iniciador do Windows (`Iniciar-HANGAR.bat`) vem junto e
> foi escrito com o mesmo cuidado, **mas ainda não foi testado numa máquina Windows de verdade**.
> Se você for o primeiro a rodar no Windows, conte no grupo como foi — com ou sem sucesso.
> O app em si (a parte que você vê no navegador) funciona igual nos dois sistemas.

---

## O que você precisa (uma vez só)

1. **Node.js** — o "motor" que roda o app.
   Baixe a versão **LTS** em [nodejs.org](https://nodejs.org) e instale (próximo, próximo, concluir).
   *Depois de instalar, reinicie o computador* — senão o sistema pode não achar o motor ainda.
2. Descompacte a pasta do HANGAR em um lugar seu (ex.: `Documentos/HANGAR`).
   *Evite pastas sincronizadas com nuvem (OneDrive/Drive) — elas podem atrapalhar o salvamento.*

---

## Como abrir o HANGAR

| Sistema | Faça isso |
|---|---|
| **Mac** | Dois cliques em **`Iniciar-HANGAR.command`** |
| **Windows** | Dois cliques em **`Iniciar-HANGAR.bat`** |

### O que é esse arquivo `Iniciar-HANGAR.command`?

É um **atalho de partida** — um arquivinho de texto com as instruções que ligam o app. Você não
precisa entender o que está escrito dentro dele; precisa saber o que ele faz quando você clica:

**1. Abre uma janela preta do Terminal.** É o programa do Mac que executa comandos. Ela vai aparecer
sozinha e encher de texto correndo. **Isso é normal e é sinal de que deu certo** — não é erro, não é
vírus, não é nada quebrando. Se você nunca viu essa janela, ela assusta um pouco na primeira vez.

**2. Confere se o Node.js está instalado.** Se não estiver, ele avisa em português e te manda para
o site oficial, em vez de dar um erro incompreensível.

**3. Na primeira vez, baixa as peças do app** (cerca de 200 MB, alguns minutos, precisa de
internet). Isso acontece **uma vez só**. Das próximas, ele pula direto para o passo 4.

**4. Liga o HANGAR e abre o navegador sozinho**, já na tela do app.

> ### 🖤 A janela preta é o motor — deixe ela aberta
> Enquanto você usa o HANGAR, **aquela janela do Terminal precisa continuar aberta**. Ela não é uma
> mensagem que você lê e fecha: ela *é* o app rodando. Se fechar, o HANGAR desliga e a página no
> navegador para de funcionar.
>
> **Para desligar o HANGAR quando terminar:** feche essa janela (ou clique nela e aperte `Ctrl + C`).
> Pode minimizar sem medo — só não feche.

### Desbloqueio no Mac (acontece só na primeira vez)

O macOS desconfia de qualquer arquivo executável que não veio da App Store. Como este veio por
download, ele bloqueia na estreia. É esperado — e o desbloqueio é seu, uma vez só:

1. **Tente primeiro:** clique com o **botão direito** no `Iniciar-HANGAR.command` → **Abrir** →
   e no aviso que aparecer, **Abrir** de novo. *(Funciona no macOS 14 ou anterior.)*
2. **Se só aparecer o botão "OK"** (macOS 15 ou mais novo, que endureceu essa regra):
   abra **Ajustes do Sistema → Privacidade e Segurança**, role até a seção **Segurança** — vai ter
   um aviso mencionando o `Iniciar-HANGAR.command` — e clique em **"Abrir Assim Mesmo"**.
   Depois volte na pasta e dê dois cliques no arquivo de novo.

**No Windows** o aviso equivalente é "o Windows protegeu seu PC": clique em **Mais informações** →
**Executar assim mesmo**.

---

## ✨ Transformar em "app" de verdade (opcional, recomendado)

Igual ao "Adicionar à Tela de Início" do iPhone:

- **Mac (Safari):** com o HANGAR aberto → menu **Arquivo → Adicionar ao Dock**. Pronto: ícone no
  Dock, janela própria, sem barra de navegador.
- **Mac/Windows (Chrome ou Edge):** ícone de **instalar** na barra de endereço (ou menu ⋮ →
  *Salvar e compartilhar → Instalar*).

Lembre: o "app" é só a **janela**. O motor continua sendo o `Iniciar-HANGAR` — rode o iniciador
primeiro, depois abra o app.

---

## As 3 naves de exemplo que já vêm dentro

Na primeira vez, o HANGAR cria seu arquivo de dados a partir de uma **frota de exemplo com 3 naves**.
Elas não são de verdade: existem para você ver o app cheio e entender o que preencher. **Edite ou
exclua à vontade** e cadastre as suas.

Foram escolhidas de propósito para cobrir os três formatos mais comuns de projeto do clube:

| Nave | O que ela ensina |
|---|---|
| **Agenda da Clínica** | O projeto completo: site na internet + banco de dados + dado de paciente. É onde os portões de LGPD, segurança e backup importam de verdade. |
| **Calculadora de Reembolso** | O projeto **sem banco de dados**: tudo acontece no navegador e nada fica guardado. Mostra que "não guardo nada" muda o risco de lugar — não o elimina. |
| **Boletim Semanal** | O projeto **sem site e sem servidor**: um roteiro com IA que roda na sua máquina quando você manda. Custo quase zero, nenhuma porta aberta para fora. |

> **Olhe o "Diagnóstico da frota" logo de cara.** A *Agenda da Clínica* chega com um alerta de
> propósito: ela guarda dado de paciente mas está declarada em hangar *compartilhado*. O HANGAR
> percebe e sugere doca própria. Esse é exatamente o tipo de coisa que o app existe para te mostrar
> — e a decisão continua sendo sua.

---

## Onde ficam os meus dados?

Num único arquivo: **`dados-hangar.json`**, dentro desta pasta. Ele é seu.

- Na primeira vez, o HANGAR cria esse arquivo a partir das 3 naves de exemplo.
- A cada salvamento, o app guarda **backups automáticos** (`dados-hangar.<data>.backup.json`,
  as 5 cópias mais recentes).
- O botão **⬆ Exportar** baixa uma cópia — bom para guardar no GitHub ou levar para outra máquina
  (lá, use **⬇ Importar**).

**O que o HANGAR nunca guarda:** senha, chave de API, token — nada disso. Nos campos de chave você
anota apenas **onde** ela mora (ex.: "nas variáveis de ambiente do Vercel"), nunca o valor. Se você
se pegar colando uma chave de verdade aqui, apague: o campo não é para isso.

---

## Como o HANGAR conversa com o plugin do Clube

A skill **`hangar-sync`** (do plugin `clube-ia-governanca`) fecha o ciclo do pipeline: quando um
projeto termina uma etapa, ela lê o projeto, monta a ficha da nave e grava aqui no
`dados-hangar.json` — com backup antes e escrita segura, preservando as outras naves.

Duas coisas que valem saber:

- **Só o esqueleto entra.** A skill nunca traz segredo de produção nem dado real de paciente para
  dentro do HANGAR. É uma trava de LGPD dela, não uma escolha.
- **O catálogo é este arquivo.** Se a skill perguntar onde fica o `dados-hangar.json`, aponte para
  o desta pasta — nunca para dentro da pasta do projeto que está sendo catalogado.

Se você não usa o plugin, ignore esta seção: dá para cadastrar tudo na mão pelo botão **+ Nova nave**.

---

## Como atualizar o HANGAR sem perder as naves

1. **⬆ Exportar** sua frota (por garantia).
2. Troque a pasta do app pela versão nova.
3. Copie o seu `dados-hangar.json` para dentro da pasta nova (ou use **⬇ Importar**).

---

## Problemas comuns

- **"Rodei e não aconteceu nada"** — o navegador deve abrir sozinho. Se não abrir, olhe a janela
  preta: lá aparece o endereço (algo como `http://localhost:5173`). Copie no navegador.
- **"Fechei a janela preta e o app parou"** — é isso mesmo: ela é o motor. Rode o iniciador de novo.
- **"npm não é reconhecido" / "command not found"** — o Node.js não está instalado, ou o computador
  não foi reiniciado depois da instalação.
- **Demorou muito na primeira vez** — é o download das peças (~200 MB). Só acontece uma vez.
- **O Mac não deixa abrir o arquivo** — veja *Desbloqueio no Mac* acima. É normal na estreia.
- **Salvou e não vê a mudança em outra aba** — recarregue a página (F5). O app avisa se houver
  conflito entre duas abas.

Travou em algo que não está aqui? Manda print no grupo do clube. Não fique parado.

---

*HANGAR v0.2 · Clube da IA · Pacote de Funcionalidades nº 1 · feito com Claude Code · tema HOLOCRON*
