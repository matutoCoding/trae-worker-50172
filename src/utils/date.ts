import dayjs from 'dayjs'

export const formatDate = (date: string | Date, format = 'YYYY-MM-DD'): string => {
  return dayjs(date).format(format)
}

export const formatDateTime = (date: string | Date, format = 'YYYY-MM-DD HH:mm'): string => {
  return dayjs(date).format(format)
}

export const formatTime = (date: string | Date, format = 'HH:mm'): string => {
  return dayjs(date).format(format)
}

export const getWeekdayText = (weekday: number): string => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[weekday] || ''
}

export const getWeekdaysText = (weekdays: number[]): string => {
  if (weekdays.length === 7) return '每天'
  if (weekdays.length === 5 && weekdays.every(d => d >= 1 && d <= 5)) return '工作日'
  return weekdays.map(d => getWeekdayText(d)).join('、')
}

export const getTodayDate = (): string => {
  return dayjs().format('YYYY-MM-DD')
}

export const getDateRange = (startDate: string, endDate: string): string[] => {
  const dates: string[] = []
  let current = dayjs(startDate)
  const end = dayjs(endDate)

  while (current.isBefore(end) || current.isSame(end, 'day')) {
    dates.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }

  return dates
}

export const addDays = (date: string, days: number): string => {
  return dayjs(date).add(days, 'day').format('YYYY-MM-DD')
}

export const isToday = (date: string): boolean => {
  return dayjs(date).isSame(dayjs(), 'day')
}

export const isPast = (date: string): boolean => {
  return dayjs(date).isBefore(dayjs(), 'day')
}

export const isFuture = (date: string): boolean => {
  return dayjs(date).isAfter(dayjs(), 'day')
}

export const getDurationMinutes = (startTime: string, endTime: string): number => {
  const start = dayjs(`2000-01-01 ${startTime}`)
  const end = dayjs(`2000-01-01 ${endTime}`)
  return end.diff(start, 'minute')
}

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}分钟`
  if (mins === 0) return `${hours}小时`
  return `${hours}小时${mins}分钟`
}
