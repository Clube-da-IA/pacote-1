import { useEffect } from 'react'
import { glossario } from '../lib/glossario'

// Tela de glossário (brief 6.4): a mesma fonte dos ⓘ, agora como lista.
export default function Glossario({ onVoltar }) {
  const termos = Object.values(glossario).sort((a, b) =>
    a.titulo.localeCompare(b.titulo, 'pt-BR'),
  )

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onVoltar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onVoltar])

  return (
    <div className="painel">
      <div className="ficha-topo">
        <button type="button" className="btn-voltar" onClick={onVoltar}>
          ← Voltar à baia
        </button>
      </div>

      <div className="hero">
        <div className="eyebrow">Manual de bordo</div>
        <h1>Glossário</h1>
        <p className="deck">
          Os termos técnicos que aparecem nas fichas, explicados em linguagem de gente — com uma
          analogia pra cada um. É a mesma fonte dos balõezinhos ⓘ.
        </p>
      </div>

      <dl className="glos-lista">
        {termos.map((t) => (
          <div className="glos-item" key={t.titulo}>
            <dt className="glos-termo">{t.titulo}</dt>
            <dd className="glos-texto">{t.texto}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
