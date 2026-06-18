import { invoke } from '@tauri-apps/api/core'
import type { EmailSettings, UpdateEmailSettingsInput } from '@/types'

export const emailService = {
  getSettings: (): Promise<EmailSettings> =>
    invoke('get_email_settings'),

  saveSettings: (input: UpdateEmailSettingsInput): Promise<EmailSettings> =>
    invoke('save_email_settings', { input }),

  sendTest: (toEmail: string): Promise<string> =>
    invoke('send_test_email', { toEmail }),

  sendReminder: (studentId: number): Promise<string> =>
    invoke('send_payment_reminder', { studentId }),
}
