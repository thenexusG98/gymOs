import { invoke } from '@tauri-apps/api/core'
import type { Plan, CreatePlanInput, UpdatePlanInput } from '@/types'

export const plansService = {
  getAll: (includeInactive = false): Promise<Plan[]> =>
    invoke('get_plans', { includeInactive }),

  getById: (id: number): Promise<Plan> =>
    invoke('get_plan', { id }),

  create: (input: CreatePlanInput): Promise<Plan> =>
    invoke('create_plan', { input }),

  update: (input: UpdatePlanInput): Promise<Plan> =>
    invoke('update_plan', { input }),

  delete: (id: number): Promise<void> =>
    invoke('delete_plan', { id }),
}
