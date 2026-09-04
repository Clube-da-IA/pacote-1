import { useEffect, useRef } from 'react'

// Modal de confirmação acessível: foca o botão seguro ao abrir, fecha no Esc,
// prende o foco entre os botões e anuncia título + explicação (aria).
export default function Confirmacao({ titulo, texto, rotulo, perigo, ocupado, onConfirmar, onCancelar }) {
  const cancelarRef = useRef(null)
  const caixaRef = useRef(null)

  useEffect(() => {
    cancelarRef.current?.focus() // foco no "Cancelar" (opção segura)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        // Captura o Esc só para o modal (não deixa a ficha atrás também fechar).
        e.stopImmediatePropagation()
        onCancelar()
        return
      }
      if (e.key === 'Tab') {
        const focaveis = caixaRef.current?.querySelectorAll('button')
        if (!focaveis || focaveis.length === 0) return
        const primeiro = focaveis[0]
        const ultimo = focaveis[focaveis.length - 1]
        if (e.shiftKey && document.activeElement === primeiro) {
          e.preventDefault()
          ultimo.focus()
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault()
          primeiro.focus()
        }
      }
    }
    // Fase de captura: roda antes do listener de Esc da ficha/editor.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onCancelar])

  return (
    <div
      className="modal-fundo"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-tit"
      aria-describedby="modal-desc"
    >
      <div className="modal" ref={caixaRef}>
        <h2 id="modal-tit" className="modal-tit">{titulo}</h2>
        <p id="modal-desc" className="modal-txt">{texto}</p>
        <div className="modal-acoes">
          <button type="button" className="btn-sec" ref={cancelarRef} onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className={perigo ? 'btn-perigo' : 'btn-primario'}
            onClick={onConfirmar}
            disabled={ocupado}
          >
            {ocupado ? 'Aguarde…' : rotulo}
          </button>
        </div>
      </div>
    </div>
  )
}
