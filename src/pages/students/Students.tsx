import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Search, Eye, Edit2, UserX } from 'lucide-react'
import toast from 'react-hot-toast'
import { studentsService } from '@/services/students'
import type { Student } from '@/types'
import Button from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import Badge, { studentStatusBadge } from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { LoadingPage } from '@/components/ui/Spinner'
import StudentForm from './StudentForm'
import { formatDate } from '@/utils/dateUtils'

export default function Students() {
  const navigate = useNavigate()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await studentsService.getAll(query || undefined, statusFilter || undefined)
      setStudents(data)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }, [query, statusFilter])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const handleDelete = async () => {
    if (!deletingStudent) return
    setDeleting(true)
    try {
      await studentsService.delete(deletingStudent.id)
      toast.success('Alumno dado de baja')
      setDeletingStudent(null)
      load()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-gym-text">Alumnos</h1>
          <p className="text-sm text-gym-text-secondary">{students.length} registros</p>
        </div>
        <Button onClick={() => { setEditingStudent(null); setShowForm(true) }}>
          <UserPlus className="w-4 h-4" />
          Nuevo alumno
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gym-border bg-gym-surface/50">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nombre, teléfono o correo..."
          className="w-72"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-gym-surface2 border border-gym-border rounded-lg px-3 py-2 text-sm text-gym-text focus:outline-none focus:ring-2 focus:ring-gym-orange/40"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="suspended">Suspendido</option>
          <option value="inactive">Baja</option>
        </select>
      </div>

      {/* Content */}
      <div className="page-content">
        {loading ? (
          <LoadingPage />
        ) : students.length === 0 ? (
          <EmptyState
            icon={<Search className="w-6 h-6" />}
            title="No se encontraron alumnos"
            description="Prueba con otros términos de búsqueda o agrega un nuevo alumno."
            action={
              <Button onClick={() => setShowForm(true)} size="sm">
                <UserPlus className="w-4 h-4" />
                Agregar alumno
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-gym-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gym-surface2 border-b border-gym-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gym-text-secondary uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gym-text-secondary uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gym-text-secondary uppercase tracking-wider">
                    Inscripción
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gym-text-secondary uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gym-text-secondary uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gym-border">
                {students.map((s) => {
                  const { variant, label } = studentStatusBadge(s.status)
                  return (
                    <tr
                      key={s.id}
                      className="bg-gym-surface hover:bg-gym-surface2 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gym-orange/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-gym-orange text-xs font-semibold">
                              {s.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gym-text">{s.full_name}</p>
                            {s.email && (
                              <p className="text-xs text-gym-text-secondary">{s.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gym-text-secondary">
                        {s.phone ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gym-text-secondary">
                        {formatDate(s.enrollment_date)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={variant}>{label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/students/${s.id}`)}
                            className="p-1.5 rounded-lg text-gym-text-secondary hover:text-gym-text hover:bg-gym-surface2 transition-colors"
                            title="Ver detalle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingStudent(s); setShowForm(true) }}
                            className="p-1.5 rounded-lg text-gym-text-secondary hover:text-gym-orange hover:bg-gym-orange/10 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {s.status !== 'inactive' && (
                            <button
                              onClick={() => setDeletingStudent(s)}
                              className="p-1.5 rounded-lg text-gym-text-secondary hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              title="Dar de baja"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <StudentForm
          student={editingStudent}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); load() }}
        />
      )}

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!deletingStudent}
        onClose={() => setDeletingStudent(null)}
        onConfirm={handleDelete}
        title="Dar de baja alumno"
        message={`¿Deseas dar de baja a "${deletingStudent?.full_name}"? El historial de pagos se conservará.`}
        confirmLabel="Dar de baja"
        isLoading={deleting}
      />
    </div>
  )
}
