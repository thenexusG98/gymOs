import { invoke } from '@tauri-apps/api/core'
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from '@/types'

export const expensesService = {
  getAll: (limit = 50, offset = 0): Promise<Expense[]> =>
    invoke('get_expenses', { limit, offset }),

  getByMonth: (year: number, month: number): Promise<Expense[]> =>
    invoke('get_expenses_by_month', { year, month }),

  create: (input: CreateExpenseInput): Promise<Expense> =>
    invoke('create_expense', { input }),

  update: (input: UpdateExpenseInput): Promise<Expense> =>
    invoke('update_expense', { input }),

  delete: (id: number): Promise<void> =>
    invoke('delete_expense', { id }),
}
