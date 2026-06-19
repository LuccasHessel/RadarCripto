import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { inserirMoeda } from '../services/api'
import MensagemErro from './MensagemErro'
import estilos from './CadastroMoeda.module.css'

const esquema = yup.object({
  nome: yup.string().trim().required('Nome obrigatorio'),
  simbolo: yup.string().trim().required('Simbolo obrigatorio'),
  moedaConversao: yup.string().oneOf(['brl', 'usd', 'eur']).required(),
  precoAtual: yup.number().typeError('Informe um numero').positive('Informe valor positivo').required('Preco obrigatorio'),
  capitalizacaoMercado: yup.number().transform(v => Number.isNaN(v) ? null : v).nullable(),
  volume24h: yup.number().transform(v => Number.isNaN(v) ? null : v).nullable(),
  variacao24h: yup.number().transform(v => Number.isNaN(v) ? null : v).nullable(),
  imagem: yup.string().url('Informe uma URL valida').nullable().notRequired(),
})

export default function CadastroMoeda({ aoCadastrar }) {
  const [mensagem, setMensagem] = useState(null)
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(esquema),
    defaultValues: {
      nome: '',
      simbolo: '',
      moedaConversao: 'usd',
      precoAtual: '',
      capitalizacaoMercado: '',
      volume24h: '',
      variacao24h: '',
      imagem: '',
    },
  })

  async function aoEnviar(valores) {
    setMensagem(null)
    try {
      const resposta = await inserirMoeda(valores)
      setMensagem({ tipo: 'info', texto: resposta.mensagem })
      reset()
      aoCadastrar?.(resposta.dados)
    } catch (err) {
      setMensagem({ tipo: 'erro', texto: err.message })
    }
  }

  return (
    <section className={estilos.caixa}>
      <div className={estilos.cabecalho}>
        <h2 className={estilos.titulo}>Inserir moeda</h2>
        <p className={estilos.subtitulo}>Cadastre dados locais similares aos retornados pela API de cripto.</p>
      </div>

      <form className={estilos.formulario} onSubmit={handleSubmit(aoEnviar)} noValidate>
        <TextField label="Nome" size="small" error={!!errors.nome} helperText={errors.nome?.message} {...register('nome')} />
        <TextField label="Simbolo" size="small" error={!!errors.simbolo} helperText={errors.simbolo?.message} {...register('simbolo')} />
        <FormControl size="small">
          <InputLabel>Moeda</InputLabel>
          <Controller
            name="moedaConversao"
            control={control}
            render={({ field }) => (
              <Select label="Moeda" {...field}>
                <MenuItem value="brl">BRL</MenuItem>
                <MenuItem value="usd">USD</MenuItem>
                <MenuItem value="eur">EUR</MenuItem>
              </Select>
            )}
          />
        </FormControl>
        <TextField label="Preco atual" size="small" error={!!errors.precoAtual} helperText={errors.precoAtual?.message} {...register('precoAtual')} />
        <TextField label="Market cap" size="small" {...register('capitalizacaoMercado')} />
        <TextField label="Volume 24h" size="small" {...register('volume24h')} />
        <TextField label="Variacao 24h (%)" size="small" {...register('variacao24h')} />
        <TextField label="URL da imagem" size="small" error={!!errors.imagem} helperText={errors.imagem?.message} {...register('imagem')} />
        <button className={estilos.botao} disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Salvando...' : 'Inserir'}
        </button>
      </form>

      {mensagem && <MensagemErro mensagem={mensagem.texto} tipo={mensagem.tipo} />}
    </section>
  )
}
