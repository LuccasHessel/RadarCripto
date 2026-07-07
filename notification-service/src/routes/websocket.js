import express from 'express'
import { WebSocketServer } from 'ws'
import { iniciarConsumidorEventos } from '../models/consumidorEventos.js'
import { registrarEvento, verificarTokenWebSocket } from '../config/security.js'

const router = express.Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', servico: 'notification-service' })
})

// Configura o servidor WebSocket (RF6) sobre o mesmo servidor HTTP e
// conecta o consumidor da fila de mensagens ao broadcast dos clientes.
export function configurarWebSocket(servidorHttp) {
  const wss = new WebSocketServer({ server: servidorHttp, path: '/ws' })

  wss.on('connection', (socket, req) => {
    const url = new URL(req.url, 'http://localhost')
    const token = url.searchParams.get('token')
    const payload = token ? verificarTokenWebSocket(token) : null

    if (!payload) {
      socket.close(4001, 'Token invalido ou ausente.')
      return
    }

    socket.usuarioId = payload.sub
    registrarEvento('websocket_conectado', { usuarioId: payload.sub })
    socket.send(JSON.stringify({ tipo: 'conexao.estabelecida' }))

    socket.on('close', () => {
      registrarEvento('websocket_desconectado', { usuarioId: payload.sub })
    })
  })

  iniciarConsumidorEventos((evento) => {
    const mensagem = JSON.stringify(evento)
    wss.clients.forEach((cliente) => {
      if (cliente.readyState === cliente.OPEN) {
        cliente.send(mensagem)
      }
    })
  })

  return wss
}

export default router
