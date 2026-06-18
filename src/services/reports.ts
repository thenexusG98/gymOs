import { invoke } from '@tauri-apps/api/core'
import type {
  DashboardStats,
  MonthlyIncome,
  ExpiringStudent,
  MonthlyReport,
} from '@/types'

export const reportsService = {
  getDashboardStats: (): Promise<DashboardStats> =>
    invoke('get_dashboard_stats'),

  getMonthlyIncome: (months = 12): Promise<MonthlyIncome[]> =>
    invoke('get_monthly_income', { months }),

  getExpiringStudents: (days = 7): Promise<ExpiringStudent[]> =>
    invoke('get_expiring_students', { days }),

  getOverdueStudents: (): Promise<ExpiringStudent[]> =>
    invoke('get_overdue_students'),

  getMonthlyReport: (year: number, month: number): Promise<MonthlyReport> =>
    invoke('get_monthly_report', { year, month }),
}
