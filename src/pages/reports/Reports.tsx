import { useState } from 'react'
import { BarChart3, Download, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { reportsService } from '@/services/reports'
import { paymentsService } from '@/services/payments'
import { expensesService } from '@/services/expenses'
import type { MonthlyReport } from '@/types'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingPage } from '@/components/ui/Spinner'
import { formatCurrency } from '@/utils/formatters'
import { currentYearMonth, formatMonthYear } from '@/utils/dateUtils'
import { generatePaymentsReport } from '@/utils/pdfGenerator'
import { exportPaymentsToExcel, exportExpensesToExcel } from '@/utils/excelExporter'

export default function Reports() {
  const { year: curYear, month: curMonth } = currentYearMonth()
  const [selYear, setSelYear] = useState(curYear)
  const [selMonth, setSelMonth] = useState(curMonth)
  const [report, setReport] = useState<MonthlyReport | null>(null)
  const [loading, setLoading] = useState(false)
  const [monthlyData, setMonthlyData] = useState<
    Array<{ month: string; income: number; expenses: number }>
  >([])

  const load = async () => {
    setLoading(true)
    try {
      const [r, md] = await Promise.all([
        reportsService.getMonthlyReport(selYear, selMonth),
        reportsService.getMonthlyIncome(12),
      ])
      setReport(r)
      setMonthlyData(md)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }

  const exportPaymentsPDF = async () => {
    try {
      const payments = await paymentsService.getByDateRange(
        `${selYear}-${String(selMonth).padStart(2, '0')}-01`,
        `${selYear}-${String(selMonth).padStart(2, '0')}-31`
      )
      generatePaymentsReport(
        payments,
        'Reporte de Ingresos',
        `${selMonth}/${selYear}`
      )
    } catch (e) {
      toast.error(String(e))
    }
  }

  const exportPaymentsXLSX = async () => {
    try {
      const payments = await paymentsService.getByDateRange(
        `${selYear}-${String(selMonth).padStart(2, '0')}-01`,
        `${selYear}-${String(selMonth).padStart(2, '0')}-31`
      )
      exportPaymentsToExcel(payments, `pagos-${selYear}-${selMonth}`)
      toast.success('Excel exportado')
    } catch (e) {
      toast.error(String(e))
    }
  }

  const exportExpensesXLSX = async () => {
    try {
      const expenses = await expensesService.getByMonth(selYear, selMonth)
      exportExpensesToExcel(expenses, `gastos-${selYear}-${selMonth}`)
      toast.success('Excel exportado')
    } catch (e) {
      toast.error(String(e))
    }
  }

  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('es-MX', { month: 'long' }),
  }))

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-gym-text">Reportes</h1>
          <p className="text-sm text-gym-text-secondary">Análisis financiero</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selMonth}
            onChange={(e) => setSelMonth(Number(e.target.value))}
            className="bg-gym-surface2 border border-gym-border rounded-lg px-3 py-2 text-sm text-gym-text focus:outline-none"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={selYear}
            onChange={(e) => setSelYear(Number(e.target.value))}
            className="bg-gym-surface2 border border-gym-border rounded-lg px-3 py-2 text-sm text-gym-text focus:outline-none"
          >
            {[curYear - 1, curYear, curYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={load} loading={loading}>
            <BarChart3 className="w-4 h-4" />
            Generar reporte
          </Button>
        </div>
      </div>

      <div className="page-content space-y-5">
        {loading && <LoadingPage />}

        {report && !loading && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: 'Ingresos', value: formatCurrency(report.total_income), color: 'text-green-400' },
                { label: 'Gastos', value: formatCurrency(report.total_expenses), color: 'text-red-400' },
                { label: 'Utilidad', value: formatCurrency(report.profit), color: report.profit >= 0 ? 'text-gym-orange' : 'text-red-400' },
                { label: 'Nuevos alumnos', value: report.new_students, color: 'text-blue-400' },
              ].map(({ label, value, color }) => (
                <Card key={label}>
                  <p className="text-xs text-gym-text-secondary mb-1">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}</p>
                </Card>
              ))}
            </div>

            {/* Export buttons */}
            <div className="flex gap-3 flex-wrap">
              <Button variant="secondary" onClick={exportPaymentsPDF} size="sm">
                <Download className="w-4 h-4" />
                Pagos PDF
              </Button>
              <Button variant="secondary" onClick={exportPaymentsXLSX} size="sm">
                <FileSpreadsheet className="w-4 h-4" />
                Pagos Excel
              </Button>
              <Button variant="secondary" onClick={exportExpensesXLSX} size="sm">
                <FileSpreadsheet className="w-4 h-4" />
                Gastos Excel
              </Button>
            </div>
          </>
        )}

        {/* Annual chart */}
        {monthlyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ingresos y Gastos anuales</CardTitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
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
                <Bar dataKey="income" fill="#f97316" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {!report && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="w-12 h-12 text-gym-text-secondary mb-4" />
            <p className="text-gym-text font-medium">Selecciona un período y genera el reporte</p>
          </div>
        )}
      </div>
    </div>
  )
}
