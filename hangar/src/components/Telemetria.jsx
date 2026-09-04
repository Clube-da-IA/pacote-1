// Faixa de telemetria no topo da Baia: 4 mostradores.
const pad2 = (n) => String(n).padStart(2, '0')
const moeda = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`

export default function Telemetria({ total, operacionais, custoTotal, alertas, onAbrirCustos, onAbrirAlertas }) {
  return (
    <div className="telem">
      <div className="tile">
        <div className="k">Naves</div>
        <div className="v">{pad2(total)}</div>
      </div>
      <div className="tile">
        <div className="k">Operacionais</div>
        <div className="v cyan">{pad2(operacionais)}</div>
      </div>
      <button type="button" className="tile clicavel" onClick={onAbrirCustos}>
        <div className="k">Custo / mês <span className="tile-seta" aria-hidden="true">›</span></div>
        <div className="v gold">{moeda(custoTotal)}</div>
        <span className="sr-only">— abrir o painel de custos</span>
      </button>
      <button type="button" className={`tile clicavel${alertas > 0 ? ' warn' : ''}`} onClick={onAbrirAlertas}>
        <div className="k">Alertas <span className="tile-seta" aria-hidden="true">›</span></div>
        <div className={`v ${alertas > 0 ? 'gold' : 'cyan'}`}>{pad2(alertas)}</div>
        <span className="sr-only">— abrir o diagnóstico da frota</span>
      </button>
    </div>
  )
}
