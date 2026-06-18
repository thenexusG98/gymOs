import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, CreditCard, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { studentsService } from '@/services/students'
import { paymentsService } from '@/services/payments'
import { attendanceService } from '@/services/misc'
import type { Student, Payment, AttendanceRecord } from '@/types'
import Button from '@/components/ui/Button'
import Badge, { studentStatusBadge, paymentStatusBadge } from '@/components/ui/Badge'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingPage } from '@/components/ui/Spinner'
import PaymentForm from '@/pages/payments/PaymentForm'
import StudentForm from './StudentForm'
import { formatDate } from '@/utils/dateUtils'
import { formatCurrency, paymentMethodLabel } from '@/utils/formatters'
import { generateReceipt } from '@/utils/pdfGenerator'

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [student, setStudent] = useState<Student | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  const studentId = Number(id)

  const load = async () => {
    setLoading(true)
    try {
      const [s, p, a] = await Promise.all([
        studentsService.getById(studentId),
        paymentsService.getByStudent(studentId),
        attendanceService.getByStudent(studentId, 20),
      ])
      setStudent(s)
      setPayments(p)
      setAttendance(a)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [studentId])

  if (loading) return <LoadingPage />
  if (!student) return null

  const { variant, label } = studentStatusBadge(student.status)
  const lastPayment = payments[0]
  const payStatus = lastPayment
    ? paymentStatusBadge(
        new Date(lastPayment.due_date) < new Date()
          ? 'overdue'
          : 'current'
      )
    : paymentStatusBadge('no_payment')

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/students')}
            className="p-1.5 rounded-lg text-gym-text-secondary hover:text-gym-text hover:bg-gym-surface2"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gym-text">{student.full_name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={variant}>{label}</Badge>
              <Badge variant={payStatus.variant}>{payStatus.label}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowEdit(true)}>
            <Edit2 className="w-4 h-4" /> Editar
          </Button>
          <Button onClick={() => setShowPayment(true)}>
            <CreditCard className="w-4 h-4" /> Registrar pago
          </Button>
        </div>
      </div>

      <div className="page-content grid grid-cols-3 gap-4">
        {/* Info card */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Información personal</CardTitle>
          </CardHeader>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Teléfono', value: student.phone },
              { label: 'Correo', value: student.email },
              { label: 'Nacimiento', value: student.birth_date ? formatDate(student.birth_date) : undefined },
              { label: 'Inscripción', value: formatDate(student.enrollment_date) },
            ].map(({ label: l, value: v }) =>
              v ? (
                <div key={l}>
                  <dt className="text-gym-text-secondary">{l}</dt>
                  <dd className="text-gym-text font-medium">{v}</dd>
                </div>
              ) : null
            )}
            {student.observations && (
              <div>
                <dt className="text-gym-text-secondary">Observaciones</dt>
                <dd className="text-gym-text">{student.observations}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Payments */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Historial de pagos ({payments.length})</CardTitle>
          </CardHeader>
          <div className="overflow-hidden rounded-lg border border-gym-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gym-surface2 border-b border-gym-border text-xs text-gym-text-secondary uppercase">
                  <th className="text-left px-3 py-2">Recibo</th>
                  <th className="text-left px-3 py-2">Plan</th>
                  <th className="text-left px-3 py-2">Fecha</th>
                  <th className="text-left px-3 py-2">Vence</th>
                  <th className="text-left px-3 py-2">Método</th>
                  <th className="text-right px-3 py-2">Importe</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gym-border">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-gym-text-secondary">
                      Sin pagos registrados
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-gym-surface2 transition-colors">
                      <td className="px-3 py-2.5 text-gym-orange font-mono text-xs">
                        {p.receipt_number}
                      </td>
                      <td className="px-3 py-2.5 text-gym-text">{p.plan_name}</td>
                      <td className="px-3 py-2.5 text-gym-text-secondary">
                        {formatDate(p.payment_date)}
                      </td>
                      <td className="px-3 py-2.5 text-gym-text-secondary">
                        {formatDate(p.due_date)}
                      </td>
                      <td className="px-3 py-2.5 text-gym-text-secondary">
                        {paymentMethodLabel(p.payment_method)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gym-text">
                        {formatCurrency(p.amount)}
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => generateReceipt(p)}
                          className="p-1 rounded text-gym-text-secondary hover:text-gym-orange hover:bg-gym-orange/10 transition-colors"
                          title="Imprimir recibo"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Attendance */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>
              <CheckSquare className="w-4 h-4 inline mr-1" />
              Asistencias recientes ({attendance.length})
            </CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {attendance.length === 0 ? (
              <p className="text-sm text-gym-text-secondary">Sin asistencias registradas</p>
            ) : (
              attendance.map((a) => (
                <span
                  key={a.id}
                  className="bg-gym-surface2 border border-gym-border rounded-lg px-3 py-1.5 text-xs text-gym-text-secondary"
                >
                  {formatDate(a.date)} {a.time.slice(0, 5)}
                </span>
              ))
            )}
          </div>
        </Card>
      </div>

      {showEdit && (
        <StudentForm
          student={student}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { setShowEdit(false); load() }}
        />
      )}

      {showPayment && (
        <PaymentForm
          preSelectedStudentId={student.id}
          onClose={() => setShowPayment(false)}
          onSuccess={() => { setShowPayment(false); load() }}
        />
      )}
    </div>
  )
}
