import { useState, useEffect } from 'react'
import { Mail, Database, Users, Save } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { emailService } from '@/services/email'
import { backupService } from '@/services/misc'
import { authService } from '@/services/auth'
import { useAuthStore as _useAuthStore } from '@/store/authStore'
import type { User, BackupInfo } from '@/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/utils/dateUtils'
import { formatFileSize } from '@/utils/formatters'

const emailSchema = z.object({
  smtp_host: z.string().min(1, 'Requerido'),
  smtp_port: z.coerce.number().int().min(1).max(65535),
  smtp_user: z.string().min(1, 'Requerido'),
  smtp_password: z.string().min(1, 'Requerido'),
  from_name: z.string().min(1, 'Requerido'),
  from_email: z.string().email('Correo inválido'),
  enabled: z.boolean(),
  days_before_reminder: z.coerce.number().int().min(1).max(30),
})

type EmailForm = z.infer<typeof emailSchema>

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'email' | 'backup' | 'users'>('email')
  const [backups, setBackups] = useState<BackupInfo[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [creatingBackup, setCreatingBackup] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<EmailForm>({ resolver: zodResolver(emailSchema) })

  useEffect(() => {
    const loadEmail = async () => {
      try {
        const s = await emailService.getSettings()
        reset({
          smtp_host: s.smtp_host,
          smtp_port: s.smtp_port,
          smtp_user: s.smtp_user,
          smtp_password: s.smtp_password,
          from_name: s.from_name,
          from_email: s.from_email,
          enabled: s.enabled,
          days_before_reminder: s.days_before_reminder,
        })
      } catch {/* ignore */}
    }

    const loadBackups = async () => {
      try {
        const b = await backupService.list()
        setBackups(b)
      } catch {/* ignore */}
    }

    const loadUsers = async () => {
      try {
        const u = await authService.getUsers()
        setUsers(u)
      } catch {/* ignore */}
    }

    loadEmail()
    loadBackups()
    loadUsers()
  }, [reset])

  const saveEmail = async (data: EmailForm) => {
    try {
      await emailService.saveSettings(data)
      toast.success('Configuración guardada')
    } catch (e) {
      toast.error(String(e))
    }
  }

  const sendTest = async () => {
    if (!testEmail) return toast.error('Ingresa un correo de prueba')
    setSendingTest(true)
    try {
      await emailService.sendTest(testEmail)
      toast.success('Correo de prueba enviado')
    } catch (e) {
      toast.error(String(e))
    } finally {
      setSendingTest(false)
    }
  }

  const createBackup = async () => {
    setCreatingBackup(true)
    try {
      const b = await backupService.create()
      toast.success(`Respaldo creado: ${b.filename}`)
      setBackups((prev) => [b, ...prev])
    } catch (e) {
      toast.error(String(e))
    } finally {
      setCreatingBackup(false)
    }
  }

  const tabs = [
    { key: 'email', label: 'Correo SMTP', icon: Mail },
    { key: 'backup', label: 'Respaldos', icon: Database },
    { key: 'users', label: 'Usuarios', icon: Users },
  ] as const

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-gym-text">Configuración</h1>
          <p className="text-sm text-gym-text-secondary">Administración del sistema</p>
        </div>
      </div>

      <div className="page-content">
        {/* Tabs */}
        <div className="flex gap-1 bg-gym-surface2 rounded-xl p-1 mb-6 w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? 'bg-gym-orange text-white shadow-sm'
                  : 'text-gym-text-secondary hover:text-gym-text'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Email Tab */}
        {activeTab === 'email' && (
          <div className="max-w-lg space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Configuración SMTP</CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit(saveEmail)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Servidor SMTP *" placeholder="smtp.gmail.com" error={errors.smtp_host?.message} {...register('smtp_host')} />
                  <Input label="Puerto *" type="number" placeholder="587" error={errors.smtp_port?.message} {...register('smtp_port')} />
                </div>
                <Input label="Usuario *" placeholder="tu@email.com" error={errors.smtp_user?.message} {...register('smtp_user')} />
                <Input label="Contraseña *" type="password" placeholder="••••••••" error={errors.smtp_password?.message} {...register('smtp_password')} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nombre remitente *" placeholder="GymOS" error={errors.from_name?.message} {...register('from_name')} />
                  <Input label="Correo remitente *" placeholder="gym@email.com" error={errors.from_email?.message} {...register('from_email')} />
                </div>
                <Input label="Días antes para recordatorio *" type="number" min="1" max="30" error={errors.days_before_reminder?.message} {...register('days_before_reminder')} />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" {...register('enabled')} className="accent-gym-orange w-4 h-4" />
                  <span className="text-sm text-gym-text-secondary">Recordatorios automáticos activados</span>
                </label>
                <Button type="submit" loading={isSubmitting}>
                  <Save className="w-4 h-4" />
                  Guardar configuración
                </Button>
              </form>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Correo de prueba</CardTitle>
              </CardHeader>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@email.com"
                  className="flex-1 bg-gym-surface2 border border-gym-border rounded-lg px-3 py-2 text-sm text-gym-text focus:outline-none focus:ring-2 focus:ring-gym-orange/40"
                />
                <Button onClick={sendTest} loading={sendingTest} variant="outline">
                  Enviar prueba
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Backup Tab */}
        {activeTab === 'backup' && (
          <div className="max-w-lg space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Crear respaldo</CardTitle>
              </CardHeader>
              <p className="text-sm text-gym-text-secondary mb-4">
                Se creará un respaldo de la base de datos en tu carpeta de inicio (GymOS_Backups).
              </p>
              <Button onClick={createBackup} loading={creatingBackup}>
                <Database className="w-4 h-4" />
                Crear respaldo ahora
              </Button>
            </Card>

            {backups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Respaldos disponibles ({backups.length})</CardTitle>
                </CardHeader>
                <div className="space-y-2">
                  {backups.map((b) => (
                    <div key={b.filename} className="flex items-center justify-between py-2 border-b border-gym-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gym-text">{b.filename}</p>
                        <p className="text-xs text-gym-text-secondary">
                          {formatDate(b.created_at)} · {formatFileSize(b.size_bytes)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="max-w-lg">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios del sistema ({users.length})</CardTitle>
              </CardHeader>
              <div className="space-y-2">
                {users.map((u) => (
                  <div key={u.id} className="flex items-center justify-between py-2.5 border-b border-gym-border/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gym-orange/20 flex items-center justify-center">
                        <span className="text-gym-orange text-xs font-bold">
                          {u.full_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gym-text">{u.full_name}</p>
                        <p className="text-xs text-gym-text-secondary">@{u.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={u.role === 'admin' ? 'orange' : 'info'}>
                        {u.role === 'admin' ? 'Administrador' : 'Recepción'}
                      </Badge>
                      <Badge variant={u.is_active ? 'success' : 'default'}>
                        {u.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
