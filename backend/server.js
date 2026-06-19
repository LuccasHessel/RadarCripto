import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './src/routes/auth.js'
import moedasRoutes from './src/routes/moedas.js'
import { inicializarBanco } from './src/config/database.js'
import {
  aplicarCabecalhosSeguranca,
  comprimirResposta,
  registrarEvento,
  servirArquivoComprimido,
} from './src/config/security.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const porta = Number(process.env.PORT || 3001)
const frontendDist = path.resolve(__dirname, '../frontend/dist')

inicializarBanco()

app.set('trust proxy', 1)
app.use(express.json({ limit: '32kb' }))
app.use(aplicarCabecalhosSeguranca)
app.use(comprimirResposta)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', servico: 'radar-cripto-api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/moedas', moedasRoutes)

app.use(servirArquivoComprimido(frontendDist))
app.use(express.static(frontendDist, {
  maxAge: '1h',
  etag: true,
  setHeaders(res) {
    res.setHeader('Cache-Control', 'public, max-age=3600')
  },
}))

app.get('*', (_req, res, next) => {
  res.sendFile(path.join(frontendDist, 'index.html'), (erro) => {
    if (erro) next()
  })
})

app.use((err, req, res, _next) => {
  registrarEvento('erro_servidor', {
    metodo: req.method,
    rota: req.originalUrl,
    mensagem: err.message,
  })
  res.status(500).json({ mensagem: 'Erro interno no servidor.' })
})

app.listen(porta, () => {
  console.log(`Radar Cripto API executando em http://localhost:${porta}`)
})
