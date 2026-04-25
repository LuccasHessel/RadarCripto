import { useReducer, useCallback, useMemo } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from '@mui/material'
import estilos from './FormularioBusca.module.css'
import ListaMoedas from './ListaMoedas'
import MensagemErro from './MensagemErro'
import { buscarIdsPorNome, buscarMoedasPorIds } from '../services/api'

const esquemaValidacao = yup.object({
  consulta: yup
    .string()
    .trim()
    .min(2, 'Digite ao menos 2 caracteres')
    .required('O nome ou símbolo da moeda é obrigatório'),
  moedaConversao: yup
    .string()
    .oneOf(['brl', 'usd', 'eur'], 'Selecione uma moeda válida')
    .required('Selecione a moeda de conversão'),
  ordenacao: yup.string().required(),
})

const MOEDAS_CONVERSAO = [
  { valor: 'brl', rotulo: 'BRL — Real Brasileiro' },
  { valor: 'usd', rotulo: 'USD — Dólar Americano' },
  { valor: 'eur', rotulo: 'EUR — Euro' },
]

const OPCOES_ORDENACAO = [
  { valor: 'market_cap_desc', rotulo: 'Market Cap ↓' },
  { valor: 'market_cap_asc',  rotulo: 'Market Cap ↑' },
  { valor: 'volume_desc',     rotulo: 'Volume ↓' },
  { valor: 'gecko_desc',      rotulo: 'Relevância' },
]

const estadoInicial = { status: 'ocioso', dados: null, erro: null }

function redutorBusca(estado, acao) {
  switch (acao.type) {
    case 'INICIAR':   return { status: 'carregando', dados: null, erro: null }
    case 'SUCESSO':   return { status: 'sucesso', dados: acao.payload, erro: null }
    case 'ERRO':      return { status: 'erro', dados: null, erro: acao.payload }
    case 'RESETAR':   return estadoInicial
    default: return estado
  }
}

export default function FormularioBusca() {
  const [estadoBusca, despachar] = useReducer(redutorBusca, estadoInicial)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(esquemaValidacao),
    defaultValues: { consulta: '', moedaConversao: 'usd', ordenacao: 'market_cap_desc' },
    mode: 'onTouched',
  })

  const moedaConversao = watch('moedaConversao')

  const aoEnviar = useCallback(async (valores) => {
    despachar({ type: 'INICIAR' })
    try {
      const ids = await buscarIdsPorNome(valores.consulta)
      if (ids.length === 0) {
        despachar({ type: 'SUCESSO', payload: [] })
        return
      }
      const dados = await buscarMoedasPorIds({
        ids,
        moedaConversao: valores.moedaConversao,
        ordenacao: valores.ordenacao,
      })
      despachar({ type: 'SUCESSO', payload: dados })
    } catch (err) {
      despachar({ type: 'ERRO', payload: err.message })
    }
  }, [])

  const temErrosFormulario = useMemo(
    () => Object.keys(errors).length > 0,
    [errors]
  )

  const carregando = isSubmitting || estadoBusca.status === 'carregando'

  return (
    <div className={estilos.caixa}>
      <form onSubmit={handleSubmit(aoEnviar)} noValidate className={estilos.formulario}>
        <div className={estilos.linha}>
          <div className={estilos.campoGrande}>
            <TextField
              label="Moeda (nome ou símbolo)"
              placeholder="Ex: bitcoin, ETH, solana..."
              fullWidth
              variant="outlined"
              size="small"
              error={!!errors.consulta}
              helperText={errors.consulta?.message}
              {...register('consulta')}
              InputProps={{ style: { fontFamily: 'var(--font-mono)', fontSize: 14 } }}
            />
          </div>

          <div className={estilos.campoPequeno}>
            <FormControl fullWidth size="small" error={!!errors.moedaConversao}>
              <InputLabel>Moeda de conversão</InputLabel>
              <Controller
                name="moedaConversao"
                control={control}
                render={({ field }) => (
                  <Select label="Moeda de conversão" {...field}>
                    {MOEDAS_CONVERSAO.map(m => (
                      <MenuItem key={m.valor} value={m.valor}>{m.rotulo}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.moedaConversao && (
                <FormHelperText>{errors.moedaConversao.message}</FormHelperText>
              )}
            </FormControl>
          </div>

          <div className={estilos.campoPequeno}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar por</InputLabel>
              <Controller
                name="ordenacao"
                control={control}
                render={({ field }) => (
                  <Select label="Ordenar por" {...field}>
                    {OPCOES_ORDENACAO.map(o => (
                      <MenuItem key={o.valor} value={o.valor}>{o.rotulo}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </div>

          <button
            type="submit"
            className={estilos.botao}
            disabled={carregando}
          >
            {carregando
              ? <span className={estilos.spinnerBotao} />
              : 'Buscar'
            }
          </button>
        </div>

        {temErrosFormulario && (
          <div className={estilos.errosFormulario}>
            {Object.values(errors).map((e, i) => (
              <MensagemErro key={i} mensagem={e.message} tipo="erro" />
            ))}
          </div>
        )}
      </form>

      <ListaMoedas estado={estadoBusca} moedaConversao={moedaConversao} />
    </div>
  )
}
