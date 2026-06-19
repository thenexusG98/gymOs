import { invoke } from '@tauri-apps/api/core'
import type { EmailSettings, UpdateEmailSettingsInput, ReminderLog } from '@/types'

export const emailService = {
  getSettings: (): Promise<EmailSettings> =>
    invoke('get_email_settings'),

  saveSettings: (input: UpdateEmailSettingsInput): Promise<EmailSettings> =>
    invoke('save_email_settings', { input }),

  sendTest: (toEmail: string): Promise<string> =>
    invoke('send_test_email', { toEmail }),

  sendReminder: (studentId: number): Promise<string> =>
    invoke('send_payment_reminder', { studentId }),

  manualCheck: (): Promise<ReminderLog[]> =>
    invoke('manual_reminder_check'),

  getReminderLogs: (limit?: number): Promise<ReminderLog[]> =>
    invoke('get_reminder_logs', { limit: limit ?? 20 }),
}
