import { create } from 'zustand'
import type { Booking, CycleRule, BookingStatus, CycleFrequency } from '@/types/booking'
import { bookings as mockBookings, cycleRules as mockCycleRules } from '@/data/bookings'
import dayjs from 'dayjs'

interface BookingState {
  bookings: Booking[]
  cycleRules: CycleRule[]
  loading: boolean
  bookingsInitialized: boolean
  rulesInitialized: boolean

  setBookings: (bookings: Booking[]) => void
  setCycleRules: (rules: CycleRule[]) => void
  addBooking: (booking: Booking) => void
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void
  cancelBooking: (bookingId: string) => void
  addCycleRule: (rule: CycleRule) => void
  updateCycleRule: (ruleId: string, updates: Partial<CycleRule>) => void
  toggleCycleRule: (ruleId: string) => void
  getBookingsByDate: (date: string) => Booking[]
  getUpcomingBookings: () => Booking[]
  getCycleBookings: (ruleId: string) => Booking[]
  getBookingById: (bookingId: string) => Booking | undefined
  getCycleRuleById: (ruleId: string) => CycleRule | undefined
  generateCycleBookings: (ruleId: string) => Booking[]
  fetchBookings: () => Promise<void>
  fetchCycleRules: () => Promise<void>
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  cycleRules: [],
  loading: false,
  bookingsInitialized: false,
  rulesInitialized: false,

  setBookings: (bookings) => set({ bookings }),

  setCycleRules: (rules) => set({ cycleRules: rules }),

  addBooking: (booking) =>
    set((state) => ({ bookings: [booking, ...state.bookings] })),

  updateBooking: (bookingId, updates) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, ...updates, updateTime: new Date().toISOString() } : b
      ),
    })),

  cancelBooking: (bookingId) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus, updateTime: new Date().toISOString() } : b
      ),
    })),

  addCycleRule: (rule) =>
    set((state) => ({ cycleRules: [rule, ...state.cycleRules], rulesInitialized: true })),

  updateCycleRule: (ruleId, updates) =>
    set((state) => ({
      cycleRules: state.cycleRules.map((r) =>
        r.id === ruleId ? { ...r, ...updates } : r
      ),
    })),

  toggleCycleRule: (ruleId) =>
    set((state) => ({
      cycleRules: state.cycleRules.map((r) =>
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      ),
    })),

  getBookingsByDate: (date) =>
    get().bookings.filter((b) => b.date === date && b.status !== 'cancelled'),

  getUpcomingBookings: () =>
    get().bookings.filter(
      (b) => b.status === 'upcoming' || b.status === 'ongoing'
    ),

  getCycleBookings: (ruleId) =>
    get().bookings.filter((b) => b.cycleRuleId === ruleId),

  getBookingById: (bookingId) =>
    get().bookings.find((b) => b.id === bookingId),

  getCycleRuleById: (ruleId) =>
    get().cycleRules.find((r) => r.id === ruleId),

  generateCycleBookings: (ruleId) => {
    const rule = get().cycleRules.find((r) => r.id === ruleId)
    if (!rule) return []

    const generated: Booking[] = []
    let currentDate = dayjs(rule.startDate)
    const endDate = dayjs(rule.endDate)
    let bookingIndex = 0

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const weekday = currentDate.day()
      if (rule.weekdays.includes(weekday)) {
        generated.push({
          id: `${ruleId}-gen-${bookingIndex++}`,
          userId: rule.userId,
          seatId: rule.seatId,
          seatNumber: rule.seatNumber,
          date: currentDate.format('YYYY-MM-DD'),
          startTime: rule.startTime,
          endTime: rule.endTime,
          status: 'upcoming',
          isCycleBooking: true,
          cycleRuleId: rule.id,
          createTime: new Date().toISOString(),
          updateTime: new Date().toISOString(),
        })
      }
      currentDate = currentDate.add(1, 'day')
    }

    return generated
  },

  fetchBookings: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 200))
    const state = get()
    if (!state.bookingsInitialized) {
      set({ bookings: mockBookings, bookingsInitialized: true, loading: false })
    } else {
      set({ loading: false })
    }
  },

  fetchCycleRules: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 200))
    const state = get()
    if (!state.rulesInitialized) {
      set({ cycleRules: mockCycleRules, rulesInitialized: true, loading: false })
    } else {
      set({ loading: false })
    }
  },
}))
