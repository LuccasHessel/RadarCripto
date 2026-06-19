import express from 'express'
import { buscarUsuarioPorEmail } from '../models/Usuario.js'
import { buscarSessaoAtiva, criarSessao, revogarSessao } from '../models/Sessao.js'
import {
  criarCookieSessao,
  criarTokenSessao,
  ehConexaoSegura,
  hashToken,
  limitarTentativasLogin,
  limparCookieSessao,
  registrarEvento,
  sanitizarTexto,
  validarCamposObrigatorios,
  verificarSenha,
} from '../config/security.js'

const router = express.Router()

export async function autenticar(req, res, next) {
  const token = req.cookies?.radar_cripto_sessao || ''
  if (!token) return res.status(401).json({ mensagem: 'Sessao ativa obrigatoria.' })

  const sessao = buscarSessaoAtiva(hashToken(token))
  if (!sessao) return res.status(401).json({ mensagem: 'Sessao expirada ou invalida.' })

  req.usuario = {
    id: sessao.usuario_id,
    nome: sessao.nome,
    email: sessao.email,
    tokenHash: sessao.token_hash,
  }
  next()
}

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

  const sessao = criarTokenSessao()
  criarSessao({ tokenHash: sessao.tokenHash, usuarioId: usuario.id, expiraEm: sessao.expiraEm })
  registrarEvento('login_sucesso', { usuarioId: usuario.id })

  res.setHeader('Set-Cookie', criarCookieSessao(sessao.token, sessao.expiraEm, ehConexaoSegura(req)))
  res.json({
    expiraEm: sessao.expiraEm,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
  })
})

router.get('/me', autenticar, (req, res) => {
  res.json({ usuario: { id: req.usuario.id, nome: req.usuario.nome, email: req.usuario.email } })
})

router.post('/logout', autenticar, (req, res) => {
  revogarSessao(req.usuario.tokenHash)
  registrarEvento('logout', { usuarioId: req.usuario.id })
  res.setHeader('Set-Cookie', limparCookieSessao(ehConexaoSegura(req)))
  res.status(204).end()
})

export default router
