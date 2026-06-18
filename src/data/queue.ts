import type { QueueItem, QueueStats } from '@/types/queue'

export const queueItems: QueueItem[] = [
  { id: 'queue-1', userId: 'user-10', userName: '张同学', priority: 'vip', status: 'waiting', queueNumber: 1, joinTime: '2024-01-15 08:30:00', expectedWaitTime: 15, isVip: true, seatType: 'single' },
  { id: 'queue-2', userId: 'user-11', userName: '李同学', priority: 'normal', status: 'waiting', queueNumber: 2, joinTime: '2024-01-15 08:35:00', expectedWaitTime: 30, isVip: false, seatType: 'single' },
  { id: 'queue-3', userId: 'user-12', userName: '王同学', priority: 'normal', status: 'waiting', queueNumber: 3, joinTime: '2024-01-15 08:40:00', expectedWaitTime: 45, isVip: false, seatType: 'quiet' },
  { id: 'queue-4', userId: 'user-13', userName: '赵同学', priority: 'vip', status: 'waiting', queueNumber: 4, joinTime: '2024-01-15 08:45:00', expectedWaitTime: 20, isVip: true, seatType: 'vip' },
  { id: 'queue-5', userId: 'user-14', userName: '孙同学', priority: 'normal', status: 'waiting', queueNumber: 5, joinTime: '2024-01-15 08:50:00', expectedWaitTime: 60, isVip: false, seatType: 'double' },
  { id: 'queue-6', userId: 'user-15', userName: '周同学', priority: 'emergency', status: 'waiting', queueNumber: 6, joinTime: '2024-01-15 09:00:00', expectedWaitTime: 5, isVip: true, seatType: 'single' },
  { id: 'queue-7', userId: 'user-16', userName: '吴同学', priority: 'normal', status: 'waiting', queueNumber: 7, joinTime: '2024-01-15 09:05:00', expectedWaitTime: 75, isVip: false, seatType: 'single' },
  { id: 'queue-8', userId: 'user-17', userName: '郑同学', priority: 'normal', status: 'called', queueNumber: 8, joinTime: '2024-01-15 08:20:00', calledTime: '2024-01-15 09:00:00', expectedWaitTime: 0, isVip: false, seatType: 'single' },
  { id: 'queue-9', userId: 'user-18', userName: '冯同学', priority: 'vip', status: 'called', queueNumber: 9, joinTime: '2024-01-15 08:15:00', calledTime: '2024-01-15 08:55:00', expectedWaitTime: 0, isVip: true, seatType: 'quiet' },
]

export const queueStats: QueueStats = {
  totalWaiting: 7,
  vipWaiting: 3,
  normalWaiting: 4,
  avgWaitTime: 35,
  availableSeats: 12,
}

export const myQueueItem: QueueItem = {
  id: 'queue-mine',
  userId: 'user-1',
  userName: '我',
  priority: 'vip',
  status: 'waiting',
  queueNumber: 3,
  joinTime: '2024-01-15 09:10:00',
  expectedWaitTime: 25,
  isVip: true,
  seatType: 'single'
}
