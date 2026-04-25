import { createContext, useContext, useReducer, useCallback } from 'react'

const ContextoFavoritos = createContext(null)

const estadoInicial = {
  favoritos: [], // armazena apenas { id, nome, simbolo, imagem } — sem preço
}

function redutorFavoritos(estado, acao) {
  switch (acao.type) {
    case 'ADICIONAR':
      if (estado.favoritos.find(f => f.id === acao.payload.id)) return estado
      return {
        ...estado,
        favoritos: [acao.payload, ...estado.favoritos],
      }
    case 'REMOVER':
      return {
        ...estado,
        favoritos: estado.favoritos.filter(f => f.id !== acao.payload),
      }
    case 'LIMPAR':
      return { ...estado, favoritos: [] }
    default:
      return estado
  }
}

export function ProvedorFavoritos({ children }) {
  const [estado, despachar] = useReducer(redutorFavoritos, estadoInicial)

  const adicionarFavorito = useCallback((moeda) => {
    // Salva apenas dados estáticos — preço é buscado ao vivo por moeda de conversão
    despachar({
      type: 'ADICIONAR',
      payload: {
        id: moeda.id,
        nome: moeda.name,
        simbolo: moeda.symbol,
        imagem: moeda.image,
      },
    })
  }, [])

  const removerFavorito = useCallback((id) => {
    despachar({ type: 'REMOVER', payload: id })
  }, [])

  const limparFavoritos = useCallback(() => {
    despachar({ type: 'LIMPAR' })
  }, [])

  const ehFavorito = useCallback((id) => {
    return estado.favoritos.some(f => f.id === id)
  }, [estado.favoritos])

  return (
    <ContextoFavoritos.Provider value={{
      favoritos: estado.favoritos,
      adicionarFavorito,
      removerFavorito,
      limparFavoritos,
      ehFavorito,
    }}>
      {children}
    </ContextoFavoritos.Provider>
  )
}

export function usarFavoritos() {
  const contexto = useContext(ContextoFavoritos)
  if (!contexto) throw new Error('usarFavoritos deve ser usado dentro de ProvedorFavoritos')
  return contexto
}
