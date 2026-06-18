export type QueueStatus = 'waiting' | 'called' | 'expired' | 'cancelled'

export type PriorityLevel = 'normal' | 'vip' | 'emergency'

export interface QueueItem {
  id: string
  userId: string
  userName: string
  seatType?: string
  priority: PriorityLevel
  status: QueueStatus
  queueNumber: number
  joinTime: string
  calledTime?: string
  expectedWaitTime: number
  isVip: boolean
  occupiedSeatId?: string
  occupiedSeatNumber?: string
}

export interface QueueStats {
  totalWaiting: number
  vipWaiting: number
  normalWaiting: number
  avgWaitTime: number
  availableSeats: number
}
