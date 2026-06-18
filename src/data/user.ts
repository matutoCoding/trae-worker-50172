import type { User, UserStats } from '@/types/user'

export const currentUser: User = {
  id: 'user-1',
  name: '学习达人',
  avatar: 'https://picsum.photos/id/64/200/200',
  phone: '138****8888',
  level: 'vip',
  studyHours: 256.5,
  balance: 128.00,
  vipExpireDate: '2024-06-30',
  createTime: '2023-06-15 10:00:00',
}

export const userStats: UserStats = {
  totalBookings: 89,
  completedBookings: 76,
  totalStudyHours: 256.5,
  consecutiveDays: 12,
}
