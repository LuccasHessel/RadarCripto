import 'dotenv/config'
import http from 'node:http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import healthRoutes, { configurarWebSocket } from './src/routes/websocket.js'

const app = express()
const porta = Number(process.env.PORT || 3003)

app.set('trust proxy', 1)
app.use(helmet())
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }))
app.use('/', healthRoutes)

const servidorHttp = http.createServer(app)
configurarWebSocket(servidorHttp)

servidorHttp.listen(porta, () => {
  console.log(`[notification-service] HTTP em http://localhost:${porta}`)
  console.log(`[notification-service] WebSocket em ws://localhost:${porta}/ws`)
})
