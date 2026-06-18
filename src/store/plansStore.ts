import { create } from 'zustand'
import type { Plan } from '@/types'
import { plansService } from '@/services/plans'

interface PlansState {
  plans: Plan[]
  isLoading: boolean
  error: string | null

  fetchPlans: (includeInactive?: boolean) => Promise<void>
  refresh: () => Promise<void>
}

export const usePlansStore = create<PlansState>((set, get) => ({
  plans: [],
  isLoading: false,
  error: null,

  fetchPlans: async (includeInactive = false) => {
    set({ isLoading: true, error: null })
    try {
      const plans = await plansService.getAll(includeInactive)
      set({ plans, isLoading: false })
    } catch (e) {
      set({ error: String(e), isLoading: false })
    }
  },

  refresh: async () => {
    await get().fetchPlans()
  },
}))
