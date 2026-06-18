import { useEffect, useState } from 'react'
import { CheckSquare, UserSearch, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'
import { attendanceService } from '@/services/misc'
import { studentsService } from '@/services/students'
import type { AttendanceRecord, AttendanceRanking, Student } from '@/types'
import Button from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import { LoadingPage } from '@/components/ui/Spinner'
import { formatDate, today, currentYearMonth } from '@/utils/dateUtils'

export default function Attendance() {
  const [students, setStudents] = useState<Student[]>([])
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([])
  const [ranking, setRanking] = useState<AttendanceRanking[]>([])
  const [query, setQuery] = useState('')
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<number | null>(null)

  const { year, month } = currentYearMonth()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [s, t, r] = await Promise.all([
          studentsService.getAll(undefined, 'active'),
          attendanceService.getByDate(today()),
          attendanceService.getMonthlyRanking(year, month),
        ])
        setStudents(s)
        setTodayRecords(t)
        setRanking(r)
      } catch (e) {
        toast.error(String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!query) {
      setFilteredStudents(students.slice(0, 10))
      return
    }
    const q = query.toLowerCase()
    setFilteredStudents(
      students.filter(
        (s) => s.full_name.toLowerCase().includes(q) || s.phone?.includes(q)
      ).slice(0, 10)
    )
  }, [query, students])

  const registerAttendance = async (studentId: number) => {
    setRegistering(studentId)
    try {
      const record = await attendanceService.register(studentId)
      setTodayRecords((prev) => [record, ...prev])
      toast.success(`Asistencia registrada para ${record.student_name}`)
    } catch (e) {
      toast.error(String(e))
    } finally {
      setRegistering(null)
    }
  }

  const isAlreadyChecked = (studentId: number) =>
    todayRecords.some((r) => r.student_id === studentId)

  if (loading) return <LoadingPage />

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="text-lg font-semibold text-gym-text">Asistencia</h1>
          <p className="text-sm text-gym-text-secondary">
            Hoy: {todayRecords.length} registros · {formatDate(today())}
          </p>
        </div>
      </div>

      <div className="page-content grid grid-cols-3 gap-5">
        {/* Register attendance */}
        <div className="col-span-2 space-y-4">
          <div className="bg-gym-surface border border-gym-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gym-text mb-3 flex items-center gap-2">
              <UserSearch className="w-4 h-4 text-gym-orange" />
              Registrar asistencia
            </h3>
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="Buscar alumno por nombre o teléfono..."
              className="mb-3"
            />
            <div className="space-y-1.5">
              {filteredStudents.map((s) => {
                const checked = isAlreadyChecked(s.id)
                return (
                  <div
                    key={s.id}
                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                      checked ? 'bg-green-500/10 border border-green-500/20' : 'bg-gym-surface2 border border-gym-border/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          checked ? 'bg-green-500/20 text-green-400' : 'bg-gym-orange/20 text-gym-orange'
                        }`}
                      >
                        {s.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gym-text">{s.full_name}</p>
                        {s.phone && (
                          <p className="text-xs text-gym-text-secondary">{s.phone}</p>
                        )}
                      </div>
                    </div>
                    {checked ? (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckSquare className="w-4 h-4" />
                        Registrado
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => registerAttendance(s.id)}
                        loading={registering === s.id}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        Registrar
                      </Button>
                    )}
                  </div>
                )
              })}
              {filteredStudents.length === 0 && (
                <p className="text-sm text-gym-text-secondary text-center py-4">
                  {query ? 'No se encontraron alumnos' : 'Escribe para buscar alumnos'}
                </p>
              )}
            </div>
          </div>

          {/* Today's list */}
          {todayRecords.length > 0 && (
            <div className="bg-gym-surface border border-gym-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gym-text mb-3">
                Asistencias de hoy ({todayRecords.length})
              </h3>
              <div className="space-y-2">
                {todayRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-1.5">
                    <p className="text-sm text-gym-text">{r.student_name}</p>
                    <span className="text-xs text-gym-text-secondary">{r.time.slice(0, 5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly ranking */}
        <div className="col-span-1">
          <div className="bg-gym-surface border border-gym-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gym-text mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gym-orange" />
              Ranking del mes
            </h3>
            <div className="space-y-2.5">
              {ranking.slice(0, 15).map((r, idx) => (
                <div key={r.student_id} className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      idx === 0
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : idx === 1
                        ? 'bg-gray-400/20 text-gray-400'
                        : idx === 2
                        ? 'bg-orange-700/20 text-orange-700'
                        : 'bg-gym-surface2 text-gym-text-secondary'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <p className="text-sm text-gym-text flex-1 truncate">{r.full_name}</p>
                  <span className="text-sm font-semibold text-gym-orange">
                    {r.total_sessions}
                  </span>
                </div>
              ))}
              {ranking.length === 0 && (
                <p className="text-sm text-gym-text-secondary text-center py-4">
                  Sin asistencias este mes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
