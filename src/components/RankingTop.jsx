import { useEffect, useReducer, useMemo } from 'react'
import { usarFavoritos } from '../contexts/ContextoFavoritos'
import CarregandoIndicador from './CarregandoIndicador'
import MensagemErro from './MensagemErro'
import { buscarRanking } from '../services/api'
import estilos from './RankingTop.module.css'

const estadoInicial = { status: 'ocioso', dados: null, erro: null }

function redutor(estado, acao) {
  switch (acao.type) {
    case 'INICIAR':  return { ...estado, status: 'carregando', erro: null }
    case 'SUCESSO':  return { status: 'sucesso', dados: acao.payload, erro: null }
    case 'ERRO':     return { status: 'erro', dados: null, erro: acao.payload }
    default: return estado
  }
}

function formatarPreco(valor, moeda) {
  if (valor == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: moeda.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: valor < 1 ? 4 : 2,
  }).format(valor)
}

export default function RankingTop({ moedaConversao }) {
  const [estado, despachar] = useReducer(redutor, estadoInicial)
  const { ehFavorito, adicionarFavorito, removerFavorito } = usarFavoritos()

  useEffect(() => {
    let cancelado = false
    async function carregarRanking() {
      despachar({ type: 'INICIAR' })
      try {
        const dados = await buscarRanking(moedaConversao)
        if (!cancelado) despachar({ type: 'SUCESSO', payload: dados })
      } catch (err) {
        if (!cancelado) despachar({ type: 'ERRO', payload: err.message })
      }
    }
    carregarRanking()
    return () => { cancelado = true }
  }, [moedaConversao])

  const dadosOrdenados = useMemo(() => {
    if (!estado.dados) return []
    return [...estado.dados].sort(
      (a, b) => (a.market_cap_rank ?? 999) - (b.market_cap_rank ?? 999)
    )
  }, [estado.dados])

  return (
    <section className={estilos.secao}>
      <div className={estilos.cabecalho}>
        <span className={estilos.rotulo}>Top 10</span>
        <span className={estilos.subrotulo}>por capitalização de mercado</span>
      </div>

      {estado.status === 'carregando' && <CarregandoIndicador rotulo="Carregando ranking..." />}
      {estado.status === 'erro' && <MensagemErro mensagem={estado.erro} />}

      {estado.status === 'sucesso' && (
        <div className={estilos.tabela}>
          <div className={estilos.cabecalhoTabela}>
            <span>#</span>
            <span>Moeda</span>
            <span>Preço</span>
            <span>24h</span>
            <span></span>
          </div>
          {dadosOrdenados.map((moeda, i) => {
            const variacao = moeda.price_change_percentage_24h
            const isPos = variacao > 0
            const isNeg = variacao < 0
            const fav = ehFavorito(moeda.id)
            return (
              <div
                key={moeda.id}
                className={estilos.linha}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className={estilos.posicao}>{moeda.market_cap_rank}</span>

                <div className={estilos.moeda}>
                  <img src={moeda.image} alt={moeda.name} className={estilos.logo} />
                  <div className={estilos.infoMoeda}>
                    <div className={estilos.nomeMoeda}>{moeda.name}</div>
                    <div className={estilos.simboloMoeda}>{moeda.symbol?.toUpperCase()}</div>
                  </div>
                </div>

                <span className={estilos.preco}>
                  {formatarPreco(moeda.current_price, moedaConversao)}
                </span>

                <span className={`${estilos.variacao} ${isPos ? estilos.pos : isNeg ? estilos.neg : estilos.neu}`}>
                  {variacao != null ? `${isPos ? '+' : ''}${variacao.toFixed(2)}%` : '—'}
                </span>

                <button
                  className={`${estilos.botaoFav} ${fav ? estilos.favAtivo : ''}`}
                  onClick={() => fav ? removerFavorito(moeda.id) : adicionarFavorito(moeda)}
                  aria-label={fav ? 'Remover favorito' : 'Favoritar'}
                >
                  {fav ? '★' : '☆'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
