import { useMemo } from 'react'
import { usarFavoritos } from '../contexts/ContextoFavoritos'
import estilos from './CartaoMoeda.module.css'

function formatarMoeda(valor, moeda) {
  if (valor == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: moeda.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: valor < 1 ? 6 : 2,
  }).format(valor)
}

function formatarNumeroGrande(valor) {
  if (valor == null) return '—'
  if (valor >= 1e12) return `${(valor / 1e12).toFixed(2)}T`
  if (valor >= 1e9)  return `${(valor / 1e9).toFixed(2)}B`
  if (valor >= 1e6)  return `${(valor / 1e6).toFixed(2)}M`
  return valor.toLocaleString('pt-BR')
}

export default function CartaoMoeda({ moeda, moedaConversao, indice }) {
  const { ehFavorito, adicionarFavorito, removerFavorito } = usarFavoritos()
  const favoritado = ehFavorito(moeda.id)

  const corVariacao = useMemo(() => {
    if (moeda.price_change_percentage_24h > 0) return 'positivo'
    if (moeda.price_change_percentage_24h < 0) return 'negativo'
    return 'neutro'
  }, [moeda.price_change_percentage_24h])

  const textoVariacao = useMemo(() => {
    const v = moeda.price_change_percentage_24h
    if (v == null) return '—'
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`
  }, [moeda.price_change_percentage_24h])

  function alternarFavorito() {
    if (favoritado) removerFavorito(moeda.id)
    else adicionarFavorito(moeda)
  }

  return (
    <article
      className={estilos.cartao}
      style={{ animationDelay: `${indice * 60}ms` }}
    >
      <div className={estilos.ranking}>#{moeda.market_cap_rank ?? '—'}</div>

      <div className={estilos.identidade}>
        <img
          src={moeda.image}
          alt={moeda.name}
          className={estilos.logo}
          loading="lazy"
        />
        <div className={estilos.nomeBloco}>
          <div className={estilos.nome}>{moeda.name}</div>
          <div className={estilos.simbolo}>{moeda.symbol?.toUpperCase()}</div>
        </div>
      </div>

      <div className={estilos.preco}>
        {formatarMoeda(moeda.current_price, moedaConversao)}
      </div>

      <div className={`${estilos.variacao} ${estilos[corVariacao]}`}>
        {textoVariacao}
      </div>

      <div className={estilos.metadados}>
        <div className={estilos.itemMeta}>
          <span className={estilos.rotuloMeta}>Mkt Cap</span>
          <span className={estilos.valorMeta}>{formatarNumeroGrande(moeda.market_cap)}</span>
        </div>
        <div className={estilos.itemMeta}>
          <span className={estilos.rotuloMeta}>Volume 24h</span>
          <span className={estilos.valorMeta}>{formatarNumeroGrande(moeda.total_volume)}</span>
        </div>
      </div>

      <button
        className={`${estilos.botaoFav} ${favoritado ? estilos.favAtivo : ''}`}
        onClick={alternarFavorito}
        aria-label={favoritado ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        {favoritado ? '★' : '☆'}
      </button>
    </article>
  )
}
