import { obterConexao } from '../config/database.js'

export function criarSessao({ tokenHash, usuarioId, expiraEm }) {
  obterConexao().prepare(`
    INSERT INTO sessoes (token_hash, usuario_id, expira_em, criada_em)
    VALUES (?, ?, ?, ?)
  `).run(tokenHash, usuarioId, expiraEm, new Date().toISOString())
}

export function buscarSessaoAtiva(tokenHash) {
  return obterConexao().prepare(`
    SELECT s.token_hash, s.usuario_id, u.nome, u.email
    FROM sessoes s
    JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.token_hash = ?
      AND s.revogada_em IS NULL
      AND s.expira_em > ?
  `).get(tokenHash, new Date().toISOString())
}

export function revogarSessao(tokenHash) {
  obterConexao().prepare(`
    UPDATE sessoes SET revogada_em = ? WHERE token_hash = ?
  `).run(new Date().toISOString(), tokenHash)
}
