import { useEffect, useRef } from 'react'
import { STATUS, custoDaNave, alertasDaNave, isolamentoRecomendado } from '../lib/naves'
import { detectarTermos } from '../lib/glossario'
import Ajuda from './Ajuda'
import DiagramaMermaid from './DiagramaMermaid'

const SIMBOLO_MOEDA = { BRL: 'R$', USD: 'US$', EUR: '€' }
const moeda = (v, cod = 'BRL') =>
  `${SIMBOLO_MOEDA[cod] || `${cod} `}${Number(v || 0).toLocaleString('pt-BR')}`

// Rótulos amigáveis para valores que viriam como "slug" técnico.
const FLUXO_GIT = { 'github-flow': 'GitHub Flow' }

// A régua de CI/CD (brief 7.1) — mostrada dentro do setor de automação.
const ESCADA_CICD = [
  { n: 0, rotulo: 'Sobe tudo na mão', analogia: 'lançamento manual' },
  { n: 1, rotulo: 'git push publica sozinho', analogia: 'botão de lançamento' },
  { n: 2, rotulo: 'Robôs checam o código antes', analogia: 'checklist pré-voo' },
  { n: 3, rotulo: 'Testes barram código quebrado', analogia: 'simulação de voo' },
  { n: 4, rotulo: 'Pipeline completo', analogia: 'torre de controle' },
]

// Uma linha "rótulo: valor". O ⓘ aparece sozinho se o valor citar um termo do glossário.
function Linha({ rotulo, valor }) {
  if (valor == null || valor === '') return null
  const termos = detectarTermos(valor)
  return (
    <div className="linha">
      <dt className="rot">{rotulo}</dt>
      <dd className="val">
        {String(valor)}
        {termos.map((t) => (
          <Ajuda key={t} termo={t} />
        ))}
      </dd>
    </div>
  )
}

// Uma lista de itens mostrada como "chips".
function CampoLista({ rotulo, itens, vazio = '—' }) {
  const lista = Array.isArray(itens) ? itens.filter(Boolean) : []
  return (
    <div className="campo-lista">
      <span className="rot">{rotulo}</span>
      {lista.length ? (
        <div className="chips">
          {lista.map((x, i) => (
            <span className="chip" key={i}>
              {x}
            </span>
          ))}
        </div>
      ) : (
        <span className="val-vazio">{vazio}</span>
      )}
    </div>
  )
}

// Bloco de um setor da ficha.
function Setor({ titulo, dica, largo, children }) {
  return (
    <section className={`setor${largo ? ' largo' : ''}`}>
      <h2 className="setor-tit">
        {titulo}
        {dica && <Ajuda termo={dica} />}
      </h2>
      <div className="setor-corpo">{children}</div>
    </section>
  )
}

export default function FichaNave({ nave, onVoltar, onEditar, onExcluir }) {
  const nomeRef = useRef(null)

  // Ao abrir uma nave, leva o foco pro nome (bom pro teclado/leitor de tela).
  useEffect(() => {
    nomeRef.current?.focus()
  }, [nave?.id])

  // Tecla Esc volta pra baia.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onVoltar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onVoltar])

  const st = STATUS[nave.status] || STATUS.operacional
  const custo = custoDaNave(nave)
  const nivel = Math.max(0, Math.min(4, Number(nave?.cicd?.nivel) || 0))
  const lgpdAlta = nave?.banco?.sensibilidadeLGPD === 'alta'
  const custos = Array.isArray(nave.custos) ? nave.custos : []
  const diario = Array.isArray(nave.diario) ? nave.diario : []

  // Réguas do M4: sugestões reais desta nave (vazio = coerente).
  const alertas = alertasDaNave(nave)
  const alertaIso = alertas.find((a) => a.tipo === 'isolamento')
  const alertaRec = alertas.find((a) => a.tipo === 'recursos')
  const recIso = isolamentoRecomendado(nave)

  return (
    <div className="ficha">
      <div className="ficha-topo">
        <button type="button" className="btn-voltar" onClick={onVoltar}>
          ← Voltar à baia
        </button>
        {(onEditar || onExcluir) && (
          <div className="ficha-topo-acoes">
            {onEditar && (
              <button type="button" className="btn-sec" onClick={onEditar}>✏️ Editar</button>
            )}
            {onExcluir && (
              <button type="button" className="btn-perigo-sec" onClick={onExcluir}>🗑️ Excluir</button>
            )}
          </div>
        )}
      </div>

      <div className="ficha-cab">
        <span className={`sdot ${st.dot}`} aria-hidden="true"></span>
        <h1 className="ficha-nome" tabIndex={-1} ref={nomeRef}>
          {nave.nome}
        </h1>
        <span className="ficha-status">{st.rotulo}</span>
      </div>

      <div className="ficha-sub">
        <span className="ficha-tipo">{nave.tipo}</span>
        {lgpdAlta && (
          <span className="lgpd">
            <span className="d" aria-hidden="true"></span>LGPD
          </span>
        )}
      </div>

      <p className="ficha-desc">{nave.descricao}</p>

      <div className="setores">
        {/* 1 · Arquitetura */}
        <Setor titulo="Arquitetura" largo>
          <p className="texto">{nave.arquitetura?.resumo}</p>
          {nave.arquitetura?.mermaid ? (
            <div className="mermaid-bloco">
              <div className="mermaid-rotulo">
                Mapa da arquitetura <Ajuda termo="mermaid" />
              </div>
              <DiagramaMermaid
                codigo={nave.arquitetura.mermaid}
                rotulo={`Diagrama da arquitetura de ${nave.nome}. ${nave.arquitetura?.resumo || ''}`}
              />
            </div>
          ) : null}
        </Setor>

        {/* 2 · Tecnologias */}
        <Setor titulo="Tecnologias (stack)">
          <dl>
            <Linha rotulo="Frente (frontend)" valor={nave.stack?.frontend} />
            <Linha rotulo="Trás (backend)" valor={nave.stack?.backend} />
            <Linha rotulo="Banco" valor={nave.stack?.banco} />
            <Linha rotulo="Hospedagem" valor={nave.stack?.hospedagem} />
          </dl>
          <CampoLista rotulo="Serviços" itens={nave.stack?.servicos} />
          <CampoLista rotulo="Modelos de IA" itens={nave.stack?.modelosIA} />
        </Setor>

        {/* 3 · Autenticação */}
        <Setor titulo="Autenticação">
          <div className="aviso-chave" role="note">
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <circle cx="8.5" cy="9" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M11.5 11.5 L20 20 M17 17 l2.5 -2.5 M19 19 l2 -2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span>
              Nunca guarde a chave aqui — só anote <strong>onde ela mora</strong>.
            </span>
          </div>
          <dl>
            <Linha rotulo="Método" valor={nave.autenticacao?.metodo} />
            <Linha rotulo="Onde moram as chaves" valor={nave.autenticacao?.ondeMoramAsChaves} />
            <Linha rotulo="Observação" valor={nave.autenticacao?.observacao} />
          </dl>
        </Setor>

        {/* 4 · Banco de dados */}
        <Setor titulo="Banco de dados">
          <dl>
            <Linha rotulo="Tipo" valor={nave.banco?.tipo} />
            <Linha rotulo="Onde mora" valor={nave.banco?.ondeMora} />
            <Linha rotulo="Dados" valor={nave.banco?.dados} />
            <div className="linha">
              <dt className="rot">
                Sensibilidade LGPD <Ajuda termo="lgpd" />
              </dt>
              <dd className="val">
                {nave.banco?.sensibilidadeLGPD}
                {lgpdAlta && <span className="tag-lgpd">alta</span>}
              </dd>
            </div>
            <Linha rotulo="Backup" valor={nave.banco?.backup} />
          </dl>
        </Setor>

        {/* 5 · Infraestrutura */}
        <Setor titulo="Infraestrutura">
          <dl>
            <Linha rotulo="Servidor / VPS" valor={nave.infra?.vpsServidor} />
            <div className="linha">
              <dt className="rot">
                Docker <Ajuda termo="docker" />
              </dt>
              <dd className="val">{nave.infra?.docker ? 'Sim' : 'Não'}</dd>
            </div>
            <Linha rotulo="Domínio" valor={nave.infra?.dominio} />
            <Linha rotulo="Como publica" valor={nave.infra?.comoPublica} />
          </dl>
        </Setor>

        {/* 6 · Automação (CI/CD) */}
        <Setor titulo="Automação (CI/CD)" dica="cicd">
          <div className="cicd-medidor">
            <span>
              Nível <b>{nivel}</b> de 4
            </span>
            <span className="ci" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <i key={i} className={i < nivel ? 'on' : ''}></i>
              ))}
            </span>
          </div>
          <ol className="escada">
            {ESCADA_CICD.map((x) => (
              <li key={x.n} className={x.n === nivel ? 'atual' : ''}>
                <b>N{x.n}</b> {x.rotulo} <em>({x.analogia})</em>
              </li>
            ))}
          </ol>
          <CampoLista rotulo="No automático" itens={nave.cicd?.automatico} />
          <CampoLista rotulo="Na mão" itens={nave.cicd?.manual} />
        </Setor>

        {/* 7 · Recursos */}
        <Setor titulo="Recursos">
          <dl>
            <Linha rotulo="CPU" valor={nave.recursos?.cpu} />
            <Linha rotulo="Memória (RAM)" valor={nave.recursos?.ram} />
            <Linha rotulo="Armazenamento" valor={nave.recursos?.armazenamento} />
            <Linha rotulo="Nota" valor={nave.recursos?.nota} />
          </dl>
          {alertaRec && (
            <div className="sugestao" role="note">
              <span className="sugestao-tit">💡 {alertaRec.titulo}</span>
              <span className="sugestao-txt">{alertaRec.texto}</span>
            </div>
          )}
        </Setor>

        {/* 8 · Custos */}
        <Setor titulo="Custos">
          {custos.length ? (
            <table className="tab-custos">
              <tbody>
                {custos.map((c, i) => (
                  <tr key={i}>
                    <td>{c.servico}</td>
                    <td className="v">{moeda(c.valorMensal, c.moeda)}/mês</td>
                  </tr>
                ))}
                <tr className="total">
                  <td>Total</td>
                  <td className="v">{moeda(custo)}/mês</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="texto">Sem custo mensal. 🎉</p>
          )}
        </Setor>

        {/* 9 · Isolamento */}
        <Setor titulo="Isolamento" dica="isolamento">
          <dl>
            <div className="linha">
              <dt className="rot">Tipo</dt>
              <dd className="val">
                {nave.isolamento?.tipo === 'doca-propria' ? 'Doca própria' : 'Hangar compartilhado'}
              </dd>
            </div>
            <Linha rotulo="Motivo" valor={nave.isolamento?.motivo} />
          </dl>
          {alertaIso ? (
            <div className="sugestao" role="note">
              <span className="sugestao-tit">💡 {alertaIso.titulo}</span>
              <span className="sugestao-txt">{alertaIso.texto}</span>
            </div>
          ) : (
            <p className="coerente">✓ Isolamento coerente com a recomendação ({recIso.tipo === 'doca-propria' ? 'doca própria' : 'hangar compartilhado'}).</p>
          )}
        </Setor>

        {/* 10 · Versionamento */}
        <Setor titulo="Versionamento (Git)" dica="githubflow">
          <dl>
            <Linha rotulo="Repositório" valor={nave.git?.repo} />
            <Linha rotulo="Fluxo" valor={FLUXO_GIT[nave.git?.fluxo] || nave.git?.fluxo} />
            <Linha rotulo="Produção" valor={nave.git?.producao} />
            <Linha rotulo="Última versão" valor={nave.git?.ultimaVersao} />
          </dl>
        </Setor>

        {/* 11 · Saúde */}
        <Setor titulo="Saúde">
          <dl>
            <Linha rotulo="Dívida técnica" valor={nave.saude?.dividaTecnica} />
            <Linha rotulo="Última inspeção" valor={nave.saude?.ultimaInspecao} />
          </dl>
          <CampoLista rotulo="Bugs conhecidos" itens={nave.saude?.bugsConhecidos} vazio="Nenhum 🎉" />
        </Setor>

        {/* 12 · Diário de bordo */}
        <Setor titulo="Diário de bordo" largo>
          {diario.length ? (
            <ul className="diario">
              {diario.map((d, i) => (
                <li key={i}>
                  <span className="data">{d.data}</span>
                  <span className="nota">{d.nota}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="texto">Sem anotações ainda.</p>
          )}
        </Setor>
      </div>
    </div>
  )
}
