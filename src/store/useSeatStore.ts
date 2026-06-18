import { create } from 'zustand'
import type { Seat, SeatArea, SeatStatus } from '@/types/seat'
import { seats as mockSeats, seatAreas as mockAreas } from '@/data/seats'

interface SeatState {
  seats: Seat[]
  seatAreas: SeatArea[]
  selectedArea: string
  selectedFloor: number
  loading: boolean

  setSeats: (seats: Seat[]) => void
  setSelectedArea: (area: string) => void
  setSelectedFloor: (floor: number) => void
  updateSeatStatus: (seatId: string, status: SeatStatus) => void
  getSeatById: (seatId: string) => Seat | undefined
  getSeatsByArea: (area: string) => Seat[]
  getAvailableSeatsCount: () => number
  fetchSeats: () => Promise<void>
}

export const useSeatStore = create<SeatState>((set, get) => ({
  seats: mockSeats,
  seatAreas: mockAreas,
  selectedArea: '',
  selectedFloor: 1,
  loading: false,

  setSeats: (seats) => set({ seats }),

  setSelectedArea: (area) => set({ selectedArea: area }),

  setSelectedFloor: (floor) => set({ selectedFloor: floor }),

  updateSeatStatus: (seatId, status) =>
    set((state) => ({
      seats: state.seats.map((seat) =>
        seat.id === seatId ? { ...seat, status } : seat
      ),
    })),

  getSeatById: (seatId) => get().seats.find((s) => s.id === seatId),

  getSeatsByArea: (area) => get().seats.filter((s) => s.area === area),

  getAvailableSeatsCount: () =>
    get().seats.filter((s) => s.status === 'available').length,

  fetchSeats: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 500))
    set({ seats: mockSeats, loading: false })
  },
}))
