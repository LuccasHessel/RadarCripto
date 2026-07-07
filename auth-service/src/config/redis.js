import Redis from 'ioredis'

// Redis e usado aqui apenas como infraestrutura compartilhada para a
// lista de revogacao de tokens (blacklist). Nao ha compartilhamento de
// tabelas/colecoes de negocio entre os servicos.
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 2,
  lazyConnect: false,
})

redis.on('error', (erro) => {
  console.error('[auth-service] erro de conexao com o Redis:', erro.message)
})

export async function revogarToken(jti, ttlSegundos) {
  if (ttlSegundos <= 0) return
  await redis.set(`blacklist:${jti}`, '1', 'EX', ttlSegundos)
}

export async function tokenEstaRevogado(jti) {
  const valor = await redis.get(`blacklist:${jti}`)
  return valor !== null
}
