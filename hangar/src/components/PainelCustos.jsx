import { useEffect } from 'react'
import { custoDaNave, custoPorServico } from '../lib/naves'

const moeda = (v) => `R$ ${Number(v || 0).toLocaleString('pt-BR')}`

// Painel de custos (brief 6.3): número grande + quebra por nave e por serviço.
export default function PainelCustos({ naves, onVoltar, onAbrirNave }) {
  const lista = Array.isArray(naves) ? naves : []

  // Tecla Esc volta pra baia (mesmo padrão da ficha).
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onVoltar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onVoltar])

  const total = lista.reduce((s, n) => s + custoDaNave(n), 0)
  const comPagamento = lista.filter((n) => custoDaNave(n) > 0).length

  const porNave = lista
    .map((n) => ({ id: n.id, nome: n.nome, custo: custoDaNave(n) }))
    .sort((a, b) => b.custo - a.custo)
  const porServico = custoPorServico(lista)

  const maxNave = Math.max(1, ...porNave.map((n) => n.custo))
  const maxServ = Math.max(1, ...porServico.map((s) => s.valorMensal))

  return (
    <div className="painel">
      <div className="ficha-topo">
        <button type="button" className="btn-voltar" onClick={onVoltar}>
          ← Voltar à baia
        </button>
      </div>

      <h1 className="sr-only">Painel de custos da frota</h1>
      <div className="custo-hero">
        <span className="custo-hero-rot">Você gasta</span>
        <span className="custo-hero-num">{moeda(total)}</span>
        <span className="custo-hero-mes">/mês</span>
        <p className="custo-hero-sub">
          Somando os serviços de {comPagamento} {comPagamento === 1 ? 'nave' : 'naves'} com custo,
          de uma frota de {lista.length}.
        </p>
      </div>

      <div className="painel-cols">
        <section className="setor">
          <h2 className="setor-tit">Por nave</h2>
          <div className="setor-corpo">
            <ul className="barras">
              {porNave.map((n) => (
                <li key={n.id} className={n.custo === 0 ? 'zero' : ''}>
                  <button type="button" className="barra-nome" onClick={() => onAbrirNave?.(n.id)}>
                    {n.nome}
                  </button>
                  <span className="barra-trilho" aria-hidden="true">
                    <span
                      className="barra-fill"
                      style={{ width: `${Math.round((n.custo / maxNave) * 100)}%` }}
                    ></span>
                  </span>
                  <span className="barra-valor">{n.custo === 0 ? '—' : `${moeda(n.custo)}/mês`}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="setor">
          <h2 className="setor-tit">Por serviço</h2>
          <div className="setor-corpo">
            <ul className="barras">
              {porServico.map((s) => (
                <li key={s.servico} className={s.valorMensal === 0 ? 'zero' : ''}>
                  <span className="barra-nome estatico">
                    {s.servico}
                    {s.naves > 1 && <em className="barra-tag">×{s.naves}</em>}
                  </span>
                  <span className="barra-trilho" aria-hidden="true">
                    <span
                      className="barra-fill ouro"
                      style={{ width: `${Math.round((s.valorMensal / maxServ) * 100)}%` }}
                    ></span>
                  </span>
                  <span className="barra-valor">
                    {s.valorMensal === 0 ? 'sob uso' : `${moeda(s.valorMensal)}/mês`}
                  </span>
                </li>
              ))}
            </ul>
            <p className="painel-nota">
              Itens “sob uso” (tokens de IA, planos grátis) não têm valor fixo mensal — só pagam
              quando rodam.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
