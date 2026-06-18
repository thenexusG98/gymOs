import { useEffect, useState, useCallback } from 'react'
import { DollarSign, PlusCircle, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { expensesService } from '@/services/expenses'
import type { Expense } from '@/types'
import { EXPENSE_CATEGORY_LABELS } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { LoadingPage } from '@/components/ui/Spinner'
import ExpenseForm from './ExpenseForm'
import { formatDate, currentYearMonth } from '@/utils/dateUtils'
import { formatCurrency } from '@/utils/formatters'

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [deleting, setDeleting] = useState(false)

  const { year, month } = currentYearMonth()
  const [selYear, setSelYear] = useState(year)
  const [selMonth, setSelMonth] = useState(month)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await expensesService.getByMonth(selYear, selMonth)
      setExpenses(data)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }, [selYear, selMonth])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!deletingExpense) return
    setDeleting(true)
    try {
      await expensesService.delete(deletingExpense.id)
      toast.success('Gasto eliminado')
      setDeletingExpense(null)
      load()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeleting(false)
    }
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

  // Group by category
  const byCategory = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount
    return acc
  }, {})

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: new Date(2024, i).toLocaleString('es-MX', { month: 'long' }),
  }))

  const years = [year - 1, year, year + 1]

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-gym-text">Gastos</h1>
          <p className="text-sm text-gym-text-secondary">
            Total: {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selMonth}
            onChange={(e) => setSelMonth(Number(e.target.value))}
            className="bg-gym-surface2 border border-gym-border rounded-lg px-3 py-2 text-sm text-gym-text focus:outline-none"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <select
            value={selYear}
            onChange={(e) => setSelYear(Number(e.target.value))}
            className="bg-gym-surface2 border border-gym-border rounded-lg px-3 py-2 text-sm text-gym-text focus:outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <Button onClick={() => { setEditingExpense(null); setShowForm(true) }}>
            <PlusCircle className="w-4 h-4" />
            Nuevo gasto
          </Button>
        </div>
      </div>

      <div className="page-content grid grid-cols-4 gap-4">
        {/* Category summary */}
        <div className="col-span-1">
          <div className="bg-gym-surface border border-gym-border rounded-xl p-4">
            <h3 className="text-sm font-semibold text-gym-text mb-3">Por categoría</h3>
            <div className="space-y-2">
              {Object.entries(byCategory).map(([cat, total]) => (
                <div key={cat} className="flex justify-between items-center">
                  <span className="text-xs text-gym-text-secondary">
                    {EXPENSE_CATEGORY_LABELS[cat as keyof typeof EXPENSE_CATEGORY_LABELS] ?? cat}
                  </span>
                  <span className="text-xs font-medium text-gym-text">{formatCurrency(total)}</span>
                </div>
              ))}
              {Object.keys(byCategory).length === 0 && (
                <p className="text-xs text-gym-text-secondary">Sin gastos</p>
              )}
            </div>
            {Object.keys(byCategory).length > 0 && (
              <div className="border-t border-gym-border mt-3 pt-3 flex justify-between">
                <span className="text-xs font-semibold text-gym-text">Total</span>
                <span className="text-xs font-bold text-gym-orange">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="col-span-3">
          {loading ? (
            <LoadingPage />
          ) : expenses.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="w-6 h-6" />}
              title="Sin gastos en este mes"
              action={
                <Button onClick={() => setShowForm(true)} size="sm">
                  <PlusCircle className="w-4 h-4" />
                  Agregar gasto
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gym-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gym-surface2 border-b border-gym-border text-xs text-gym-text-secondary uppercase">
                    <th className="text-left px-4 py-3">Fecha</th>
                    <th className="text-left px-4 py-3">Concepto</th>
                    <th className="text-left px-4 py-3">Categoría</th>
                    <th className="text-right px-4 py-3">Importe</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gym-border">
                  {expenses.map((e) => (
                    <tr key={e.id} className="bg-gym-surface hover:bg-gym-surface2 transition-colors">
                      <td className="px-4 py-3 text-gym-text-secondary">{formatDate(e.date)}</td>
                      <td className="px-4 py-3 text-gym-text">{e.concept}</td>
                      <td className="px-4 py-3">
                        <Badge variant="default">
                          {EXPENSE_CATEGORY_LABELS[e.category as keyof typeof EXPENSE_CATEGORY_LABELS] ?? e.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gym-text">
                        {formatCurrency(e.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditingExpense(e); setShowForm(true) }}
                            className="p-1.5 rounded text-gym-text-secondary hover:text-gym-orange hover:bg-gym-orange/10"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingExpense(e)}
                            className="p-1.5 rounded text-gym-text-secondary hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); load() }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDelete}
        title="Eliminar gasto"
        message={`¿Eliminar el gasto "${deletingExpense?.concept}"?`}
        confirmLabel="Eliminar"
        isLoading={deleting}
      />
    </div>
  )
}
