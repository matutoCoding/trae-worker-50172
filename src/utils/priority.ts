import type { PriorityLevel } from '@/types/queue'

export const getPriorityText = (priority: PriorityLevel): string => {
  switch (priority) {
    case 'emergency': return '应急优先'
    case 'vip': return 'VIP优先'
    case 'normal': return '普通排队'
    default: return '普通排队'
  }
}

export const getPriorityColor = (priority: PriorityLevel): string => {
  switch (priority) {
    case 'emergency': return '#F53F3F'
    case 'vip': return '#FFD700'
    case 'normal': return '#2BA471'
    default: return '#2BA471'
  }
}

export const getPriorityWeight = (priority: PriorityLevel): number => {
  switch (priority) {
    case 'emergency': return 3
    case 'vip': return 2
    case 'normal': return 1
    default: return 0
  }
}

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'waiting': return '排队中'
    case 'called': return '已叫号'
    case 'seated': return '已入座'
    case 'expired': return '已过期'
    case 'cancelled': return '已取消'
    case 'available': return '空闲'
    case 'occupied': return '使用中'
    case 'reserved': return '已预约'
    case 'maintenance': return '维护中'
    case 'upcoming': return '待使用'
    case 'ongoing': return '进行中'
    case 'completed': return '已完成'
    default: return status
  }
}

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'waiting': return '#FF7D00'
    case 'called': return '#00B42A'
    case 'seated': return '#165DFF'
    case 'expired': return '#86909C'
    case 'cancelled': return '#86909C'
    case 'available': return '#00B42A'
    case 'occupied': return '#C9CDD4'
    case 'reserved': return '#FF9F43'
    case 'maintenance': return '#86909C'
    case 'upcoming': return '#165DFF'
    case 'ongoing': return '#00B42A'
    case 'completed': return '#86909C'
    default: return '#4E5969'
  }
}

export const getSeatTypeText = (type: string): string => {
  switch (type) {
    case 'single': return '单人座'
    case 'double': return '双人座'
    case 'vip': return 'VIP座'
    case 'quiet': return '静音座'
    default: return type
  }
}

export const getFrequencyText = (frequency: string): string => {
  switch (frequency) {
    case 'daily': return '每天'
    case 'weekly': return '每周'
    case 'monthly': return '每月'
    default: return frequency
  }
}
