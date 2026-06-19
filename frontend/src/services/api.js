const BASE = '/api'

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
    // A sessao e mantida em um cookie httpOnly definido pelo servidor,
    // entao o navegador precisa enviar/receber cookies nas requisicoes.
    credentials: 'include',
  })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.mensagem || 'Nao foi possivel concluir a requisicao.')
  }
  return data
}

export async function login(email, senha) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })
}

export async function buscarSessaoAtual() {
  return apiFetch('/auth/me')
}

export async function logout() {
  return apiFetch('/auth/logout', { method: 'POST' })
}

export async function buscarMoedas({ consulta, moedaConversao, ordenacao }) {
  const data = await apiFetch(`/moedas?${new URLSearchParams({
    consulta,
    moedaConversao,
    ordenacao,
  })}`)
  return data.dados || []
}

export async function buscarIdsPorNome(query) {
  return buscarMoedas({
    consulta: query,
    moedaConversao: 'usd',
    ordenacao: 'market_cap_desc',
  })
}

export async function buscarMoedasPorIds({ ids, moedaConversao, ordenacao }) {
  return buscarMoedas({
    consulta: Array.isArray(ids) ? ids.join(' ') : String(ids || ''),
    moedaConversao,
    ordenacao,
  })
}

export async function inserirMoeda(dados) {
  return apiFetch('/moedas', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export async function buscarRanking(moedaConversao) {
  const data = await apiFetch(`/moedas/ranking?${new URLSearchParams({ moedaConversao })}`)
  return data.dados || []
}

export async function buscarPrecoAtualizado(ids, moedaConversao) {
  const data = await apiFetch(`/moedas/precos?${new URLSearchParams({
    ids: ids.join(','),
    moedaConversao,
  })}`)
  return data.dados || []
}
