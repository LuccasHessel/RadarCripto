import { useState } from 'react'
import { ProvedorFavoritos } from './contexts/ContextoFavoritos'
import FormularioBusca from './components/FormularioBusca'
import RankingTop from './components/RankingTop'
import ListaFavoritos from './components/ListaFavoritos'
import estilos from './App.module.css'

const MOEDAS = { brl: 'BRL', usd: 'USD', eur: 'EUR' }

export default function App() {
  const [moedaConversao, setMoedaConversao] = useState('usd')
  const [abaAtiva, setAbaAtiva] = useState('ranking')

  return (
    <ProvedorFavoritos>
      <div className={estilos.app}>
        <div className={estilos.grade} aria-hidden="true" />

        <header className={estilos.cabecalho}>
          <div className={estilos.cabecalhoInterno}>
            <div className={estilos.logo}>
              <span className={estilos.logoMarca}>◈</span>
              <span className={estilos.logoTexto}>Radar Cripto</span>
            </div>
            <nav className={estilos.navMoeda}>
              {Object.entries(MOEDAS).map(([chave, rotulo]) => (
                <button
                  key={chave}
                  className={`${estilos.botaoMoeda} ${moedaConversao === chave ? estilos.moedaAtiva : ''}`}
                  onClick={() => setMoedaConversao(chave)}
                >
                  {rotulo}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className={estilos.principal}>
          <section className={estilos.colunaBusca}>
            <div className={estilos.cabecalhoSecao}>
              <h2 className={estilos.tituloBusca}>Buscar moeda</h2>
              <p className={estilos.subtituloBusca}>
                Digite o nome ou símbolo e configure os filtros
              </p>
            </div>
            <FormularioBusca />
          </section>

          <aside className={estilos.painel}>
            <div className={estilos.abas}>
              <button
                className={`${estilos.aba} ${abaAtiva === 'ranking' ? estilos.abaAtiva : ''}`}
                onClick={() => setAbaAtiva('ranking')}
              >
                Ranking
              </button>
              <button
                className={`${estilos.aba} ${abaAtiva === 'favoritos' ? estilos.abaAtiva : ''}`}
                onClick={() => setAbaAtiva('favoritos')}
              >
                Favoritos
              </button>
            </div>
            <div className={estilos.conteudoAba}>
              {abaAtiva === 'ranking'   && <RankingTop moedaConversao={moedaConversao} />}
              {abaAtiva === 'favoritos' && <ListaFavoritos moedaConversao={moedaConversao} />}
            </div>
          </aside>
        </main>

        <footer className={estilos.rodape}>
          <span>Dados via</span>
          <a
            href="https://www.coingecko.com"
            target="_blank"
            rel="noopener noreferrer"
            className={estilos.linkRodape}
          >
            CoinGecko API
          </a>
          <span className={estilos.separador}>·</span>
          <span>ES47B — Programação Web Fullstack</span>
        </footer>
      </div>
    </ProvedorFavoritos>
  )
}
