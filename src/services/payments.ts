import { invoke } from '@tauri-apps/api/core'
import type { Payment, CreatePaymentInput } from '@/types'

export const paymentsService = {
  getAll: (limit = 50, offset = 0): Promise<Payment[]> =>
    invoke('get_payments', { limit, offset }),

  getById: (id: number): Promise<Payment> =>
    invoke('get_payment', { id }),

  create: (input: CreatePaymentInput): Promise<Payment> =>
    invoke('create_payment', { input }),

  getByStudent: (studentId: number): Promise<Payment[]> =>
    invoke('get_student_payments', { studentId }),

  getByDateRange: (dateFrom: string, dateTo: string): Promise<Payment[]> =>
    invoke('get_payments_by_date', { dateFrom, dateTo }),
}
