import { useId } from 'react'
import { glossario } from '../lib/glossario'

// Ícone ⓘ com explicação simples (do glossário). Aparece ao passar o mouse ou
// focar pelo teclado (CSS puro), e é anunciado por leitores de tela via
// aria-describedby. O balão é centralizado na base da tela, então nunca é cortado.
export default function Ajuda({ termo }) {
  const tipId = useId()
  const item = glossario[termo]
  if (!item) return null

  return (
    <span className="ajuda">
      <button
        type="button"
        className="ajuda-i"
        aria-label={`O que é ${item.titulo}?`}
        aria-describedby={tipId}
      >
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true" focusable="false">
          <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="8" cy="4.7" r="0.95" fill="currentColor" />
          <rect x="7.1" y="6.7" width="1.8" height="5" rx="0.9" fill="currentColor" />
        </svg>
      </button>
      <span className="ajuda-tip" role="tooltip" id={tipId}>
        <strong>{item.titulo}</strong>
        <span>{item.texto}</span>
      </span>
    </span>
  )
}
