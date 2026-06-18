import type { Booking, CycleRule } from '@/types/booking'

export const bookings: Booking[] = [
  { id: 'booking-1', userId: 'user-1', seatId: 'seat-2', seatNumber: 'A02', date: '2024-01-15', startTime: '09:00', endTime: '12:00', status: 'ongoing', isCycleBooking: true, cycleRuleId: 'cycle-1', createTime: '2024-01-10 10:00:00', updateTime: '2024-01-15 09:00:00' },
  { id: 'booking-2', userId: 'user-1', seatId: 'seat-6', seatNumber: 'A06', date: '2024-01-15', startTime: '14:00', endTime: '18:00', status: 'upcoming', isCycleBooking: false, createTime: '2024-01-14 15:00:00', updateTime: '2024-01-14 15:00:00' },
  { id: 'booking-3', userId: 'user-1', seatId: 'seat-10', seatNumber: 'A10', date: '2024-01-14', startTime: '09:00', endTime: '17:00', status: 'completed', isCycleBooking: true, cycleRuleId: 'cycle-1', createTime: '2024-01-08 10:00:00', updateTime: '2024-01-14 17:00:00' },
  { id: 'booking-4', userId: 'user-1', seatId: 'seat-1', seatNumber: 'A01', date: '2024-01-16', startTime: '10:00', endTime: '16:00', status: 'upcoming', isCycleBooking: true, cycleRuleId: 'cycle-2', createTime: '2024-01-12 09:00:00', updateTime: '2024-01-12 09:00:00' },
  { id: 'booking-5', userId: 'user-1', seatId: 'seat-3', seatNumber: 'A03', date: '2024-01-17', startTime: '08:00', endTime: '12:00', status: 'upcoming', isCycleBooking: false, createTime: '2024-01-13 14:00:00', updateTime: '2024-01-13 14:00:00' },
  { id: 'booking-6', userId: 'user-1', seatId: 'seat-16', seatNumber: 'C01', date: '2024-01-13', startTime: '13:00', endTime: '21:00', status: 'completed', isCycleBooking: false, createTime: '2024-01-10 16:00:00', updateTime: '2024-01-13 21:00:00' },
  { id: 'booking-7', userId: 'user-1', seatId: 'seat-21', seatNumber: 'D01', date: '2024-01-12', startTime: '09:00', endTime: '18:00', status: 'cancelled', isCycleBooking: false, createTime: '2024-01-11 10:00:00', updateTime: '2024-01-11 18:00:00' },
]

export const cycleRules: CycleRule[] = [
  { id: 'cycle-1', userId: 'user-1', seatId: 'seat-2', seatNumber: 'A02', frequency: 'weekly', weekdays: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '12:00', startDate: '2024-01-01', endDate: '2024-03-31', isActive: true, createTime: '2024-01-01 10:00:00' },
  { id: 'cycle-2', userId: 'user-1', seatId: 'seat-1', seatNumber: 'A01', frequency: 'weekly', weekdays: [2, 4, 6], startTime: '10:00', endTime: '16:00', startDate: '2024-01-05', endDate: '2024-02-28', isActive: true, createTime: '2024-01-03 14:00:00' },
  { id: 'cycle-3', userId: 'user-1', seatId: 'seat-17', seatNumber: 'C02', frequency: 'daily', weekdays: [0, 1, 2, 3, 4, 5, 6], startTime: '19:00', endTime: '22:00', startDate: '2024-01-10', endDate: '2024-01-31', isActive: false, createTime: '2024-01-08 09:00:00' },
]
