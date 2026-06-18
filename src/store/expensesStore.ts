import { create } from 'zustand'
import type { Expense } from '@/types'
import { expensesService } from '@/services/expenses'

interface ExpensesState {
  expenses: Expense[]
  isLoading: boolean
  error: string | null

  fetchExpenses: (limit?: number) => Promise<void>
  refresh: () => Promise<void>
}

export const useExpensesStore = create<ExpensesState>((set, get) => ({
  expenses: [],
  isLoading: false,
  error: null,

  fetchExpenses: async (limit = 50) => {
    set({ isLoading: true, error: null })
    try {
      const expenses = await expensesService.getAll(limit)
      set({ expenses, isLoading: false })
    } catch (e) {
      set({ error: String(e), isLoading: false })
    }
  },

  refresh: async () => {
    await get().fetchExpenses()
  },
}))
