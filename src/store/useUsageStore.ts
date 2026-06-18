import { create } from 'zustand'
import type { UsageRecord, UsageStatus, UsageSource, UsageStats } from '@/types/usage'
import { saveToStorage, loadFromStorage } from '@/utils/persist'

const USAGE_KEY = 'usageRecords'

interface UsageState {
  records: UsageRecord[]
  loading: boolean
  loaded: boolean

  setRecords: (records: UsageRecord[]) => void
  addRecord: (record: UsageRecord) => void
  updateRecord: (recordId: string, updates: Partial<UsageRecord>) => void
  getRecordById: (recordId: string) => UsageRecord | undefined
  getRecordByQueueId: (queueId: string) => UsageRecord | undefined
  getRecordByBookingId: (bookingId: string) => UsageRecord | undefined
  getUsingRecords: () => UsageRecord[]
  getMyRecords: () => UsageRecord[]
  getStats: () => UsageStats
  fetchRecords: () => Promise<void>
  resetUsageData: () => void
  createRecordFromQueue: (params: {
    queueId: string
    userId: string
    userName: string
    seatId: string
    seatNumber: string
    queueNumber: number
  }) => UsageRecord
  createRecordFromBooking: (params: {
    bookingId: string
    userId: string
    userName: string
    seatId: string
    seatNumber: string
    expectedEndTime: string
  }) => UsageRecord
  finishRecord: (recordId: string, status: UsageStatus, leaveReason?: string) => void
}

export const useUsageStore = create<UsageState>((set, get) => ({
  records: [],
  loading: false,
  loaded: false,

  setRecords: (records) => {
    set({ records })
    saveToStorage(USAGE_KEY, records)
  },

  addRecord: (record) => {
    set((state) => {
      const newRecords = [record, ...state.records]
      saveToStorage(USAGE_KEY, newRecords)
      return { records: newRecords }
    })
  },

  updateRecord: (recordId, updates) => {
    set((state) => {
      const newRecords = state.records.map((r) =>
        r.id === recordId ? { ...r, ...updates } : r
      )
      saveToStorage(USAGE_KEY, newRecords)
      return { records: newRecords }
    })
  },

  getRecordById: (recordId) => get().records.find(r => r.id === recordId),

  getRecordByQueueId: (queueId) =>
    get().records.find(r => r.source === 'queue' && r.sourceRefId === queueId),

  getRecordByBookingId: (bookingId) =>
    get().records.find(r => r.source === 'booking' && r.sourceRefId === bookingId),

  getUsingRecords: () =>
    get().records
      .filter(r => r.status === 'using')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),

  getMyRecords: () =>
    get().records
      .filter(r => r.userId === 'user-1')
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),

  getStats: () => {
    const records = get().records
    return {
      totalRecords: records.length,
      usingCount: records.filter(r => r.status === 'using').length,
      completedCount: records.filter(r => r.status === 'completed').length,
      timeoutCount: records.filter(r => r.status === 'timeout').length,
      cancelledCount: records.filter(r => r.status === 'cancelled').length,
      noshowCount: records.filter(r => r.status === 'noshow').length,
    }
  },

  fetchRecords: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 50))
    const state = get()
    if (!state.loaded) {
      const stored = loadFromStorage<UsageRecord[]>(USAGE_KEY, [])
      set({ records: stored, loaded: true, loading: false })
    } else {
      set({ loading: false })
    }
  },

  resetUsageData: () => {
    set({ records: [], loaded: true })
    saveToStorage(USAGE_KEY, [])
  },

  createRecordFromQueue: (params) => {
    const now = new Date().toISOString()
    const newRecord: UsageRecord = {
      id: `usage-${Date.now()}`,
      userId: params.userId,
      userName: params.userName,
      seatId: params.seatId,
      seatNumber: params.seatNumber,
      source: 'queue' as UsageSource,
      sourceRefId: params.queueId,
      queueNumber: params.queueNumber,
      startTime: now,
      status: 'using' as UsageStatus,
      createTime: now,
    }
    get().addRecord(newRecord)
    return newRecord
  },

  createRecordFromBooking: (params) => {
    const now = new Date().toISOString()
    const newRecord: UsageRecord = {
      id: `usage-${Date.now()}`,
      userId: params.userId,
      userName: params.userName,
      seatId: params.seatId,
      seatNumber: params.seatNumber,
      source: 'booking' as UsageSource,
      sourceRefId: params.bookingId,
      startTime: now,
      expectedEndTime: params.expectedEndTime,
      status: 'using' as UsageStatus,
      createTime: now,
    }
    get().addRecord(newRecord)
    return newRecord
  },

  finishRecord: (recordId, status, leaveReason) => {
    get().updateRecord(recordId, {
      status,
      endTime: new Date().toISOString(),
      leaveReason,
    })
  },
}))
