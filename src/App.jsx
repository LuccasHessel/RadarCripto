import { useState } from 'react'
import { FavoritesProvider } from './contexts/FavoritesContext'
import SearchForm from './components/SearchForm'
import TopRanking from './components/TopRanking'
import FavoritesList from './components/FavoritesList'
import styles from './App.module.css'

const CURRENCIES = { brl: 'BRL', usd: 'USD', eur: 'EUR' }

export default function App() {
  const [currency, setCurrency] = useState('usd')
  const [activeTab, setActiveTab] = useState('ranking')

  return (
    <FavoritesProvider>
      <div className={styles.app}>
        {/* Background grid */}
        <div className={styles.grid} aria-hidden="true" />

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerInner}>
            <div className={styles.logo}>
              <span className={styles.logoMark}>◈</span>
              <span className={styles.logoText}>CryptoTrack</span>
            </div>
            <nav className={styles.currencyNav}>
              {Object.entries(CURRENCIES).map(([key, label]) => (
                <button
                  key={key}
                  className={`${styles.currencyBtn} ${currency === key ? styles.currencyActive : ''}`}
                  onClick={() => setCurrency(key)}
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </header>

        {/* Main layout */}
        <main className={styles.main}>
          {/* Left column: Search */}
          <section className={styles.searchCol}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Buscar moeda</h2>
              <p className={styles.sectionSub}>
                Digite o nome ou símbolo e configure os filtros
              </p>
            </div>
            <SearchForm />
          </section>

          {/* Right column: Ranking + Favorites */}
          <aside className={styles.sidebar}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'ranking' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('ranking')}
              >
                Ranking
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'favorites' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('favorites')}
              >
                Favoritos
              </button>
            </div>

            <div className={styles.tabContent}>
              {activeTab === 'ranking' && <TopRanking currency={currency} />}
              {activeTab === 'favorites' && <FavoritesList currency={currency} />}
            </div>
          </aside>
        </main>

        <footer className={styles.footer}>
          <span>Dados via</span>
          <a
            href="https://www.coingecko.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.footerLink}
          >
            CoinGecko API
          </a>
          <span className={styles.footerDot}>·</span>
          <span>ES47B — Programação Web Fullstack</span>
        </footer>
      </div>
    </FavoritesProvider>
  )
}
