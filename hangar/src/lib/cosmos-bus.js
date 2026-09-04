// Pequeno "rádio" interno: o App avisa eventos (salvou, abriu ficha) e o
// FundoCosmos reage (hyperspace, roll) — sem um acoplar no outro.
const ouvintes = new Set()

export function emitirCosmos(evento, dado) {
  for (const fn of ouvintes) fn(evento, dado)
}

export function ouvirCosmos(fn) {
  ouvintes.add(fn)
  return () => ouvintes.delete(fn)
}
