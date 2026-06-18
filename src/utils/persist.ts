const STORAGE_PREFIX = 'seat_booking_'
const NULL_MARKER = '__NULL__'

export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    const toSave = data === null ? NULL_MARKER : JSON.stringify(data)
    if (typeof Taro !== 'undefined' && Taro.setStorageSync) {
      Taro.setStorageSync(STORAGE_PREFIX + key, toSave)
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + key, toSave)
    }
  } catch (e) {
    console.warn('[persist] saveToStorage failed:', e)
  }
}

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    let raw: string | null = null
    if (typeof Taro !== 'undefined' && Taro.getStorageSync) {
      raw = Taro.getStorageSync(STORAGE_PREFIX + key)
    } else if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(STORAGE_PREFIX + key)
    }
    if (raw !== null && raw !== undefined && raw !== '') {
      if (raw === NULL_MARKER) return null as unknown as T
      return JSON.parse(raw) as T
    }
  } catch (e) {
    console.warn('[persist] loadFromStorage failed:', e)
  }
  return defaultValue
}

export const hasStorageKey = (key: string): boolean => {
  try {
    if (typeof Taro !== 'undefined' && Taro.getStorageInfoSync) {
      const info = Taro.getStorageInfoSync()
      return (info.keys as string[]).includes(STORAGE_PREFIX + key)
    } else if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(STORAGE_PREFIX + key) !== null
    }
  } catch (e) {
    console.warn('[persist] hasStorageKey failed:', e)
  }
  return false
}

export const clearStorage = (key?: string): void => {
  try {
    if (key) {
      if (typeof Taro !== 'undefined' && Taro.removeStorageSync) {
        Taro.removeStorageSync(STORAGE_PREFIX + key)
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_PREFIX + key)
      }
    } else {
      if (typeof Taro !== 'undefined' && Taro.clearStorageSync) {
        Taro.clearStorageSync()
      } else if (typeof localStorage !== 'undefined') {
        const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX))
        keys.forEach(k => localStorage.removeItem(k))
      }
    }
  } catch (e) {
    console.warn('[persist] clearStorage failed:', e)
  }
}
