// ===================== ENTITIES =====================

export interface User {
  id: number
  username: string
  role: 'admin' | 'reception'
  full_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: number
  full_name: string
  phone?: string
  email?: string
  enrollment_date: string
  birth_date?: string
  photo_path?: string
  observations?: string
  status: 'active' | 'suspended' | 'inactive'
  created_at: string
  updated_at: string
}

export interface StudentWithPaymentStatus extends Student {
  last_payment_date?: string
  last_due_date?: string
  last_plan_name?: string
  payment_status: 'current' | 'expiring' | 'overdue' | 'no_payment'
}

export interface Plan {
  id: number
  name: string
  price: number
  duration_days: number
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Payment {
  id: number
  student_id: number
  plan_id: number
  amount: number
  payment_date: string
  due_date: string
  payment_method: 'cash' | 'transfer' | 'card'
  receipt_number: string
  notes?: string
  created_by?: number
  created_at: string
  student_name?: string
  plan_name?: string
}

export interface Expense {
  id: number
  date: string
  concept: string
  category: ExpenseCategory
  amount: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface EmailSettings {
  id: number
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  from_name: string
  from_email: string
  enabled: boolean
  days_before_reminder: number
}

export interface AttendanceRecord {
  id: number
  student_id: number
  student_name: string
  date: string
  time: string
  created_at: string
}

export interface AttendanceRanking {
  student_id: number
  full_name: string
  total_sessions: number
  rank: number
}

// ===================== REPORT TYPES =====================

export interface DashboardStats {
  total_active_students: number
  students_expiring_soon: number
  students_overdue: number
  income_today: number
  income_month: number
  expenses_month: number
  profit_month: number
}

export interface MonthlyIncome {
  month: string
  income: number
  expenses: number
}

export interface ExpiringStudent {
  id: number
  full_name: string
  phone?: string
  email?: string
  due_date: string
  plan_name: string
  days_until_due: number
  payment_status: 'overdue' | 'expiring' | 'current'
}

export interface MonthlyReport {
  year: number
  month: number
  total_income: number
  total_expenses: number
  profit: number
  total_payments: number
  active_students: number
  new_students: number
}

export interface BackupInfo {
  filename: string
  path: string
  size_bytes: number
  created_at: string
}

// ===================== INPUT TYPES =====================

export interface CreateStudentInput {
  full_name: string
  phone?: string
  email?: string
  enrollment_date: string
  birth_date?: string
  photo_path?: string
  observations?: string
}

export interface UpdateStudentInput extends CreateStudentInput {
  id: number
  status: string
}

export interface CreatePlanInput {
  name: string
  price: number
  duration_days: number
  description?: string
}

export interface UpdatePlanInput extends CreatePlanInput {
  id: number
  is_active: boolean
}

export interface CreatePaymentInput {
  student_id: number
  plan_id: number
  amount: number
  payment_date: string
  payment_method: string
  notes?: string
  created_by?: number
}

export interface CreateExpenseInput {
  date: string
  concept: string
  category: string
  amount: number
  notes?: string
}

export interface UpdateExpenseInput extends CreateExpenseInput {
  id: number
}

export interface CreateUserInput {
  username: string
  password: string
  role: string
  full_name: string
}

export interface UpdateUserInput {
  id: number
  full_name: string
  role: string
  is_active: boolean
  password?: string
}

export interface UpdateEmailSettingsInput {
  smtp_host: string
  smtp_port: number
  smtp_user: string
  smtp_password: string
  from_name: string
  from_email: string
  enabled: boolean
  days_before_reminder: number
}

export interface ReminderLog {
  id: number
  student_id: number
  student_name: string
  reminder_type: 'expiring' | 'overdue'
  sent_date: string
  student_email?: string
  admin_notified: boolean
  created_at: string
}

// ===================== ENUMS / CONSTANTS =====================

export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'water'
  | 'maintenance'
  | 'cleaning'
  | 'equipment'
  | 'other'

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  rent: 'Renta',
  electricity: 'Luz',
  water: 'Agua',
  maintenance: 'Mantenimiento',
  cleaning: 'Limpieza',
  equipment: 'Equipamiento',
  other: 'Otros',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
}

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  active: 'Activo',
  suspended: 'Suspendido',
  inactive: 'Baja',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  current: 'Al corriente',
  expiring: 'Próximo a vencer',
  overdue: 'Vencido',
  no_payment: 'Sin pago',
}

// ===================== UI TYPES =====================

export interface NavItem {
  path: string
  label: string
  icon: string
  adminOnly?: boolean
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'
