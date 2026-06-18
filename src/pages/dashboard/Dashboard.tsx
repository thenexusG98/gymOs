import { useEffect, useState } from 'react'
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { reportsService } from '@/services/reports'
import type { DashboardStats, MonthlyIncome, ExpiringStudent } from '@/types'
import { LoadingPage } from '@/components/ui/Spinner'
import Badge, { paymentStatusBadge } from '@/components/ui/Badge'
import { formatCurrency } from '@/utils/formatters'
import { formatDate, formatMonthYear } from '@/utils/dateUtils'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  subtitle?: string
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <div className="bg-gym-surface border border-gym-border rounded-xl p-5 hover:border-gym-orange/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gym-text">{value}</p>
      <p className="text-sm text-gym-text-secondary mt-1">{title}</p>
      {subtitle && <p className="text-xs text-gym-text-secondary/60 mt-0.5">{subtitle}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<MonthlyIncome[]>([])
  const [expiring, setExpiring] = useState<ExpiringStudent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, c, e] = await Promise.all([
          reportsService.getDashboardStats(),
          reportsService.getMonthlyIncome(6),
          reportsService.getExpiringStudents(7),
        ])
        setStats(s)
        setChartData(c)
        setExpiring(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingPage />

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-gym-text">Dashboard</h1>
          <p className="text-sm text-gym-text-secondary">Vista general del deportivo</p>
        </div>
      </div>

      <div className="page-content space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Alumnos activos"
            value={stats?.total_active_students ?? 0}
            icon={<Users className="w-5 h-5 text-blue-400" />}
            color="bg-blue-500/15"
          />
          <StatCard
            title="Ingresos del día"
            value={formatCurrency(stats?.income_today ?? 0)}
            icon={<DollarSign className="w-5 h-5 text-green-400" />}
            color="bg-green-500/15"
          />
          <StatCard
            title="Próximos a vencer"
            value={stats?.students_expiring_soon ?? 0}
            icon={<Calendar className="w-5 h-5 text-yellow-400" />}
            color="bg-yellow-500/15"
            subtitle="En los próximos 3 días"
          />
          <StatCard
            title="Vencidos"
            value={stats?.students_overdue ?? 0}
            icon={<AlertTriangle className="w-5 h-5 text-red-400" />}
            color="bg-red-500/15"
          />
        </div>

        {/* Second row */}
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            title="Ingresos del mes"
            value={formatCurrency(stats?.income_month ?? 0)}
            icon={<TrendingUp className="w-5 h-5 text-gym-orange" />}
            color="bg-gym-orange/15"
          />
          <StatCard
            title="Gastos del mes"
            value={formatCurrency(stats?.expenses_month ?? 0)}
            icon={<TrendingDown className="w-5 h-5 text-red-400" />}
            color="bg-red-500/15"
          />
          <StatCard
            title="Utilidad del mes"
            value={formatCurrency(stats?.profit_month ?? 0)}
            icon={<TrendingUp className="w-5 h-5 text-green-400" />}
            color="bg-green-500/15"
          />
        </div>

        {/* Chart + Expiring */}
        <div className="grid grid-cols-5 gap-4">
          {/* Revenue chart */}
          <div className="col-span-3 bg-gym-surface border border-gym-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gym-text mb-4">
              Ingresos vs Gastos (últimos 6 meses)
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e2e2e" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonthYear}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={{ stroke: '#2e2e2e' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fill: '#9ca3af', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a1a',
                    border: '1px solid #2e2e2e',
                    borderRadius: 8,
                    color: '#f5f5f5',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelFormatter={formatMonthYear}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, color: '#9ca3af' }}
                  formatter={(v) => (v === 'income' ? 'Ingresos' : 'Gastos')}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="#f97316"
                  strokeWidth={2}
                  fill="url(#incomeGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  stroke="#ef4444"
                  strokeWidth={2}
                  fill="url(#expenseGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Expiring students */}
          <div className="col-span-2 bg-gym-surface border border-gym-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gym-text">Próximos vencimientos</h3>
              <Link
                to="/students"
                className="text-xs text-gym-orange hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-52">
              {expiring.length === 0 ? (
                <p className="text-xs text-gym-text-secondary text-center py-6">
                  Sin vencimientos próximos
                </p>
              ) : (
                expiring.map((s) => {
                  const { variant, label } = paymentStatusBadge(s.payment_status)
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-2 border-b border-gym-border/50 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gym-text truncate">
                          {s.full_name}
                        </p>
                        <p className="text-xs text-gym-text-secondary">
                          {formatDate(s.due_date)}
                        </p>
                      </div>
                      <Badge variant={variant}>{label}</Badge>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
