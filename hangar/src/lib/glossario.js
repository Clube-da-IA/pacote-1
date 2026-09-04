// ===================================================================
// HANGAR · Glossário — explicações em "linguagem de gente"
// Alimenta os ícones ⓘ da ficha técnica. Cada termo: título + texto curto
// com uma analogia. "O app ensina enquanto organiza."
// ===================================================================

export const glossario = {
  deploy: {
    titulo: 'Deploy',
    texto:
      'Publicar o app — colocar a versão nova no ar pra todo mundo usar. Como abrir a loja depois de arrumar as prateleiras.',
  },
  cicd: {
    titulo: 'CI/CD',
    texto:
      'A esteira que leva seu código do computador até o ar. Quanto mais alto o nível, mais robôs conferem e publicam por você (veja a régua N0–N4 ao lado).',
  },
  docker: {
    titulo: 'Docker',
    texto:
      'Empacota o app com tudo que ele precisa numa "caixa" que roda igual em qualquer máquina. Como um contêiner de navio: o que vai dentro viaja sem bagunçar o resto.',
  },
  container: {
    titulo: 'Contêiner',
    texto: 'Uma "caixa" isolada onde o app roda com as próprias coisas, sem se misturar com os vizinhos.',
  },
  vps: {
    titulo: 'VPS',
    texto:
      'Um computador alugado na internet, ligado 24 horas, que você controla. Como alugar uma salinha só sua num prédio.',
  },
  lgpd: {
    titulo: 'LGPD',
    texto:
      'A lei brasileira de proteção de dados pessoais. "Sensibilidade alta" = dado de saúde / de paciente, que pede cuidado redobrado.',
  },
  serverless: {
    titulo: 'Serverless',
    texto:
      'Você não cuida de servidor nenhum — a nuvem liga e desliga sozinha conforme o uso e você paga só pelo que usar. Como táxi em vez de carro próprio.',
  },
  supabase: {
    titulo: 'Supabase',
    texto: 'Um serviço pronto de banco de dados (Postgres) na nuvem, já com login e segurança embutidos.',
  },
  postgres: {
    titulo: 'Postgres',
    texto: 'Um banco de dados robusto e gratuito, dos mais usados do mundo, que guarda tudo em tabelas.',
  },
  rls: {
    titulo: 'RLS (segurança por linha)',
    texto:
      'Deixa a regra de "quem pode ver o quê" dentro do próprio banco: cada pessoa só enxerga as linhas que tem permissão.',
  },
  vercel: {
    titulo: 'Vercel',
    texto: 'Um serviço que publica sites e apps na internet quase com um clique, cuidando dos servidores por você.',
  },
  mermaid: {
    titulo: 'Mermaid',
    texto:
      'Uma ferramenta que desenha diagramas a partir de texto: você escreve as caixas e setas, ela desenha o mapa — é o desenho que aparece aqui na ficha.',
  },
  branch: {
    titulo: 'Branch (ramo)',
    texto:
      'Uma linha do tempo paralela do código pra você mexer sem bagunçar a versão principal. Depois junta de volta.',
  },
  githubflow: {
    titulo: 'GitHub Flow',
    texto:
      'Um jeito simples de versionar: uma linha principal sempre funcional (a "main") e ramos curtos pra cada mudança.',
  },
  byok: {
    titulo: 'BYOK (traga sua chave)',
    texto:
      'O app não tem chave de IA embutida — quem usa cola a própria. Só há chamada (e custo) se a pessoa escolher usar.',
  },
  pwa: {
    titulo: 'PWA',
    texto: 'Um app que você instala no celular direto pelo navegador e abre como um aplicativo normal.',
  },
  whisper: {
    titulo: 'Whisper',
    texto: 'Um modelo de IA que transcreve voz em texto.',
  },
  token: {
    titulo: 'Link com token',
    texto: 'Um endereço secreto que dá acesso a um formulário sem precisar criar conta nem senha.',
  },
  serveractions: {
    titulo: 'Server Actions',
    texto:
      'Um recurso do Next.js pra rodar código no servidor direto a partir da tela, sem montar uma API separada.',
  },
  isolamento: {
    titulo: 'Isolamento',
    texto:
      'Se a nave divide ambiente ("hangar compartilhado", mais barato) ou fica numa "doca própria" (servidor/contêiner só dela). Doca própria é sugerida quando há dado sensível, precisa ficar de pé 24/7, tem tráfego alto ou as dependências brigam.',
  },
}

// Detecta o primeiro termo do glossário citado num texto, pra ligar o ⓘ
// automaticamente nos campos da ficha. Ordem importa (do mais específico ao geral).
const PISTAS = [
  [/docker/i, 'docker'],
  [/serverless/i, 'serverless'],
  [/\bvps\b/i, 'vps'],
  [/supabase/i, 'supabase'],
  [/postgres/i, 'postgres'],
  [/\brls\b/i, 'rls'],
  [/server actions/i, 'serveractions'],
  [/vercel/i, 'vercel'],
  [/byok/i, 'byok'],
  [/\bpwa\b/i, 'pwa'],
  [/whisper/i, 'whisper'],
  [/mermaid/i, 'mermaid'],
  [/github[- ]flow/i, 'githubflow'],
  [/tokeniza/i, 'token'], // só o sentido "link tokenizado" (evita "tokens do Claude")
  [/doca|compartilhad/i, 'isolamento'],
  [/lgpd/i, 'lgpd'],
  [/deploy|git push/i, 'deploy'],
  [/cont[eê]iner/i, 'container'],
  [/\bbranch\b|\bmain\b/i, 'branch'],
]

// Retorna TODOS os termos do glossário citados num texto (sem repetir), até `max`.
// Assim um campo como "Supabase (Postgres)" ganha um ⓘ para cada termo.
export function detectarTermos(texto, max = 3) {
  if (!texto) return []
  const t = String(texto)
  const achados = []
  for (const [re, chave] of PISTAS) {
    if (re.test(t) && !achados.includes(chave)) {
      achados.push(chave)
      if (achados.length >= max) break
    }
  }
  return achados
}
