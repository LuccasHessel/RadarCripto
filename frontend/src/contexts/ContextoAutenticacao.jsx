import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  buscarSessaoAtual,
  definirToken,
  login as loginApi,
  logout as logoutApi,
} from '../services/api'

const ContextoAutenticacao = createContext(null)
const CHAVE_TOKEN = 'radar_cripto_token'

export function ProvedorAutenticacao({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [token, setToken] = useState(null)
  const [carregandoSessao, setCarregandoSessao] = useState(true)

  useEffect(() => {
    let cancelado = false
    async function carregarSessao() {
      const tokenSalvo = localStorage.getItem(CHAVE_TOKEN)
      if (!tokenSalvo) {
        if (!cancelado) setCarregandoSessao(false)
        return
      }
      definirToken(tokenSalvo)
      try {
        const resposta = await buscarSessaoAtual()
        if (!cancelado) {
          setUsuario(resposta.usuario)
          setToken(tokenSalvo)
        }
      } catch {
        localStorage.removeItem(CHAVE_TOKEN)
        definirToken(null)
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
    localStorage.setItem(CHAVE_TOKEN, resposta.token)
    setToken(resposta.token)
    setUsuario(resposta.usuario)
  }, [])

  const sair = useCallback(async () => {
    try {
      await logoutApi()
    } finally {
      localStorage.removeItem(CHAVE_TOKEN)
      setToken(null)
      setUsuario(null)
    }
  }, [])

  const valor = useMemo(() => ({
    usuario,
    token,
    autenticado: !!usuario,
    carregandoSessao,
    entrar,
    sair,
  }), [usuario, token, carregandoSessao, entrar, sair])

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
