import { useEffect } from 'react'
import { alertasDaNave, isolamentoRecomendado, diagnosticoRecursos } from '../lib/naves'

const ISO_ROTULO = { 'doca-propria': 'doca própria', compartilhado: 'hangar compartilhado' }

// Painel de alertas (brief 7.2 + 7.3): roda as réguas em cada nave e mostra,
// de forma honesta, onde há sugestão e onde está tudo coerente.
export default function PainelAlertas({ naves, onVoltar, onAbrirNave }) {
  const lista = Array.isArray(naves) ? naves : []

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onVoltar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onVoltar])

  const diag = lista.map((n) => {
    const alertas = alertasDaNave(n)
    return {
      nave: n,
      alertas,
      iso: isolamentoRecomendado(n),
      rec: diagnosticoRecursos(n),
      isoOk: !alertas.some((a) => a.tipo === 'isolamento'),
      recOk: !alertas.some((a) => a.tipo === 'recursos'),
    }
  })
  // Naves com sugestão primeiro.
  diag.sort((a, b) => b.alertas.length - a.alertas.length)
  const totalAlertas = diag.reduce((s, d) => s + d.alertas.length, 0)

  return (
    <div className="painel">
      <div className="ficha-topo">
        <button type="button" className="btn-voltar" onClick={onVoltar}>
          ← Voltar à baia
        </button>
      </div>

      <div className="alertas-cab">
        <h1 className="painel-tit">Diagnóstico da frota</h1>
        {totalAlertas === 0 ? (
          <p className="alertas-resumo ok">
            ✓ Tudo coerente — nenhuma sugestão. As réguas rodaram nas {lista.length} naves e não
            acharam isolamento mal-encaixado nem servidor superdimensionado.
          </p>
        ) : (
          <p className="alertas-resumo warn">
            {totalAlertas} {totalAlertas === 1 ? 'sugestão' : 'sugestões'} para revisar — detalhe
            abaixo.
          </p>
        )}
        <p className="painel-nota">
          Duas réguas: <strong>isolamento</strong> (doca própria quando há dado sensível, uso 24/7,
          tráfego alto ou dependências que brigam) e <strong>recursos</strong> (servidor pago com
          folga grande de RAM). São sugestões, não ordens.
        </p>
      </div>

      <ul className="alertas-lista">
        {diag.map((d) => (
          <li key={d.nave.id} className={d.alertas.length ? 'tem-alerta' : ''}>
            <button type="button" className="alerta-nave" onClick={() => onAbrirNave?.(d.nave.id)}>
              {d.nave.nome}
            </button>

            <div className="alerta-checks">
              <span className={`check ${d.isoOk ? 'ok' : 'warn'}`}>
                {d.isoOk ? '✓' : '⚠'} Isolamento: {ISO_ROTULO[d.nave.isolamento?.tipo] || '—'}
                {!d.isoOk && (
                  <em>
                    {' '}
                    → recomendado: {ISO_ROTULO[d.iso.tipo]}
                  </em>
                )}
              </span>
              <span className={`check ${d.recOk ? 'ok' : 'warn'}`}>
                {d.recOk ? '✓' : '⚠'} Recursos
                {d.rec.pago && d.rec.usadoGB != null && (
                  <em>
                    {' '}
                    (RAM ~{d.rec.usadoGB}/{d.rec.contratadoGB} GB)
                  </em>
                )}
              </span>
            </div>

            {d.alertas.map((a, i) => (
              <div key={i} className="alerta-detalhe">
                <span className="alerta-detalhe-tit">{a.titulo}</span>
                <span className="alerta-detalhe-txt">{a.texto}</span>
              </div>
            ))}
          </li>
        ))}
      </ul>
    </div>
  )
}
