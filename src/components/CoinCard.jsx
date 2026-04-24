import { useMemo } from 'react'
import { useFavorites } from '../contexts/FavoritesContext'
import styles from './CoinCard.module.css'

function formatCurrency(value, currency) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value)
}

function formatBigNumber(value) {
  if (value == null) return '—'
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9)  return `${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6)  return `${(value / 1e6).toFixed(2)}M`
  return value.toLocaleString('pt-BR')
}

export default function CoinCard({ coin, currency, index }) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const favorited = isFavorite(coin.id)

  const changeColor = useMemo(() => {
    if (coin.price_change_percentage_24h > 0) return 'positive'
    if (coin.price_change_percentage_24h < 0) return 'negative'
    return 'neutral'
  }, [coin.price_change_percentage_24h])

  const changeDisplay = useMemo(() => {
    const v = coin.price_change_percentage_24h
    if (v == null) return '—'
    const sign = v > 0 ? '+' : ''
    return `${sign}${v.toFixed(2)}%`
  }, [coin.price_change_percentage_24h])

  function toggleFavorite() {
    if (favorited) {
      removeFavorite(coin.id)
    } else {
      addFavorite(coin)
    }
  }

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className={styles.rank}>#{coin.market_cap_rank ?? '—'}</div>

      <div className={styles.identity}>
        <img
          src={coin.image}
          alt={coin.name}
          className={styles.logo}
          loading="lazy"
        />
        <div>
          <div className={styles.name}>{coin.name}</div>
          <div className={styles.symbol}>{coin.symbol?.toUpperCase()}</div>
        </div>
      </div>

      <div className={styles.price}>
        {formatCurrency(coin.current_price, currency)}
      </div>

      <div className={`${styles.change} ${styles[changeColor]}`}>
        {changeDisplay}
      </div>

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Mkt Cap</span>
          <span className={styles.metaValue}>
            {formatBigNumber(coin.market_cap)}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Volume 24h</span>
          <span className={styles.metaValue}>
            {formatBigNumber(coin.total_volume)}
          </span>
        </div>
      </div>

      <button
        className={`${styles.favBtn} ${favorited ? styles.favActive : ''}`}
        onClick={toggleFavorite}
        aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        title={favorited ? 'Remover favorito' : 'Favoritar'}
      >
        {favorited ? '★' : '☆'}
      </button>
    </article>
  )
}
