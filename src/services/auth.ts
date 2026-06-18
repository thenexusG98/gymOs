import { invoke } from '@tauri-apps/api/core'
import type { User, CreateUserInput, UpdateUserInput } from '@/types'

export const authService = {
  login: (username: string, password: string): Promise<User> =>
    invoke('login', { input: { username, password } }),

  getCurrentUser: (userId: number): Promise<User> =>
    invoke('get_current_user', { userId }),

  createUser: (input: CreateUserInput): Promise<User> =>
    invoke('create_user', { input }),

  updateUser: (input: UpdateUserInput): Promise<User> =>
    invoke('update_user', { input }),

  getUsers: (): Promise<User[]> =>
    invoke('get_users'),
}
