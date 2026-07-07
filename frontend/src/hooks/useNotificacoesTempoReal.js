import { useEffect, useRef, useState } from 'react'

const WS_URL = import.meta.env.VITE_NOTIFICATION_WS_URL || 'ws://localhost:3003/ws'

// RF6 - Notificacoes em tempo real: conecta ao notification-service via
// WebSocket assim que o usuario esta autenticado e expoe o ultimo evento
// recebido da fila (recurso.criado | recurso.atualizado | recurso.excluido)
// para que os componentes possam atualizar suas listagens automaticamente.
export function useNotificacoesTempoReal(token) {
  const [ultimoEvento, setUltimoEvento] = useState(null)
  const [conectado, setConectado] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    if (!token) return undefined

    let cancelado = false
    let tentativaReconexao = null

    function conectar() {
      const socket = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`)
      socketRef.current = socket

      socket.onopen = () => {
        if (!cancelado) setConectado(true)
      }

      socket.onmessage = (mensagem) => {
        try {
          const evento = JSON.parse(mensagem.data)
          if (evento.tipo && evento.tipo !== 'conexao.estabelecida' && !cancelado) {
            setUltimoEvento({ ...evento, recebidoEm: Date.now() })
          }
        } catch {
          // mensagem nao reconhecida, ignora
        }
      }

      socket.onclose = () => {
        if (cancelado) return
        setConectado(false)
        tentativaReconexao = setTimeout(conectar, 3000)
      }

      socket.onerror = () => {
        socket.close()
      }
    }

    conectar()

    return () => {
      cancelado = true
      clearTimeout(tentativaReconexao)
      socketRef.current?.close()
    }
  }, [token])

  return { ultimoEvento, conectado }
}
