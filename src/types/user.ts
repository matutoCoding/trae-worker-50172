export type UserLevel = 'normal' | 'vip' | 'svip'

export interface User {
  id: string
  name: string
  avatar: string
  phone: string
  level: UserLevel
  studyHours: number
  balance: number
  vipExpireDate?: string
  createTime: string
}

export interface UserStats {
  totalBookings: number
  completedBookings: number
  totalStudyHours: number
  consecutiveDays: number
}
