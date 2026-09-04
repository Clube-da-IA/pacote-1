# Trilhas por Stack (Bloco 3) — security-review

**Clube da IA · Endolife Health-Tech × Inova UNIMES**

O Bloco 3 aplica os vetores de **vazamento específicos da stack** do projeto. A skill descobre a stack pelo `SPEC.md` §7 (Restrições técnicas → Stack) e roda a trilha certa. v1 cobre **GCP** e **Supabase + Vercel + Prisma** — as duas realidades mais comuns do ecossistema (GCP de um lado; Supabase/Vercel do outro).

> Mesmo padrão dos outros blocos: **o que o atacante tenta → sinal que confirma → comando pra você rodar**.

---

## Como escolher a trilha
1. Leia o SPEC §7 → Stack.
2. Bate com **GCP**? → roda a Trilha GCP.
3. Bate com **Supabase / Vercel / Prisma**? → roda a Trilha Supabase/Vercel/Prisma.
4. **Stack diferente ou não declarada?** → roda só os Blocos 1 e 2 (universais) e **marca pendência**: *"stack X sem trilha específica no v1 — checagens universais aplicadas; vetores próprios da stack ficam como pendência."* **Nunca invente** checagem de uma stack que você não conhece.

---

## Trilha A — GCP *(Endolife hoje)*

Google Cloud. Os vazamentos aqui quase sempre são de **permissão larga demais** ou **recurso exposto**.

### A1 — IAM permissivo demais
- **Atacante tenta:** usar uma conta/serviço com poder de sobra (papel `Owner`/`Editor` onde bastaria leitura) pra alcançar dado que não deveria.
- **Sinal que confirma:** service account com `roles/owner` ou `roles/editor`; permissão concedida a `allUsers`/`allAuthenticatedUsers`.
- **Comando/checagem:** revisar as políticas de IAM do projeto; procurar papéis amplos e concessões a "todos".
- **Correção:** **privilégio mínimo** — cada conta só com o papel necessário; nunca `allUsers` em recurso com dado de paciente.

### A2 — Bucket de Storage público
- **Atacante tenta:** ler um bucket do Cloud Storage aberto (achando a URL).
- **Sinal que confirma:** bucket com acesso a `allUsers`; laudo/imagem de exame em bucket público.
- **Comando/checagem:** listar buckets e checar a política de acesso (nenhum com `allUsers` para dado sensível).
- **Correção:** buckets privados; acesso via URL assinada temporária quando precisar servir arquivo.

### A3 — Chave de service account exportada
- **Atacante tenta:** usar uma **chave JSON de service account** que vazou (commitada no repo, ou baixada e esquecida).
- **Sinal que confirma:** arquivo `*.json` de credencial no repo; chave de service account em código/CI sem cofre.
- **Correção:** não exportar chave — usar **Workload Identity**; se precisar, guardar no **Secret Manager**, nunca no repo. Rotacionar se vazou.

### A4 — Segredo fora do Secret Manager
- **Atacante tenta:** ler credencial/API key escrita direto no código ou em variável de ambiente exposta.
- **Sinal que confirma:** `API_KEY=...`, `DATABASE_URL=...` hardcoded; segredo em arquivo versionado.
- **Correção:** tudo no **Secret Manager**; no repo, só o **local** do segredo, nunca o valor (regra do clube).

### A5 — Serviço sem autenticação / SQL com IP público
- **Atacante tenta:** chamar uma Cloud Function/Cloud Run aberta (invoker público), ou conectar num Cloud SQL com IP público sem rede autorizada.
- **Sinal que confirma:** função com `allUsers` como invoker; Cloud SQL com IP público e sem *authorized networks*.
- **Correção:** exigir autenticação no invoker; Cloud SQL sem IP público (usar conexão privada) ou com redes autorizadas restritas.

> Firebase/Firestore no projeto? Cheque também as **Security Rules** — `allow read, write: if true` é o equivalente GCP da "RLS desligada": libera o banco inteiro.

---

## Trilha B — Supabase + Vercel + Prisma

Aqui está o **vazamento nº1 do vibe coding em saúde**. Preste atenção especial ao B1.

### B1 — RLS desligada *(o buraco que mais vaza — trate como prioridade)*
- **O que é:** *RLS* (Row Level Security) é a trava do Postgres que decide **quais linhas** cada usuário pode ver. No Supabase ela é **opcional, não vem ligada** — tabela criada por SQL/migração nasce **sem** RLS.
- **Por que é grave:** o Supabase gera uma API REST automática a partir das tabelas. A **anon key** (que fica pública no frontend **por design**) só é segura **se a RLS estiver ligada**. Sem RLS, essa chave vira **uma chave-mestra do banco inteiro** — qualquer um lê, e às vezes escreve, todos os dados.
- **O quão real é:** em 2025, o **CVE-2025-48757** atingiu **mais de 170 aplicações geradas por IA** por exatamente isso — RLS não ligada no código gerado. Um vazamento expôs 13 mil usuários. É o ponto cego clássico de código gerado por IA, que prioriza função sobre segurança.
- **Atacante tenta:** bater na API REST com a anon key e ler a tabela de pacientes inteira.
- **Sinal que confirma:** a tabela não tem `ENABLE ROW LEVEL SECURITY`; o painel mostra o aviso "RLS disabled in public".
- **Comando pra você rodar (confirmação de 30 segundos):**
  ```
  curl 'https://<seu-projeto>.supabase.co/rest/v1/pacientes?select=*' \
    -H "apikey: <ANON_KEY>"
  ```
  Resposta **segura = `[]`** (array vazio). Se vier **dado**, a tabela está exposta.
  **Ou** rode o **Security Advisor** no painel do Supabase (ferramenta nativa que varre tabelas sem RLS e colunas expostas).
- **Correção:**
  ```sql
  ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
  -- e uma política que limita cada usuário aos seus dados:
  CREATE POLICY "cada um vê o seu" ON pacientes
    FOR SELECT TO authenticated
    USING ((select auth.uid()) = user_id);
  ```
  Ligue a RLS em **toda** tabela com dado. Ative o toggle "Enable RLS on new tables" do projeto.
- **Norma:** OWASP A01:2025 + LGPD Art. 46.

### B2 — service_role exposta *(bypassa toda a RLS)*
- **Atacante tenta:** achar a **service_role key** no frontend/cliente — ela **ignora completamente a RLS** e dá controle total do banco.
- **Sinal que confirma:** `service_role` em código de cliente, em `NEXT_PUBLIC_...`, ou entregue ao navegador.
- **Correção:** service_role **só no servidor**, nunca no cliente. Se vazou, rotacionar imediatamente no painel.
- **Cruzamento crítico com o Bloco 2:** **assistente de IA com acesso service_role burla a RLS via injeção de prompt** — ou seja, uma IA agêntica (como o assistente de IA) com essa chave pode ser enganada para despejar o banco. Se o projeto conecta IA ao Supabase, este é um achado 🔴.

### B3 — Segredo vazando pelo `NEXT_PUBLIC_` (Vercel/Next.js)
- **O que é:** no Next.js, qualquer variável com prefixo `NEXT_PUBLIC_` é **enviada ao navegador**. É pra isso que serve — mas significa que **um segredo nunca pode ter esse prefixo**.
- **Atacante tenta:** ler o bundle do frontend e pegar uma chave que foi exposta sem querer.
- **Sinal que confirma:** `NEXT_PUBLIC_SERVICE_ROLE`, `NEXT_PUBLIC_API_SECRET`, `NEXT_PUBLIC_DATABASE_URL` — qualquer segredo com esse prefixo.
- **Correção:** segredo **sem** `NEXT_PUBLIC_`, lido só no servidor. No cliente, só o que pode ser público (a anon key, protegida por RLS).

### B4 — Query crua do Prisma (SQL Injection)
- **Atacante tenta:** injetar comando SQL onde o Prisma monta query com string.
- **Sinal que confirma:** uso de `$queryRawUnsafe` ou `$executeRawUnsafe` com input concatenado; template de query montado com `+` e dado do usuário.
- **Correção:** usar a API tipada do Prisma ou `$queryRaw` **parametrizado** (com placeholders), nunca `Unsafe` com input do usuário.
- **Norma:** OWASP A05:2025.

### B5 — Connection string / migrações expostas
- **Atacante tenta:** pegar a `DATABASE_URL` (que dá acesso direto ao banco, contornando a RLS) exposta em repo/log.
- **Sinal que confirma:** `DATABASE_URL` hardcoded, commitada, ou em log; `.env` versionado.
- **Correção:** `DATABASE_URL` só em variável de ambiente do servidor; `.env` no `.gitignore`; documentar o **local**, nunca o valor.

### B6 — Views que furam a RLS
- **Atacante tenta:** ler dado por uma **view** que ignora a RLS das tabelas de baixo (views no Postgres rodam como *security definer* por padrão).
- **Sinal que confirma:** view sobre tabela sensível sem `security_invoker = true` (Postgres 15+), acessível por `anon`/`authenticated`.
- **Correção:** `security_invoker = true` na view, ou revogar acesso de `anon`/`authenticated`, ou pôr a view num schema não exposto.

### B7 — RLS baseada em `user_metadata`
- **Atacante tenta:** alterar o próprio `user_metadata` do token (que o usuário final **pode modificar**) para driblar uma política de RLS que confia nesse campo.
- **Sinal que confirma:** política de RLS que decide acesso lendo `auth.jwt() -> user_metadata`.
- **Correção:** basear a política em `auth.uid()` ou em `app_metadata` (que o usuário não altera), nunca em `user_metadata`.

### B8 — Preview deployment exposto (Vercel)
- **Atacante tenta:** achar uma URL de *preview* (deploy de teste) que aponta pro banco real ou expõe endpoint sem proteção.
- **Sinal que confirma:** preview com as mesmas credenciais de produção e sem proteção de acesso.
- **Correção:** proteger previews (Vercel Authentication); separar credenciais de preview das de produção.

---

## Nota de fronteira

Esta trilha cuida da **arquitetura de segurança** da stack. Ela **não** refaz:
- a auditoria de privacidade/consentimento/CFM → `lgpd-saude-guard` (rodou antes);
- backup e recuperação → `resilience-checkpoint` (roda depois);
- o que **conta como dado sensível** → vem da referência compartilhada `lgpd-saude-guard.md`.

---

**Versão:** 1.0 · **Trilhas v1:** GCP · Supabase/Vercel/Prisma · **Fonte Supabase:** docs oficiais + retrospectiva de segurança 2025 (CVE-2025-48757). Novas trilhas conforme os projetos do clube pedirem.
