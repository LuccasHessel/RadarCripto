import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import authRoutes from './src/routes/auth.js'
import { inicializarBanco } from './src/config/database.js'
import { registrarEvento } from './src/config/security.js'

const app = express()
const porta = Number(process.env.PORT || 3001)

inicializarBanco()

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }))
app.use(compression())
app.use(express.json({ limit: '32kb' }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', servico: 'auth-service' })
})

app.use('/', authRoutes)

app.use((err, req, res, _next) => {
  registrarEvento('erro_servidor', { metodo: req.method, rota: req.originalUrl, mensagem: err.message })
  res.status(500).json({ mensagem: 'Erro interno no servidor.' })
})

app.listen(porta, () => {
  console.log(`[auth-service] executando em http://localhost:${porta}`)
})
