import { useFavorites } from '../contexts/FavoritesContext'
import styles from './FavoritesList.module.css'

function formatPrice(value, currency) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: value < 1 ? 4 : 2,
  }).format(value)
}

export default function FavoritesList({ currency }) {
  const { favorites, removeFavorite, clearFavorites } = useFavorites()

  if (favorites.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.header}>
          <span className={styles.label}>Favoritos</span>
        </div>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>☆</span>
          <span className={styles.emptyText}>Nenhum favorito ainda</span>
          <span className={styles.emptyHint}>Clique em ☆ em qualquer moeda</span>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <span className={styles.label}>Favoritos</span>
        <span className={styles.count}>{favorites.length}</span>
        <button className={styles.clearBtn} onClick={clearFavorites}>
          Limpar
        </button>
      </div>
      <div className={styles.list}>
        {favorites.map((coin, i) => {
          const change = coin.price_change_percentage_24h
          const isPos = change > 0
          const isNeg = change < 0
          return (
            <div key={coin.id} className={styles.item} style={{ animationDelay: `${i * 40}ms` }}>
              <img src={coin.image} alt={coin.name} className={styles.logo} />
              <div className={styles.info}>
                <span className={styles.name}>{coin.name}</span>
                <span className={styles.symbol}>{coin.symbol?.toUpperCase()}</span>
              </div>
              <div className={styles.right}>
                <span className={styles.price}>{formatPrice(coin.current_price, currency)}</span>
                {change != null && (
                  <span className={`${styles.change} ${isPos ? styles.pos : isNeg ? styles.neg : styles.neu}`}>
                    {`${isPos ? '+' : ''}${change.toFixed(2)}%`}
                  </span>
                )}
              </div>
              <button
                className={styles.removeBtn}
                onClick={() => removeFavorite(coin.id)}
                aria-label={`Remover ${coin.name} dos favoritos`}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
