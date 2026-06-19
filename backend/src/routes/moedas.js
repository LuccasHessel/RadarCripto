import express from 'express'
import { autenticar } from './auth.js'
import {
  buscarMoedasLocaisPorIds,
  inserirMoeda,
  listarMoedasLocais,
  listarRankingLocal,
} from '../models/Moeda.js'
import {
  registrarEvento,
  sanitizarMoeda,
  sanitizarTexto,
  validarCamposObrigatorios,
} from '../config/security.js'

const router = express.Router()
const COINGECKO = 'https://api.coingecko.com/api/v3'
const cache = new Map()
const TTL_CACHE_MS = 1000 * 60 * 5
const ORDENACOES = new Set(['market_cap_desc', 'market_cap_asc', 'volume_desc', 'gecko_desc'])

router.use(autenticar)

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
    const locais = listarMoedasLocais({ consulta, moedaConversao })
    const remotas = await buscarMoedasCoinGecko({ consulta, moedaConversao, ordenacao })
    res.json({ dados: [...locais, ...remotas].slice(0, 15) })
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
    const locais = listarRankingLocal(moedaConversao)
    const remotas = await buscarRankingCoinGecko(moedaConversao)
    res.json({ dados: [...remotas, ...locais].slice(0, 10) })
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

router.post('/', (req, res) => {
  const nome = sanitizarTexto(req.body.nome, 80)
  const simbolo = sanitizarTexto(req.body.simbolo, 12).toUpperCase()
  const moedaConversao = sanitizarMoeda(req.body.moedaConversao)
  const precoAtual = Number(req.body.precoAtual)
  const capitalizacaoMercado = numeroOpcional(req.body.capitalizacaoMercado)
  const volume24h = numeroOpcional(req.body.volume24h)
  const variacao24h = numeroOpcional(req.body.variacao24h)
  const imagem = sanitizarTexto(req.body.imagem, 240)
  const faltantes = validarCamposObrigatorios({ nome, simbolo, moedaConversao, precoAtual })

  if (faltantes.length || !Number.isFinite(precoAtual) || precoAtual <= 0) {
    return res.status(400).json({
      mensagem: 'Preencha nome, simbolo, moeda de conversao e preco atual valido.',
    })
  }

  const moeda = inserirMoeda({
    nome,
    simbolo,
    precoAtual,
    moedaConversao,
    capitalizacaoMercado,
    volume24h,
    variacao24h,
    imagem,
    usuarioId: req.usuario.id,
  })

  registrarEvento('insercao_moeda', { usuarioId: req.usuario.id, moeda: moeda.id })
  res.status(201).json({ dados: moeda, mensagem: 'Moeda cadastrada com sucesso.' })
})

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
  const item = cache.get(chave)
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
  cache.set(chave, { dados, expira: Date.now() + TTL_CACHE_MS })
  return dados
}

function numeroOpcional(valor) {
  if (valor === undefined || valor === null || valor === '') return null
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : null
}

export default router
