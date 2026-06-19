import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  buscarSessaoAtual,
  login as loginApi,
  logout as logoutApi,
  obterToken,
  removerToken,
  salvarToken,
} from '../services/api'

const ContextoAutenticacao = createContext(null)

export function ProvedorAutenticacao({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [carregandoSessao, setCarregandoSessao] = useState(true)

  useEffect(() => {
    let cancelado = false
    async function carregarSessao() {
      if (!obterToken()) {
        setCarregandoSessao(false)
        return
      }
      try {
        const resposta = await buscarSessaoAtual()
        if (!cancelado) setUsuario(resposta.usuario)
      } catch {
        removerToken()
        if (!cancelado) setUsuario(null)
      } finally {
        if (!cancelado) setCarregandoSessao(false)
      }
    }
    carregarSessao()
    return () => { cancelado = true }
  }, [])

  const entrar = useCallback(async ({ email, senha }) => {
    const resposta = await loginApi(email, senha)
    salvarToken(resposta.token)
    setUsuario(resposta.usuario)
  }, [])

  const sair = useCallback(async () => {
    try {
      await logoutApi()
    } finally {
      removerToken()
      setUsuario(null)
    }
  }, [])

  const valor = useMemo(() => ({
    usuario,
    autenticado: !!usuario,
    carregandoSessao,
    entrar,
    sair,
  }), [usuario, carregandoSessao, entrar, sair])

  return (
    <ContextoAutenticacao.Provider value={valor}>
      {children}
    </ContextoAutenticacao.Provider>
  )
}

export function usarAutenticacao() {
  const contexto = useContext(ContextoAutenticacao)
  if (!contexto) throw new Error('usarAutenticacao deve ser usado dentro de ProvedorAutenticacao')
  return contexto
}
