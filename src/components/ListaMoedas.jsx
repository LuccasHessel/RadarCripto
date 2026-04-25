import CartaoMoeda from './CartaoMoeda'
import CarregandoIndicador from './CarregandoIndicador'
import MensagemErro from './MensagemErro'
import estilos from './ListaMoedas.module.css'

export default function ListaMoedas({ estado, moedaConversao }) {
  const { status, dados, erro } = estado

  if (status === 'ocioso') return null

  if (status === 'carregando') {
    return <CarregandoIndicador rotulo="Consultando CoinGecko..." />
  }

  if (status === 'erro') {
    return (
      <div className={estilos.caixa}>
        <MensagemErro mensagem={erro} tipo="erro" />
      </div>
    )
  }

  if (status === 'sucesso' && (!dados || dados.length === 0)) {
    return (
      <div className={estilos.caixa}>
        <MensagemErro
          mensagem="Nenhuma moeda encontrada para os parâmetros informados."
          tipo="info"
        />
      </div>
    )
  }

  return (
    <section className={estilos.caixa}>
      <div className={estilos.cabecalho}>
        <span className={estilos.titulo}>Resultados</span>
        <span className={estilos.contador}>
          {dados.length} moeda{dados.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className={estilos.lista}>
        {dados.map((moeda, i) => (
          <CartaoMoeda
            key={moeda.id}
            moeda={moeda}
            moedaConversao={moedaConversao}
            indice={i}
          />
        ))}
      </div>
    </section>
  )
}
