import { useEffect, useRef, useState } from 'react'
import Confirmacao from './Confirmacao'

// Ficha em branco de uma nave nova (com padrões seguros).
const NAVE_VAZIA = {
  id: '', nome: '', tipo: '', status: 'em-construcao', descricao: '',
  arquitetura: { resumo: '', mermaid: '' },
  stack: { frontend: '', backend: '', banco: '', hospedagem: '', servicos: [], modelosIA: [] },
  autenticacao: { metodo: '', ondeMoramAsChaves: '', observacao: '' },
  banco: { tipo: '', ondeMora: '', dados: '', sensibilidadeLGPD: 'nenhuma', backup: '' },
  infra: { vpsServidor: '', docker: false, dominio: '', comoPublica: '' },
  cicd: { nivel: 0, automatico: [], manual: [] },
  recursos: { cpu: '', ram: '', armazenamento: '', nota: '' },
  custos: [],
  isolamento: { tipo: 'compartilhado', motivo: '' },
  git: { repo: '', fluxo: 'github-flow', producao: '', ultimaVersao: '' },
  saude: { dividaTecnica: '', bugsConhecidos: [], ultimaInspecao: '' },
  diario: [],
}

const STATUS_OPC = [
  { v: 'operacional', r: 'Operacional' },
  { v: 'manutencao', r: 'Em manutenção' },
  { v: 'em-solo', r: 'Em solo (pausada)' },
  { v: 'em-construcao', r: 'Em construção' },
  { v: 'arquivada', r: 'Arquivada' },
]
const LGPD_OPC = [
  { v: 'nenhuma', r: 'Nenhuma' },
  { v: 'baixa', r: 'Baixa' },
  { v: 'media', r: 'Média' },
  { v: 'alta', r: 'Alta (dado de paciente)' },
]
const ISOL_OPC = [
  { v: 'compartilhado', r: 'Hangar compartilhado' },
  { v: 'doca-propria', r: 'Doca própria' },
]
const NIVEL_OPC = [
  { v: 0, r: 'N0 — sobe tudo na mão' },
  { v: 1, r: 'N1 — git push publica' },
  { v: 2, r: 'N2 — robôs checam' },
  { v: 3, r: 'N3 — testes barram' },
  { v: 4, r: 'N4 — pipeline completo' },
]
// Só R$ no MVP: os totais do app somam tudo como R$, então moeda estrangeira
// daria conta errada. Quem paga em dólar/euro anota o valor convertido.
// (Naves antigas com USD/EUR continuam aparecendo — o seletor mostra o valor.)
const MOEDA_OPC = [{ v: 'BRL', r: 'R$ (BRL)' }]
const FLUXO_OPC = [
  { v: 'github-flow', r: 'GitHub Flow' },
  { v: 'gitflow', r: 'Gitflow' },
  { v: 'trunk', r: 'Trunk-based' },
  { v: 'nenhum', r: 'Nenhum (trabalho sozinho)' },
]

function paraSlug(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Versão "ao vivo" pro campo de id: preserva o hífen do fim enquanto a pessoa
// digita (o paraSlug cortava o hífen a cada tecla, impossibilitando digitá-lo).
function paraSlugDigitando(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9-]+/g, '-').replace(/^-+/, '').replace(/-{2,}/g, '-')
}

// Garante que toda a estrutura exista (ao editar uma nave antiga).
function comDefaults(n) {
  const v = NAVE_VAZIA
  return {
    id: n.id ?? '', nome: n.nome ?? '', tipo: n.tipo ?? '', status: n.status ?? v.status, descricao: n.descricao ?? '',
    arquitetura: { ...v.arquitetura, ...(n.arquitetura || {}) },
    stack: {
      ...v.stack, ...(n.stack || {}),
      servicos: [...(n.stack?.servicos || [])], modelosIA: [...(n.stack?.modelosIA || [])],
    },
    autenticacao: { ...v.autenticacao, ...(n.autenticacao || {}) },
    banco: { ...v.banco, ...(n.banco || {}) },
    infra: { ...v.infra, ...(n.infra || {}) },
    cicd: { ...v.cicd, ...(n.cicd || {}), automatico: [...(n.cicd?.automatico || [])], manual: [...(n.cicd?.manual || [])] },
    recursos: { ...v.recursos, ...(n.recursos || {}) },
    custos: (n.custos || []).map((c) => ({ servico: c.servico ?? '', valorMensal: c.valorMensal ?? 0, moeda: c.moeda ?? 'BRL' })),
    isolamento: { ...v.isolamento, ...(n.isolamento || {}) },
    git: { ...v.git, ...(n.git || {}) },
    saude: { ...v.saude, ...(n.saude || {}), bugsConhecidos: [...(n.saude?.bugsConhecidos || [])] },
    diario: (n.diario || []).map((d) => ({ data: d.data ?? '', nota: d.nota ?? '' })),
  }
}

// ---- Campos reutilizáveis ----
function Campo({ rotulo, children, dica }) {
  return (
    <label className="campo">
      <span className="campo-rot">{rotulo}{dica && <em className="campo-dica"> · {dica}</em>}</span>
      {children}
    </label>
  )
}
function Texto({ valor, onChange, placeholder, readOnly, tipo = 'text' }) {
  return <input className="campo-in" type={tipo} value={valor} placeholder={placeholder} readOnly={readOnly} onChange={(e) => onChange(e.target.value)} />
}
function Area({ valor, onChange, placeholder, linhas = 2 }) {
  return <textarea className="campo-in" rows={linhas} value={valor} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}
function Selecao({ valor, onChange, opcoes }) {
  // Valor fora do vocabulário (ex.: "média" com acento, vindo do arquivo)
  // vira uma opção extra visível — em vez de o seletor mostrar a opção errada.
  const lista = opcoes.some((o) => String(o.v) === String(valor))
    ? opcoes
    : [...opcoes, { v: valor, r: valor === '' || valor == null ? '(vazio)' : `${valor} (valor do arquivo)` }]
  return (
    <select className="campo-in" value={valor} onChange={(e) => onChange(e.target.value)}>
      {lista.map((o) => <option key={String(o.v)} value={o.v}>{o.r}</option>)}
    </select>
  )
}
function ListaTextos({ rotulo, itens, onItens, placeholder }) {
  return (
    <div className="campo">
      <span className="campo-rot">{rotulo}</span>
      {itens.map((x, i) => (
        <div className="lista-linha" key={i}>
          <input className="campo-in" aria-label={`${rotulo} ${i + 1}`} value={x} placeholder={placeholder} onChange={(e) => onItens(itens.map((it, j) => (j === i ? e.target.value : it)))} />
          <button type="button" className="btn-remover" aria-label="Remover item" onClick={() => onItens(itens.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button type="button" className="btn-adicionar" onClick={() => onItens([...itens, ''])}>+ adicionar</button>
    </div>
  )
}

export default function EditorNave({ naveInicial, ehNova, idsExistentes = [], salvando, onSalvar, onCancelar }) {
  const [draft, setDraft] = useState(() => comDefaults(naveInicial || NAVE_VAZIA))
  const [idAuto, setIdAuto] = useState(ehNova) // ao criar, o id segue o nome até você editá-lo
  const [erro, setErro] = useState('')
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)
  const tituloRef = useRef(null)
  // Retrato do formulário como ele abriu — pra saber se há mudança não salva.
  // A comparação é em forma "canônica" (valor de custo coagido pra número):
  // digitar no campo troca número por texto, e "12" ≠ 12 daria alarme falso.
  const canonico = (n) => JSON.stringify({
    ...n,
    custos: (n.custos || []).map((c) => ({ ...c, valorMensal: Number(c.valorMensal) || 0 })),
  })
  const inicialRef = useRef(null)
  if (inicialRef.current === null) inicialRef.current = canonico(comDefaults(naveInicial || NAVE_VAZIA))

  const temMudanca = () => canonico(draft) !== inicialRef.current

  // Cancelar/Esc: se há mudança não salva, pergunta antes de descartar.
  const pedirCancelar = () => {
    if (temMudanca()) setConfirmandoSaida(true)
    else onCancelar()
  }

  useEffect(() => { tituloRef.current?.focus() }, [])
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') pedirCancelar() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const up = (fn) => setDraft((d) => { const n = structuredClone(d); fn(n); return n })

  const mudarNome = (v) => up((d) => { d.nome = v; if (idAuto && ehNova) d.id = paraSlug(v) })
  const mudarId = (v) => { setIdAuto(false); up((d) => { d.id = paraSlugDigitando(v) }) }

  const aoEnviar = (e) => {
    e.preventDefault()
    const nome = draft.nome.trim()
    // Normaliza o id SÓ na criação. Na edição ele é readOnly e é a CHAVE que
    // o App usa pra achar a nave — mexer nele (ex.: um id legado "NSE_Data"
    // gravado por skill) faria a edição se perder em silêncio.
    const id = ehNova ? paraSlug(draft.id.trim()) : draft.id
    if (!nome) return setErro('Dá um nome pra nave.')
    if (ehNova) {
      if (!id) return setErro('Dá um apelido (id) pra nave.')
      if (!/^[a-z0-9-]+$/.test(id)) return setErro('O id só pode ter letras minúsculas, números e hífen.')
      if (idsExistentes.includes(id)) return setErro(`Já existe uma nave com o id "${id}". Escolha outro.`)
    }
    // Limpa itens em branco das listas.
    const limpaLista = (a) => a.map((x) => x.trim()).filter(Boolean)
    const final = {
      ...draft,
      id, nome,
      tipo: draft.tipo.trim(),
      descricao: draft.descricao.trim(),
      stack: { ...draft.stack, servicos: limpaLista(draft.stack.servicos), modelosIA: limpaLista(draft.stack.modelosIA) },
      cicd: { ...draft.cicd, nivel: Number(draft.cicd.nivel) || 0, automatico: limpaLista(draft.cicd.automatico), manual: limpaLista(draft.cicd.manual) },
      custos: draft.custos.filter((c) => c.servico.trim()).map((c) => ({ servico: c.servico.trim(), valorMensal: Math.max(0, Number(c.valorMensal) || 0), moeda: c.moeda || 'BRL' })),
      saude: { ...draft.saude, bugsConhecidos: limpaLista(draft.saude.bugsConhecidos) },
      diario: draft.diario.filter((d) => d.data.trim() || d.nota.trim()).map((d) => ({ data: d.data.trim(), nota: d.nota.trim() })),
    }
    onSalvar(final)
  }

  return (
    <form className="editor" onSubmit={aoEnviar} noValidate>
      <div className="ficha-topo">
        <button type="button" className="btn-voltar" onClick={pedirCancelar}>← Cancelar</button>
      </div>
      <h1 className="ficha-nome" tabIndex={-1} ref={tituloRef}>
        {ehNova ? 'Nova nave' : `Editando: ${draft.nome || draft.id}`}
      </h1>

      <div className="setores">
        <section className="setor largo">
          <h2 className="setor-tit">Identidade</h2>
          <div className="grade-campos">
            <Campo rotulo="Nome"><Texto valor={draft.nome} onChange={mudarNome} placeholder="Ex.: Agenda da Clínica" /></Campo>
            <Campo rotulo="Apelido (id)" dica={ehNova ? 'sem espaços' : 'não muda depois de criada'}>
              <Texto valor={draft.id} onChange={mudarId} readOnly={!ehNova} placeholder="ex.: agenda-da-clinica" />
            </Campo>
            <Campo rotulo="Tipo"><Texto valor={draft.tipo} onChange={(v) => up((d) => { d.tipo = v })} placeholder="Ex.: App · Saúde" /></Campo>
            <Campo rotulo="Status"><Selecao valor={draft.status} onChange={(v) => up((d) => { d.status = v })} opcoes={STATUS_OPC} /></Campo>
          </div>
          <Campo rotulo="Descrição (uma frase)"><Area valor={draft.descricao} onChange={(v) => up((d) => { d.descricao = v })} placeholder="O que essa nave faz, em uma frase." /></Campo>
        </section>

        <section className="setor largo">
          <h2 className="setor-tit">Arquitetura</h2>
          <Campo rotulo="Resumo"><Area linhas={3} valor={draft.arquitetura.resumo} onChange={(v) => up((d) => { d.arquitetura.resumo = v })} placeholder="Como as peças conversam." /></Campo>
          <Campo rotulo="Mapa (texto Mermaid)" dica="o desenho aparece no M4"><Area linhas={2} valor={draft.arquitetura.mermaid} onChange={(v) => up((d) => { d.arquitetura.mermaid = v })} placeholder="graph LR; A --> B" /></Campo>
        </section>

        <section className="setor">
          <h2 className="setor-tit">Tecnologias (stack)</h2>
          <Campo rotulo="Frente (frontend)"><Texto valor={draft.stack.frontend} onChange={(v) => up((d) => { d.stack.frontend = v })} placeholder="Ex.: React" /></Campo>
          <Campo rotulo="Trás (backend)"><Texto valor={draft.stack.backend} onChange={(v) => up((d) => { d.stack.backend = v })} placeholder="Ex.: —" /></Campo>
          <Campo rotulo="Banco"><Texto valor={draft.stack.banco} onChange={(v) => up((d) => { d.stack.banco = v })} placeholder="Ex.: Supabase" /></Campo>
          <Campo rotulo="Hospedagem"><Texto valor={draft.stack.hospedagem} onChange={(v) => up((d) => { d.stack.hospedagem = v })} placeholder="Ex.: Vercel" /></Campo>
          <ListaTextos rotulo="Serviços" itens={draft.stack.servicos} onItens={(a) => up((d) => { d.stack.servicos = a })} placeholder="Ex.: Resend (e-mail)" />
          <ListaTextos rotulo="Modelos de IA" itens={draft.stack.modelosIA} onItens={(a) => up((d) => { d.stack.modelosIA = a })} placeholder="Ex.: Claude" />
        </section>

        <section className="setor">
          <h2 className="setor-tit">Autenticação</h2>
          <div className="aviso-chave" role="note">
            <span>Nunca guarde a chave aqui — só anote <strong>onde ela mora</strong>.</span>
          </div>
          <Campo rotulo="Método"><Texto valor={draft.autenticacao.metodo} onChange={(v) => up((d) => { d.autenticacao.metodo = v })} /></Campo>
          <Campo rotulo="Onde moram as chaves"><Area valor={draft.autenticacao.ondeMoramAsChaves} onChange={(v) => up((d) => { d.autenticacao.ondeMoramAsChaves = v })} placeholder="Ex.: variáveis de ambiente do Vercel" /></Campo>
          <Campo rotulo="Observação"><Texto valor={draft.autenticacao.observacao} onChange={(v) => up((d) => { d.autenticacao.observacao = v })} /></Campo>
        </section>

        <section className="setor">
          <h2 className="setor-tit">Banco de dados</h2>
          <Campo rotulo="Tipo"><Texto valor={draft.banco.tipo} onChange={(v) => up((d) => { d.banco.tipo = v })} /></Campo>
          <Campo rotulo="Onde mora"><Texto valor={draft.banco.ondeMora} onChange={(v) => up((d) => { d.banco.ondeMora = v })} /></Campo>
          <Campo rotulo="Dados"><Texto valor={draft.banco.dados} onChange={(v) => up((d) => { d.banco.dados = v })} /></Campo>
          <Campo rotulo="Sensibilidade LGPD"><Selecao valor={draft.banco.sensibilidadeLGPD} onChange={(v) => up((d) => { d.banco.sensibilidadeLGPD = v })} opcoes={LGPD_OPC} /></Campo>
          <Campo rotulo="Backup"><Texto valor={draft.banco.backup} onChange={(v) => up((d) => { d.banco.backup = v })} /></Campo>
        </section>

        <section className="setor">
          <h2 className="setor-tit">Infraestrutura</h2>
          <Campo rotulo="Servidor / VPS"><Texto valor={draft.infra.vpsServidor} onChange={(v) => up((d) => { d.infra.vpsServidor = v })} placeholder="Ex.: —" /></Campo>
          <label className="campo campo-check">
            <input type="checkbox" checked={draft.infra.docker} onChange={(e) => up((d) => { d.infra.docker = e.target.checked })} />
            <span>Usa Docker</span>
          </label>
          <Campo rotulo="Domínio"><Texto valor={draft.infra.dominio} onChange={(v) => up((d) => { d.infra.dominio = v })} /></Campo>
          <Campo rotulo="Como publica"><Texto valor={draft.infra.comoPublica} onChange={(v) => up((d) => { d.infra.comoPublica = v })} /></Campo>
        </section>

        <section className="setor">
          <h2 className="setor-tit">Automação (CI/CD)</h2>
          <Campo rotulo="Nível"><Selecao valor={draft.cicd.nivel} onChange={(v) => up((d) => { d.cicd.nivel = Number(v) })} opcoes={NIVEL_OPC} /></Campo>
          <ListaTextos rotulo="No automático" itens={draft.cicd.automatico} onItens={(a) => up((d) => { d.cicd.automatico = a })} placeholder="Ex.: build" />
          <ListaTextos rotulo="Na mão" itens={draft.cicd.manual} onItens={(a) => up((d) => { d.cicd.manual = a })} placeholder="Ex.: testes antes de publicar" />
        </section>

        <section className="setor">
          <h2 className="setor-tit">Recursos</h2>
          <Campo rotulo="CPU"><Texto valor={draft.recursos.cpu} onChange={(v) => up((d) => { d.recursos.cpu = v })} /></Campo>
          <Campo rotulo="Memória (RAM)"><Texto valor={draft.recursos.ram} onChange={(v) => up((d) => { d.recursos.ram = v })} /></Campo>
          <Campo rotulo="Armazenamento"><Texto valor={draft.recursos.armazenamento} onChange={(v) => up((d) => { d.recursos.armazenamento = v })} /></Campo>
          <Campo rotulo="Nota"><Area valor={draft.recursos.nota} onChange={(v) => up((d) => { d.recursos.nota = v })} /></Campo>
        </section>

        <section className="setor">
          <h2 className="setor-tit">Custos</h2>
          {draft.custos.map((c, i) => (
            <div className="lista-linha custo-linha" key={i}>
              <input className="campo-in" aria-label={`Serviço ${i + 1}`} value={c.servico} placeholder="Serviço" onChange={(e) => up((d) => { d.custos[i].servico = e.target.value })} />
              <input className="campo-in custo-valor" aria-label={`Valor mensal ${i + 1}`} type="number" min="0" value={c.valorMensal} placeholder="0" onChange={(e) => up((d) => { d.custos[i].valorMensal = e.target.value })} />
              <select className="campo-in custo-moeda" aria-label={`Moeda ${i + 1}`} value={c.moeda} onChange={(e) => up((d) => { d.custos[i].moeda = e.target.value })}>
                {(MOEDA_OPC.some((o) => o.v === c.moeda) ? MOEDA_OPC : [...MOEDA_OPC, { v: c.moeda, r: c.moeda }]).map((o) => (
                  <option key={o.v} value={o.v}>{o.r}</option>
                ))}
              </select>
              <button type="button" className="btn-remover" aria-label="Remover custo" onClick={() => up((d) => { d.custos.splice(i, 1) })}>×</button>
            </div>
          ))}
          <button type="button" className="btn-adicionar" onClick={() => up((d) => { d.custos.push({ servico: '', valorMensal: 0, moeda: 'BRL' }) })}>+ adicionar custo</button>
        </section>

        <section className="setor">
          <h2 className="setor-tit">Isolamento</h2>
          <Campo rotulo="Tipo"><Selecao valor={draft.isolamento.tipo} onChange={(v) => up((d) => { d.isolamento.tipo = v })} opcoes={ISOL_OPC} /></Campo>
          <Campo rotulo="Motivo"><Area valor={draft.isolamento.motivo} onChange={(v) => up((d) => { d.isolamento.motivo = v })} /></Campo>
        </section>

        <section className="setor">
          <h2 className="setor-tit">Versionamento (Git)</h2>
          <Campo rotulo="Repositório"><Texto valor={draft.git.repo} onChange={(v) => up((d) => { d.git.repo = v })} /></Campo>
          <Campo rotulo="Fluxo">
            <Selecao valor={draft.git.fluxo} onChange={(v) => up((d) => { d.git.fluxo = v })} opcoes={FLUXO_OPC} />
          </Campo>
          <Campo rotulo="Produção"><Texto valor={draft.git.producao} onChange={(v) => up((d) => { d.git.producao = v })} /></Campo>
          <Campo rotulo="Última versão"><Texto valor={draft.git.ultimaVersao} onChange={(v) => up((d) => { d.git.ultimaVersao = v })} placeholder="ex.: v0.1" /></Campo>
        </section>

        <section className="setor">
          <h2 className="setor-tit">Saúde</h2>
          <Campo rotulo="Dívida técnica"><Texto valor={draft.saude.dividaTecnica} onChange={(v) => up((d) => { d.saude.dividaTecnica = v })} /></Campo>
          <Campo rotulo="Última inspeção"><Texto valor={draft.saude.ultimaInspecao} onChange={(v) => up((d) => { d.saude.ultimaInspecao = v })} placeholder="AAAA-MM-DD" /></Campo>
          <ListaTextos rotulo="Bugs conhecidos" itens={draft.saude.bugsConhecidos} onItens={(a) => up((d) => { d.saude.bugsConhecidos = a })} placeholder="Descreva o bug" />
        </section>

        <section className="setor largo">
          <h2 className="setor-tit">Diário de bordo</h2>
          {draft.diario.map((d0, i) => (
            <div className="lista-linha diario-linha" key={i}>
              <input className="campo-in diario-data" aria-label={`Data ${i + 1}`} value={d0.data} placeholder="AAAA-MM-DD" onChange={(e) => up((d) => { d.diario[i].data = e.target.value })} />
              <input className="campo-in" aria-label={`Anotação ${i + 1}`} value={d0.nota} placeholder="O que decidiu / aprendeu" onChange={(e) => up((d) => { d.diario[i].nota = e.target.value })} />
              <button type="button" className="btn-remover" aria-label="Remover anotação" onClick={() => up((d) => { d.diario.splice(i, 1) })}>×</button>
            </div>
          ))}
          <button type="button" className="btn-adicionar" onClick={() => up((d) => { d.diario.push({ data: '', nota: '' }) })}>+ adicionar anotação</button>
        </section>
      </div>

      {erro && <p className="editor-erro" role="alert">{erro}</p>}
      <div className="editor-acoes">
        <button type="button" className="btn-sec" onClick={pedirCancelar} disabled={salvando}>Cancelar</button>
        <button type="submit" className="btn-primario" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
      </div>

      {confirmandoSaida && (
        <Confirmacao
          titulo="Descartar alterações?"
          texto={<>Você fez mudanças que ainda <strong>não foram salvas</strong>. Quer descartá-las e sair do editor?</>}
          rotulo="Descartar"
          perigo
          onConfirmar={onCancelar}
          onCancelar={() => setConfirmandoSaida(false)}
        />
      )}
    </form>
  )
}
