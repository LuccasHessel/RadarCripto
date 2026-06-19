import { obterConexao } from '../config/database.js'

export function inserirMoeda(dados) {
  const resultado = obterConexao().prepare(`
    INSERT INTO moedas (
      nome, simbolo, preco_atual, moeda_conversao, capitalizacao_mercado,
      volume_24h, variacao_24h, imagem, criado_por, criado_em
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    new Date().toISOString()
  )
  return buscarMoedaPorId(resultado.lastInsertRowid)
}

export function buscarMoedaPorId(id) {
  const moeda = obterConexao().prepare('SELECT * FROM moedas WHERE id = ?').get(id)
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
  }
}
