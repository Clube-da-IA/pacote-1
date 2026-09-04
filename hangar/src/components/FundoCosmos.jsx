import { useEffect, useRef, useState } from 'react'
import { ouvirCosmos } from '../lib/cosmos-bus'

// ===================================================================
// FUNDO COSMOS — a "janela da nave": nebulosa + galáxias (estilo JWST)
// + Gargantua com lente gravitacional (shader WebGL). Fica atrás de tudo.
// Guardas de bateria: pausa ao trocar de janela, ~30fps, respeita
// "reduzir movimento", e cai num fundo simples se o WebGL falhar.
// ===================================================================

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.0,1.0); }`

const FRAG = `precision mediump float;
uniform vec2 u_res; uniform float u_time; uniform vec2 u_par;
uniform float u_warp;   // 0..1 salto hyperspace
uniform float u_att;    // 0..1 atração do cursor
uniform float u_roll;   // banking ao abrir ficha

float h21(vec2 p){ p=fract(p*vec2(123.34,345.45)); p+=dot(p,p+34.345); return fract(p.x*p.y); }
float vnoise(vec2 x){ vec2 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f);
  float a=h21(i), b=h21(i+vec2(1,0)), c=h21(i+vec2(0,1)), d=h21(i+vec2(1,1));
  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
float fbm(vec2 x){ float s=0.0,a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<5;i++){ s+=a*vnoise(x); x=m*x; a*=0.5; } return s; }

vec3 stars(vec2 uv, float dens, float sz, vec3 tint){
  vec3 col=vec3(0.0); vec2 g=uv*dens, id=floor(g), f=fract(g)-0.5;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 o=vec2(float(x),float(y)); float rnd=h21(id+o);
    if(rnd>0.55){
      vec2 pos=o+vec2(h21(id+o+1.3),h21(id+o+2.7))-0.5-f;
      float d=length(pos);
      float b=smoothstep(sz*(0.6+rnd*0.8),0.0,d);
      float tw=0.7+0.3*sin(u_time*(0.6+rnd*2.0)+rnd*30.0);
      col+=tint*b*tw*(0.5+rnd);
    }
  }
  return col;
}
vec3 galaxy(vec2 uv, vec2 c, float rot, float scale, vec3 tint, float ell, float spin){
  vec2 d=uv-c; float ca=cos(rot),sa=sin(rot); d=mat2(ca,-sa,sa,ca)*d; d.y*=ell;
  float r=length(d)/scale; float a=atan(d.y,d.x);
  float arms=0.5+0.5*sin(a*2.0 - r*spin);
  float dust=0.55+0.45*sin(a*2.0 - r*spin + 1.4);
  float body=exp(-r*1.9)*(0.2+0.8*arms)*dust;
  float core=exp(-r*r*26.0);
  float halo=exp(-r*r*2.2)*0.3;
  return core*vec3(1.0,0.96,0.86)*1.7 + body*tint*1.2 + halo*tint;
}
vec3 heroStars(vec2 uv){
  vec3 col=vec3(0.0); float dens=6.0; vec2 g=uv*dens, id=floor(g), f=fract(g)-0.5;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){
    vec2 o=vec2(float(x),float(y)); float rnd=h21(id+o+9.1);
    if(rnd>0.85){
      vec2 pos=(o+vec2(h21(id+o+4.1),h21(id+o+8.3))-0.5-f)/dens;
      float d=length(pos), a=atan(pos.y,pos.x);
      float sz=(0.5+h21(id+o+2.2)*1.8)*0.2;        // tamanho varia; -80% (tela grande pedia discrição)
      float temp=h21(id+o+5.5);                     // temperatura da estrela
      vec3 cor=mix(vec3(0.72,0.83,1.0), vec3(1.0,0.78,0.48), pow(temp,1.7)); // fria(azul)->quente(âmbar)
      float sp=exp(-d*80.0/sz);
      float core=smoothstep(0.006*sz,0.0,d);
      float spk=pow(abs(cos(3.0*a)),24.0)*sp;
      float spk2=pow(abs(cos(3.0*a+1.5708)),70.0)*0.35*sp;
      float glow=exp(-d*d*1400.0/(sz*sz))*0.5;
      col+=cor*(core*2.0*sz + (spk+spk2)*1.5 + glow)*(0.7+rnd);
    }
  }
  return col;
}

void main(){
  vec2 uv=(gl_FragCoord.xy - 0.5*u_res)/u_res.y;
  float cr=cos(u_roll), sr=sin(u_roll);
  uv=mat2(cr,-sr,sr,cr)*uv;                 // banking (roll)
  vec2 drift=vec2(u_time*0.006, u_time*0.0018) + u_par;

  vec2 bh=vec2(0.62,0.06);
  vec2 d=uv-bh; float r=length(d); vec2 dir=d/max(r,1e-4);
  float rs=0.062;
  // Lente gravitacional em DUAS forças (ref. foto NASA):
  // 1) puxão radial (deflexão ~1/r) — dobra a luz pra dentro;
  // 2) giro TANGENCIAL (~1/r²) — as estrelas viram arcos em espiral ao redor.
  float bend=(rs*1.9/max(r,rs*0.9))*(1.0+u_att*1.6);   // cursor intensifica
  vec2 tang=vec2(-dir.y,dir.x);
  float sw=min((rs*rs*3.0)/max(r*r,rs*rs*0.8), 2.2);
  vec2 luv=uv - dir*bend - tang*sw*rs*(0.9+u_att*1.4);
  vec2 buv=luv + drift;

  float dense=exp(-length(buv-vec2(-0.34,0.02))*2.3);
  float neb=fbm(buv*2.2+7.0), neb2=fbm(buv*4.5-3.0), neb3=fbm(buv*6.5+dense*2.0);
  vec3 col=vec3(0.012,0.03,0.07);
  col += vec3(0.0,0.28,0.5)*pow(neb,3.0)*(0.9+dense*1.4);
  col += vec3(0.55,0.34,0.09)*pow(neb2,4.0)*(0.5+dense*1.2);
  col += vec3(0.7,0.25,0.35)*pow(neb3,5.0)*dense*1.3;

  // metade das galáxias (7 → 4): 2 grandes + 2 do deep-field
  col += galaxy(buv, vec2(-0.55,-0.34), 0.5, 0.26, vec3(0.55,0.72,1.0), 2.6, 12.0)*0.95;
  col += galaxy(buv, vec2(0.06,-0.42), -0.3, 0.19, vec3(0.95,0.78,0.5), 1.5, 9.0)*0.8;
  col += galaxy(buv, vec2(-0.30,0.10), 0.9, 0.055, vec3(0.9,0.7,0.55), 1.8, 20.0)*0.8;
  col += galaxy(buv, vec2(-0.40,-0.06), -0.6, 0.045, vec3(0.7,0.8,1.0), 2.4, 18.0)*0.8;

  col += stars(buv, 26.0, 0.05, vec3(0.8,0.88,1.0));
  col += stars(buv, 12.0, 0.045, vec3(0.6,0.8,1.0))*1.2;
  col += stars(buv, 60.0, 0.03, vec3(1.0))*(1.0+dense*0.8);
  col += heroStars(buv);

  // hyperspace: linhas de velocidade radiais quando salva (leve, sem loop)
  if(u_warp>0.001){
    float ang2=atan(uv.y,uv.x);
    float bin=floor(ang2*70.0);
    float rr=h21(vec2(bin,7.0));
    float line=step(0.82,rr)*smoothstep(0.12,0.95,length(uv));
    float fl=0.6+0.4*fract(rr*13.0+u_time*4.0);
    col += vec3(0.55,0.82,1.0)*line*fl*u_warp*1.6;
    col += vec3(0.35,0.62,1.0)*u_warp*0.06*smoothstep(0.1,0.9,length(uv));
  }

  // anel de Einstein das estrelas de fundo (discreto, além dos arcos do disco)
  col *= 1.0 + 0.35*exp(-pow((r-rs*3.0)/0.02,2.0));

  // ================= GARGANTUA cinematográfica =================
  // Anatomia (refs Interstellar + visualização da NASA):
  //  disco frontal fino passando NA FRENTE da sombra · arco superior =
  //  imagem lensada do LADO DE TRÁS (grosso na base, fino no topo) ·
  //  arco inferior = imagem do lado de BAIXO · anel de fótons duplo ·
  //  Doppler beaming (lado que se aproxima brilha mais) · filamentos.
  // Sistema do disco INCLINADO (~17°) — o ângulo das cenas do filme.
  float ct=cos(-0.30), st=sin(-0.30);
  vec2 dl=mat2(ct,-st,st,ct)*d;
  float ang=atan(dl.y,dl.x);
  float rr=r/rs;

  // filamentos orbitais (estrias) com rotação diferencial lenta
  float fil=fbm(vec2(rr*6.0 - u_time*0.10, ang*2.5));
  float fil2=fbm(vec2(rr*14.0 + u_time*0.04, ang*5.0+3.0));
  float tex=(0.55+0.45*fil)*(0.72+0.38*fil2);

  // Doppler beaming: o lado esquerdo (vem na nossa direção) brilha muito mais
  float dop=0.30+0.85*pow(0.5-0.5*cos(ang), 1.8);

  vec3 corQuente=vec3(1.0,0.96,0.90);
  vec3 corMorna=vec3(1.0,0.80,0.55);

  // A MORFOLOGIA é composição por PROFUNDIDADE (o que faz "toda a diferença"):
  //   atrás do buraco  → fundo, arcos lensados, metade DISTANTE do disco
  //                      (tudo isso a SOMBRA apaga);
  //   na borda         → anel de fótons (delimita a sombra);
  //   NA FRENTE        → a metade PRÓXIMA do disco, que passa POR CIMA da
  //                      sombra — nunca é recortada pelo círculo preto.
  float frente=smoothstep(0.15,-0.15,dl.y/rs); // 1 = entre nós e o buraco

  // banda do disco (elipse fina) — usada atrás E na frente
  vec2 q=vec2(dl.x, dl.y*7.0);
  float qr=length(q)/rs;
  float banda=smoothstep(1.12,1.32,qr)*smoothstep(4.9,3.1,qr);
  float gradD=smoothstep(4.9,1.3,qr);
  vec3 corDisco=mix(corMorna,corQuente,gradD)*tex*dop*(0.9+2.2*gradD);

  // 1) metade DISTANTE do disco (atrás do buraco; o grosso dela reaparece
  //    lensado como arco superior, então entra fraca)
  col += corDisco*banda*(1.0-frente)*0.35;

  // 2) ARCO SUPERIOR (far side lensado): abre e AFINA conforme sobe
  float topM=smoothstep(0.0,0.3,dl.y/rs);
  float alt=clamp(dl.y/(rs*2.9),0.0,1.0);
  float raioA=rs*(1.55+0.95*alt);
  float espA=rs*mix(0.55,0.13,alt);
  float arcoA=exp(-pow((r-raioA)/espA,2.0))*topM;
  col += mix(corMorna,corQuente,0.65)*arcoA*tex*(0.45+0.55*dop)*1.6;

  // 3) ARCO INFERIOR (underside lensado): menor, mais fino e mais fraco
  float botM=1.0-topM;
  float alt2=clamp(-dl.y/(rs*1.7),0.0,1.0);
  float raioB=rs*(1.38+0.38*alt2);
  float espB=rs*mix(0.34,0.08,alt2);
  float arcoB=exp(-pow((r-raioB)/espB,2.0))*botM;
  col += corMorna*arcoB*tex*(0.45+0.55*dop)*0.75;

  // 4) ANEL DE FÓTONS na borda da sombra + bloom ambiente (atrás)
  col += vec3(1.0,0.98,0.95)*exp(-pow((r-rs*1.08)/0.0045,2.0))*2.2;
  col += vec3(1.0,0.95,0.88)*exp(-pow((r-rs*1.17)/0.0030,2.0))*0.8;
  col += corMorna*0.12*exp(-pow((r-rs*1.9)/(rs*1.4),2.0));

  // 5) SOMBRA: apaga tudo que está ATRÁS do buraco (preto absoluto)
  col *= smoothstep(rs*0.99,rs*1.05,r);

  // 6) metade PRÓXIMA do disco — desenhada DEPOIS da sombra: passa na frente
  col += corDisco*banda*frente;
  // brilho suave da banda frontal (contorno quente sobre o preto)
  col += corMorna*0.10*frente*exp(-pow((qr-1.7)/1.3,2.0))*tex;

  col *= 1.0 - 0.25*dot(uv,uv);
  col = pow(col, vec3(0.85));
  gl_FragColor=vec4(col,1.0);
}`

function compilar(gl, tipo, src) {
  const s = gl.createShader(tipo)
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s) || '(sem log)'
    throw new Error(`${tipo === gl.VERTEX_SHADER ? 'vertex' : 'fragment'}: ${log}`)
  }
  return s
}

export default function FundoCosmos({ naves = [], onAbrirNave, ativo = true }) {
  const canvasRef = useRef(null)
  const [fallback, setFallback] = useState(false)

  // posição-alvo do parallax + valores animados (fora do React, no rAF).
  const alvo = useRef({ px: 0, py: 0, att: 0, warp: 0, roll: 0 })
  const val = useRef({ px: 0, py: 0, att: 0, warp: 0, roll: 0 })

  useEffect(() => {
    if (!ativo) return
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const canvas = canvasRef.current
    let gl
    try {
      // preserveDrawingBuffer: mantém o último quadro na tela quando o loop
      // pausa (janela oculta, ou "reduzir movimento" que desenha 1 quadro só)
      // — sem isso, o WebGL limparia pra preto.
      const opts = { preserveDrawingBuffer: true, antialias: true, powerPreference: 'low-power' }
      gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts)
      if (!gl) throw new Error('sem webgl')
    } catch {
      setFallback(true)
      return
    }

    let prog
    try {
      prog = gl.createProgram()
      gl.attachShader(prog, compilar(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compilar(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link')
    } catch (e) {
      console.warn('Cosmos: WebGL indisponível, usando fundo simples.', e?.message)
      setFallback(true)
      return
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const pl = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(pl)
    gl.vertexAttribPointer(pl, 2, gl.FLOAT, false, 0, 0)
    const U = {
      res: gl.getUniformLocation(prog, 'u_res'),
      time: gl.getUniformLocation(prog, 'u_time'),
      par: gl.getUniformLocation(prog, 'u_par'),
      warp: gl.getUniformLocation(prog, 'u_warp'),
      att: gl.getUniformLocation(prog, 'u_att'),
      roll: gl.getUniformLocation(prog, 'u_roll'),
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
    const redimensionar = () => {
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    redimensionar()
    window.addEventListener('resize', redimensionar)

    // Gargantua fica ~x=0.62 (em unidades de altura) à direita — guardamos a
    // posição em pixels pra medir a proximidade do cursor (atração).
    const bhTela = () => ({ x: window.innerWidth * 0.5 + 0.62 * window.innerHeight, y: window.innerHeight * (0.5 - 0.06) })
    const onMouse = (e) => {
      alvo.current.px = (e.clientX / window.innerWidth - 0.5) * 0.06
      alvo.current.py = (e.clientY / window.innerHeight - 0.5) * 0.06
      const b = bhTela()
      const dist = Math.hypot(e.clientX - b.x, e.clientY - b.y)
      alvo.current.att = Math.max(0, 1 - dist / (window.innerHeight * 0.55))
    }
    window.addEventListener('mousemove', onMouse)

    // Eventos do app: salvar dispara hyperspace; abrir ficha dá um roll.
    const desouvir = ouvirCosmos((ev) => {
      if (ev === 'salvou') alvo.current.warp = 1
      if (ev === 'ficha') { val.current.roll = 0.05 }
    })

    const t0 = performance.now()
    let raf = null
    let ultimo = 0
    const intervalo = 1000 / 30 // ~30fps

    // Desenha UM quadro (sem agendar). O loop chama isto na cadência de fps.
    const render = (agora) => {
      const a = alvo.current, v = val.current
      v.px += (a.px - v.px) * 0.05
      v.py += (a.py - v.py) * 0.05
      v.att += (a.att - v.att) * 0.08
      a.warp *= 0.9 // o alvo do warp decai; o valor persegue
      v.warp += (a.warp - v.warp) * 0.25
      v.roll += (0 - v.roll) * 0.06 // roll sempre volta a zero
      gl.uniform2f(U.res, canvas.width, canvas.height)
      gl.uniform1f(U.time, reduz ? 8.0 : (agora - t0) / 1000)
      gl.uniform2f(U.par, v.px, v.py)
      gl.uniform1f(U.warp, v.warp)
      gl.uniform1f(U.att, v.att)
      gl.uniform1f(U.roll, v.roll)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const desenhar = (agora) => {
      raf = requestAnimationFrame(desenhar)
      if (agora - ultimo < intervalo) return
      ultimo = agora
      render(agora)
    }

    const iniciar = () => { if (!raf) { ultimo = 0; raf = requestAnimationFrame(desenhar) } }
    const parar = () => { if (raf) { cancelAnimationFrame(raf); raf = null } }
    // Guarda de bateria: só anima com a janela visível.
    const onVis = () => (document.hidden ? parar() : iniciar())
    document.addEventListener('visibilitychange', onVis)

    render(performance.now())        // primeiro quadro imediato (nunca fica preto)
    if (!reduz && !document.hidden) iniciar()

    return () => {
      parar()
      window.removeEventListener('resize', redimensionar)
      window.removeEventListener('mousemove', onMouse)
      document.removeEventListener('visibilitychange', onVis)
      desouvir()
      // Não chamamos loseContext(): isso "queima" a canvas e, se o React
      // remontar (StrictMode no dev), o getContext devolveria um contexto
      // morto → todo shader falharia. O contexto é liberado pelo GC.
    }
  }, [ativo])

  if (!ativo) return null

  return (
    <>
      {fallback ? (
        <div className="cosmos-fallback" aria-hidden="true" />
      ) : (
        <canvas ref={canvasRef} className="cosmos-canvas" aria-hidden="true" />
      )}
      <NavesCruzando naves={naves} onAbrirNave={onAbrirNave} />
    </>
  )
}

// ---- Naves cruzando o céu: pontinhos com nome que atravessam o fundo ----
// Ficam ATRÁS do console (z abaixo do conteúdo): viram ambiente por trás do
// vidro e ficam clicáveis só nas margens abertas do cosmos.
function NavesCruzando({ naves, onAbrirNave }) {
  const [voando, setVoando] = useState([])
  const idc = useRef(0)

  useEffect(() => {
    const reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduz || !naves.length) return
    let vivo = true
    const lancar = () => {
      if (!vivo) return
      const nave = naves[Math.floor(Math.random() * naves.length)]
      const topo = 6 + Math.random() * 80 // % vertical
      const dur = 26 + Math.random() * 22 // s
      const key = idc.current++
      setVoando((v) => [...v, { key, nave, topo, dur }])
      setTimeout(() => vivo && setVoando((v) => v.filter((x) => x.key !== key)), dur * 1000)
      setTimeout(lancar, 7000 + Math.random() * 9000)
    }
    const t = setTimeout(lancar, 3000)
    return () => { vivo = false; clearTimeout(t) }
  }, [naves])

  return (
    <div className="naves-ceu" aria-hidden="true">
      {voando.map(({ key, nave, topo, dur }) => (
        <button
          key={key}
          type="button"
          className="nave-voando"
          style={{ top: `${topo}%`, animationDuration: `${dur}s` }}
          onClick={() => onAbrirNave?.(nave.id)}
          tabIndex={-1}
          aria-label={`Abrir ${nave.nome}`}
        >
          <span className="nave-voando-pt" />
          <span className="nave-voando-nome">{nave.nome}</span>
        </button>
      ))}
    </div>
  )
}
