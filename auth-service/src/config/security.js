import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const NOME_SERVICO = 'auth-service'
const logDir = path.resolve(__dirname, '../../../logs')
const logPath = path.join(logDir, 'security.log')
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-dev-inseguro-trocar-em-producao'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m'
const SALT_ROUNDS = 12

// ---------- Criptografia de senha (hash + salt) ----------
export function criarHashSenha(senha) {
  return bcrypt.hashSync(String(senha), SALT_ROUNDS)
}

export function verificarSenha(senha, hashArmazenado) {
  try {
    return bcrypt.compareSync(String(senha), String(hashArmazenado))
  } catch {
    return false
  }
}

// ---------- JWT ----------
export function emitirToken(usuario) {
  const jti = crypto_randomId()
  const token = jwt.sign(
    { sub: usuario.id, nome: usuario.nome, email: usuario.email, jti },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
  const decodificado = jwt.decode(token)
  return { token, jti, expiraEm: new Date(decodificado.exp * 1000).toISOString() }
}

export function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

function crypto_randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

// ---------- Sanitizacao (prevencao de injecao/XSS) ----------
export function sanitizarTexto(valor, limite = 160) {
  return String(valor ?? '')
    .replace(/[<>{}$`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limite)
}

export function validarCamposObrigatorios(campos) {
  return Object.entries(campos)
    .filter(([, valor]) => valor === undefined || valor === null || String(valor).trim() === '')
    .map(([campo]) => campo)
}

// ---------- Rate limiting (protecao contra forca bruta no login) ----------
export const limitarTentativasLogin = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { mensagem: 'Muitas tentativas de login. Aguarde um minuto e tente novamente.' },
  handler: (req, res, _next, options) => {
    registrarEvento('login_bloqueado_rate_limit', { ip: req.ip })
    res.status(options.statusCode).json(options.message)
  },
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
