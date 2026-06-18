export type BookingStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled' | 'arrived' | 'noshow'

export interface Booking {
  id: string
  userId: string
  seatId: string
  seatNumber: string
  date: string
  startTime: string
  endTime: string
  status: BookingStatus
  isCycleBooking: boolean
  cycleRuleId?: string
  createTime: string
  updateTime: string
}

export type CycleFrequency = 'daily' | 'weekly' | 'monthly'

export interface CycleRule {
  id: string
  userId: string
  seatId: string
  seatNumber: string
  frequency: CycleFrequency
  weekdays: number[]
  startTime: string
  endTime: string
  startDate: string
  endDate: string
  isActive: boolean
  createTime: string
}

export interface TimeSlot {
  time: string
  available: boolean
  bookingId?: string
}
