// Estrategia simples de cache em memoria para reduzir chamadas repetidas
// tanto ao SGBD local quanto a API externa (CoinGecko). E invalidado a
// cada operacao de escrita (Create/Update/Delete) para nunca servir
// dados desatualizados dos recursos do proprio usuario.
const armazenamento = new Map()
const TTL_MS = Number(process.env.CACHE_TTL_MS || 60000)

export function obterCache(chave) {
  const item = armazenamento.get(chave)
  if (!item) return undefined
  if (item.expira < Date.now()) {
    armazenamento.delete(chave)
    return undefined
  }
  return item.valor
}

export function definirCache(chave, valor, ttlMs = TTL_MS) {
  armazenamento.set(chave, { valor, expira: Date.now() + ttlMs })
}

export function limparCache() {
  armazenamento.clear()
}
