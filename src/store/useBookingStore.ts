import { create } from 'zustand'
import type { Booking, CycleRule, BookingStatus } from '@/types/booking'
import { bookings as mockBookings, cycleRules as mockCycleRules } from '@/data/bookings'
import { saveToStorage, loadFromStorage } from '@/utils/persist'
import dayjs from 'dayjs'

const BOOKINGS_KEY = 'bookings'
const CYCLE_RULES_KEY = 'cycleRules'

interface BookingState {
  bookings: Booking[]
  cycleRules: CycleRule[]
  loading: boolean
  bookingsLoaded: boolean
  rulesLoaded: boolean

  setBookings: (bookings: Booking[]) => void
  setCycleRules: (rules: CycleRule[]) => void
  addBooking: (booking: Booking) => void
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void
  cancelBooking: (bookingId: string) => void
  deleteBookingsByRuleId: (ruleId: string) => void
  addCycleRule: (rule: CycleRule) => void
  updateCycleRule: (ruleId: string, updates: Partial<CycleRule>) => void
  toggleCycleRule: (ruleId: string) => void
  getBookingsByDate: (date: string) => Booking[]
  getUpcomingBookings: () => Booking[]
  getCycleBookings: (ruleId: string) => Booking[]
  getBookingById: (bookingId: string) => Booking | undefined
  getCycleRuleById: (ruleId: string) => CycleRule | undefined
  generateCycleBookings: (ruleId: string) => Booking[]
  regenerateCycleBookings: (ruleId: string) => Booking[]
  fetchBookings: () => Promise<void>
  fetchCycleRules: () => Promise<void>
  resetBookingData: () => void
  resetRuleData: () => void
}

export const useBookingStore = create<BookingState>((set, get) => ({
  bookings: [],
  cycleRules: [],
  loading: false,
  bookingsLoaded: false,
  rulesLoaded: false,

  setBookings: (bookings) => {
    set({ bookings })
    saveToStorage(BOOKINGS_KEY, bookings)
  },

  setCycleRules: (rules) => {
    set({ cycleRules: rules })
    saveToStorage(CYCLE_RULES_KEY, rules)
  },

  addBooking: (booking) => {
    set((state) => {
      const newBookings = [booking, ...state.bookings]
      saveToStorage(BOOKINGS_KEY, newBookings)
      return { bookings: newBookings }
    })
  },

  updateBooking: (bookingId, updates) => {
    set((state) => {
      const newBookings = state.bookings.map((b) =>
        b.id === bookingId ? { ...b, ...updates, updateTime: new Date().toISOString() } : b
      )
      saveToStorage(BOOKINGS_KEY, newBookings)
      return { bookings: newBookings }
    })
  },

  cancelBooking: (bookingId) => {
    set((state) => {
      const newBookings = state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' as BookingStatus, updateTime: new Date().toISOString() } : b
      )
      saveToStorage(BOOKINGS_KEY, newBookings)
      return { bookings: newBookings }
    })
  },

  deleteBookingsByRuleId: (ruleId) => {
    set((state) => {
      const newBookings = state.bookings.filter((b) => b.cycleRuleId !== ruleId)
      saveToStorage(BOOKINGS_KEY, newBookings)
      return { bookings: newBookings }
    })
  },

  addCycleRule: (rule) => {
    set((state) => {
      const newRules = [rule, ...state.cycleRules]
      saveToStorage(CYCLE_RULES_KEY, newRules)
      return { cycleRules: newRules }
    })
  },

  updateCycleRule: (ruleId, updates) => {
    set((state) => {
      const newRules = state.cycleRules.map((r) =>
        r.id === ruleId ? { ...r, ...updates } : r
      )
      saveToStorage(CYCLE_RULES_KEY, newRules)
      return { cycleRules: newRules }
    })
  },

  toggleCycleRule: (ruleId) => {
    set((state) => {
      const newRules = state.cycleRules.map((r) =>
        r.id === ruleId ? { ...r, isActive: !r.isActive } : r
      )
      saveToStorage(CYCLE_RULES_KEY, newRules)
      return { cycleRules: newRules }
    })
  },

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
    let bookingIndex = Date.now()

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

  regenerateCycleBookings: (ruleId) => {
    get().deleteBookingsByRuleId(ruleId)
    const generated = get().generateCycleBookings(ruleId)

    set((state) => {
      const newBookings = [...generated, ...state.bookings]
      saveToStorage(BOOKINGS_KEY, newBookings)
      return { bookings: newBookings }
    })

    return generated
  },

  fetchBookings: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 100))
    const state = get()
    if (!state.bookingsLoaded) {
      const stored = loadFromStorage<Booking[]>(BOOKINGS_KEY, [])
      if (stored && stored.length > 0) {
        set({ bookings: stored, bookingsLoaded: true, loading: false })
      } else {
        set({ bookings: mockBookings, bookingsLoaded: true, loading: false })
        saveToStorage(BOOKINGS_KEY, mockBookings)
      }
    } else {
      set({ loading: false })
    }
  },

  fetchCycleRules: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 100))
    const state = get()
    if (!state.rulesLoaded) {
      const stored = loadFromStorage<CycleRule[]>(CYCLE_RULES_KEY, [])
      if (stored && stored.length > 0) {
        set({ cycleRules: stored, rulesLoaded: true, loading: false })
      } else {
        set({ cycleRules: mockCycleRules, rulesLoaded: true, loading: false })
        saveToStorage(CYCLE_RULES_KEY, mockCycleRules)
      }
    } else {
      set({ loading: false })
    }
  },

  resetBookingData: () => {
    set({ bookings: mockBookings, bookingsLoaded: true })
    saveToStorage(BOOKINGS_KEY, mockBookings)
  },

  resetRuleData: () => {
    set({ cycleRules: mockCycleRules, rulesLoaded: true })
    saveToStorage(CYCLE_RULES_KEY, mockCycleRules)
  },
}))
