import { create } from 'zustand'
import type { User, UserStats, UserLevel } from '@/types/user'
import { currentUser as mockUser, userStats as mockStats } from '@/data/user'

interface UserState {
  user: User | null
  userStats: UserStats
  loading: boolean

  setUser: (user: User | null) => void
  setUserStats: (stats: UserStats) => void
  updateUser: (updates: Partial<User>) => void
  isVip: () => boolean
  getUserLevelText: () => string
  fetchUser: () => Promise<void>
  fetchUserStats: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  user: mockUser,
  userStats: mockStats,
  loading: false,

  setUser: (user) => set({ user }),

  setUserStats: (stats) => set({ userStats: stats }),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),

  isVip: () => {
    const user = get().user
    return user?.level === 'vip' || user?.level === 'svip'
  },

  getUserLevelText: () => {
    const level = get().user?.level
    switch (level) {
      case 'svip': return '超级会员'
      case 'vip': return 'VIP会员'
      default: return '普通用户'
    }
  },

  fetchUser: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 500))
    set({ user: mockUser, loading: false })
  },

  fetchUserStats: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 500))
    set({ userStats: mockStats, loading: false })
  },
}))
