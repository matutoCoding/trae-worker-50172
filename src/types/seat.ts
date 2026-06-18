export type SeatStatus = 'available' | 'occupied' | 'reserved' | 'maintenance'

export type SeatType = 'single' | 'double' | 'vip' | 'quiet'

export interface Seat {
  id: string
  seatNumber: string
  type: SeatType
  status: SeatStatus
  floor: number
  area: string
  hasPower: boolean
  hasWindow: boolean
  description?: string
  currentUserId?: string
  currentBookingId?: string
}

export interface SeatArea {
  id: string
  name: string
  floor: number
  seatCount: number
}
