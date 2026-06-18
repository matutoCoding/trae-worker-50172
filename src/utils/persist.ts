const STORAGE_PREFIX = 'seat_booking_'

export const saveToStorage = <T>(key: string, data: T): void => {
  try {
    if (typeof Taro !== 'undefined' && Taro.setStorageSync) {
      Taro.setStorageSync(STORAGE_PREFIX + key, JSON.stringify(data))
    } else if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data))
    }
  } catch (e) {
    console.warn('[persist] saveToStorage failed:', e)
  }
}

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    let data: string | null = null
    if (typeof Taro !== 'undefined' && Taro.getStorageSync) {
      data = Taro.getStorageSync(STORAGE_PREFIX + key)
    } else if (typeof localStorage !== 'undefined') {
      data = localStorage.getItem(STORAGE_PREFIX + key)
    }
    if (data) {
      return JSON.parse(data) as T
    }
  } catch (e) {
    console.warn('[persist] loadFromStorage failed:', e)
  }
  return defaultValue
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
