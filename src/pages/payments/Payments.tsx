import { useEffect, useState, useCallback } from 'react'
import { CreditCard, PlusCircle, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { paymentsService } from '@/services/payments'
import type { Payment } from '@/types'
import Button from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import { LoadingPage } from '@/components/ui/Spinner'
import PaymentForm from './PaymentForm'
import { formatDate } from '@/utils/dateUtils'
import { formatCurrency, paymentMethodLabel } from '@/utils/formatters'
import { generateReceipt } from '@/utils/pdfGenerator'

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filtered, setFiltered] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      let data: Payment[]
      if (dateFrom && dateTo) {
        data = await paymentsService.getByDateRange(dateFrom, dateTo)
      } else {
        data = await paymentsService.getAll(100)
      }
      setPayments(data)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!query) {
      setFiltered(payments)
      return
    }
    const q = query.toLowerCase()
    setFiltered(
      payments.filter(
        (p) =>
          p.student_name?.toLowerCase().includes(q) ||
          p.receipt_number.toLowerCase().includes(q) ||
          p.plan_name?.toLowerCase().includes(q)
      )
    )
  }, [query, payments])

  const totalAmount = filtered.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-gym-text">Pagos</h1>
          <p className="text-sm text-gym-text-secondary">
            {filtered.length} registros · Total: {formatCurrency(totalAmount)}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <PlusCircle className="w-4 h-4" />
          Registrar pago
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gym-border bg-gym-surface/50 flex-wrap">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por alumno, recibo..."
          className="w-64"
        />
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-gym-surface2 border border-gym-border rounded-lg px-3 py-2 text-sm text-gym-text focus:outline-none focus:ring-2 focus:ring-gym-orange/40"
          />
          <span className="text-gym-text-secondary text-sm">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-gym-surface2 border border-gym-border rounded-lg px-3 py-2 text-sm text-gym-text focus:outline-none focus:ring-2 focus:ring-gym-orange/40"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(''); setDateTo('') }}
              className="text-xs text-gym-text-secondary hover:text-gym-orange"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <LoadingPage />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-6 h-6" />}
            title="Sin pagos registrados"
            description="Registra el primer pago."
            action={
              <Button onClick={() => setShowForm(true)} size="sm">
                <PlusCircle className="w-4 h-4" />
                Registrar pago
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gym-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gym-surface2 border-b border-gym-border text-xs text-gym-text-secondary uppercase">
                  <th className="text-left px-4 py-3">Recibo</th>
                  <th className="text-left px-4 py-3">Alumno</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3">Fecha pago</th>
                  <th className="text-left px-4 py-3">Vencimiento</th>
                  <th className="text-left px-4 py-3">Método</th>
                  <th className="text-right px-4 py-3">Importe</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gym-border">
                {filtered.map((p) => (
                  <tr key={p.id} className="bg-gym-surface hover:bg-gym-surface2 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gym-orange">{p.receipt_number}</td>
                    <td className="px-4 py-3 font-medium text-gym-text">{p.student_name}</td>
                    <td className="px-4 py-3 text-gym-text-secondary">{p.plan_name}</td>
                    <td className="px-4 py-3 text-gym-text-secondary">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3 text-gym-text-secondary">{formatDate(p.due_date)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{paymentMethodLabel(p.payment_method)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gym-text">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => generateReceipt(p)}
                        className="p-1.5 rounded-lg text-gym-text-secondary hover:text-gym-orange hover:bg-gym-orange/10 transition-colors"
                        title="Generar recibo PDF"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <PaymentForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); load() }}
        />
      )}
    </div>
  )
}
