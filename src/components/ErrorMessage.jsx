import styles from './ErrorMessage.module.css'

export default function ErrorMessage({ message, type = 'error' }) {
  if (!message) return null
  return (
    <div className={`${styles.wrapper} ${styles[type]}`} role="alert">
      <span className={styles.icon}>
        {type === 'error' ? '⚠' : 'ℹ'}
      </span>
      <span className={styles.text}>{message}</span>
    </div>
  )
}
