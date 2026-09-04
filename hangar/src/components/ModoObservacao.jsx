import { useEffect, useRef, useState } from 'react'
import { ouvirCosmos } from '../lib/cosmos-bus'

const moeda = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`
const pad2 = (n) => String(n).padStart(2, '0')

// Modo Observação: depois de um tempo parado (ou pelo botão), some a
// interface e fica só o cosmos + relógio + telemetria da frota — como um
// descanso de tela. Qualquer toque/tecla volta.
export default function ModoObservacao({ tel, base, ociosidade = 45000, ativo = true }) {
  const [observando, setObservando] = useState(false)
  const [agora, setAgora] = useState(() => new Date())
  const timer = useRef(null)

  // Liga/desliga a classe global que apaga o console (revela o cosmos atrás).
  useEffect(() => {
    document.documentElement.classList.toggle('observando', observando)
  }, [observando])

  // Relógio só corre quando está observando.
  useEffect(() => {
    if (!observando) return
    const t = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(t)
  }, [observando])

  useEffect(() => {
    if (!ativo) return
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rearmar = () => {
      clearTimeout(timer.current)
      if (reduz) return // sem entrar sozinho se a pessoa pediu menos movimento
      timer.current = setTimeout(() => setObservando(true), ociosidade)
    }
    const acordar = () => {
      setObservando((o) => {
        if (o) return false
        return o
      })
      rearmar()
    }
    const eventos = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel']
    eventos.forEach((e) => window.addEventListener(e, acordar, { passive: true }))
    const desobs = ouvirCosmos((ev) => {
      if (ev === 'observar') { clearTimeout(timer.current); setObservando(true) }
    })
    rearmar()
    return () => {
      clearTimeout(timer.current)
      eventos.forEach((e) => window.removeEventListener(e, acordar))
      desobs()
      document.documentElement.classList.remove('observando')
    }
  }, [ativo, ociosidade])

  if (!observando) return null

  return (
    <div
      className="obs-camada"
      role="button"
      tabIndex={0}
      aria-label="Sair do modo observação"
      onClick={() => setObservando(false)}
    >
      <div className="obs-relogio">{pad2(agora.getHours())}:{pad2(agora.getMinutes())}</div>
      <div className="obs-tel">
        BASE {String(base || '—').toUpperCase()} &nbsp;·&nbsp; FROTA {pad2(tel?.total || 0)} &nbsp;·&nbsp;
        OPERACIONAIS {pad2(tel?.operacionais || 0)} &nbsp;·&nbsp; {moeda(tel?.custoTotal)}/MÊS &nbsp;·&nbsp;
        ALERTAS {pad2(tel?.alertas || 0)}
      </div>
      <div className="obs-dica">toque em qualquer lugar para voltar</div>
    </div>
  )
}
