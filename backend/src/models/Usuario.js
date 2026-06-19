import { obterConexao } from '../config/database.js'

export function buscarUsuarioPorEmail(email) {
  return obterConexao()
    .prepare('SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ?')
    .get(email)
}
