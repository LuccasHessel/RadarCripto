import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'

// Banco de dados PROPRIO do resource-service. Isolado do banco do
// auth-service - nenhuma tabela e compartilhada entre os servicos.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bancoPath = path.resolve(__dirname, '../../resource.sqlite')

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
      criado_por_nome TEXT,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT
    );
  `)
}
