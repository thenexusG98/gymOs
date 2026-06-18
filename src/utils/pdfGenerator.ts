import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Payment } from '@/types'
import { formatDate, formatDateLong } from './dateUtils'
import { formatCurrency, paymentMethodLabel } from './formatters'

export const generateReceipt = (payment: Payment): void => {
  const doc = new jsPDF({ unit: 'mm', format: 'a5' })

  // Header
  doc.setFillColor(249, 115, 22) // orange
  doc.rect(0, 0, 148, 25, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('GymOS', 10, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Deportivo de Calistenia', 10, 19)

  // Receipt number
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text(`Recibo: ${payment.receipt_number}`, 148 - 10, 10, { align: 'right' })
  doc.text(`Fecha: ${formatDate(payment.payment_date)}`, 148 - 10, 16, { align: 'right' })

  // Body
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Comprobante de Pago', 74, 36, { align: 'center' })

  autoTable(doc, {
    startY: 42,
    margin: { left: 10, right: 10 },
    head: [],
    body: [
      ['Alumno', payment.student_name ?? '—'],
      ['Plan', payment.plan_name ?? '—'],
      ['Fecha de pago', formatDate(payment.payment_date)],
      ['Fecha de vencimiento', formatDate(payment.due_date)],
      ['Método de pago', paymentMethodLabel(payment.payment_method)],
      ['Importe', formatCurrency(payment.amount)],
    ],
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, fillColor: [245, 245, 245] },
      1: { cellWidth: 80 },
    },
    theme: 'plain',
  })

  // Total highlight
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
  doc.setFillColor(249, 115, 22)
  doc.rect(10, finalY, 128, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL PAGADO', 20, finalY + 8)
  doc.text(formatCurrency(payment.amount), 138, finalY + 8, { align: 'right' })

  // Notes
  if (payment.notes) {
    doc.setTextColor(100, 100, 100)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text(`Notas: ${payment.notes}`, 10, finalY + 22)
  }

  // Footer
  doc.setTextColor(150, 150, 150)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    `Generado por GymOS el ${formatDateLong(new Date().toISOString())}`,
    74,
    205,
    { align: 'center' }
  )

  doc.save(`recibo-${payment.receipt_number}.pdf`)
}

export const generatePaymentsReport = (
  payments: Payment[],
  title: string,
  dateRange: string
): void => {
  const doc = new jsPDF()

  // Header
  doc.setFillColor(15, 15, 15)
  doc.rect(0, 0, 210, 30, 'F')

  doc.setTextColor(249, 115, 22)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('GymOS', 14, 16)

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text(title, 14, 24)
  doc.text(dateRange, 196, 24, { align: 'right' })

  autoTable(doc, {
    startY: 38,
    head: [['Recibo', 'Alumno', 'Plan', 'Fecha', 'Método', 'Importe']],
    body: payments.map((p) => [
      p.receipt_number,
      p.student_name ?? '',
      p.plan_name ?? '',
      formatDate(p.payment_date),
      paymentMethodLabel(p.payment_method),
      formatCurrency(p.amount),
    ]),
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    styles: { fontSize: 9 },
  })

  // Total
  const total = payments.reduce((s, p) => s + p.amount, 0)
  const lastY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text(`Total: ${formatCurrency(total)}`, 196, lastY, { align: 'right' })

  doc.save(`reporte-pagos-${Date.now()}.pdf`)
}
