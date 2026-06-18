import { useEffect, useState } from 'react'
import { PlusCircle, Edit2, Trash2, ClipboardList } from 'lucide-react'
import toast from 'react-hot-toast'
import { plansService } from '@/services/plans'
import type { Plan } from '@/types'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { LoadingPage } from '@/components/ui/Spinner'
import PlanForm from './PlanForm'
import { formatCurrency } from '@/utils/formatters'

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const data = await plansService.getAll(showAll)
      setPlans(data)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [showAll])

  const handleDelete = async () => {
    if (!deletingPlan) return
    setDeleting(true)
    try {
      await plansService.delete(deletingPlan.id)
      toast.success('Plan desactivado')
      setDeletingPlan(null)
      load()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-gym-text">Planes</h1>
          <p className="text-sm text-gym-text-secondary">{plans.length} planes</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gym-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="accent-gym-orange"
            />
            Mostrar inactivos
          </label>
          <Button onClick={() => { setEditingPlan(null); setShowForm(true) }}>
            <PlusCircle className="w-4 h-4" />
            Nuevo plan
          </Button>
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <LoadingPage />
        ) : plans.length === 0 ? (
          <EmptyState
            icon={<ClipboardList className="w-6 h-6" />}
            title="Sin planes registrados"
            description="Crea tu primer plan de membresía."
            action={
              <Button onClick={() => setShowForm(true)} size="sm">
                <PlusCircle className="w-4 h-4" />
                Crear plan
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-gym-surface border rounded-xl p-5 transition-all ${
                  plan.is_active
                    ? 'border-gym-border hover:border-gym-orange/40'
                    : 'border-gym-border/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gym-orange/15 flex items-center justify-center">
                    <ClipboardList className="w-5 h-5 text-gym-orange" />
                  </div>
                  <Badge variant={plan.is_active ? 'success' : 'default'}>
                    {plan.is_active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gym-text mb-1">{plan.name}</h3>
                {plan.description && (
                  <p className="text-xs text-gym-text-secondary mb-3">{plan.description}</p>
                )}
                <div className="flex items-end justify-between mt-4 pt-3 border-t border-gym-border">
                  <div>
                    <p className="text-2xl font-bold text-gym-orange">
                      {formatCurrency(plan.price)}
                    </p>
                    <p className="text-xs text-gym-text-secondary">{plan.duration_days} días</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditingPlan(plan); setShowForm(true) }}
                      className="p-2 rounded-lg text-gym-text-secondary hover:text-gym-orange hover:bg-gym-orange/10 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {plan.is_active && (
                      <button
                        onClick={() => setDeletingPlan(plan)}
                        className="p-2 rounded-lg text-gym-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <PlanForm
          plan={editingPlan}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); load() }}
        />
      )}

      <ConfirmDialog
        isOpen={!!deletingPlan}
        onClose={() => setDeletingPlan(null)}
        onConfirm={handleDelete}
        title="Desactivar plan"
        message={`¿Desactivar el plan "${deletingPlan?.name}"? Los pagos existentes no se verán afectados.`}
        confirmLabel="Desactivar"
        isLoading={deleting}
      />
    </div>
  )
}
