// ===================================================================
// HANGAR · Funções auxiliares das naves
// Tudo aqui é cálculo simples em cima dos dados do dados-hangar.json.
// ===================================================================

// Mapa de status: classe de cor, cor da luzinha e o rótulo que aparece.
export const STATUS = {
  operacional: { classe: 's-ok', dot: 'ok', rotulo: 'operacional' },
  manutencao: { classe: 's-maint', dot: 'maint', rotulo: 'em manutenção' },
  'em-solo': { classe: 's-down', dot: 'down', rotulo: 'em solo' },
  'em-construcao': { classe: 's-build', dot: 'build', rotulo: 'em construção' },
  arquivada: { classe: 's-arch', dot: 'arch', rotulo: 'arquivada' },
}

// Soma o custo mensal de UMA nave (somando todos os serviços dela).
export function custoDaNave(nave) {
  const custos = Array.isArray(nave?.custos) ? nave.custos : []
  return custos.reduce((soma, c) => soma + (Number(c?.valorMensal) || 0), 0)
}

// ===================================================================
// Réguas de inteligência (M4) — sugestões honestas sobre cada nave.
// Tudo aqui é heurística simples e transparente em cima dos dados.
// ===================================================================

// Junta os textos onde podem estar pistas de "24/7", tráfego, etc.
// NÃO inclui o `isolamento.motivo`: ele é a justificativa em prosa e costuma
// NEGAR critérios ("sem necessidade de ficar 24/7") — a régua não entende
// negação, então só lemos fatos objetivos (tipo, descrição, infra, recursos).
function textoDaNave(nave) {
  return [
    nave?.tipo,
    nave?.descricao,
    nave?.recursos?.nota,
    nave?.recursos?.cpu,
    nave?.recursos?.ram,
    nave?.infra?.vpsServidor,
  ]
    .filter(Boolean)
    .join(' · ')
}

// 7.2 — Isolamento recomendado. Sugere "doca própria" quando QUALQUER um for
// verdade: dado sensível (LGPD alta), precisa ficar 24/7, tráfego alto, ou as
// dependências brigam. Devolve o tipo sugerido + os motivos (pra explicar).
export function isolamentoRecomendado(nave) {
  const t = textoDaNave(nave)
  const motivos = []
  if (nave?.banco?.sensibilidadeLGPD === 'alta') motivos.push('lida com dado sensível (LGPD alta)')
  if (/24\s*\/\s*7|24\s*horas|sempre\s*lig|de\s*p[ée]\s*24/i.test(t)) motivos.push('precisa ficar de pé 24/7')
  if (/tr[aá]fego\s*alto|alto\s*tr[aá]fego|muito\s*acesso/i.test(t)) motivos.push('tem tráfego alto')
  if (/depend[eê]ncias\s*brigam|conflito\s*de\s*depend|vers[õo]es\s*brigam/i.test(t))
    motivos.push('as dependências brigam com as de outro projeto')
  return { tipo: motivos.length ? 'doca-propria' : 'compartilhado', motivos }
}

// 7.3 — Diagnóstico de recursos. Procura possível desperdício: servidor PAGO +
// folga grande (RAM usada bem abaixo da contratada, padrão "X GB de Y GB").
export function diagnosticoRecursos(nave) {
  const vps = String(nave?.infra?.vpsServidor || '').trim()
  const temServidor = vps !== '' && vps !== '—'
  const pago = temServidor && custoDaNave(nave) > 0

  // Tenta ler "~3 GB de 4 GB" → usado / contratado.
  // Exige o "de" COLADO entre os dois valores (sem atravessar prosa), pra não
  // inverter usado/contratado em textos do tipo "16 GB de RAM, usando 2 GB".
  let usadoGB = null
  let contratadoGB = null
  const m = String(nave?.recursos?.ram || '').match(
    /(\d+(?:[.,]\d+)?)\s*GB\s+de\s+(\d+(?:[.,]\d+)?)\s*GB/i,
  )
  if (m) {
    usadoGB = parseFloat(m[1].replace(',', '.'))
    contratadoGB = parseFloat(m[2].replace(',', '.'))
  }

  const folga =
    usadoGB != null && contratadoGB > 0 && usadoGB <= contratadoGB && usadoGB / contratadoGB < 0.5
  return { pago, usadoGB, contratadoGB, desperdicio: pago && folga }
}

// Lista de alertas REAIS de uma nave (só as réguas 7.2 + 7.3).
// Cada alerta: { tipo, titulo, texto }. Vazio = nave coerente.
export function alertasDaNave(nave) {
  const alertas = []

  const iso = isolamentoRecomendado(nave)
  const declarado = nave?.isolamento?.tipo
  if (declarado && declarado !== iso.tipo) {
    if (iso.tipo === 'doca-propria') {
      alertas.push({
        tipo: 'isolamento',
        titulo: 'Considere uma doca própria',
        texto: `Esta nave ${iso.motivos.join(' e ')} — vale isolar num servidor/contêiner só dela, em vez de dividir o hangar.`,
      })
    } else {
      alertas.push({
        tipo: 'isolamento',
        titulo: 'Talvez dê pra compartilhar',
        texto:
          'Sem dado sensível, necessidade de ficar 24/7, tráfego alto ou conflito de dependências — daria pra usar hangar compartilhado e baratear.',
      })
    }
  }

  const rec = diagnosticoRecursos(nave)
  if (rec.desperdicio) {
    alertas.push({
      tipo: 'recursos',
      titulo: 'Possível superdimensionamento',
      texto: `Servidor pago usando só ~${rec.usadoGB} GB de ${rec.contratadoGB} GB de RAM — talvez dê pra um plano menor. (Caminhão pra entregar pizza.)`,
    })
  }

  return alertas
}

// Uma nave "precisa de atenção" quando dispara algum alerta real.
export function precisaAtencao(nave) {
  return alertasDaNave(nave).length > 0
}

// Números da faixa de telemetria no topo da Baia.
export function calcularTelemetria(naves) {
  const lista = Array.isArray(naves) ? naves : []
  return {
    total: lista.length,
    operacionais: lista.filter((n) => n?.status === 'operacional').length,
    custoTotal: lista.reduce((soma, n) => soma + custoDaNave(n), 0),
    alertas: lista.reduce((soma, n) => soma + alertasDaNave(n).length, 0),
  }
}

// Soma o custo por serviço entre toda a frota (pro painel de custos).
// Junta serviços de mesmo nome (ex.: todo "Vercel" numa linha só).
export function custoPorServico(naves) {
  const lista = Array.isArray(naves) ? naves : []
  const mapa = new Map()
  for (const nave of lista) {
    const custos = Array.isArray(nave?.custos) ? nave.custos : []
    for (const c of custos) {
      const nome = String(c?.servico || '—').trim()
      const valor = Number(c?.valorMensal) || 0
      const atual = mapa.get(nome) || { servico: nome, valorMensal: 0, naves: 0 }
      atual.valorMensal += valor
      atual.naves += 1
      mapa.set(nome, atual)
    }
  }
  return [...mapa.values()].sort((a, b) => b.valorMensal - a.valorMensal)
}

// Encurta um texto descritivo num rótulo curto de "chip".
// Ex.: "Supabase (Postgres)" -> "Supabase"; "VPS Hetzner — 2 vCPU" -> "VPS Hetzner".
function encurtar(texto) {
  return String(texto).split('(')[0].split('—')[0].split(' · ')[0].trim()
}

// Monta até 3 "chips" de tecnologia a partir do stack de cada nave.
// (Auto-gerados — dá pra refinar a curadoria depois.)
export function chipsDaNave(nave) {
  const s = nave?.stack || {}
  const candidatos = [
    s.frontend,
    nave?.infra?.docker ? 'Docker' : null,
    s.banco,
    s.hospedagem,
    ...(Array.isArray(s.modelosIA) ? s.modelosIA : []),
    ...(Array.isArray(s.servicos) ? s.servicos : []),
    s.backend,
  ]

  const vistos = new Set()
  const chips = []
  for (const bruto of candidatos) {
    if (!bruto) continue
    const limpo = encurtar(bruto)
    if (!limpo || limpo === '—') continue
    if (/^(nenhum|nenhuma|sem |n\/a|-)/i.test(limpo)) continue // pula valores vazios/genéricos
    if (limpo.length > 18) continue // evita chips longos demais
    const chave = limpo.toLowerCase()
    if (vistos.has(chave)) continue
    vistos.add(chave)
    chips.push(limpo)
    if (chips.length >= 3) break
  }
  return chips
}
