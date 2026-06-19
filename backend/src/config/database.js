import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import { criarHashSenha } from './security.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bancoPath = path.resolve(__dirname, '../../radar_cripto.sqlite')
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
    CREATE TABLE IF NOT EXISTS sessoes (
      token_hash TEXT PRIMARY KEY,
      usuario_id INTEGER NOT NULL,
      expira_em TEXT NOT NULL,
      criada_em TEXT NOT NULL,
      revogada_em TEXT,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
    CREATE TABLE IF NOT EXISTS moedas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      simbolo TEXT NOT NULL,
      preco_atual REAL NOT NULL,
      moeda_conversao TEXT NOT NULL,
      capitalizacao_mercado REAL,
      volume_24h REAL,
      variacao_24h REAL,
      imagem TEXT,
      criado_por INTEGER NOT NULL,
      criado_em TEXT NOT NULL,
      FOREIGN KEY (criado_por) REFERENCES usuarios(id)
    );
  `)

  const usuario = db.prepare('SELECT id FROM usuarios WHERE email = ?').get('admin@radarcripto.local')
  if (!usuario) {
    db.prepare(`
      INSERT INTO usuarios (nome, email, senha_hash, criado_em)
      VALUES (?, ?, ?, ?)
    `).run(
      'Administrador Radar Cripto',
      'admin@radarcripto.local',
      criarHashSenha('Radar@2025'),
      new Date().toISOString()
    )
  }
}
