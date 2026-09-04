// ===================================================================
// HANGAR · Empacotador do Kit do Clube — `npm run empacotar`
// Monta um zip SÓ com o que o membro precisa (allowlist), deixando de
// fora dados pessoais (dados-hangar.json, backups) e docs internos
// (HANDOFF, BRIEF, tasks/). O membro começa do dados-exemplo.json.
// ===================================================================
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const destino = path.join(raiz, 'kit')
const nomePasta = 'HANGAR'
const pastaKit = path.join(destino, nomePasta)

// O que VAI no pacote (tudo que não está aqui, fica de fora).
const ALLOWLIST = [
  'src',
  'public',
  'scripts/empacotar.mjs',
  'index.html',
  'vite.config.js',
  'package.json',
  'package-lock.json',
  '.gitignore',
  'README.md',
  'dados-exemplo.json',
  'Iniciar-HANGAR.command',
  'Iniciar-HANGAR.bat',
]

// Trava de segurança: nada de dado pessoal no pacote.
const PROIBIDOS = ['dados-hangar.json', 'HANDOFF.md', 'BRIEF_HANGAR.md', 'tasks', 'hangar_conceito.html', 'node_modules', 'dist']

fs.rmSync(destino, { recursive: true, force: true })
fs.mkdirSync(pastaKit, { recursive: true })

for (const item of ALLOWLIST) {
  const de = path.join(raiz, item)
  if (!fs.existsSync(de)) {
    console.error(`✗ Faltou no projeto: ${item} — pacote NÃO gerado.`)
    process.exit(1)
  }
  const para = path.join(pastaKit, item)
  fs.mkdirSync(path.dirname(para), { recursive: true })
  fs.cpSync(de, para, { recursive: true })
}

// Confere a trava: nenhum proibido pode ter escorregado.
for (const proibido of PROIBIDOS) {
  if (fs.existsSync(path.join(pastaKit, proibido))) {
    console.error(`✗ TRAVA: "${proibido}" apareceu no pacote — abortado.`)
    process.exit(1)
  }
}

// Garante que o iniciador do Mac continua executável e zipa preservando permissões.
fs.chmodSync(path.join(pastaKit, 'Iniciar-HANGAR.command'), 0o755)
const zip = path.join(destino, 'HANGAR-kit.zip')
execFileSync('zip', ['-r', '-q', zip, nomePasta], { cwd: destino })

const mb = (fs.statSync(zip).size / 1024 / 1024).toFixed(2)
console.log(`✓ Kit pronto: kit/HANGAR-kit.zip (${mb} MB)`)
console.log('  Dentro: app completo + dados-exemplo.json + README + iniciadores.')
console.log('  Fora  : dados-hangar.json (sua frota), backups, HANDOFF/BRIEF/tasks.')
