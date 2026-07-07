import express from 'express'
import {
  atualizarMoeda,
  buscarMoedaBrutaPorId,
  buscarMoedasLocaisPorIds,
  excluirMoeda,
  inserirMoeda,
  listarMoedasDoUsuario,
  listarMoedasLocais,
  listarRankingLocal,
} from '../models/Moeda.js'
import { autenticar, limitarRequisicoes, registrarEvento, sanitizarMoeda, sanitizarTexto, sanitizarUrl, validarCamposObrigatorios } from '../config/security.js'
import { publicarEvento } from '../config/redis.js'
import { definirCache, limparCache, obterCache } from '../config/cache.js'

const router = express.Router()
const COINGECKO = 'https://api.coingecko.com/api/v3'
const cacheExterno = new Map()
const TTL_CACHE_EXTERNO_MS = 1000 * 60 * 5
const ORDENACOES = new Set(['market_cap_desc', 'market_cap_asc', 'volume_desc', 'gecko_desc'])

router.use(limitarRequisicoes)
router.use(autenticar)

// ---------- RF2: Busca (Read) ----------
router.get('/', async (req, res, next) => {
  try {
    const consulta = sanitizarTexto(req.query.consulta, 80).toLowerCase()
    const moedaConversao = sanitizarMoeda(req.query.moedaConversao || 'usd')
    const ordenacao = ORDENACOES.has(req.query.ordenacao) ? req.query.ordenacao : 'market_cap_desc'
    const faltantes = validarCamposObrigatorios({ consulta, moedaConversao })

    if (faltantes.length) {
      return res.status(400).json({ mensagem: `Campos obrigatorios: ${faltantes.join(', ')}.` })
    }

    registrarEvento('busca_moedas', { usuarioId: req.usuario.id, consulta, moedaConversao })

    const chaveCache = `busca:${consulta}:${moedaConversao}:${ordenacao}`
    const emCache = obterCache(chaveCache)
    if (emCache) return res.json({ dados: emCache })

    const locais = listarMoedasLocais({ consulta, moedaConversao })
    const remotas = await buscarMoedasCoinGecko({ consulta, moedaConversao, ordenacao })
    const resultado = [...locais, ...remotas].slice(0, 15)
    definirCache(chaveCache, resultado)
    res.json({ dados: resultado })
  } catch (err) {
    next(err)
  }
})

router.get('/ranking', async (req, res, next) => {
  try {
    const moedaConversao = sanitizarMoeda(req.query.moedaConversao || 'usd')
    if (!moedaConversao) {
      return res.status(400).json({ mensagem: 'Moeda de conversao invalida.' })
    }

    const chaveCache = `ranking:${moedaConversao}`
    const emCache = obterCache(chaveCache)
    if (emCache) return res.json({ dados: emCache })

    const locais = listarRankingLocal(moedaConversao)
    const remotas = await buscarRankingCoinGecko(moedaConversao)
    const resultado = [...remotas, ...locais].slice(0, 10)
    definirCache(chaveCache, resultado)
    res.json({ dados: resultado })
  } catch (err) {
    next(err)
  }
})

router.get('/precos', async (req, res, next) => {
  try {
    const ids = sanitizarTexto(req.query.ids, 300)
      .split(',')
      .map(id => sanitizarTexto(id, 80))
      .filter(Boolean)
    const moedaConversao = sanitizarMoeda(req.query.moedaConversao || 'usd')
    if (!ids.length || !moedaConversao) {
      return res.status(400).json({ mensagem: 'Informe ids e moeda de conversao.' })
    }
    const locais = buscarMoedasLocaisPorIds(ids, moedaConversao)
    const remotos = ids.filter(id => !id.startsWith('local-'))
    const dados = remotos.length ? await buscarMercados(remotos, moedaConversao, 'market_cap_desc') : []
    res.json({ dados: [...locais, ...dados] })
  } catch (err) {
    next(err)
  }
})

// Lista somente os recursos do usuario autenticado (base para Update/Delete)
router.get('/minhas', (req, res) => {
  const dados = listarMoedasDoUsuario(req.usuario.id)
  res.json({ dados })
})

// ---------- RF3: Insercao (Create) ----------
router.post('/', async (req, res) => {
  const { faltantes, valores, erro } = validarPayloadMoeda(req.body)
  if (erro) return res.status(400).json({ mensagem: erro })
  if (faltantes.length) {
    return res.status(400).json({
      mensagem: 'Preencha nome, simbolo, moeda de conversao e preco atual valido.',
    })
  }

  const moedaBruta = inserirMoeda({
    ...valores,
    usuarioId: req.usuario.id,
    usuarioNome: req.usuario.nome,
  })

  limparCache()
  registrarEvento('insercao_moeda', { usuarioId: req.usuario.id, moeda: moedaBruta.id })
  await publicarEvento('recurso.criado', formatarSaida(moedaBruta))

  res.status(201).json({ dados: formatarSaida(moedaBruta), mensagem: 'Moeda cadastrada com sucesso.' })
})

// ---------- RF4: Atualizacao (Update) ----------
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ mensagem: 'Identificador invalido.' })

  const existente = buscarMoedaBrutaPorId(id)
  if (!existente) return res.status(404).json({ mensagem: 'Moeda nao encontrada.' })
  if (existente.criado_por !== req.usuario.id) {
    registrarEvento('acesso_negado_atualizacao', { usuarioId: req.usuario.id, moeda: id })
    return res.status(403).json({ mensagem: 'Voce so pode atualizar moedas que voce mesmo cadastrou.' })
  }

  const { faltantes, valores, erro } = validarPayloadMoeda(req.body)
  if (erro) return res.status(400).json({ mensagem: erro })
  if (faltantes.length) {
    return res.status(400).json({
      mensagem: 'Preencha nome, simbolo, moeda de conversao e preco atual valido.',
    })
  }

  const moedaAtualizada = atualizarMoeda(id, valores)
  limparCache()
  registrarEvento('atualizacao_moeda', { usuarioId: req.usuario.id, moeda: id })
  await publicarEvento('recurso.atualizado', formatarSaida(moedaAtualizada))

  res.json({ dados: formatarSaida(moedaAtualizada), mensagem: 'Moeda atualizada com sucesso.' })
})

// ---------- RF5: Exclusao (Delete) ----------
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id)
  if (!Number.isInteger(id)) return res.status(400).json({ mensagem: 'Identificador invalido.' })

  const existente = buscarMoedaBrutaPorId(id)
  if (!existente) return res.status(404).json({ mensagem: 'Moeda nao encontrada.' })
  if (existente.criado_por !== req.usuario.id) {
    registrarEvento('acesso_negado_exclusao', { usuarioId: req.usuario.id, moeda: id })
    return res.status(403).json({ mensagem: 'Voce so pode excluir moedas que voce mesmo cadastrou.' })
  }

  excluirMoeda(id)
  limparCache()
  registrarEvento('exclusao_moeda', { usuarioId: req.usuario.id, moeda: id })
  await publicarEvento('recurso.excluido', { id: `local-${id}` })

  res.status(204).end()
})

function validarPayloadMoeda(body) {
  const nome = sanitizarTexto(body.nome, 80)
  const simbolo = sanitizarTexto(body.simbolo, 12).toUpperCase()
  const moedaConversao = sanitizarMoeda(body.moedaConversao)
  const precoAtual = Number(body.precoAtual)
  const capitalizacaoMercado = numeroOpcional(body.capitalizacaoMercado)
  const volume24h = numeroOpcional(body.volume24h)
  const variacao24h = numeroOpcional(body.variacao24h)
  const imagem = sanitizarUrl(body.imagem, 240)
  const faltantes = validarCamposObrigatorios({ nome, simbolo, moedaConversao, precoAtual })

  if (faltantes.length || !Number.isFinite(precoAtual) || precoAtual <= 0) {
    return { faltantes: ['dados'], valores: null, erro: null }
  }

  return {
    faltantes: [],
    erro: null,
    valores: { nome, simbolo, moedaConversao, precoAtual, capitalizacaoMercado, volume24h, variacao24h, imagem },
  }
}

function formatarSaida(moedaBruta) {
  return {
    id: `local-${moedaBruta.id}`,
    name: moedaBruta.nome,
    symbol: moedaBruta.simbolo,
    current_price: moedaBruta.preco_atual,
    market_cap: moedaBruta.capitalizacao_mercado,
    total_volume: moedaBruta.volume_24h,
    price_change_percentage_24h: moedaBruta.variacao_24h,
    image: moedaBruta.imagem || '',
    market_cap_rank: null,
    origem: 'local',
    moedaConversao: moedaBruta.moeda_conversao,
    criadoPor: moedaBruta.criado_por,
    criadoPorNome: moedaBruta.criado_por_nome,
  }
}

async function buscarMoedasCoinGecko({ consulta, moedaConversao, ordenacao }) {
  const busca = await fetchComCache(`/search?query=${encodeURIComponent(consulta)}`)
  const ids = (busca.coins || []).slice(0, 10).map(moeda => moeda.id)
  if (!ids.length) return []
  return buscarMercados(ids, moedaConversao, ordenacao)
}

async function buscarRankingCoinGecko(moedaConversao) {
  return fetchComCache(`/coins/markets?${new URLSearchParams({
    vs_currency: moedaConversao,
    order: 'market_cap_desc',
    per_page: '10',
    page: '1',
    sparkline: 'false',
  })}`)
}

async function buscarMercados(ids, moedaConversao, ordenacao) {
  return fetchComCache(`/coins/markets?${new URLSearchParams({
    vs_currency: moedaConversao,
    ids: ids.join(','),
    order: ordenacao,
    per_page: String(ids.length),
    page: '1',
    sparkline: 'false',
  })}`)
}

async function fetchComCache(caminho) {
  const chave = caminho
  const item = cacheExterno.get(chave)
  if (item && item.expira > Date.now()) return item.dados

  const resposta = await fetch(`${COINGECKO}${caminho}`, {
    headers: { accept: 'application/json' },
  })
  if (!resposta.ok) {
    const mensagem = resposta.status === 429
      ? 'Limite de requisicoes da CoinGecko atingido. Tente novamente em instantes.'
      : `Erro ao consultar CoinGecko (${resposta.status}).`
    throw new Error(mensagem)
  }
  const dados = await resposta.json()
  cacheExterno.set(chave, { dados, expira: Date.now() + TTL_CACHE_EXTERNO_MS })
  return dados
}

function numeroOpcional(valor) {
  if (valor === undefined || valor === null || valor === '') return null
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

export default router
