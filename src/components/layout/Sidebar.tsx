import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  BarChart3,
  Settings,
  Dumbbell,
  CheckSquare,
  ClipboardList,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users, label: 'Alumnos' },
  { to: '/plans', icon: ClipboardList, label: 'Planes' },
  { to: '/payments', icon: CreditCard, label: 'Pagos' },
  { to: '/expenses', icon: DollarSign, label: 'Gastos' },
  { to: '/attendance', icon: CheckSquare, label: 'Asistencia' },
  { to: '/reports', icon: BarChart3, label: 'Reportes' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
]

export default function Sidebar() {
  const { user, logout } = useAuthStore()

  return (
    <aside className="w-56 bg-gym-surface border-r border-gym-border flex flex-col flex-shrink-0 h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gym-border">
        <div className="w-9 h-9 bg-gym-orange rounded-xl flex items-center justify-center flex-shrink-0">
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gym-text text-sm">GymOS</p>
          <p className="text-xs text-gym-text-secondary">Calistenia</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <ul className="space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-gym-orange text-white shadow-sm shadow-gym-orange/30'
                      : 'text-gym-text-secondary hover:bg-gym-surface2 hover:text-gym-text'
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User section */}
      <div className="border-t border-gym-border p-3">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gym-orange/20 border border-gym-orange/40 flex items-center justify-center flex-shrink-0">
            <span className="text-gym-orange font-semibold text-xs">
              {user?.full_name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-gym-text truncate">{user?.full_name}</p>
            <p className="text-xs text-gym-text-secondary capitalize">{user?.role}</p>
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="flex-shrink-0 p-1.5 rounded-lg text-gym-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
