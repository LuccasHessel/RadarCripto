import { CANAL_EVENTOS, redisSubscriber } from '../config/redis.js'
import { registrarEvento } from '../config/security.js'

// Consumidor da fila de mensagens: assina o canal publicado pelo
// resource-service e repassa cada evento recebido para o callback de
// broadcast fornecido pelo servidor WebSocket (routes/websocket.js).
export function iniciarConsumidorEventos(aoReceberEvento) {
  redisSubscriber.subscribe(CANAL_EVENTOS, (erro) => {
    if (erro) {
      console.error('[notification-service] falha ao assinar o canal:', erro.message)
      return
    }
    console.log(`[notification-service] inscrito no canal "${CANAL_EVENTOS}"`)
  })

  redisSubscriber.on('message', (canal, mensagem) => {
    if (canal !== CANAL_EVENTOS) return
    try {
      const evento = JSON.parse(mensagem)
      registrarEvento('evento_consumido', { tipo: evento.tipo })
      aoReceberEvento(evento)
    } catch (erro) {
      console.error('[notification-service] evento invalido recebido da fila:', erro.message)
    }
  })
}
