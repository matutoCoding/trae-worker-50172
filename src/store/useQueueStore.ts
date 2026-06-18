import { create } from 'zustand'
import type { QueueItem, QueueStats, PriorityLevel, QueueStatus } from '@/types/queue'
import { queueItems as mockQueueItems, queueStats as mockQueueStats, myQueueItem as mockMyQueueItem } from '@/data/queue'
import { saveToStorage, loadFromStorage, hasStorageKey } from '@/utils/persist'
import { useSeatStore } from './useSeatStore'
import { useUsageStore } from './useUsageStore'

const QUEUE_ITEMS_KEY = 'queueItems'
const MY_QUEUE_KEY = 'myQueueItem'

interface QueueState {
  queueItems: QueueItem[]
  queueStats: QueueStats
  myQueueItem: QueueItem | null
  loading: boolean
  queueLoaded: boolean
  myQueueLoaded: boolean

  setQueueItems: (items: QueueItem[]) => void
  setQueueStats: (stats: QueueStats) => void
  setMyQueueItem: (item: QueueItem | null) => void
  joinQueue: (seatType: string, priority: PriorityLevel) => Promise<QueueItem>
  leaveQueue: (queueId: string) => void
  callNext: () => QueueItem | null
  expireQueue: (queueId: string) => void
  getPriorityQueue: () => QueueItem[]
  getNormalQueue: () => QueueItem[]
  getCalledQueue: () => QueueItem[]
  getWaitingCount: () => number
  updateQueueStatus: (queueId: string, status: QueueStatus) => void
  recalcStats: () => void
  fetchQueue: () => Promise<void>
  fetchMyQueue: () => Promise<void>
  resetQueueData: () => void
  occupySeatForQueue: (queueId: string, seatId: string) => void
  confirmSeated: (queueId: string) => QueueItem | null
}

const getPriorityWeight = (priority: PriorityLevel): number => {
  switch (priority) {
    case 'emergency': return 3
    case 'vip': return 2
    case 'normal': return 1
    default: return 0
  }
}

export const useQueueStore = create<QueueState>((set, get) => ({
  queueItems: [],
  queueStats: mockQueueStats,
  myQueueItem: null,
  loading: false,
  queueLoaded: false,
  myQueueLoaded: false,

  setQueueItems: (items) => {
    set({ queueItems: items })
    saveToStorage(QUEUE_ITEMS_KEY, items)
    get().recalcStats()
  },

  setQueueStats: (stats) => set({ queueStats: stats }),

  setMyQueueItem: (item) => {
    set({ myQueueItem: item })
    saveToStorage(MY_QUEUE_KEY, item)
  },

  joinQueue: async (seatType, priority) => {
    const waitingItems = get().queueItems.filter(q => q.status === 'waiting')
    const newItem: QueueItem = {
      id: `queue-${Date.now()}`,
      userId: 'user-1',
      userName: '我',
      seatType,
      priority,
      status: 'waiting',
      queueNumber: waitingItems.length + 1,
      joinTime: new Date().toISOString(),
      expectedWaitTime: priority === 'vip' ? 15 : 45,
      isVip: priority === 'vip' || priority === 'emergency',
    }

    const newQueueItems = [...get().queueItems, newItem]
    set({
      queueItems: newQueueItems,
      myQueueItem: newItem,
      myQueueLoaded: true,
    })
    saveToStorage(QUEUE_ITEMS_KEY, newQueueItems)
    saveToStorage(MY_QUEUE_KEY, newItem)
    get().recalcStats()

    return newItem
  },

  leaveQueue: (queueId) => {
    const item = get().queueItems.find(q => q.id === queueId)
    if (item?.occupiedSeatId && item.status === 'called') {
      const seatStore = useSeatStore.getState()
      seatStore.releaseSeat(item.occupiedSeatId)
    }

    if (item?.status === 'seated') {
      const usageStore = useUsageStore.getState()
      const usage = usageStore.getRecordByQueueId(queueId)
      if (usage) {
        usageStore.finishRecord(usage.id, 'cancelled', '学员主动取消排队')
      }
      if (item.occupiedSeatId) {
        const seatStore = useSeatStore.getState()
        seatStore.releaseSeat(item.occupiedSeatId)
      }
    }

    const newQueueItems = get().queueItems.map(q =>
      q.id === queueId ? { ...q, status: 'cancelled' as QueueStatus, leaveTime: new Date().toISOString() } : q
    )
    const isMyQueue = get().myQueueItem?.id === queueId

    set({
      queueItems: newQueueItems,
      myQueueItem: isMyQueue ? null : get().myQueueItem,
      myQueueLoaded: true,
    })
    saveToStorage(QUEUE_ITEMS_KEY, newQueueItems)
    if (isMyQueue) {
      saveToStorage(MY_QUEUE_KEY, null)
    }
    get().recalcStats()
  },

  callNext: async () => {
    const seatStore = useSeatStore.getState()
    if (!seatStore.seatsLoaded) {
      await seatStore.fetchSeats()
    }

    const waitingItems = get().queueItems
      .filter(q => q.status === 'waiting')
      .sort((a, b) => {
        const weightDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
        if (weightDiff !== 0) return weightDiff
        return new Date(a.joinTime).getTime() - new Date(b.joinTime).getTime()
      })

    if (waitingItems.length === 0) return null

    const nextItem = waitingItems[0]

    const freshSeatStore = useSeatStore.getState()
    const availableSeat = freshSeatStore.getAvailableSeatByType(nextItem.seatType || 'single')

    let occupiedSeatId: string | undefined
    let occupiedSeatNumber: string | undefined
    if (availableSeat) {
      freshSeatStore.occupySeat(availableSeat.id)
      occupiedSeatId = availableSeat.id
      occupiedSeatNumber = availableSeat.seatNumber
    }

    const newQueueItems = get().queueItems.map(q =>
      q.id === nextItem.id
        ? {
            ...q,
            status: 'called' as QueueStatus,
            calledTime: new Date().toISOString(),
            occupiedSeatId,
            occupiedSeatNumber,
          }
        : q
    )
    const isMyQueue = get().myQueueItem?.id === nextItem.id

    const calledItem = newQueueItems.find(q => q.id === nextItem.id)!

    set({
      queueItems: newQueueItems,
      myQueueItem: isMyQueue ? { ...calledItem } : get().myQueueItem,
    })
    saveToStorage(QUEUE_ITEMS_KEY, newQueueItems)
    if (isMyQueue) {
      saveToStorage(MY_QUEUE_KEY, calledItem)
    }
    get().recalcStats()

    return calledItem
  },

  expireQueue: (queueId) => {
    const item = get().queueItems.find(q => q.id === queueId)
    if (item?.occupiedSeatId) {
      const seatStore = useSeatStore.getState()
      seatStore.releaseSeat(item.occupiedSeatId)
    }

    if (item?.status === 'called') {
      const usageStore = useUsageStore.getState()
      const usage = usageStore.getRecordByQueueId(queueId)
      if (usage) {
        usageStore.finishRecord(usage.id, 'timeout', '叫号后5分钟未入座')
      } else if (item.occupiedSeatId) {
        usageStore.createRecordFromQueue({
          queueId: item.id,
          userId: item.userId,
          userName: item.userName,
          seatId: item.occupiedSeatId,
          seatNumber: item.occupiedSeatNumber || '',
          queueNumber: item.queueNumber,
        })
        const newUsage = usageStore.getRecordByQueueId(item.id)
        if (newUsage) {
          usageStore.finishRecord(newUsage.id, 'timeout', '叫号后5分钟未入座')
        }
      }
    }

    const newQueueItems = get().queueItems.map(q =>
      q.id === queueId ? { ...q, status: 'expired' as QueueStatus, leaveTime: new Date().toISOString() } : q
    )
    const isMyQueue = get().myQueueItem?.id === queueId

    set({
      queueItems: newQueueItems,
      myQueueItem: isMyQueue
        ? { ...get().myQueueItem!, status: 'expired' as QueueStatus, leaveTime: new Date().toISOString() }
        : get().myQueueItem,
    })
    saveToStorage(QUEUE_ITEMS_KEY, newQueueItems)
    if (isMyQueue) {
      saveToStorage(MY_QUEUE_KEY, {
        ...get().myQueueItem!,
        status: 'expired',
        leaveTime: new Date().toISOString(),
      })
    }
    get().recalcStats()
  },

  getPriorityQueue: () =>
    get().queueItems
      .filter(q => q.status === 'waiting' && (q.priority === 'vip' || q.priority === 'emergency'))
      .sort((a, b) => {
        const weightDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
        if (weightDiff !== 0) return weightDiff
        return new Date(a.joinTime).getTime() - new Date(b.joinTime).getTime()
      }),

  getNormalQueue: () =>
    get().queueItems
      .filter(q => q.status === 'waiting' && q.priority === 'normal')
      .sort((a, b) => new Date(a.joinTime).getTime() - new Date(b.joinTime).getTime()),

  getCalledQueue: () =>
    get().queueItems
      .filter(q => q.status === 'called' || q.status === 'seated' || q.status === 'expired')
      .sort((a, b) => {
        const timeA = a.calledTime ? new Date(a.calledTime).getTime() : 0
        const timeB = b.calledTime ? new Date(b.calledTime).getTime() : 0
        return timeB - timeA
      }),

  getWaitingCount: () =>
    get().queueItems.filter(q => q.status === 'waiting').length,

  updateQueueStatus: (queueId, status) => {
    const newQueueItems = get().queueItems.map(q =>
      q.id === queueId
        ? { ...q, status, calledTime: status === 'called' ? new Date().toISOString() : q.calledTime }
        : q
    )
    const isMyQueue = get().myQueueItem?.id === queueId

    set({
      queueItems: newQueueItems,
      myQueueItem: isMyQueue
        ? {
            ...get().myQueueItem!,
            status,
            calledTime: status === 'called' ? new Date().toISOString() : get().myQueueItem?.calledTime,
          }
        : get().myQueueItem,
    })
    saveToStorage(QUEUE_ITEMS_KEY, newQueueItems)
    if (isMyQueue && get().myQueueItem) {
      saveToStorage(MY_QUEUE_KEY, get().myQueueItem)
    }
  },

  recalcStats: () => {
    const items = get().queueItems
    const totalWaiting = items.filter(q => q.status === 'waiting').length
    const vipWaiting = items.filter(q => q.status === 'waiting' && (q.priority === 'vip' || q.priority === 'emergency')).length
    const normalWaiting = items.filter(q => q.status === 'waiting' && q.priority === 'normal').length
    const avgWaitTime = totalWaiting > 0
      ? Math.round(items.filter(q => q.status === 'waiting').reduce((sum, q) => sum + q.expectedWaitTime, 0) / totalWaiting)
      : 0

    const seatStore = useSeatStore.getState()
    const availableSeats = seatStore.getAvailableSeatsCount()

    set({
      queueStats: {
        ...get().queueStats,
        totalWaiting,
        vipWaiting,
        normalWaiting,
        avgWaitTime,
        availableSeats,
      },
    })
  },

  fetchQueue: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 100))
    const state = get()
    if (!state.queueLoaded) {
      const stored = loadFromStorage<QueueItem[]>(QUEUE_ITEMS_KEY, [])
      if (stored && stored.length > 0) {
        set({ queueItems: stored, queueLoaded: true, loading: false })
        get().recalcStats()
      } else {
        set({ queueItems: mockQueueItems, queueLoaded: true, loading: false })
        saveToStorage(QUEUE_ITEMS_KEY, mockQueueItems)
        get().recalcStats()
      }
    } else {
      set({ loading: false })
      get().recalcStats()
    }
  },

  fetchMyQueue: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 50))
    const state = get()
    if (!state.myQueueLoaded) {
      const hasStored = hasStorageKey(MY_QUEUE_KEY)
      if (hasStored) {
        const stored = loadFromStorage<QueueItem | null>(MY_QUEUE_KEY, null)
        set({ myQueueItem: stored, myQueueLoaded: true, loading: false })
      } else {
        set({ myQueueItem: mockMyQueueItem, myQueueLoaded: true, loading: false })
        saveToStorage(MY_QUEUE_KEY, mockMyQueueItem)
      }
    } else {
      set({ loading: false })
    }
  },

  resetQueueData: () => {
    set({
      queueItems: mockQueueItems,
      myQueueItem: mockMyQueueItem,
      queueLoaded: true,
      myQueueLoaded: true,
    })
    saveToStorage(QUEUE_ITEMS_KEY, mockQueueItems)
    saveToStorage(MY_QUEUE_KEY, mockMyQueueItem)
    get().recalcStats()
  },

  occupySeatForQueue: (queueId, seatId) => {
    console.log('[Queue] 占位座位:', { queueId, seatId })
  },

  confirmSeated: (queueId) => {
    const item = get().queueItems.find(q => q.id === queueId)
    if (!item || (item.status !== 'called')) return null

    const now = new Date().toISOString()
    const newQueueItems = get().queueItems.map(q =>
      q.id === queueId
        ? { ...q, status: 'seated' as QueueStatus, seatedTime: now }
        : q
    )
    const isMyQueue = get().myQueueItem?.id === queueId

    set({
      queueItems: newQueueItems,
      myQueueItem: isMyQueue
        ? { ...get().myQueueItem!, status: 'seated' as QueueStatus, seatedTime: now }
        : get().myQueueItem,
    })
    saveToStorage(QUEUE_ITEMS_KEY, newQueueItems)
    if (isMyQueue && get().myQueueItem) {
      saveToStorage(MY_QUEUE_KEY, get().myQueueItem)
    }

    if (item.occupiedSeatId) {
      const usageStore = useUsageStore.getState()
      const existing = usageStore.getRecordByQueueId(queueId)
      if (!existing) {
        usageStore.createRecordFromQueue({
          queueId: item.id,
          userId: item.userId,
          userName: item.userName,
          seatId: item.occupiedSeatId,
          seatNumber: item.occupiedSeatNumber || '',
          queueNumber: item.queueNumber,
        })
      }
    }

    get().recalcStats()

    return newQueueItems.find(q => q.id === queueId) || null
  },
}))
