import { create } from 'zustand'
import type { QueueItem, QueueStats, PriorityLevel, QueueStatus } from '@/types/queue'
import { queueItems as mockQueueItems, queueStats as mockQueueStats, myQueueItem as mockMyQueueItem } from '@/data/queue'

interface QueueState {
  queueItems: QueueItem[]
  queueStats: QueueStats
  myQueueItem: QueueItem | null
  loading: boolean

  setQueueItems: (items: QueueItem[]) => void
  setQueueStats: (stats: QueueStats) => void
  setMyQueueItem: (item: QueueItem | null) => void
  joinQueue: (seatType: string, priority: PriorityLevel) => Promise<QueueItem>
  leaveQueue: (queueId: string) => void
  callNext: () => QueueItem | null
  getPriorityQueue: () => QueueItem[]
  getNormalQueue: () => QueueItem[]
  getWaitingCount: () => number
  updateQueueStatus: (queueId: string, status: QueueStatus) => void
  fetchQueue: () => Promise<void>
  fetchMyQueue: () => Promise<void>
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
  queueItems: mockQueueItems,
  queueStats: mockQueueStats,
  myQueueItem: mockMyQueueItem,
  loading: false,

  setQueueItems: (items) => set({ queueItems: items }),

  setQueueStats: (stats) => set({ queueStats: stats }),

  setMyQueueItem: (item) => set({ myQueueItem: item }),

  joinQueue: async (seatType, priority) => {
    const newItem: QueueItem = {
      id: `queue-${Date.now()}`,
      userId: 'user-1',
      userName: '我',
      seatType,
      priority,
      status: 'waiting',
      queueNumber: get().queueItems.filter(q => q.status === 'waiting').length + 1,
      joinTime: new Date().toISOString(),
      expectedWaitTime: priority === 'vip' ? 15 : 45,
      isVip: priority === 'vip' || priority === 'emergency',
    }

    set((state) => ({
      queueItems: [...state.queueItems, newItem],
      myQueueItem: newItem,
      queueStats: {
        ...state.queueStats,
        totalWaiting: state.queueStats.totalWaiting + 1,
        vipWaiting: state.queueStats.vipWaiting + (newItem.isVip ? 1 : 0),
        normalWaiting: state.queueStats.normalWaiting + (newItem.isVip ? 0 : 1),
      },
    }))

    return newItem
  },

  leaveQueue: (queueId) => {
    set((state) => {
      const item = state.queueItems.find(q => q.id === queueId)
      return {
        queueItems: state.queueItems.filter(q => q.id !== queueId),
        myQueueItem: state.myQueueItem?.id === queueId ? null : state.myQueueItem,
        queueStats: {
          ...state.queueStats,
          totalWaiting: Math.max(0, state.queueStats.totalWaiting - 1),
          vipWaiting: Math.max(0, state.queueStats.vipWaiting - (item?.isVip ? 1 : 0)),
          normalWaiting: Math.max(0, state.queueStats.normalWaiting - (item?.isVip ? 0 : 1)),
        },
      }
    })
  },

  callNext: () => {
    const waitingItems = get().queueItems
      .filter(q => q.status === 'waiting')
      .sort((a, b) => {
        const weightDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority)
        if (weightDiff !== 0) return weightDiff
        return new Date(a.joinTime).getTime() - new Date(b.joinTime).getTime()
      })

    if (waitingItems.length === 0) return null

    const nextItem = waitingItems[0]
    get().updateQueueStatus(nextItem.id, 'called')
    return nextItem
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

  getWaitingCount: () =>
    get().queueItems.filter(q => q.status === 'waiting').length,

  updateQueueStatus: (queueId, status) =>
    set((state) => ({
      queueItems: state.queueItems.map(q =>
        q.id === queueId
          ? { ...q, status, calledTime: status === 'called' ? new Date().toISOString() : q.calledTime }
          : q
      ),
      myQueueItem: state.myQueueItem?.id === queueId
        ? { ...state.myQueueItem, status, calledTime: status === 'called' ? new Date().toISOString() : state.myQueueItem.calledTime }
        : state.myQueueItem,
    })),

  fetchQueue: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 500))
    set({ queueItems: mockQueueItems, queueStats: mockQueueStats, loading: false })
  },

  fetchMyQueue: async () => {
    set({ loading: true })
    await new Promise((resolve) => setTimeout(resolve, 300))
    set({ myQueueItem: mockMyQueueItem, loading: false })
  },
}))
