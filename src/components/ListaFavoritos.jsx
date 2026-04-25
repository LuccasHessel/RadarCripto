import { useEffect, useReducer } from 'react'
import { usarFavoritos } from '../contexts/ContextoFavoritos'
import CarregandoIndicador from './CarregandoIndicador'
import MensagemErro from './MensagemErro'
import { buscarPrecoAtualizado } from '../services/api'
import estilos from './ListaFavoritos.module.css'

const estadoInicial = { status: 'ocioso', precos: {}, erro: null }

function redutor(estado, acao) {
  switch (acao.type) {
    case 'INICIAR':  return { ...estado, status: 'carregando', erro: null }
    case 'SUCESSO':  return { status: 'sucesso', precos: acao.payload, erro: null }
    case 'ERRO':     return { status: 'erro', precos: {}, erro: acao.payload }
    case 'OCIOSO':   return estadoInicial
    default: return estado
  }
}

function formatarMoeda(valor, moeda) {
  if (valor == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: moeda.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: valor < 1 ? 4 : 2,
  }).format(valor)
}

export default function ListaFavoritos({ moedaConversao }) {
  const { favoritos, removerFavorito, limparFavoritos } = usarFavoritos()
  const [estado, despachar] = useReducer(redutor, estadoInicial)

  useEffect(() => {
    if (favoritos.length === 0) {
      despachar({ type: 'OCIOSO' })
      return
    }
    let cancelado = false
    async function carregarPrecos() {
      despachar({ type: 'INICIAR' })
      try {
        const ids = favoritos.map(f => f.id)
        const dados = await buscarPrecoAtualizado(ids, moedaConversao)
        if (cancelado) return
        const mapaPrecos = {}
        dados.forEach(m => { mapaPrecos[m.id] = m })
        despachar({ type: 'SUCESSO', payload: mapaPrecos })
      } catch (err) {
        if (!cancelado) despachar({ type: 'ERRO', payload: err.message })
      }
    }
    carregarPrecos()
    return () => { cancelado = true }
  }, [favoritos, moedaConversao])

  if (favoritos.length === 0) {
    return (
      <section className={estilos.secao}>
        <div className={estilos.cabecalho}>
          <span className={estilos.rotulo}>Favoritos</span>
        </div>
        <div className={estilos.vazio}>
          <span className={estilos.iconeVazio}>☆</span>
          <span className={estilos.textoVazio}>Nenhum favorito ainda</span>
          <span className={estilos.dicaVazio}>Clique em ☆ em qualquer moeda</span>
        </div>
      </section>
    )
  }

  return (
    <section className={estilos.secao}>
      <div className={estilos.cabecalho}>
        <span className={estilos.rotulo}>Favoritos</span>
        <span className={estilos.contador}>{favoritos.length}</span>
        <button className={estilos.botaoLimpar} onClick={limparFavoritos}>Limpar</button>
      </div>

      {estado.status === 'carregando' && <CarregandoIndicador rotulo="Atualizando preços..." />}
      {estado.status === 'erro' && <MensagemErro mensagem={estado.erro} tipo="erro" />}

      {(estado.status === 'sucesso' || estado.status === 'ocioso') && (
        <div className={estilos.lista}>
          {favoritos.map((fav, i) => {
            const dadosAoVivo = estado.precos[fav.id]
            const variacao = dadosAoVivo?.price_change_percentage_24h
            const isPos = variacao > 0
            const isNeg = variacao < 0
            return (
              <div key={fav.id} className={estilos.item} style={{ animationDelay: `${i * 40}ms` }}>
                <img src={fav.imagem} alt={fav.nome} className={estilos.logo} />
                <div className={estilos.info}>
                  <span className={estilos.nome}>{fav.nome}</span>
                  <span className={estilos.simbolo}>{fav.simbolo?.toUpperCase()}</span>
                </div>
                <div className={estilos.direita}>
                  <span className={estilos.preco}>
                    {dadosAoVivo ? formatarMoeda(dadosAoVivo.current_price, moedaConversao) : '—'}
                  </span>
                  {variacao != null && (
                    <span className={`${estilos.variacao} ${isPos ? estilos.pos : isNeg ? estilos.neg : estilos.neu}`}>
                      {`${isPos ? '+' : ''}${variacao.toFixed(2)}%`}
                    </span>
                  )}
                </div>
                <button
                  className={estilos.botaoRemover}
                  onClick={() => removerFavorito(fav.id)}
                  aria-label={`Remover ${fav.nome} dos favoritos`}
                >×</button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
