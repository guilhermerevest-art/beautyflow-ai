import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'react-hot-toast'
import AuthLayout from '../layouts/AuthLayout'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async ({ email, password }) => {
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard')
    } catch (err) {
const msg = err.message?.toLowerCase() || ''
      if (msg.includes('invalid') || msg.includes('credentials') || msg.includes('password')) {
        toast.error('E-mail ou senha incorretos. Verifique e tente novamente.')
      } else if (msg.includes('email not confirmed')) {
        toast.error('Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.')
      } else {
        toast.error(`Erro: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Entrar</h1>
      <p className="text-gray-500 text-sm mb-6">Acesse o painel do seu estúdio</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email"
          type="email"
          placeholder="seu@email.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Por favor, informe seu e-mail',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'E-mail inválido. Verifique e tente novamente.',
            },
          })}
        />
        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', {
            required: 'Por favor, informe sua senha',
            minLength: {
              value: 6,
              message: 'A senha precisa ter pelo menos 6 caracteres',
            },
          })}
        />
        <Button type="submit" disabled={loading} className="w-full mt-2">
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </AuthLayout>
  )
}
