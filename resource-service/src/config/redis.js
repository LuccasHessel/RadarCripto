import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
const CANAL_EVENTOS = process.env.REDIS_CANAL_EVENTOS || 'recursos.eventos'

// Conexao usada para publicar eventos (fila de mensagens / Pub-Sub) e
// para consultar a blacklist de tokens revogados, escrita pelo auth-service.
export const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 2 })

redis.on('error', (erro) => {
  console.error('[resource-service] erro de conexao com o Redis:', erro.message)
})

export async function tokenEstaRevogado(jti) {
  try {
    const valor = await redis.get(`blacklist:${jti}`)
    return valor !== null
  } catch {
    // Se o Redis estiver indisponivel, nao bloqueia a autenticacao por
    // isso (o JWT continua validado por assinatura/expiracao).
    return false
  }
}

// Publica um evento de escrita (criado/atualizado/excluido) na fila de
// mensagens. O notification-service consome este canal.
export async function publicarEvento(tipo, dados) {
  const mensagem = JSON.stringify({ tipo, dados, emitidoEm: new Date().toISOString() })
  try {
    await redis.publish(CANAL_EVENTOS, mensagem)
  } catch (erro) {
    console.error('[resource-service] falha ao publicar evento na fila:', erro.message)
  }
}
