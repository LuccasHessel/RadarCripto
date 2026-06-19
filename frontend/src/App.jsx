import { useState } from 'react'
import { ProvedorAutenticacao, usarAutenticacao } from './contexts/ContextoAutenticacao'
import { ProvedorFavoritos } from './contexts/ContextoFavoritos'
import FormularioBusca from './components/FormularioBusca'
import RankingTop from './components/RankingTop'
import ListaFavoritos from './components/ListaFavoritos'
import CadastroMoeda from './components/CadastroMoeda'
import Login from './components/Login'
import CarregandoIndicador from './components/CarregandoIndicador'
import estilos from './App.module.css'

const MOEDAS = { brl: 'BRL', usd: 'USD', eur: 'EUR' }

function AplicacaoAutenticada() {
  const [moedaConversao, setMoedaConversao] = useState('usd')
  const [abaAtiva, setAbaAtiva] = useState('ranking')
  const [atualizacaoRanking, setAtualizacaoRanking] = useState(0)
  const { usuario, sair } = usarAutenticacao()

  return (
    <ProvedorFavoritos>
      <div className={estilos.app}>
        <div className={estilos.grade} aria-hidden="true" />

        <header className={estilos.cabecalho}>
          <div className={estilos.cabecalhoInterno}>
            <div className={estilos.logo}>
              <span className={estilos.logoMarca}>●</span>
              <span className={estilos.logoTexto}>Radar Cripto</span>
            </div>
            <nav className={estilos.navMoeda}>
              {Object.entries(MOEDAS).map(([chave, rotulo]) => (
                <button
                  key={chave}
                  className={`${estilos.botaoMoeda} ${moedaConversao === chave ? estilos.moedaAtiva : ''}`}
                  onClick={() => setMoedaConversao(chave)}
                  type="button"
                >
                  {rotulo}
                </button>
              ))}
            </nav>
            <div className={estilos.sessao}>
              <span>{usuario?.nome}</span>
              <button className={estilos.botaoSair} onClick={sair} type="button">Sair</button>
            </div>
          </div>
        </header>

        <main className={estilos.principal}>
          <section className={estilos.colunaBusca}>
            <div className={estilos.cabecalhoSecao}>
              <h2 className={estilos.tituloBusca}>Buscar moeda</h2>
              <p className={estilos.subtituloBusca}>
                Digite o nome ou simbolo e consulte dados pelo backend
              </p>
            </div>
            <FormularioBusca />
            <CadastroMoeda aoCadastrar={() => setAtualizacaoRanking(v => v + 1)} />
          </section>

          <aside className={estilos.painel}>
            <div className={estilos.abas}>
              <button
                className={`${estilos.aba} ${abaAtiva === 'ranking' ? estilos.abaAtiva : ''}`}
                onClick={() => setAbaAtiva('ranking')}
                type="button"
              >
                Ranking
              </button>
              <button
                className={`${estilos.aba} ${abaAtiva === 'favoritos' ? estilos.abaAtiva : ''}`}
                onClick={() => setAbaAtiva('favoritos')}
                type="button"
              >
                Favoritos
              </button>
            </div>
            <div className={estilos.conteudoAba}>
              {abaAtiva === 'ranking' && (
                <RankingTop
                  moedaConversao={moedaConversao}
                  atualizacao={atualizacaoRanking}
                />
              )}
              {abaAtiva === 'favoritos' && <ListaFavoritos moedaConversao={moedaConversao} />}
            </div>
          </aside>
        </main>

        <footer className={estilos.rodape}>
          <span>Front-end React</span>
          <span className={estilos.separador}>·</span>
          <span>Back-end Express + SQLite</span>
          <span className={estilos.separador}>·</span>
          <span>ES47B - Programacao Web Fullstack</span>
        </footer>
      </div>
    </ProvedorFavoritos>
  )
}

function Conteudo() {
  const { autenticado, carregandoSessao } = usarAutenticacao()

  if (carregandoSessao) {
    return (
      <div className={estilos.telaCarregamento}>
        <CarregandoIndicador rotulo="Verificando sessao..." />
      </div>
    )
  }

  return autenticado ? <AplicacaoAutenticada /> : <Login />
}

export default function App() {
  return (
    <ProvedorAutenticacao>
      <Conteudo />
    </ProvedorAutenticacao>
  )
}
