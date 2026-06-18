import { create } from 'zustand'
import type { Payment } from '@/types'
import { paymentsService } from '@/services/payments'

interface PaymentsState {
  payments: Payment[]
  isLoading: boolean
  error: string | null

  fetchPayments: (limit?: number) => Promise<void>
  refresh: () => Promise<void>
}

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  payments: [],
  isLoading: false,
  error: null,

  fetchPayments: async (limit = 50) => {
    set({ isLoading: true, error: null })
    try {
      const payments = await paymentsService.getAll(limit)
      set({ payments, isLoading: false })
    } catch (e) {
      set({ error: String(e), isLoading: false })
    }
  },

  refresh: async () => {
    await get().fetchPayments()
  },
}))
