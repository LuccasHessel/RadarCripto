import estilos from './CarregandoIndicador.module.css'

export default function CarregandoIndicador({ rotulo = 'Carregando...' }) {
  return (
    <div className={estilos.caixa}>
      <div className={estilos.spinner} aria-label={rotulo} />
      <span className={estilos.rotulo}>{rotulo}</span>
    </div>
  )
}
