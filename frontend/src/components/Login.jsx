import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { TextField } from '@mui/material'
import { usarAutenticacao } from '../contexts/ContextoAutenticacao'
import MensagemErro from './MensagemErro'
import estilos from './Login.module.css'

const esquema = yup.object({
  email: yup.string().email('Informe um e-mail valido').required('E-mail obrigatorio'),
  senha: yup.string().required('Senha obrigatoria'),
})

export default function Login() {
  const { entrar } = usarAutenticacao()
  const [erro, setErro] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(esquema),
    defaultValues: { email: 'admin@radarcripto.local', senha: 'Radar@2025' },
  })

  async function aoEnviar(valores) {
    setErro('')
    try {
      await entrar(valores)
    } catch (err) {
      setErro(err.message)
    }
  }

  return (
    <main className={estilos.tela}>
      <section className={estilos.painel}>
        <div className={estilos.marca}>Radar Cripto</div>
        <h1 className={estilos.titulo}>Acesso restrito</h1>
        <p className={estilos.texto}>Entre para buscar e inserir moedas no sistema.</p>

        <form className={estilos.formulario} onSubmit={handleSubmit(aoEnviar)} noValidate>
          <TextField
            label="E-mail"
            fullWidth
            size="small"
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />
          <TextField
            label="Senha"
            type="password"
            fullWidth
            size="small"
            error={!!errors.senha}
            helperText={errors.senha?.message}
            {...register('senha')}
          />
          {erro && <MensagemErro mensagem={erro} tipo="erro" />}
          <button className={estilos.botao} disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </main>
  )
}
