import { useEffect, useReducer, useMemo } from 'react'
import { useFavorites } from '../contexts/FavoritesContext'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'
import styles from './TopRanking.module.css'

const initialState = { status: 'idle', data: null, error: null }

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':  return { ...state, status: 'loading', error: null }
    case 'FETCH_SUCCESS': return { status: 'success', data: action.payload, error: null }
    case 'FETCH_ERROR':  return { status: 'error', data: null, error: action.payload }
    default: return state
  }
}

function formatPrice(value, currency) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)
}

export default function TopRanking({ currency }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()

  useEffect(() => {
    let cancelled = false
    async function fetchTop() {
      dispatch({ type: 'FETCH_START' })
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=10&page=1&sparkline=false`
        )
        if (!res.ok) throw new Error(`Erro ${res.status}: não foi possível carregar o ranking.`)
        const data = await res.json()
        if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: data })
      } catch (err) {
        if (!cancelled) dispatch({ type: 'FETCH_ERROR', payload: err.message })
      }
    }
    fetchTop()
    return () => { cancelled = true }
  }, [currency])

  const sortedData = useMemo(() => {
    if (!state.data) return []
    return [...state.data].sort((a, b) => (a.market_cap_rank ?? 999) - (b.market_cap_rank ?? 999))
  }, [state.data])

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.label}>Top 10</span>
        <span className={styles.sublabel}>por capitalização de mercado</span>
      </div>

      {state.status === 'loading' && <LoadingSpinner label="Carregando ranking..." />}
      {state.status === 'error'   && <ErrorMessage message={state.error} />}

      {state.status === 'success' && (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span>#</span>
            <span>Moeda</span>
            <span>Preço</span>
            <span>24h</span>
            <span></span>
          </div>
          {sortedData.map((coin, i) => {
            const change = coin.price_change_percentage_24h
            const isPos = change > 0
            const isNeg = change < 0
            const fav = isFavorite(coin.id)
            return (
              <div
                key={coin.id}
                className={styles.row}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <span className={styles.rank}>{coin.market_cap_rank}</span>
                <div className={styles.coin}>
                  <img src={coin.image} alt={coin.name} className={styles.logo} />
                  <div>
                    <div className={styles.name}>{coin.name}</div>
                    <div className={styles.symbol}>{coin.symbol?.toUpperCase()}</div>
                  </div>
                </div>
                <span className={styles.price}>
                  {formatPrice(coin.current_price, currency)}
                </span>
                <span className={`${styles.change} ${isPos ? styles.pos : isNeg ? styles.neg : styles.neu}`}>
                  {change != null ? `${isPos ? '+' : ''}${change.toFixed(2)}%` : '—'}
                </span>
                <button
                  className={`${styles.fav} ${fav ? styles.favOn : ''}`}
                  onClick={() => fav ? removeFavorite(coin.id) : addFavorite(coin)}
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
