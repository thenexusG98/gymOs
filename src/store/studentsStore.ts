import { create } from 'zustand'
import type { Student, StudentWithPaymentStatus } from '@/types'
import { studentsService } from '@/services/students'

interface StudentsState {
  students: Student[]
  studentsWithStatus: StudentWithPaymentStatus[]
  selectedStudent: Student | null
  isLoading: boolean
  error: string | null

  fetchStudents: (query?: string, statusFilter?: string) => Promise<void>
  fetchStudentsWithStatus: () => Promise<void>
  setSelectedStudent: (student: Student | null) => void
  refresh: () => Promise<void>
}

export const useStudentsStore = create<StudentsState>((set, get) => ({
  students: [],
  studentsWithStatus: [],
  selectedStudent: null,
  isLoading: false,
  error: null,

  fetchStudents: async (query, statusFilter) => {
    set({ isLoading: true, error: null })
    try {
      const students = await studentsService.getAll(query, statusFilter)
      set({ students, isLoading: false })
    } catch (e) {
      set({ error: String(e), isLoading: false })
    }
  },

  fetchStudentsWithStatus: async () => {
    set({ isLoading: true, error: null })
    try {
      const studentsWithStatus = await studentsService.getWithPaymentStatus()
      set({ studentsWithStatus, isLoading: false })
    } catch (e) {
      set({ error: String(e), isLoading: false })
    }
  },

  setSelectedStudent: (student) => set({ selectedStudent: student }),

  refresh: async () => {
    await get().fetchStudents()
  },
}))
