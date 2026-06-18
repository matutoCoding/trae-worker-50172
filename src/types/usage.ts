export type UsageStatus = 'using' | 'completed' | 'timeout' | 'cancelled' | 'noshow'

export type UsageSource = 'queue' | 'booking'

export interface UsageRecord {
  id: string
  userId: string
  userName: string
  seatId: string
  seatNumber: string
  source: UsageSource
  sourceRefId?: string
  queueNumber?: number
  startTime: string
  endTime?: string
  expectedEndTime?: string
  status: UsageStatus
  leaveReason?: string
  createTime: string
}

export interface UsageStats {
  totalRecords: number
  usingCount: number
  completedCount: number
  timeoutCount: number
  cancelledCount: number
  noshowCount: number
}
