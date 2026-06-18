import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { useSeatStore } from '@/store/useSeatStore'
import { useBookingStore } from '@/store/useBookingStore'
import { getSeatTypeText, getFrequencyText } from '@/utils/priority'
import { formatDate, getTodayDate, addDays } from '@/utils/date'
import type { Seat } from '@/types/seat'
import type { CycleFrequency, CycleRule } from '@/types/booking'
import styles from './index.module.scss'

const weekdayOptions = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 0, label: '日' },
]

const frequencyOptions: { value: CycleFrequency; label: string }[] = [
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
]

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00',
]

const CycleRulePage: React.FC = () => {
  const router = useRouter()
  const { seats, getSeatById } = useSeatStore()
  const { addCycleRule, updateCycleRule, cycleRules, generateCycleBookings, regenerateCycleBookings, addBooking, bookings, getCycleRuleById } = useBookingStore()

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [frequency, setFrequency] = useState<CycleFrequency>('weekly')
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 2, 3, 4, 5])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('12:00')
  const [startDate, setStartDate] = useState(getTodayDate())
  const [endDate, setEndDate] = useState(addDays(getTodayDate(), 30))
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState('')

  useEffect(() => {
    const { id } = router.params
    console.log('[CycleRulePage] 参数:', { id })

    if (id) {
      setIsEditing(true)
      setEditingId(id)
      const rule = getCycleRuleById(id)
      if (rule) {
        const seat = getSeatById(rule.seatId)
        if (seat) setSelectedSeat(seat)
        setFrequency(rule.frequency)
        setSelectedWeekdays(rule.weekdays)
        setStartTime(rule.startTime)
        setEndTime(rule.endTime)
        setStartDate(rule.startDate)
        setEndDate(rule.endDate)
      }
    }
  }, [router.params, getCycleRuleById, getSeatById])

  const estimatedCount = useMemo(() => {
    if (!selectedSeat) return 0

    const tempRule: CycleRule = {
      id: 'temp',
      userId: 'user-1',
      seatId: selectedSeat.id,
      seatNumber: selectedSeat.seatNumber,
      frequency,
      weekdays: frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : selectedWeekdays,
      startTime,
      endTime,
      startDate,
      endDate,
      isActive: true,
      createTime: new Date().toISOString(),
    }

    const tempStore = {
      cycleRules: [tempRule],
      bookings: [],
    }

    let count = 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const weekdays = frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : selectedWeekdays

    const current = new Date(start)
    while (current <= end) {
      if (weekdays.includes(current.getDay())) {
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    return count
  }, [selectedSeat, frequency, selectedWeekdays, startTime, endTime, startDate, endDate])

  const handleSeatSelect = () => {
    Taro.showActionSheet({
      itemList: seats
        .filter(s => s.status !== 'maintenance')
        .map(s => `${s.seatNumber} - ${getSeatTypeText(s.type)}`),
      success: (res) => {
        const availableSeats = seats.filter(s => s.status !== 'maintenance')
        const seat = availableSeats[res.tapIndex]
        if (seat) setSelectedSeat(seat)
      },
    })
  }

  const handleWeekdayToggle = (day: number) => {
    if (frequency === 'daily') return

    setSelectedWeekdays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day)
      }
      return [...prev, day].sort((a, b) => {
        if (a === 0) return 1
        if (b === 0) return -1
        return a - b
      })
    })
  }

  const handleStartTimeSelect = (time: string) => {
    setStartTime(time)
    if (time >= endTime) {
      const hour = parseInt(time.split(':')[0]) + 1
      if (hour < 22) {
        setEndTime(`${String(hour).padStart(2, '0')}:00`)
      }
    }
  }

  const handleEndTimeSelect = (time: string) => {
    setEndTime(time)
  }

  const handleStartDateChange = () => {
    Taro.showActionSheet({
      itemList: [
        '今天',
        '明天',
        '7天后',
        '30天后',
      ],
      success: (res) => {
        const options = [0, 1, 7, 30]
        const newDate = addDays(getTodayDate(), options[res.tapIndex])
        setStartDate(newDate)
        if (new Date(newDate) > new Date(endDate)) {
          setEndDate(addDays(newDate, 30))
        }
      },
    })
  }

  const handleEndDateChange = () => {
    Taro.showActionSheet({
      itemList: [
        '7天后',
        '30天后',
        '90天后',
        '180天后',
      ],
      success: (res) => {
        const options = [7, 30, 90, 180]
        const newDate = addDays(startDate, options[res.tapIndex])
        setEndDate(newDate)
      },
    })
  }

  const canSubmit = selectedSeat && selectedWeekdays.length > 0 && startTime < endTime

  const handleSubmit = () => {
    if (!selectedSeat) {
      Taro.showToast({ title: '请选择座位', icon: 'none' })
      return
    }
    if (selectedWeekdays.length === 0 && frequency === 'weekly') {
      Taro.showToast({ title: '请选择星期', icon: 'none' })
      return
    }
    if (startTime >= endTime) {
      Taro.showToast({ title: '结束时间需晚于开始时间', icon: 'none' })
      return
    }

    const weekdays = frequency === 'daily' ? [0, 1, 2, 3, 4, 5, 6] : selectedWeekdays

    if (isEditing) {
      const originalRule = getCycleRuleById(editingId)
      const seatChanged = originalRule && selectedSeat && originalRule.seatId !== selectedSeat.id
      const scheduleChanged = originalRule && (
        originalRule.frequency !== frequency ||
        JSON.stringify(originalRule.weekdays.sort()) !== JSON.stringify([...weekdays].sort()) ||
        originalRule.startTime !== startTime ||
        originalRule.endTime !== endTime ||
        originalRule.startDate !== startDate ||
        originalRule.endDate !== endDate
      )

      updateCycleRule(editingId, {
        seatId: selectedSeat.id,
        seatNumber: selectedSeat.seatNumber,
        frequency,
        weekdays,
        startTime,
        endTime,
        startDate,
        endDate,
      })

      if (seatChanged || scheduleChanged) {
        Taro.showModal({
          title: '修改成功',
          content: `规则已更新，是否重新生成 ${estimatedCount} 条预约？\n（将覆盖该规则下所有原预约）`,
          confirmText: '重新生成',
          cancelText: '暂不生成',
          success: (res) => {
            if (res.confirm) {
              const generated = regenerateCycleBookings(editingId)
              Taro.showToast({
                title: `已重新生成 ${generated.length} 条预约`,
                icon: 'success',
              })
            } else {
              Taro.showToast({ title: '已保存修改', icon: 'success' })
            }
            setTimeout(() => {
              Taro.navigateBack()
            }, 1500)
          },
        })
      } else {
        Taro.showToast({
          title: '已保存修改',
          icon: 'success',
          success: () => {
            setTimeout(() => {
              Taro.navigateBack()
            }, 1500)
          }
        })
      }
    } else {
      const newRule: CycleRule = {
        id: `cycle-${Date.now()}`,
        userId: 'user-1',
        seatId: selectedSeat.id,
        seatNumber: selectedSeat.seatNumber,
        frequency,
        weekdays,
        startTime,
        endTime,
        startDate,
        endDate,
        isActive: true,
        createTime: new Date().toISOString(),
      }

      addCycleRule(newRule)

      Taro.showModal({
        title: '创建成功',
        content: `是否立即生成 ${estimatedCount} 条预约？`,
        confirmText: '立即生成',
        cancelText: '稍后生成',
        success: (res) => {
          if (res.confirm) {
            const generated = generateCycleBookings(newRule.id)
            generated.forEach(booking => {
              const exists = bookings.some(
                b => b.date === booking.date && b.seatId === booking.seatId
              )
              if (!exists) {
                addBooking(booking)
              }
            })
            Taro.showToast({
              title: `已生成 ${generated.length} 条预约`,
              icon: 'success',
            })
          }
          setTimeout(() => {
            Taro.navigateBack()
          }, 1500)
        },
      })
    }
  }

  return (
    <View className={styles.page}>
      <ScrollView scrollY className={styles.scrollArea}>
        <View className={styles.formCard}>
          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>选择座位</Text>
            <View className={styles.seatPicker} onClick={handleSeatSelect}>
              <View className={styles.seatInfo}>
                <Text className={styles.seatNumber}>
                  {selectedSeat?.seatNumber || '请选择座位'}
                </Text>
                <Text className={styles.seatDesc}>
                  {selectedSeat ? `${getSeatTypeText(selectedSeat.type)} · ${selectedSeat.area}` : '点击选择座位'}
                </Text>
              </View>
              <Text className={styles.pickerArrow}>›</Text>
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>周期频率</Text>
            <View className={styles.frequencyRow}>
              {frequencyOptions.map(opt => (
                <Button
                  key={opt.value}
                  className={classnames(
                    styles.frequencyItem,
                    frequency === opt.value && styles.active
                  )}
                  onClick={() => setFrequency(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>
              选择星期
              {frequency === 'daily' && <Text className={styles.formHint}>（每天模式自动全选）</Text>}
            </Text>
            <View className={styles.weekdayRow}>
              {weekdayOptions.map(opt => {
                const isSelected = frequency === 'daily' || selectedWeekdays.includes(opt.value)
                return (
                  <Button
                    key={opt.value}
                    className={classnames(
                      styles.weekdayItem,
                      isSelected && styles.active,
                      frequency === 'daily' && styles.disabled
                    )}
                    onClick={() => handleWeekdayToggle(opt.value)}
                    disabled={frequency === 'daily'}
                  >
                    {opt.label}
                  </Button>
                )
              })}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>开始时间</Text>
            <View className={styles.timeGrid}>
              {timeSlots.map(time => {
                const isDisabled = time < '08:00' || time > '21:00' || time >= endTime
                const isSelected = startTime === time
                return (
                  <Button
                    key={time}
                    className={classnames(
                      styles.timeItem,
                      isSelected && styles.selected,
                      isDisabled && styles.disabled
                    )}
                    onClick={() => !isDisabled && handleStartTimeSelect(time)}
                    disabled={isDisabled}
                  >
                    {time}
                  </Button>
                )
              })}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>结束时间</Text>
            <View className={styles.timeGrid}>
              {timeSlots.map(time => {
                const isDisabled = time < '09:00' || time > '22:00' || time <= startTime
                const isSelected = endTime === time
                return (
                  <Button
                    key={time}
                    className={classnames(
                      styles.timeItem,
                      isSelected && styles.selected,
                      isDisabled && styles.disabled
                    )}
                    onClick={() => !isDisabled && handleEndTimeSelect(time)}
                    disabled={isDisabled}
                  >
                    {time}
                  </Button>
                )
              })}
            </View>
          </View>

          <View className={styles.formGroup}>
            <Text className={styles.formLabel}>有效期</Text>
            <View className={styles.dateRow}>
              <View className={styles.datePicker} onClick={handleStartDateChange}>
                <Text className={styles.datePickerLabel}>开始日期</Text>
                <Text className={styles.datePickerValue}>{formatDate(startDate, 'YYYY年MM月DD日')}</Text>
              </View>
              <Text className={styles.dateSeparator}>至</Text>
              <View className={styles.datePicker} onClick={handleEndDateChange}>
                <Text className={styles.datePickerLabel}>结束日期</Text>
                <Text className={styles.datePickerValue}>{formatDate(endDate, 'YYYY年MM月DD日')}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className={styles.summaryCard}>
          <Text className={styles.summaryTitle}>规则预览</Text>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>座位</Text>
            <Text className={styles.summaryValue}>{selectedSeat?.seatNumber || '--'}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>周期</Text>
            <Text className={styles.summaryValue}>{getFrequencyText(frequency)}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>时间</Text>
            <Text className={styles.summaryValue}>{startTime} - {endTime}</Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>星期</Text>
            <Text className={styles.summaryValue}>
              {frequency === 'daily'
                ? '每天'
                : selectedWeekdays.length > 0
                  ? selectedWeekdays.map(d => ['日', '一', '二', '三', '四', '五', '六'][d]).join('、')
                  : '--'
              }
            </Text>
          </View>
          <View className={styles.summaryRow}>
            <Text className={styles.summaryLabel}>有效期</Text>
            <Text className={styles.summaryValue}>
              {formatDate(startDate, 'MM月DD日')} 至 {formatDate(endDate, 'MM月DD日')}
            </Text>
          </View>
          <View className={classnames(styles.summaryRow, styles.estimateRow)}>
            <Text className={styles.summaryLabel}>预计生成</Text>
            <Text className={classnames(styles.summaryValue, styles.estimateValue)}>
              {estimatedCount} 条预约
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <Button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isEditing ? '保存修改' : '创建周期规则'}
        </Button>
      </View>
    </View>
  )
}

export default CycleRulePage
