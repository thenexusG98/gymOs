import * as XLSX from 'xlsx'
import type { Payment, Expense } from '@/types'
import { formatDate } from './dateUtils'
import { paymentMethodLabel } from './formatters'

export const exportPaymentsToExcel = (payments: Payment[], filename = 'pagos'): void => {
  const data = payments.map((p) => ({
    Recibo: p.receipt_number,
    Alumno: p.student_name ?? '',
    Plan: p.plan_name ?? '',
    'Fecha Pago': formatDate(p.payment_date),
    'Fecha Vencimiento': formatDate(p.due_date),
    'Método Pago': paymentMethodLabel(p.payment_method),
    Importe: p.amount,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pagos')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export const exportExpensesToExcel = (expenses: Expense[], filename = 'gastos'): void => {
  const data = expenses.map((e) => ({
    Fecha: formatDate(e.date),
    Concepto: e.concept,
    Categoría: e.category,
    Importe: e.amount,
    Notas: e.notes ?? '',
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Gastos')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
