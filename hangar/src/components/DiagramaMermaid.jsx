import { useEffect, useId, useState } from 'react'
import mermaid from 'mermaid'

// Inicializa o Mermaid UMA vez, com o tema escuro casado ao HOLOCRON.
// securityLevel 'strict' = sem HTML/cliques embutidos no diagrama (seguro).
let inicializado = false
function inicializarMermaid() {
  if (inicializado) return
  inicializado = true
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: {
      darkMode: true,
      background: 'transparent',
      fontFamily: "'Manrope', system-ui, sans-serif",
      fontSize: '15px',
      primaryColor: '#14294D', // fundo das caixas (steel)
      primaryBorderColor: '#00C2FF', // borda saber
      primaryTextColor: '#F4F6FA', // texto paper
      secondaryColor: '#0B1E3F',
      secondaryBorderColor: '#1F3358',
      secondaryTextColor: '#F4F6FA',
      tertiaryColor: '#0F1726',
      tertiaryBorderColor: '#1F3358',
      tertiaryTextColor: '#C8D1DD',
      mainBkg: '#14294D',
      nodeBorder: '#00C2FF',
      clusterBkg: '#0B1E3F',
      clusterBorder: '#1F3358',
      lineColor: '#5B86B3', // setas (silver-saber)
      textColor: '#C8D1DD',
      edgeLabelBackground: '#0B1E3F',
    },
  })
}

// Desenha o `arquitetura.mermaid` de uma nave. Se o texto for inválido,
// NÃO quebra a tela: mostra o texto cru com um aviso gentil.
export default function DiagramaMermaid({ codigo, rotulo }) {
  const idBruto = useId()
  const id = `mm-${idBruto.replace(/[^a-zA-Z0-9]/g, '')}`
  const codigoLimpo = String(codigo || '').trim()
  const [svg, setSvg] = useState('')
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let vivo = true
    if (!codigoLimpo) {
      setSvg('')
      setErro(false)
      return
    }
    inicializarMermaid()
    // parse() valida sem sujar o DOM; só então render() desenha.
    mermaid
      .parse(codigoLimpo)
      .then(() => mermaid.render(id, codigoLimpo))
      .then(({ svg }) => {
        if (vivo) {
          setSvg(svg)
          setErro(false)
        }
      })
      .catch(() => {
        if (vivo) {
          setSvg('')
          setErro(true)
        }
      })
    return () => {
      vivo = false
    }
  }, [codigoLimpo, id])

  if (!codigoLimpo) return null

  if (erro) {
    return (
      <div className="mermaid-erro" role="note">
        <span className="mermaid-erro-tit">
          Não consegui desenhar este mapa — segue o texto original:
        </span>
        <pre className="mermaid-codigo">{codigoLimpo}</pre>
      </div>
    )
  }

  return svg ? (
    <div
      className="mermaid-svg"
      role="img"
      aria-label={rotulo || 'Diagrama da arquitetura da nave'}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  ) : (
    <p className="mermaid-carregando">Desenhando o mapa…</p>
  )
}
