import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const raizBackend = path.resolve(__dirname, '../..')
const logPath = path.join(raizBackend, 'security.log')
const tentativasLogin = new Map()
const TOKEN_BYTES = 32
const TOKEN_TTL_MS = 1000 * 60 * 60 * 2

export function aplicarCabecalhosSeguranca(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'same-origin')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' https: data:; connect-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'")
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  next()
}

export function comprimirResposta(req, res, next) {
  const aceitaGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '')
  if (!aceitaGzip) return next()

  const originalJson = res.json.bind(res)
  res.json = (body) => {
    const payload = Buffer.from(JSON.stringify(body))
    if (payload.length < 1024) return originalJson(body)
    zlib.gzip(payload, (erro, comprimido) => {
      if (erro) return originalJson(body)
      res.setHeader('Content-Encoding', 'gzip')
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Vary', 'Accept-Encoding')
      res.end(comprimido)
    })
  }
  next()
}

export function servirArquivoComprimido(diretorio) {
  return (req, res, next) => {
    const aceitaGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '')
    const caminhoSeguro = path.normalize(req.path).replace(/^(\.\.[/\\])+/, '')
    const arquivo = path.join(diretorio, caminhoSeguro)
    const extensao = path.extname(arquivo)
    const tipos = new Map([
      ['.html', 'text/html; charset=utf-8'],
      ['.js', 'text/javascript; charset=utf-8'],
      ['.css', 'text/css; charset=utf-8'],
      ['.svg', 'image/svg+xml'],
    ])

    if (!aceitaGzip || !tipos.has(extensao) || !arquivo.startsWith(diretorio)) {
      return next()
    }

    fs.readFile(arquivo, (erro, conteudo) => {
      if (erro) return next()
      zlib.gzip(conteudo, (erroGzip, comprimido) => {
        if (erroGzip) return next()
        res.setHeader('Content-Encoding', 'gzip')
        res.setHeader('Content-Type', tipos.get(extensao))
        res.setHeader('Cache-Control', 'public, max-age=3600')
        res.setHeader('Vary', 'Accept-Encoding')
        res.end(comprimido)
      })
    })
  }
}

export function sanitizarTexto(valor, limite = 120) {
  return String(valor ?? '')
    .replace(/[<>{}$;]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limite)
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

export function criarHashSenha(senha, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(String(senha), salt, 120000, 32, 'sha256').toString('hex')
  return `${salt}:${hash}`
}

export function verificarSenha(senha, hashArmazenado) {
  const [salt, hashEsperado] = String(hashArmazenado).split(':')
  if (!salt || !hashEsperado) return false
  const hash = criarHashSenha(senha, salt).split(':')[1]
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hashEsperado))
}

export function criarTokenSessao() {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('hex')
  return {
    token,
    tokenHash: hashToken(token),
    expiraEm: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  }
}

export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

export function limitarTentativasLogin(req, res, next) {
  const chave = req.ip || req.socket.remoteAddress || 'local'
  const agora = Date.now()
  const janelaMs = 60 * 1000
  const maximo = 5
  const registro = tentativasLogin.get(chave) || { contador: 0, inicio: agora }

  if (agora - registro.inicio > janelaMs) {
    tentativasLogin.set(chave, { contador: 1, inicio: agora })
    return next()
  }

  registro.contador += 1
  tentativasLogin.set(chave, registro)
  if (registro.contador > maximo) {
    registrarEvento('login_bloqueado_rate_limit', { ip: chave })
    return res.status(429).json({ mensagem: 'Muitas tentativas de login. Aguarde um minuto.' })
  }
  next()
}

export function criarCookieSessao(token, expiraEm, seguro) {
  const maxAgeSegundos = Math.max(0, Math.floor((new Date(expiraEm).getTime() - Date.now()) / 1000))
  const atributos = [
    `radar_cripto_sessao=${token}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    `Max-Age=${maxAgeSegundos}`,
  ]
  if (seguro) atributos.push('Secure')
  return atributos.join('; ')
}

export function limparCookieSessao(seguro) {
  const atributos = [
    'radar_cripto_sessao=',
    'HttpOnly',
    'Path=/',
    'SameSite=Strict',
    'Max-Age=0',
  ]
  if (seguro) atributos.push('Secure')
  return atributos.join('; ')
}

export function analisarCookies(cabecalho = '') {
  return Object.fromEntries(
    String(cabecalho || '')
      .split(';')
      .map((parte) => parte.trim())
      .filter(Boolean)
      .map((parte) => {
        const indice = parte.indexOf('=')
        if (indice === -1) return [parte, '']
        return [
          decodeURIComponent(parte.slice(0, indice)),
          decodeURIComponent(parte.slice(indice + 1)),
        ]
      })
  )
}

export function ehConexaoSegura(req) {
  return Boolean(req.secure || req.headers['x-forwarded-proto'] === 'https')
}

export function registrarEvento(tipo, dados = {}) {
  const linha = JSON.stringify({
    data: new Date().toISOString(),
    tipo,
    ...dados,
  })
  fs.appendFile(logPath, `${linha}\n`, () => {})
}
