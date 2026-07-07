import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { criarHashSenha } from './security.js'

// Banco de dados PROPRIO do auth-service. Nenhum outro servico
// acessa este arquivo diretamente (persistencia isolada por servico).
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bancoPath = path.resolve(__dirname, '../../auth.sqlite')

// Pool simples de conexoes (round-robin) para o SGBD.
const TAMANHO_POOL = Number(process.env.DB_POOL_SIZE || 4)
const pool = Array.from({ length: TAMANHO_POOL }, () => new DatabaseSync(bancoPath))
let ponteiro = 0

export function obterConexao() {
  const conexao = pool[ponteiro]
  ponteiro = (ponteiro + 1) % pool.length
  return conexao
}

export function inicializarBanco() {
  const db = obterConexao()
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      criado_em TEXT NOT NULL
    );
  `)

  const usuariosSeed = [
    { nome: 'Administrador Radar Cripto', email: 'admin@radarcripto.local', senha: 'Radar@2025' },
    { nome: 'Usuaria Convidada', email: 'convidada@radarcripto.local', senha: 'Convidada@2025' },
  ]

  for (const usuario of usuariosSeed) {
    const existente = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(usuario.email)
    if (!existente) {
      db.prepare(`
        INSERT INTO usuarios (nome, email, senha_hash, criado_em)
        VALUES (?, ?, ?, ?)
      `).run(usuario.nome, usuario.email, criarHashSenha(usuario.senha), new Date().toISOString())
    }
  }
}
