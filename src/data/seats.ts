import type { Seat, SeatArea } from '@/types/seat'

export const seatAreas: SeatArea[] = [
  { id: 'area-1', name: 'A区-单人座', floor: 1, seatCount: 20 },
  { id: 'area-2', name: 'B区-双人座', floor: 1, seatCount: 10 },
  { id: 'area-3', name: 'C区-静音区', floor: 2, seatCount: 15 },
  { id: 'area-4', name: 'D区-VIP区', floor: 2, seatCount: 8 },
]

export const seats: Seat[] = [
  { id: 'seat-1', seatNumber: 'A01', type: 'single', status: 'available', floor: 1, area: 'A区', hasPower: true, hasWindow: false, description: '舒适单人座' },
  { id: 'seat-2', seatNumber: 'A02', type: 'single', status: 'occupied', floor: 1, area: 'A区', hasPower: true, hasWindow: false, description: '舒适单人座', currentUserId: 'user-2', currentBookingId: 'booking-1' },
  { id: 'seat-3', seatNumber: 'A03', type: 'single', status: 'available', floor: 1, area: 'A区', hasPower: true, hasWindow: true, description: '靠窗单人座' },
  { id: 'seat-4', seatNumber: 'A04', type: 'single', status: 'reserved', floor: 1, area: 'A区', hasPower: false, hasWindow: true, description: '靠窗单人座' },
  { id: 'seat-5', seatNumber: 'A05', type: 'single', status: 'available', floor: 1, area: 'A区', hasPower: true, hasWindow: false, description: '舒适单人座' },
  { id: 'seat-6', seatNumber: 'A06', type: 'single', status: 'occupied', floor: 1, area: 'A区', hasPower: true, hasWindow: false, description: '舒适单人座', currentUserId: 'user-3', currentBookingId: 'booking-2' },
  { id: 'seat-7', seatNumber: 'A07', type: 'single', status: 'available', floor: 1, area: 'A区', hasPower: true, hasWindow: false, description: '舒适单人座' },
  { id: 'seat-8', seatNumber: 'A08', type: 'single', status: 'maintenance', floor: 1, area: 'A区', hasPower: true, hasWindow: false, description: '维护中' },
  { id: 'seat-9', seatNumber: 'A09', type: 'single', status: 'available', floor: 1, area: 'A区', hasPower: true, hasWindow: true, description: '靠窗单人座' },
  { id: 'seat-10', seatNumber: 'A10', type: 'single', status: 'occupied', floor: 1, area: 'A区', hasPower: false, hasWindow: false, description: '舒适单人座', currentUserId: 'user-4', currentBookingId: 'booking-3' },
  { id: 'seat-11', seatNumber: 'B01', type: 'double', status: 'available', floor: 1, area: 'B区', hasPower: true, hasWindow: false, description: '双人讨论座' },
  { id: 'seat-12', seatNumber: 'B02', type: 'double', status: 'occupied', floor: 1, area: 'B区', hasPower: true, hasWindow: true, description: '靠窗双人座', currentUserId: 'user-5', currentBookingId: 'booking-4' },
  { id: 'seat-13', seatNumber: 'B03', type: 'double', status: 'available', floor: 1, area: 'B区', hasPower: true, hasWindow: false, description: '双人讨论座' },
  { id: 'seat-14', seatNumber: 'B04', type: 'double', status: 'reserved', floor: 1, area: 'B区', hasPower: true, hasWindow: false, description: '双人讨论座' },
  { id: 'seat-15', seatNumber: 'B05', type: 'double', status: 'available', floor: 1, area: 'B区', hasPower: false, hasWindow: true, description: '靠窗双人座' },
  { id: 'seat-16', seatNumber: 'C01', type: 'quiet', status: 'available', floor: 2, area: 'C区', hasPower: true, hasWindow: false, description: '静音区单人座' },
  { id: 'seat-17', seatNumber: 'C02', type: 'quiet', status: 'occupied', floor: 2, area: 'C区', hasPower: true, hasWindow: true, description: '静音区靠窗座', currentUserId: 'user-6', currentBookingId: 'booking-5' },
  { id: 'seat-18', seatNumber: 'C03', type: 'quiet', status: 'available', floor: 2, area: 'C区', hasPower: true, hasWindow: false, description: '静音区单人座' },
  { id: 'seat-19', seatNumber: 'C04', type: 'quiet', status: 'available', floor: 2, area: 'C区', hasPower: true, hasWindow: false, description: '静音区单人座' },
  { id: 'seat-20', seatNumber: 'C05', type: 'quiet', status: 'occupied', floor: 2, area: 'C区', hasPower: true, hasWindow: true, description: '静音区靠窗座', currentUserId: 'user-7', currentBookingId: 'booking-6' },
  { id: 'seat-21', seatNumber: 'D01', type: 'vip', status: 'available', floor: 2, area: 'D区', hasPower: true, hasWindow: true, description: 'VIP豪华座' },
  { id: 'seat-22', seatNumber: 'D02', type: 'vip', status: 'occupied', floor: 2, area: 'D区', hasPower: true, hasWindow: true, description: 'VIP豪华座', currentUserId: 'user-8', currentBookingId: 'booking-7' },
  { id: 'seat-23', seatNumber: 'D03', type: 'vip', status: 'available', floor: 2, area: 'D区', hasPower: true, hasWindow: false, description: 'VIP标准座' },
  { id: 'seat-24', seatNumber: 'D04', type: 'vip', status: 'reserved', floor: 2, area: 'D区', hasPower: true, hasWindow: true, description: 'VIP豪华座' },
]
