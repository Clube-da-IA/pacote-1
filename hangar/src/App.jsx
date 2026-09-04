// FONTE ÚNICA DA VERDADE: o app lê deste arquivo e (no M3) escreve nele.
import { useEffect, useRef, useState } from 'react'
import dadosHangarInicial from '../dados-hangar.json'

import Telemetria from './components/Telemetria.jsx'
import NaveCard from './components/NaveCard.jsx'
import FichaNave from './components/FichaNave.jsx'
import EditorNave from './components/EditorNave.jsx'
import Confirmacao from './components/Confirmacao.jsx'
import PainelCustos from './components/PainelCustos.jsx'
import PainelAlertas from './components/PainelAlertas.jsx'
import Glossario from './components/Glossario.jsx'
import FundoCosmos from './components/FundoCosmos.jsx'
import ModoObservacao from './components/ModoObservacao.jsx'
import { calcularTelemetria } from './lib/naves'
import { salvarNoArquivo, exportarArquivo, importarArquivo, obterEstadoArquivo } from './lib/persistencia'
import { emitirCosmos } from './lib/cosmos-bus'

// Data de hoje no fuso local (UTC gravava "amanhã" depois das 21h no Brasil).
const hoje = () => {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Insere a nave nova antes da própria "hangar" (que fica por último).
function inserirNave(naves, nova) {
  const idx = naves.findIndex((n) => n.id === 'hangar')
  if (idx === -1) return [...naves, nova]
  return [...naves.slice(0, idx), nova, ...naves.slice(idx)]
}

export default function App() {
  const [dados, setDados] = useState(dadosHangarInicial)
  const [naveId, setNaveId] = useState(null) // ficha aberta
  const [painel, setPainel] = useState(null) // 'custos' | 'alertas' | 'glossario'
  const [editando, setEditando] = useState(null) // { modo: 'nova' } | { modo: 'editar', nave }
  const [confirmacao, setConfirmacao] = useState(null) // { titulo, texto, rotulo, perigo, aoConfirmar }
  const [toast, setToast] = useState(null) // { tipo, texto }
  const [salvando, setSalvando] = useState(false)
  // Fundo cosmos ligado por padrão; a escolha fica salva no navegador.
  const [cosmosOn, setCosmosOn] = useState(() => {
    try { return localStorage.getItem('hangar-cosmos') !== 'off' } catch { return true }
  })
  const inputArquivo = useRef(null)

  const alternarCosmos = () => setCosmosOn((v) => {
    const n = !v
    try { localStorage.setItem('hangar-cosmos', n ? 'on' : 'off') } catch { /* modo anônimo */ }
    return n
  })

  // Abre a ficha e dá um "roll" na nave (evento do cosmos).
  const verFicha = (id) => { emitirCosmos('ficha'); setNaveId(id) }
  // "Carimbo" do arquivo no disco quando o app o leu — o servidor compara
  // antes de gravar e recusa (409) se alguém mudou o arquivo por fora.
  const mtimeArquivo = useRef(null)

  useEffect(() => {
    obterEstadoArquivo().then((m) => { mtimeArquivo.current = m })
  }, [])

  const base = dados?.base || '—'
  const versao = dados?.versaoDados || '0.0'
  const naves = Array.isArray(dados?.naves) ? dados.naves : []
  const tel = calcularTelemetria(naves)
  const naveSelecionada = naveId ? naves.find((n) => n.id === naveId) : null

  // Toast some sozinho depois de alguns segundos (erro fica mais tempo na tela).
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), toast.tipo === 'erro' ? 8000 : 3800)
    return () => clearTimeout(t)
  }, [toast])

  // Grava o objeto inteiro no arquivo. Só atualiza a tela se gravou de verdade.
  const persistir = async (novosDados) => {
    setSalvando(true)
    const paraSalvar = { ...novosDados, atualizadoEm: hoje() }
    try {
      const novoCarimbo = await salvarNoArquivo(paraSalvar, mtimeArquivo.current)
      mtimeArquivo.current = novoCarimbo
      setDados(paraSalvar)
      setToast({ tipo: 'ok', texto: 'Salvo no dados-hangar.json ✓' })
      emitirCosmos('salvou') // hyperspace 🚀
      return true
    } catch (e) {
      setToast({
        tipo: 'erro',
        texto: e.conflito ? `⚠ ${e.message}` : `Não salvou: ${e.message}`,
      })
      return false
    } finally {
      setSalvando(false)
    }
  }

  const aoSalvarNave = async (final) => {
    const novasNaves = editando?.modo === 'nova'
      ? inserirNave(naves, final)
      : naves.map((n) => (n.id === final.id ? final : n))
    const ok = await persistir({ ...dados, naves: novasNaves })
    if (ok) {
      setEditando(null)
      setNaveId(final.id) // mostra a ficha da nave salva
    }
  }

  // Pede confirmação antes de excluir.
  const pedirExclusao = (nave) => {
    setConfirmacao({
      titulo: 'Excluir nave?',
      texto: (
        <>
          Tem certeza que quer excluir <strong>{nave.nome}</strong>? Isso grava direto no{' '}
          <code>dados-hangar.json</code>. A versão anterior fica salva como backup, então dá pra
          voltar atrás importando o backup.
        </>
      ),
      rotulo: 'Excluir',
      perigo: true,
      aoConfirmar: async () => {
        const ok = await persistir({ ...dados, naves: naves.filter((n) => n.id !== nave.id) })
        if (ok) {
          setConfirmacao(null)
          setNaveId(null)
        }
      },
    })
  }

  // Abre a ficha de uma nave a partir de um painel (fecha o painel).
  const abrirNave = (id) => {
    setPainel(null)
    verFicha(id)
  }

  const aoExportar = () => {
    exportarArquivo(dados)
    setToast({ tipo: 'ok', texto: 'Cópia baixada ✓' })
  }

  // Importar: lê o arquivo, recusa se vier vazio, e pede confirmação (substitui tudo).
  const aoEscolherArquivo = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    let importado
    try {
      importado = await importarArquivo(file)
    } catch (err) {
      setToast({ tipo: 'erro', texto: err.message })
      return
    }
    if (!importado.naves.length) {
      setToast({ tipo: 'erro', texto: 'Esse arquivo não tem nenhuma nave — importação cancelada por segurança.' })
      return
    }
    // Preserva nome da base e versão se o arquivo importado não trouxer.
    const merged = {
      ...importado,
      base: importado.base ?? dados.base,
      versaoDados: importado.versaoDados ?? dados.versaoDados,
    }
    setConfirmacao({
      titulo: 'Substituir todas as naves?',
      texto: (
        <>
          Importar vai <strong>substituir as {naves.length} naves atuais</strong> pelas{' '}
          <strong>{importado.naves.length}</strong> do arquivo, gravando no{' '}
          <code>dados-hangar.json</code>. A versão atual fica salva como backup.
        </>
      ),
      rotulo: 'Substituir',
      perigo: true,
      aoConfirmar: async () => {
        const ok = await persistir(merged)
        if (ok) {
          setConfirmacao(null)
          setNaveId(null)
          setEditando(null)
        }
      },
    })
  }

  return (
    <>
    {cosmosOn && <FundoCosmos naves={naves} onAbrirNave={abrirNave} ativo={cosmosOn} />}
    {cosmosOn && <ModoObservacao tel={tel} base={base} ativo={cosmosOn} />}
    <div className={`console${cosmosOn ? ' vidro' : ''}`}>
      <div className="tech-grid" aria-hidden="true"></div>
      <span className="corner tl" aria-hidden="true"></span>
      <span className="corner tr" aria-hidden="true"></span>
      <span className="corner bl" aria-hidden="true"></span>
      <span className="corner br" aria-hidden="true"></span>

      <header className="thead">
        <span className="l">
          <span className="dot" aria-hidden="true"></span>
          HOLOCRON · HANGAR · SALA DE CONTROLE
        </span>
        <span className="r">
          BASE {String(base).toUpperCase()} · v{versao}
        </span>
      </header>

      <main>
        {editando ? (
          <EditorNave
            ehNova={editando.modo === 'nova'}
            naveInicial={editando.nave}
            idsExistentes={naves.map((n) => n.id)}
            salvando={salvando}
            onSalvar={aoSalvarNave}
            onCancelar={() => setEditando(null)}
          />
        ) : naveSelecionada ? (
          <FichaNave
            nave={naveSelecionada}
            onVoltar={() => setNaveId(null)}
            onEditar={() => setEditando({ modo: 'editar', nave: naveSelecionada })}
            onExcluir={() => pedirExclusao(naveSelecionada)}
          />
        ) : painel === 'custos' ? (
          <PainelCustos naves={naves} onVoltar={() => setPainel(null)} onAbrirNave={abrirNave} />
        ) : painel === 'alertas' ? (
          <PainelAlertas naves={naves} onVoltar={() => setPainel(null)} onAbrirNave={abrirNave} />
        ) : painel === 'glossario' ? (
          <Glossario onVoltar={() => setPainel(null)} />
        ) : (
          <>
            <div className="hero">
              <div className="eyebrow">Visão geral da frota</div>
              <h1>HANGAR</h1>
              <p className="deck">
                Cada projeto é uma nave. Aqui você vê, num lugar só, tudo que faz cada
                uma voar — arquitetura, chaves, banco, servidores, custo e o que
                precisa de reparo.
              </p>
            </div>

            <Telemetria
              {...tel}
              onAbrirCustos={() => setPainel('custos')}
              onAbrirAlertas={() => setPainel('alertas')}
            />

            <div className="bayhead">
              <span className="t">Naves no hangar</span>
              <div className="bayhead-r">
                <span className="hint">toque numa nave → ficha técnica</span>
                <div className="acoes-frota">
                  <button type="button" className="btn-sec" onClick={() => setPainel('glossario')}>📖 Glossário</button>
                  <button type="button" className="btn-sec" onClick={aoExportar}>⬆ Exportar</button>
                  <button type="button" className="btn-sec" onClick={() => inputArquivo.current?.click()}>⬇ Importar</button>
                  <button type="button" className="btn-nova" onClick={() => setEditando({ modo: 'nova' })}>+ Nova nave</button>
                </div>
              </div>
            </div>

            {naves.length === 0 ? (
              <p className="vazio">Nenhuma nave no hangar ainda. Clique em “+ Nova nave”.</p>
            ) : (
              <div className="bay">
                {naves.map((n) => (
                  <NaveCard key={n.id} nave={n} onAbrir={() => verFicha(n.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="foot">
        <span className="d" aria-hidden="true"></span>
        Clube da IA · Endolife Health-Tech × Inova UNIMES · HANGAR v{versao}
        <span className="cosmos-acoes">
          {cosmosOn && (
            <button type="button" className="btn-cosmos" onClick={() => emitirCosmos('observar')} title="Modo observação">
              ☾ observar
            </button>
          )}
          <button type="button" className="btn-cosmos" onClick={alternarCosmos} title="Liga/desliga o fundo espacial">
            {cosmosOn ? '✦ cosmos on' : '✦ cosmos off'}
          </button>
        </span>
      </footer>

      <input
        ref={inputArquivo}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={aoEscolherArquivo}
      />

      {confirmacao && (
        <Confirmacao
          titulo={confirmacao.titulo}
          texto={confirmacao.texto}
          rotulo={confirmacao.rotulo}
          perigo={confirmacao.perigo}
          ocupado={salvando}
          onConfirmar={confirmacao.aoConfirmar}
          onCancelar={() => setConfirmacao(null)}
        />
      )}

      {toast && <div className={`toast toast-${toast.tipo}`} role="status">{toast.texto}</div>}
    </div>
    </>
  )
}
