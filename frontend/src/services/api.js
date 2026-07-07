const AUTH_BASE = import.meta.env.VITE_AUTH_SERVICE_URL || 'http://localhost:3001'
const RESOURCE_BASE = import.meta.env.VITE_RESOURCE_SERVICE_URL || 'http://localhost:3002'

let tokenAtual = null

export function definirToken(token) {
  tokenAtual = token
}

export function obterToken() {
  return tokenAtual
}

async function apiFetch(base, path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  if (tokenAtual) {
    headers.Authorization = `Bearer ${tokenAtual}`
  }

  const res = await fetch(`${base}${path}`, { ...options, headers })
  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const erro = new Error(data.mensagem || 'Nao foi possivel concluir a requisicao.')
    erro.status = res.status
    throw erro
  }
  return data
}

// ---------- auth-service ----------
export async function login(email, senha) {
  const resposta = await apiFetch(AUTH_BASE, '/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  })
  definirToken(resposta.token)
  return resposta
}

export async function buscarSessaoAtual() {
  return apiFetch(AUTH_BASE, '/me')
}

export async function logout() {
  try {
    return await apiFetch(AUTH_BASE, '/logout', { method: 'POST' })
  } finally {
    definirToken(null)
  }
}

// ---------- resource-service ----------
export async function buscarMoedas({ consulta, moedaConversao, ordenacao }) {
  const data = await apiFetch(RESOURCE_BASE, `/?${new URLSearchParams({
    consulta,
    moedaConversao,
    ordenacao,
  })}`)
  return data.dados || []
}

export async function buscarMinhasMoedas() {
  const data = await apiFetch(RESOURCE_BASE, '/minhas')
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
  return apiFetch(RESOURCE_BASE, '/', {
    method: 'POST',
    body: JSON.stringify(dados),
  })
}

export async function atualizarMoeda(id, dados) {
  const idNumerico = String(id).replace('local-', '')
  return apiFetch(RESOURCE_BASE, `/${idNumerico}`, {
    method: 'PUT',
    body: JSON.stringify(dados),
  })
}

export async function excluirMoeda(id) {
  const idNumerico = String(id).replace('local-', '')
  return apiFetch(RESOURCE_BASE, `/${idNumerico}`, { method: 'DELETE' })
}

export async function buscarRanking(moedaConversao) {
  const data = await apiFetch(RESOURCE_BASE, `/ranking?${new URLSearchParams({ moedaConversao })}`)
  return data.dados || []
}

export async function buscarPrecoAtualizado(ids, moedaConversao) {
  const data = await apiFetch(RESOURCE_BASE, `/precos?${new URLSearchParams({
    ids: ids.join(','),
    moedaConversao,
  })}`)
  return data.dados || []
}
