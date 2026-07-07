import { useCallback, useEffect, useState } from 'react'
import { atualizarMoeda, buscarMinhasMoedas, excluirMoeda } from '../services/api'
import CarregandoIndicador from './CarregandoIndicador'
import MensagemErro from './MensagemErro'
import estilos from './MinhasMoedas.module.css'

function formatarMoeda(valor, moeda) {
  if (valor == null) return '-'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: (moeda || 'usd').toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: valor < 1 ? 6 : 2,
  }).format(valor)
}

export default function MinhasMoedas({ atualizacao = 0 }) {
  const [status, setStatus] = useState('carregando')
  const [moedas, setMoedas] = useState([])
  const [erro, setErro] = useState(null)
  const [emEdicao, setEmEdicao] = useState(null)
  const [aExcluir, setAExcluir] = useState(null)
  const [salvando, setSalvando] = useState(false)

  const carregar = useCallback(async () => {
    setStatus('carregando')
    try {
      const dados = await buscarMinhasMoedas()
      setMoedas(dados)
      setStatus('sucesso')
    } catch (err) {
      setErro(err.message)
      setStatus('erro')
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar, atualizacao])

  function iniciarEdicao(moeda) {
    setEmEdicao({
      id: moeda.id,
      nome: moeda.name,
      simbolo: moeda.symbol,
      precoAtual: moeda.current_price,
      capitalizacaoMercado: moeda.market_cap ?? '',
      volume24h: moeda.total_volume ?? '',
      variacao24h: moeda.price_change_percentage_24h ?? '',
      imagem: moeda.image || '',
      moedaConversaoOriginal: moeda.moedaConversao || 'usd',
    })
  }

  async function salvarEdicao(evento) {
    evento.preventDefault()
    setSalvando(true)
    setErro(null)
    try {
      await atualizarMoeda(emEdicao.id, {
        nome: emEdicao.nome,
        simbolo: emEdicao.simbolo,
        moedaConversao: emEdicao.moedaConversaoOriginal || 'usd',
        precoAtual: Number(emEdicao.precoAtual),
        capitalizacaoMercado: emEdicao.capitalizacaoMercado,
        volume24h: emEdicao.volume24h,
        variacao24h: emEdicao.variacao24h,
        imagem: emEdicao.imagem,
      })
      setEmEdicao(null)
      await carregar()
    } catch (err) {
      setErro(err.message)
    } finally {
      setSalvando(false)
    }
  }

  async function confirmarExclusao() {
    try {
      await excluirMoeda(aExcluir.id)
      setAExcluir(null)
      await carregar()
    } catch (err) {
      setErro(err.message)
      setAExcluir(null)
    }
  }

  return (
    <section className={estilos.secao}>
      <div className={estilos.cabecalho}>
        <span className={estilos.rotulo}>Minhas moedas</span>
        <span className={estilos.contador}>{moedas.length}</span>
      </div>

      {status === 'carregando' && <CarregandoIndicador rotulo="Carregando suas moedas..." />}
      {erro && <MensagemErro mensagem={erro} tipo="erro" />}

      {status === 'sucesso' && moedas.length === 0 && (
        <div className={estilos.vazio}>
          <span>Voce ainda nao cadastrou nenhuma moeda.</span>
          <span>Use o formulario "Inserir moeda" para comecar.</span>
        </div>
      )}

      {status === 'sucesso' && moedas.length > 0 && (
        <div className={estilos.lista}>
          {moedas.map((moeda) => (
            <div key={moeda.id}>
              {emEdicao?.id === moeda.id ? (
                <form className={estilos.formularioEdicao} onSubmit={salvarEdicao}>
                  <input
                    value={emEdicao.nome}
                    onChange={(e) => setEmEdicao(v => ({ ...v, nome: e.target.value }))}
                    placeholder="Nome"
                    required
                  />
                  <input
                    value={emEdicao.simbolo}
                    onChange={(e) => setEmEdicao(v => ({ ...v, simbolo: e.target.value }))}
                    placeholder="Simbolo"
                    required
                  />
                  <input
                    type="number"
                    step="any"
                    value={emEdicao.precoAtual}
                    onChange={(e) => setEmEdicao(v => ({ ...v, precoAtual: e.target.value }))}
                    placeholder="Preco atual"
                    required
                  />
                  <input
                    value={emEdicao.imagem}
                    onChange={(e) => setEmEdicao(v => ({ ...v, imagem: e.target.value }))}
                    placeholder="URL da imagem"
                  />
                  <div className={estilos.linhaBotoes}>
                    <button type="button" className={estilos.botaoCancelar} onClick={() => setEmEdicao(null)}>
                      Cancelar
                    </button>
                    <button type="submit" className={estilos.botaoSalvar} disabled={salvando}>
                      {salvando ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className={estilos.item}>
                  <img src={moeda.image || '/vite.svg'} alt={moeda.name} className={estilos.logo} />
                  <div className={estilos.info}>
                    <span className={estilos.nome}>{moeda.name}</span>
                    <span className={estilos.simbolo}>{moeda.symbol?.toUpperCase()}</span>
                  </div>
                  <span className={estilos.preco}>{formatarMoeda(moeda.current_price, 'usd')}</span>
                  <div className={estilos.acoes}>
                    <button className={estilos.botaoAcao} onClick={() => iniciarEdicao(moeda)} type="button">
                      Editar
                    </button>
                    <button
                      className={`${estilos.botaoAcao} ${estilos.botaoExcluir}`}
                      onClick={() => setAExcluir(moeda)}
                      type="button"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {aExcluir && (
        <div className={estilos.sobreposicao} role="dialog" aria-modal="true">
          <div className={estilos.dialogo}>
            <span className={estilos.dialogoTitulo}>Excluir moeda?</span>
            <span className={estilos.dialogoTexto}>
              Tem certeza que deseja excluir "{aExcluir.name}"? Esta acao nao pode ser desfeita.
            </span>
            <div className={estilos.dialogoBotoes}>
              <button className={estilos.botaoCancelar} onClick={() => setAExcluir(null)} type="button">
                Cancelar
              </button>
              <button className={estilos.botaoConfirmarExcluir} onClick={confirmarExclusao} type="button">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
