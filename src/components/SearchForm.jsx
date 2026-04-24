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
import styles from './SearchForm.module.css'
import CoinList from './CoinList'
import ErrorMessage from './ErrorMessage'

const schema = yup.object({
  query: yup
    .string()
    .trim()
    .min(2, 'Digite ao menos 2 caracteres')
    .required('O nome ou símbolo da moeda é obrigatório'),
  currency: yup
    .string()
    .oneOf(['brl', 'usd', 'eur'], 'Selecione uma moeda válida')
    .required('Selecione a moeda de conversão'),
  order: yup.string().required(),
})

const CURRENCIES = [
  { value: 'brl', label: 'BRL — Real Brasileiro' },
  { value: 'usd', label: 'USD — Dólar Americano' },
  { value: 'eur', label: 'EUR — Euro' },
]

const ORDERS = [
  { value: 'market_cap_desc', label: 'Market Cap ↓' },
  { value: 'market_cap_asc',  label: 'Market Cap ↑' },
  { value: 'volume_desc',     label: 'Volume ↓' },
  { value: 'gecko_desc',      label: 'Relevância' },
]

// useReducer to manage all search states
const initialSearchState = { status: 'idle', data: null, error: null }

function searchReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':   return { status: 'loading', data: null, error: null }
    case 'FETCH_SUCCESS': return { status: 'success', data: action.payload, error: null }
    case 'FETCH_ERROR':   return { status: 'error', data: null, error: action.payload }
    case 'RESET':         return initialSearchState
    default: return state
  }
}

async function resolveIds(query) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
  )
  if (!res.ok) throw new Error(`Erro ao buscar moedas (${res.status})`)
  const data = await res.json()
  if (!data.coins || data.coins.length === 0) return []
  return data.coins.slice(0, 10).map(c => c.id)
}

export default function SearchForm() {
  const [searchState, dispatch] = useReducer(searchReducer, initialSearchState)

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { query: '', currency: 'usd', order: 'market_cap_desc' },
    mode: 'onTouched',
  })

  const currency = watch('currency')

  const onSubmit = useCallback(async (values) => {
    dispatch({ type: 'FETCH_START' })
    try {
      const ids = await resolveIds(values.query)
      if (ids.length === 0) {
        dispatch({ type: 'FETCH_SUCCESS', payload: [] })
        return
      }
      const params = new URLSearchParams({
        vs_currency: values.currency,
        ids: ids.join(','),
        order: values.order,
        per_page: '10',
        page: '1',
        sparkline: 'false',
      })
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?${params}`
      )
      if (!res.ok) {
        const msg = res.status === 429
          ? 'Limite de requisições atingido. Aguarde alguns segundos e tente novamente.'
          : `Erro na API (${res.status}). Tente novamente.`
        throw new Error(msg)
      }
      const data = await res.json()
      dispatch({ type: 'FETCH_SUCCESS', payload: data })
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message })
    }
  }, [])

  const hasFormErrors = useMemo(
    () => Object.keys(errors).length > 0,
    [errors]
  )

  return (
    <div className={styles.wrapper}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className={styles.form}>
        <div className={styles.row}>
          <div className={styles.fieldLarge}>
            <TextField
              label="Moeda (nome ou símbolo)"
              placeholder="Ex: bitcoin, ETH, solana..."
              fullWidth
              variant="outlined"
              size="small"
              error={!!errors.query}
              helperText={errors.query?.message}
              {...register('query')}
              InputProps={{ style: { fontFamily: 'var(--font-mono)', fontSize: 14 } }}
            />
          </div>

          <div className={styles.fieldSmall}>
            <FormControl fullWidth size="small" error={!!errors.currency}>
              <InputLabel>Moeda de conversão</InputLabel>
              <Controller
                name="currency"
                control={control}
                render={({ field }) => (
                  <Select label="Moeda de conversão" {...field}>
                    {CURRENCIES.map(c => (
                      <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.currency && (
                <FormHelperText>{errors.currency.message}</FormHelperText>
              )}
            </FormControl>
          </div>

          <div className={styles.fieldSmall}>
            <FormControl fullWidth size="small" error={!!errors.order}>
              <InputLabel>Ordenar por</InputLabel>
              <Controller
                name="order"
                control={control}
                render={({ field }) => (
                  <Select label="Ordenar por" {...field}>
                    {ORDERS.map(o => (
                      <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </div>

          <button
            type="submit"
            className={styles.btn}
            disabled={isSubmitting || searchState.status === 'loading'}
          >
            {isSubmitting || searchState.status === 'loading' ? (
              <span className={styles.btnSpinner} />
            ) : (
              'Buscar'
            )}
          </button>
        </div>

        {hasFormErrors && (
          <div className={styles.formErrors}>
            {Object.values(errors).map((e, i) => (
              <ErrorMessage key={i} message={e.message} type="error" />
            ))}
          </div>
        )}
      </form>

      <CoinList state={searchState} currency={currency} />
    </div>
  )
}
