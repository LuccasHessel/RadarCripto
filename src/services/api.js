// Em desenvolvimento, usa o proxy do Vite (/api/coingecko → https://api.coingecko.com/api/v3)
// Em produção (GitHub Pages), chama a API diretamente — o CORS funciona em produção pois o
// CoinGecko permite origens de domínios hospedados. Se houver erro em prod, adicione uma
// chave de API gratuita em https://www.coingecko.com/en/api e passe como header abaixo.

const BASE = import.meta.env.DEV
  ? '/api/coingecko'
  : 'https://api.coingecko.com/api/v3'

async function apiFetch(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const msg = res.status === 429
      ? 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.'
      : `Erro na API CoinGecko (${res.status}). Tente novamente.`
    throw new Error(msg)
  }
  return res.json()
}

export async function buscarIdsPorNome(query) {
  const data = await apiFetch(`/search?query=${encodeURIComponent(query)}`)
  if (!data.coins || data.coins.length === 0) return []
  return data.coins.slice(0, 10).map(c => c.id)
}

export async function buscarMoedasPorIds({ ids, moedaConversao, ordenacao }) {
  const params = new URLSearchParams({
    vs_currency: moedaConversao,
    ids: ids.join(','),
    order: ordenacao,
    per_page: '10',
    page: '1',
    sparkline: 'false',
  })
  return apiFetch(`/coins/markets?${params}`)
}

export async function buscarRanking(moedaConversao) {
  const params = new URLSearchParams({
    vs_currency: moedaConversao,
    order: 'market_cap_desc',
    per_page: '10',
    page: '1',
    sparkline: 'false',
  })
  return apiFetch(`/coins/markets?${params}`)
}

export async function buscarPrecoAtualizado(ids, moedaConversao) {
  const params = new URLSearchParams({
    vs_currency: moedaConversao,
    ids: ids.join(','),
    order: 'market_cap_desc',
    per_page: String(ids.length),
    page: '1',
    sparkline: 'false',
  })
  return apiFetch(`/coins/markets?${params}`)
}
