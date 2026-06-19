import express from 'express'
import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import authRoutes from './src/routes/auth.js'
import moedasRoutes from './src/routes/moedas.js'
import { inicializarBanco } from './src/config/database.js'
import {
  analisarCookies,
  aplicarCabecalhosSeguranca,
  comprimirResposta,
  ehConexaoSegura,
  registrarEvento,
  servirArquivoComprimido,
} from './src/config/security.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const porta = Number(process.env.PORT || 3001)
const frontendDist = path.resolve(__dirname, '../frontend/dist')
const certPath = path.resolve(__dirname, 'certs/localhost.pem')
const keyPath = path.resolve(__dirname, 'certs/localhost-key.pem')
const temCertificadoLocal = fs.existsSync(certPath) && fs.existsSync(keyPath)

inicializarBanco()

app.set('trust proxy', 1)
app.use(express.json({ limit: '32kb' }))

// Le os cookies da requisicao (usado para a sessao httpOnly)
app.use((req, _res, next) => {
  req.cookies = analisarCookies(req.headers.cookie)
  next()
})

// Em producao, forca redirecionamento de HTTP para HTTPS
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !ehConexaoSegura(req)) {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`)
  }
  next()
})

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

if (temCertificadoLocal) {
  https.createServer(
    {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    },
    app
  ).listen(porta, () => {
    console.log(`Radar Cripto API (HTTPS) executando em https://localhost:${porta}`)
  })
} else {
  app.listen(porta, () => {
    console.log(`Radar Cripto API executando em http://localhost:${porta}`)
    console.log('Dica: para rodar com HTTPS local, gere um certificado com "npm run gerar-certificado" e reinicie o servidor.')
  })
}
