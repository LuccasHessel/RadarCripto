import CoinCard from './CoinCard'
import LoadingSpinner from './LoadingSpinner'
import ErrorMessage from './ErrorMessage'
import styles from './CoinList.module.css'

export default function CoinList({ state, currency }) {
  const { status, data, error } = state

  if (status === 'idle') return null

  if (status === 'loading') {
    return <LoadingSpinner label="Consultando CoinGecko..." />
  }

  if (status === 'error') {
    return (
      <div className={styles.wrapper}>
        <ErrorMessage message={error} type="error" />
      </div>
    )
  }

  if (status === 'success' && (!data || data.length === 0)) {
    return (
      <div className={styles.wrapper}>
        <ErrorMessage
          message="Nenhuma moeda encontrada para os parâmetros informados."
          type="info"
        />
      </div>
    )
  }

  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>Resultados</span>
        <span className={styles.count}>{data.length} moeda{data.length !== 1 ? 's' : ''}</span>
      </div>
      <div className={styles.list}>
        {data.map((coin, i) => (
          <CoinCard
            key={coin.id}
            coin={coin}
            currency={currency}
            index={i}
          />
        ))}
      </div>
    </section>
  )
}
