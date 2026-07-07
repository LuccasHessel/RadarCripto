import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
export const CANAL_EVENTOS = process.env.REDIS_CANAL_EVENTOS || 'recursos.eventos'

// Conexao dedicada para inscricao (subscribe). O ioredis exige uma
// conexao separada da usada para comandos comuns quando em modo de
// assinatura de canais Pub/Sub.
export const redisSubscriber = new Redis(REDIS_URL)

redisSubscriber.on('error', (erro) => {
  console.error('[notification-service] erro de conexao com o Redis:', erro.message)
})
