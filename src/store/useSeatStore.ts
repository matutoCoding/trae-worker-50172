import { create } from 'zustand'
import type { Seat, SeatArea, SeatStatus, SeatType } from '@/types/seat'
import { seats as mockSeats, seatAreas as mockAreas } from '@/data/seats'
import { saveToStorage, loadFromStorage } from '@/utils/persist'

const SEATS_KEY = 'seats'

interface SeatState {
  seats: Seat[]
  seatAreas: SeatArea[]
  selectedArea: string
  selectedFloor: number
  loading: boolean
  seatsLoaded: boolean

  setSeats: (seats: Seat[]) => void
  setSelectedArea: (area: string) => void
  setSelectedFloor: (floor: number) => void
  updateSeatStatus: (seatId: string, status: SeatStatus) => void
  getSeatById: (seatId: string) => Seat | undefined
  getSeatsByArea: (area: string) => Seat[]
  getAvailableSeatsCount: () => number
  getAvailableSeatByType: (seatType: string) => Seat | undefined
  occupySeat: (seatId: string) => void
  releaseSeat: (seatId: string) => void
  fetchSeats: () => Promise<void>
  resetSeatData: () => void
}

export const useSeatStore = create<SeatState>((set, get) => ({
  seats: [],
  seatAreas: mockAreas,
  selectedArea: '',
  selectedFloor: 1,
  loading: false,
  seatsLoaded: false,

  setSeats: (seats) => {
    set({ seats })
    saveToStorage(SEATS_KEY, seats)
  },

  setSelectedArea: (area) => set({ selectedArea: area }),

  setSelectedFloor: (floor) => set({ selectedFloor: floor }),

  updateSeatStatus: (seatId, status) => {
    set((state) => {
      const newSeats = state.seats.map((seat) =>
        seat.id === seatId ? { ...seat, status } : seat
      )
      saveToStorage(SEATS_KEY, newSeats)
      return { seats: newSeats }
    })
  },

  getSeatById: (seatId) => get().seats.find((s) => s.id === seatId),

  getSeatsByArea: (area) => get().seats.filter((s) => s.area === area),

  getAvailableSeatsCount: () =>
    get().seats.filter((s) => s.status === 'available').length,

  getAvailableSeatByType: (seatType) => {
    return get().seats.find(
      (s) => s.status === 'available' && s.type === (seatType as SeatType)
    )
  },

  occupySeat: (seatId) => {
    get().updateSeatStatus(seatId, 'occupied')
  },

  releaseSeat: (seatId) => {
    get().updateSeatStatus(seatId, 'available')
  },

  fetchSeats: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 100))
    const state = get()
    if (!state.seatsLoaded) {
      const stored = loadFromStorage<Seat[]>(SEATS_KEY, [])
      if (stored && stored.length > 0) {
        set({ seats: stored, seatsLoaded: true, loading: false })
      } else {
        set({ seats: mockSeats, seatsLoaded: true, loading: false })
        saveToStorage(SEATS_KEY, mockSeats)
      }
    } else {
      set({ loading: false })
    }
  },

  resetSeatData: () => {
    set({ seats: mockSeats, seatsLoaded: true })
    saveToStorage(SEATS_KEY, mockSeats)
  },
}))
