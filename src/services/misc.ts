import { invoke } from '@tauri-apps/api/core'
import type { BackupInfo, AttendanceRecord, AttendanceRanking } from '@/types'

export const backupService = {
  create: (backupDir?: string): Promise<BackupInfo> =>
    invoke('create_backup', { backupDir: backupDir || null }),

  restore: (backupPath: string): Promise<string> =>
    invoke('restore_backup', { backupPath }),

  list: (backupDir?: string): Promise<BackupInfo[]> =>
    invoke('list_backups', { backupDir: backupDir || null }),
}

export const attendanceService = {
  register: (studentId: number): Promise<AttendanceRecord> =>
    invoke('register_attendance', { studentId }),

  getByStudent: (studentId: number, limit?: number): Promise<AttendanceRecord[]> =>
    invoke('get_attendance_by_student', { studentId, limit: limit || null }),

  getByDate: (date: string): Promise<AttendanceRecord[]> =>
    invoke('get_attendance_by_date', { date }),

  getMonthlyRanking: (year?: number, month?: number): Promise<AttendanceRanking[]> =>
    invoke('get_monthly_attendance_ranking', {
      year: year || null,
      month: month || null,
    }),
}
