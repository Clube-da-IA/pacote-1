import { defineConfig, normalizePath } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// HANGAR · Vite + React (JavaScript)
// O dados-hangar.json (ao lado deste arquivo) é a FONTE ÚNICA DA VERDADE.
// O app LÊ dele (src/App.jsx) e ESCREVE nele através do "ajudante de salvar"
// abaixo — uma peça do servidor local (sem nuvem, sem custo).

const raiz = path.dirname(fileURLToPath(import.meta.url))
const arquivoDados = path.join(raiz, 'dados-hangar.json')
// Caminho com barras normais, do jeito que o Vite entrega ao handleHotUpdate
// (no Windows o path.join usa contrabarras e a comparação nunca bateria).
const arquivoDadosNorm = normalizePath(arquivoDados)
const arquivoExemplo = path.join(raiz, 'dados-exemplo.json')
const GERACOES_BACKUP = 5
// Só arquivos com o carimbo padrão entram na rotação (backup renomeado à mão
// pelo usuário fica fora — nem apagado, nem ocupando geração).
const PADRAO_BACKUP = /^dados-hangar\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}(-\d{3})?\.backup\.json$/

// Primeira execução (Kit do Clube): se ainda não existe frota nesta máquina,
// ela nasce do dados-exemplo.json. O arquivo pessoal nunca vai no pacote.
if (!fs.existsSync(arquivoDados) && fs.existsSync(arquivoExemplo)) {
  fs.copyFileSync(arquivoExemplo, arquivoDados)
}

// "Carimbo" da versão do arquivo no disco (pra detectar mudança externa).
function carimboDoArquivo() {
  return fs.existsSync(arquivoDados) ? String(Math.round(fs.statSync(arquivoDados).mtimeMs)) : null
}

// Validação de verdade (espelhada no importarArquivo do app): cada nave
// precisa ser um objeto com id e nome, e os ids não podem repetir.
function validarDados(dados) {
  if (!dados || typeof dados !== 'object' || !Array.isArray(dados.naves)) {
    return 'Formato inválido: faltou a lista "naves".'
  }
  const vistos = new Set()
  for (let i = 0; i < dados.naves.length; i++) {
    const n = dados.naves[i]
    if (!n || typeof n !== 'object' || Array.isArray(n)) return `A nave nº ${i + 1} não é um objeto válido.`
    if (typeof n.id !== 'string' || !n.id.trim()) return `A nave nº ${i + 1} está sem apelido (id).`
    if (typeof n.nome !== 'string' || !n.nome.trim()) return `A nave "${n.id}" está sem nome.`
    if (vistos.has(n.id)) return `Há duas naves com o mesmo id "${n.id}".`
    vistos.add(n.id)
  }
  return null
}

// Só aceita gravação vinda do próprio app local (anti-CSRF): se a requisição
// trouxer Origin, ele precisa ser localhost; e o app manda o cabeçalho
// X-Hangar (cabeçalho custom força preflight, que este servidor não atende —
// então página de fora não consegue nem enviar o POST).
function origemPermitida(req) {
  const origem = req.headers.origin
  if (!origem) return true // curl/skills locais não mandam Origin
  try {
    const host = new URL(origem).hostname
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]'
  } catch {
    return false
  }
}

// Backup com GERAÇÕES: um arquivo carimbado por gravação, mantendo os 5 mais
// novos. Gravação sem mudança de conteúdo não gasta geração.
function fazerBackup(conteudoNovo) {
  if (!fs.existsSync(arquivoDados)) return
  const atual = fs.readFileSync(arquivoDados, 'utf8')
  if (atual === conteudoNovo) return
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 23) // com milissegundos
  fs.copyFileSync(arquivoDados, path.join(raiz, `dados-hangar.${ts}.backup.json`))
  const backups = fs
    .readdirSync(raiz)
    .filter((f) => PADRAO_BACKUP.test(f))
    .sort()
  for (const velho of backups.slice(0, Math.max(0, backups.length - GERACOES_BACKUP))) {
    fs.unlinkSync(path.join(raiz, velho))
  }
}

// Plugin: expõe POST /__hangar/salvar (grava com backup + escrita atômica)
// e GET /__hangar/estado (carimbo do arquivo, pra detectar conflito).
function ajudanteSalvarHangar() {
  return {
    name: 'hangar-ajudante-salvar',

    // O dados-hangar.json agora É vigiado pelo Vite (pra o F5 sempre ler o
    // arquivo fresco), mas mudanças nele NÃO recarregam a página sozinhas —
    // senão você perderia o que está digitando quando o app salva.
    handleHotUpdate({ file }) {
      if (normalizePath(file) === arquivoDadosNorm) return []
    },

    configureServer(server) {
      server.middlewares.use('/__hangar/estado', (req, res, next) => {
        if (req.method !== 'GET') return next()
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, mtime: carimboDoArquivo() }))
      })

      server.middlewares.use('/__hangar/salvar', (req, res, next) => {
        if (req.method !== 'POST') return next()
        res.setHeader('Content-Type', 'application/json')

        if (!origemPermitida(req) || req.headers['x-hangar'] !== '1') {
          res.statusCode = 403
          return res.end(JSON.stringify({ ok: false, erro: 'Gravação recusada: pedido não veio do próprio HANGAR.' }))
        }

        let corpo = ''
        req.on('data', (pedaco) => {
          corpo += pedaco
          if (corpo.length > 5_000_000) req.destroy() // trava de segurança (5 MB)
        })
        req.on('end', () => {
          try {
            const dados = JSON.parse(corpo)
            const problema = validarDados(dados)
            if (problema) throw new Error(problema)

            // Conflito: se o arquivo mudou no disco desde que o app o leu
            // (outra aba, ou uma skill), NÃO sobrescreve — avisa (409).
            const base = req.headers['x-hangar-base']
            const atual = carimboDoArquivo()
            if (base && atual && base !== atual) {
              res.statusCode = 409
              return res.end(JSON.stringify({
                ok: false,
                conflito: true,
                erro: 'O arquivo mudou fora desta aba (outra aba ou uma skill). Recarregue a página (F5) para ver a versão nova antes de salvar.',
              }))
            }

            const conteudo = JSON.stringify(dados, null, 2) + '\n'
            // 1) Backup da versão anterior (rede de segurança / "desfazer").
            fazerBackup(conteudo)
            // 2) Escrita ATÔMICA: grava num .tmp e troca de uma vez (evita
            //    arquivo pela metade se algo travar no meio).
            const tmp = arquivoDados + '.tmp'
            fs.writeFileSync(tmp, conteudo, 'utf8')
            fs.renameSync(tmp, arquivoDados)
            res.statusCode = 200
            res.end(JSON.stringify({ ok: true, mtime: carimboDoArquivo() }))
          } catch (e) {
            res.statusCode = res.statusCode === 409 ? 409 : 400
            res.end(JSON.stringify({ ok: false, erro: String(e?.message || e) }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), ajudanteSalvarHangar()],
  server: {
    open: true, // abre o navegador sozinho ao subir (Kit do Clube)
    // Sem CORS: o app é 100% mesma-origem e as skills gravam direto no disco.
    // Isso faz o navegador barrar o preflight de QUALQUER outra origem (até
    // outra porta localhost), fechando o último furo de gravação de fora.
    cors: false,
    // Os backups e o .tmp continuam fora do watcher (só fazem barulho).
    // O dados-hangar.json em si É vigiado — assim o F5 sempre lê o arquivo
    // fresco; quem segura o reload da página é o handleHotUpdate acima.
    watch: {
      ignored: ['**/dados-hangar.*.backup.json', '**/dados-hangar.backup.json', '**/dados-hangar.json.tmp'],
    },
  },
})
