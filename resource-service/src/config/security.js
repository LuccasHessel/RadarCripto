import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { tokenEstaRevogado } from './redis.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const NOME_SERVICO = 'resource-service'
const logDir = path.resolve(__dirname, '../../../logs')
const logPath = path.join(logDir, 'security.log')
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-dev-inseguro-trocar-em-producao'

// ---------- Autenticacao (validacao do JWT com o segredo compartilhado) ----------
export async function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || ''
  const [, token] = cabecalho.split(' ')
  if (!token) return res.status(401).json({ mensagem: 'Token de acesso obrigatorio.' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    if (await tokenEstaRevogado(payload.jti)) {
      return res.status(401).json({ mensagem: 'Sessao encerrada. Faca login novamente.' })
    }
    req.usuario = { id: payload.sub, nome: payload.nome, email: payload.email }
    next()
  } catch {
    return res.status(401).json({ mensagem: 'Token invalido ou expirado.' })
  }
}

// ---------- Sanitizacao (prevencao de injecao SQL/NoSQL e XSS) ----------
// Toda a persistencia usa consultas parametrizadas (previne SQL injection).
// Alem disso removemos caracteres de marcacao HTML/script das entradas de
// texto para mitigar XSS armazenado.
export function sanitizarTexto(valor, limite = 120) {
  return String(valor ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>{}$`;]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limite)
}

export function sanitizarUrl(valor, limite = 300) {
  const texto = sanitizarTexto(valor, limite)
  if (!texto) return ''
  return /^https?:\/\//i.test(texto) ? texto : ''
}

export function sanitizarMoeda(valor) {
  const moeda = sanitizarTexto(valor, 3).toLowerCase()
  return ['brl', 'usd', 'eur'].includes(moeda) ? moeda : ''
}

export function validarCamposObrigatorios(campos) {
  return Object.entries(campos)
    .filter(([, valor]) => valor === undefined || valor === null || String(valor).trim() === '')
    .map(([campo]) => campo)
}

// ---------- Rate limiting geral da API ----------
export const limitarRequisicoes = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensagem: 'Muitas requisicoes. Aguarde um instante.' },
})

// ---------- Logs de seguranca (centralizados, com identificacao do servico) ----------
export function registrarEvento(tipo, dados = {}) {
  const linha = JSON.stringify({
    data: new Date().toISOString(),
    servico: NOME_SERVICO,
    tipo,
    ...dados,
  })
  fs.appendFile(logPath, `${linha}\n`, () => {})
}
