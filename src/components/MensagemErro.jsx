import estilos from './MensagemErro.module.css'

export default function MensagemErro({ mensagem, tipo = 'erro' }) {
  if (!mensagem) return null
  return (
    <div className={`${estilos.caixa} ${estilos[tipo]}`} role="alert">
      <span className={estilos.icone}>{tipo === 'erro' ? '⚠' : 'ℹ'}</span>
      <span className={estilos.texto}>{mensagem}</span>
    </div>
  )
}
