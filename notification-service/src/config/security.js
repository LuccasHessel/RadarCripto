import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import jwt from 'jsonwebtoken'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const NOME_SERVICO = 'notification-service'
const logDir = path.resolve(__dirname, '../../../logs')
const logPath = path.join(logDir, 'security.log')
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true })

const JWT_SECRET = process.env.JWT_SECRET || 'segredo-dev-inseguro-trocar-em-producao'

// Valida o JWT enviado pelo cliente ao abrir a conexao WebSocket
// (?token=...), garantindo que somente usuarios autenticados recebam
// notificacoes em tempo real.
export function verificarTokenWebSocket(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export function registrarEvento(tipo, dados = {}) {
  const linha = JSON.stringify({
    data: new Date().toISOString(),
    servico: NOME_SERVICO,
    tipo,
    ...dados,
  })
  fs.appendFile(logPath, `${linha}\n`, () => {})
}
