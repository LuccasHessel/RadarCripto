import { obterConexao } from '../config/database.js'

export function inserirMoeda(dados) {
  const agora = new Date().toISOString()
  const resultado = obterConexao().prepare(`
    INSERT INTO moedas (
      nome, simbolo, preco_atual, moeda_conversao, capitalizacao_mercado,
      volume_24h, variacao_24h, imagem, criado_por, criado_por_nome, criado_em
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dados.nome,
    dados.simbolo,
    dados.precoAtual,
    dados.moedaConversao,
    dados.capitalizacaoMercado,
    dados.volume24h,
    dados.variacao24h,
    dados.imagem,
    dados.usuarioId,
    dados.usuarioNome || null,
    agora
  )
  return buscarMoedaBrutaPorId(resultado.lastInsertRowid)
}

export function atualizarMoeda(id, dados) {
  obterConexao().prepare(`
    UPDATE moedas SET
      nome = ?, simbolo = ?, preco_atual = ?, moeda_conversao = ?,
      capitalizacao_mercado = ?, volume_24h = ?, variacao_24h = ?, imagem = ?,
      atualizado_em = ?
    WHERE id = ?
  `).run(
    dados.nome,
    dados.simbolo,
    dados.precoAtual,
    dados.moedaConversao,
    dados.capitalizacaoMercado,
    dados.volume24h,
    dados.variacao24h,
    dados.imagem,
    new Date().toISOString(),
    id
  )
  return buscarMoedaBrutaPorId(id)
}

export function excluirMoeda(id) {
  obterConexao().prepare('DELETE FROM moedas WHERE id = ?').run(id)
}

export function buscarMoedaBrutaPorId(id) {
  return obterConexao().prepare('SELECT * FROM moedas WHERE id = ?').get(id)
}

export function buscarMoedaPorId(id) {
  const moeda = buscarMoedaBrutaPorId(id)
  return moeda ? mapearMoeda(moeda) : null
}

export function listarMoedasLocais({ consulta = '', moedaConversao = 'usd' }) {
  const termo = `%${consulta.toLowerCase()}%`
  const linhas = obterConexao().prepare(`
    SELECT * FROM moedas
    WHERE moeda_conversao = ?
      AND (LOWER(nome) LIKE ? OR LOWER(simbolo) LIKE ?)
    ORDER BY criado_em DESC
    LIMIT 25
  `).all(moedaConversao, termo, termo)
  return linhas.map(mapearMoeda)
}

export function listarRankingLocal(moedaConversao = 'usd') {
  const linhas = obterConexao().prepare(`
    SELECT * FROM moedas
    WHERE moeda_conversao = ?
    ORDER BY COALESCE(capitalizacao_mercado, 0) DESC, criado_em DESC
    LIMIT 10
  `).all(moedaConversao)
  return linhas.map(mapearMoeda)
}

export function buscarMoedasLocaisPorIds(ids, moedaConversao = 'usd') {
  const idsNumericos = ids
    .filter(id => id.startsWith('local-'))
    .map(id => Number(id.replace('local-', '')))
    .filter(Number.isInteger)

  if (!idsNumericos.length) return []

  const placeholders = idsNumericos.map(() => '?').join(',')
  const linhas = obterConexao().prepare(`
    SELECT * FROM moedas
    WHERE id IN (${placeholders}) AND moeda_conversao = ?
  `).all(...idsNumericos, moedaConversao)
  return linhas.map(mapearMoeda)
}

// Lista somente os recursos pertencentes ao usuario autenticado - usada
// pelo Front-end como ponto de partida para Atualizacao (RF4) e
// Exclusao (RF5).
export function listarMoedasDoUsuario(usuarioId) {
  const linhas = obterConexao().prepare(`
    SELECT * FROM moedas WHERE criado_por = ? ORDER BY criado_em DESC
  `).all(usuarioId)
  return linhas.map(mapearMoeda)
}

function mapearMoeda(moeda) {
  return {
    id: `local-${moeda.id}`,
    name: moeda.nome,
    symbol: moeda.simbolo,
    current_price: moeda.preco_atual,
    market_cap: moeda.capitalizacao_mercado,
    total_volume: moeda.volume_24h,
    price_change_percentage_24h: moeda.variacao_24h,
    image: moeda.imagem || '',
    market_cap_rank: null,
    origem: 'local',
    moedaConversao: moeda.moeda_conversao,
    criadoPor: moeda.criado_por,
    criadoPorNome: moeda.criado_por_nome,
  }
}
