import { STATUS, custoDaNave, chipsDaNave } from '../lib/naves'

// Card de uma nave na grade da Baia. Clicar (ou Enter/Espaço) abre a ficha técnica.
export default function NaveCard({ nave, onAbrir }) {
  const st = STATUS[nave?.status] || STATUS.operacional
  const ehEsta = nave?.id === 'hangar' // a própria HANGAR = "você está aqui"
  const custo = custoDaNave(nave)
  const chips = chipsDaNave(nave)
  const nivel = Math.max(0, Math.min(4, Number(nave?.cicd?.nivel) || 0))
  const lgpdAlta = nave?.banco?.sensibilidadeLGPD === 'alta'

  const abrir = () => onAbrir?.()
  const aoTeclar = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      abrir()
    }
  }

  return (
    <article
      className={`nave ${st.classe}${ehEsta ? ' self' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`Abrir ficha técnica de ${nave?.nome}`}
      onClick={abrir}
      onKeyDown={aoTeclar}
    >
      <div className="row1">
        <span className={`sdot ${st.dot}`} aria-hidden="true"></span>
        <h3 className="name">{nave?.nome}</h3>
        <span className="st">{st.rotulo}</span>
      </div>

      <div className="type">{nave?.tipo}</div>
      <p className="desc">{nave?.descricao}</p>

      <div className="sep" aria-hidden="true"></div>

      <div className="metrics">
        <span className="cost">
          R$<b>{custo.toLocaleString('pt-BR')}</b>
        </span>

        <span className="ci" title={`CI/CD — nível ${nivel} de 4`}>
          CI/CD
          {[0, 1, 2, 3].map((i) => (
            <i key={i} className={i < nivel ? 'on' : ''} aria-hidden="true"></i>
          ))}
        </span>

        {ehEsta ? (
          <span className="here">você está aqui</span>
        ) : lgpdAlta ? (
          <span className="lgpd" title="Dados sensíveis — LGPD alta">
            <span className="d" aria-hidden="true"></span>LGPD
          </span>
        ) : (
          <span className="git" title="Versionado no Git">
            GIT <b>&#10003;</b>
          </span>
        )}
      </div>

      {chips.length > 0 && (
        <div className="chips">
          {chips.map((c, i) => (
            <span className="chip" key={i}>
              {c}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}
