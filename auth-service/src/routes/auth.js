import express from 'express'
import { buscarUsuarioPorEmail, buscarUsuarioPorId } from '../models/Usuario.js'
import { revogarToken, tokenEstaRevogado } from '../config/redis.js'
import {
  emitirToken,
  limitarTentativasLogin,
  registrarEvento,
  sanitizarTexto,
  validarCamposObrigatorios,
  verificarSenha,
  verificarToken,
} from '../config/security.js'

const router = express.Router()

// Middleware de autenticacao usado pelas rotas do proprio auth-service
// (/me e /logout). O resource-service e o notification-service possuem
// sua propria copia deste middleware, validando o JWT com o segredo
// compartilhado (nenhuma chamada sincrona obrigatoria entre servicos).
export async function autenticar(req, res, next) {
  const cabecalho = req.headers.authorization || ''
  const [, token] = cabecalho.split(' ')
  if (!token) return res.status(401).json({ mensagem: 'Token de acesso obrigatorio.' })

  try {
    const payload = verificarToken(token)
    if (await tokenEstaRevogado(payload.jti)) {
      return res.status(401).json({ mensagem: 'Sessao encerrada. Faca login novamente.' })
    }
    req.usuario = { id: payload.sub, nome: payload.nome, email: payload.email, jti: payload.jti, exp: payload.exp }
    next()
  } catch {
    return res.status(401).json({ mensagem: 'Token invalido ou expirado.' })
  }
}

// ---------- RF1: Login ----------
router.post('/login', limitarTentativasLogin, (req, res) => {
  const email = sanitizarTexto(req.body.email, 160).toLowerCase()
  const senha = String(req.body.senha || '')
  const faltantes = validarCamposObrigatorios({ email, senha })

  if (faltantes.length) {
    return res.status(400).json({ mensagem: `Campos obrigatorios: ${faltantes.join(', ')}.` })
  }

  const usuario = buscarUsuarioPorEmail(email)
  if (!usuario || !verificarSenha(senha, usuario.senha_hash)) {
    registrarEvento('falha_autenticacao', { email })
    return res.status(401).json({ mensagem: 'E-mail ou senha invalidos.' })
  }

  const { token, expiraEm } = emitirToken(usuario)
  registrarEvento('login_sucesso', { usuarioId: usuario.id })

  res.json({
    token,
    expiraEm,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  })
})

router.get('/me', autenticar, (req, res) => {
  const usuario = buscarUsuarioPorId(req.usuario.id)
  if (!usuario) return res.status(404).json({ mensagem: 'Usuario nao encontrado.' })
  res.json({ usuario })
})

// Logout: invalida o token adicionando seu jti a lista de revogacao,
// com TTL igual ao tempo restante de vida do token.
router.post('/logout', autenticar, async (req, res) => {
  const ttlSegundos = req.usuario.exp - Math.floor(Date.now() / 1000)
  await revogarToken(req.usuario.jti, ttlSegundos)
  registrarEvento('logout', { usuarioId: req.usuario.id })
  res.status(204).end()
})

export default router
