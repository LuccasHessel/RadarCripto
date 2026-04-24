import styles from './LoadingSpinner.module.css'

export default function LoadingSpinner({ label = 'Carregando...' }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.spinner} aria-label={label} />
      <span className={styles.label}>{label}</span>
    </div>
  )
}
