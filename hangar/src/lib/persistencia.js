// ===================================================================
// HANGAR · Persistência — falar com o "ajudante de salvar" do servidor
// e exportar/importar o dados-hangar.json.
// ===================================================================

// Pergunta ao servidor o "carimbo" (versão) do arquivo no disco.
// Devolve null se o ajudante não estiver de pé (ex.: build estático).
export async function obterEstadoArquivo() {
  try {
    const resp = await fetch('/__hangar/estado')
    const corpo = await resp.json()
    return corpo?.ok ? (corpo.mtime ?? null) : null
  } catch {
    return null
  }
}

// Grava o objeto inteiro no dados-hangar.json (via servidor local).
// Envia o carimbo do arquivo que o app leu: se o disco mudou desde então
// (outra aba, uma skill), o servidor recusa com 409 e ninguém perde nada.
// Lança erro se não conseguir (ex.: rodando fora do `npm run dev`).
export async function salvarNoArquivo(dados, baseMtime) {
  const headers = { 'Content-Type': 'application/json', 'X-Hangar': '1' }
  if (baseMtime) headers['X-Hangar-Base'] = baseMtime
  const resp = await fetch('/__hangar/salvar', {
    method: 'POST',
    headers,
    body: JSON.stringify(dados),
  })
  let corpo = null
  try {
    corpo = await resp.json()
  } catch {
    // resposta não-JSON (ex.: build estático sem o ajudante)
  }
  if (!resp.ok || !corpo?.ok) {
    const erro = new Error(corpo?.erro || 'Não foi possível salvar no arquivo.')
    erro.conflito = resp.status === 409 || corpo?.conflito === true
    throw erro
  }
  return corpo.mtime ?? null // novo carimbo do arquivo
}

// Baixa uma cópia do dados-hangar.json (backup / GitHub).
export function exportarArquivo(dados) {
  const conteudo = JSON.stringify(dados, null, 2) + '\n'
  const blob = new Blob([conteudo], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'dados-hangar.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Confere nave por nave (mesma régua do servidor): objeto com id e nome,
// sem id repetido. Devolve a mensagem do problema, ou null se estiver bom.
export function problemaNasNaves(naves) {
  const vistos = new Set()
  for (let i = 0; i < naves.length; i++) {
    const n = naves[i]
    if (!n || typeof n !== 'object' || Array.isArray(n)) return `A nave nº ${i + 1} do arquivo não é válida.`
    if (typeof n.id !== 'string' || !n.id.trim()) return `A nave nº ${i + 1} do arquivo está sem apelido (id).`
    if (typeof n.nome !== 'string' || !n.nome.trim()) return `A nave "${n.id}" do arquivo está sem nome.`
    if (vistos.has(n.id)) return `O arquivo tem duas naves com o mesmo id "${n.id}".`
    vistos.add(n.id)
  }
  return null
}

// Lê um arquivo .json escolhido pelo usuário e devolve o objeto (validado).
export function importarArquivo(file) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader()
    leitor.onload = () => {
      try {
        const dados = JSON.parse(String(leitor.result))
        if (!dados || typeof dados !== 'object' || !Array.isArray(dados.naves)) {
          throw new Error('Esse arquivo não parece um dados-hangar.json (faltou a lista "naves").')
        }
        const problema = problemaNasNaves(dados.naves)
        if (problema) throw new Error(`Importação cancelada por segurança: ${problema}`)
        resolve(dados)
      } catch (e) {
        reject(new Error(e?.message || 'Arquivo inválido.'))
      }
    }
    leitor.onerror = () => reject(new Error('Não foi possível ler o arquivo.'))
    leitor.readAsText(file)
  })
}
