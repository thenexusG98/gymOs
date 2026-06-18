import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dumbbell, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '@/services/auth'
import { useAuthStore } from '@/store/authStore'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const user = await authService.login(data.username, data.password)
      login(user)
      navigate('/dashboard', { replace: true })
    } catch (e) {
      toast.error(String(e) || 'Credenciales incorrectas')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gym-bg">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gym-orange rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-gym-orange/30">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gym-text">GymOS</h1>
          <p className="text-gym-text-secondary text-sm mt-1">Sistema de Administración</p>
        </div>

        {/* Form */}
        <div className="bg-gym-surface border border-gym-border rounded-2xl p-8 shadow-xl">
          <h2 className="text-base font-semibold text-gym-text mb-6">Iniciar sesión</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Usuario"
              placeholder="admin"
              autoFocus
              autoComplete="username"
              error={errors.username?.message}
              {...register('username')}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              loading={isLoading}
            >
              <LogIn className="w-4 h-4" />
              Ingresar
            </Button>
          </form>
          <p className="text-xs text-gym-text-secondary text-center mt-4">
            Acceso predeterminado: <span className="text-gym-orange">admin / admin123</span>
          </p>
        </div>
      </div>
    </div>
  )
}
