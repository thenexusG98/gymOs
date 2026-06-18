import { invoke } from '@tauri-apps/api/core'
import type {
  Student,
  StudentWithPaymentStatus,
  CreateStudentInput,
  UpdateStudentInput,
} from '@/types'

export const studentsService = {
  getAll: (query?: string, statusFilter?: string): Promise<Student[]> =>
    invoke('get_students', { query: query || null, statusFilter: statusFilter || null }),

  getById: (id: number): Promise<Student> =>
    invoke('get_student', { id }),

  create: (input: CreateStudentInput): Promise<Student> =>
    invoke('create_student', { input }),

  update: (input: UpdateStudentInput): Promise<Student> =>
    invoke('update_student', { input }),

  delete: (id: number): Promise<void> =>
    invoke('delete_student', { id }),

  getWithPaymentStatus: (): Promise<StudentWithPaymentStatus[]> =>
    invoke('get_students_with_status'),
}
