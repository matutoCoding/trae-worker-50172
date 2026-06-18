import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { useSeatStore } from '@/store/useSeatStore'
import { useBookingStore } from '@/store/useBookingStore'
import { getSeatTypeText } from '@/utils/priority'
import { addDays, formatDate, getWeekdayText, getTodayDate } from '@/utils/date'
import type { Seat } from '@/types/seat'
import styles from './index.module.scss'

const durations = [1, 2, 3, 4, 6, 8]
const timeSlots = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00',
]

const BookingEditPage: React.FC = () => {
  const router = useRouter()
  const { seats, getSeatById } = useSeatStore()
  const { addBooking, updateBooking, getBookingById } = useBookingStore()

  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [selectedStartTime, setSelectedStartTime] = useState('')
  const [duration, setDuration] = useState(2)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    const { seatId, time, id } = router.params
    console.log('[BookingEditPage] 参数:', { seatId, time, id })

    if (id) {
      setIsEditing(true)
      const originalBooking = getBookingById(id)
      if (originalBooking) {
        const seat = getSeatById(originalBooking.seatId)
        if (seat) setSelectedSeat(seat)
        setSelectedDate(originalBooking.date)
        setSelectedStartTime(originalBooking.startTime)
        const startHour = parseInt(originalBooking.startTime.split(':')[0])
        const endHour = parseInt(originalBooking.endTime.split(':')[0])
        const durationHours = endHour - startHour
        if (durationHours > 0) {
          setDuration(durationHours)
        }
      }
    } else {
      if (seatId) {
        const seat = getSeatById(seatId)
        if (seat) setSelectedSeat(seat)
      } else if (seats.length > 0) {
        const availableSeat = seats.find(s => s.status === 'available')
        if (availableSeat) setSelectedSeat(availableSeat)
      }

      if (time) {
        setSelectedStartTime(time)
      }
    }
  }, [router.params, seats, getSeatById, getBookingById])

  const dateList = useMemo(() => {
    const list = []
    for (let i = 0; i < 7; i++) {
      const date = addDays(getTodayDate(), i)
      list.push({
        date,
        day: getWeekdayText(new Date(date).getDay()),
        dateNum: new Date(date).getDate(),
      })
    }
    return list
  }, [])

  const endTime = useMemo(() => {
    if (!selectedStartTime) return ''
    const [hour, minute] = selectedStartTime.split(':').map(Number)
    const endHour = hour + duration
    if (endHour >= 24) return '22:00'
    return `${String(endHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
  }, [selectedStartTime, duration])

  const price = useMemo(() => {
    const basePrice = selectedSeat?.type === 'vip' ? 15 : 10
    return (basePrice * duration).toFixed(2)
  }, [selectedSeat, duration])

  const handleSeatSelect = () => {
    Taro.showActionSheet({
      itemList: seats
        .filter(s => s.status === 'available' || s.status === 'reserved')
        .map(s => `${s.seatNumber} - ${getSeatTypeText(s.type)}`),
      success: (res) => {
        const availableSeats = seats.filter(s => s.status === 'available' || s.status === 'reserved')
        const seat = availableSeats[res.tapIndex]
        if (seat) setSelectedSeat(seat)
      },
    })
  }

  const handleTimeSelect = (time: string) => {
    setSelectedStartTime(time)
  }

  const handleDurationSelect = (d: number) => {
    setDuration(d)
  }

  const handleSubmit = () => {
    if (!selectedSeat) {
      Taro.showToast({ title: '请选择座位', icon: 'none' })
      return
    }
    if (!selectedStartTime) {
      Taro.showToast({ title: '请选择开始时间', icon: 'none' })
      return
    }

    console.log('[BookingEditPage] 提交预约:', {
      seat: selectedSeat?.seatNumber,
      date: selectedDate,
      startTime: selectedStartTime,
      endTime,
      duration,
      price,
    })

    if (isEditing) {
      const { id } = router.params
      if (id) {
        updateBooking(id, {
          seatId: selectedSeat.id,
          seatNumber: selectedSeat.seatNumber,
          date: selectedDate,
          startTime: selectedStartTime,
          endTime,
        })

        Taro.showToast({
          title: '修改成功',
          icon: 'success',
          success: () => {
            setTimeout(() => {
              Taro.navigateBack()
            }, 1500)
          },
        })
      }
    } else {
      const newBooking = {
        id: `booking-${Date.now()}`,
        userId: 'user-1',
        seatId: selectedSeat.id,
        seatNumber: selectedSeat.seatNumber,
        date: selectedDate,
        startTime: selectedStartTime,
        endTime,
        status: 'upcoming' as const,
        isCycleBooking: false,
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
      }

      addBooking(newBooking)

      Taro.showToast({
        title: '预约成功',
        icon: 'success',
        success: () => {
          setTimeout(() => {
            Taro.navigateBack()
          }, 1500)
        },
      })
    }
  }

  const canSubmit = selectedSeat && selectedStartTime

  return (
    <View className={styles.page}>
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
          <Text className={styles.formLabel}>选择日期</Text>
          <ScrollView className={styles.dateScroll} scrollX enhanced showScrollbar={false}>
            {dateList.map(item => (
              <View
                key={item.date}
                className={classnames(styles.dateItem, selectedDate === item.date && styles.active)}
                onClick={() => setSelectedDate(item.date)}
              >
                <Text className={styles.dayText}>{item.day}</Text>
                <Text className={styles.dateText}>{item.dateNum}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>开始时间</Text>
          <View className={styles.timeGrid}>
            {timeSlots.map(time => {
              const isDisabled = time < '08:00' || time > '21:00'
              const isSelected = selectedStartTime === time
              return (
                <Button
                  key={time}
                  className={classnames(
                    styles.timeItem,
                    styles.available,
                    isSelected && styles.selected,
                    isDisabled && styles.disabled
                  )}
                  onClick={() => !isDisabled && handleTimeSelect(time)}
                  disabled={isDisabled}
                >
                  {time}
                </Button>
              )
            })}
          </View>
        </View>

        <View className={styles.formGroup}>
          <Text className={styles.formLabel}>学习时长</Text>
          <View className={styles.durationSection}>
            {durations.map(d => (
              <Button
                key={d}
                className={classnames(styles.durationItem, duration === d && styles.active)}
                onClick={() => handleDurationSelect(d)}
              >
                {d}小时
              </Button>
            ))}
          </View>
        </View>
      </View>

      <View className={styles.summaryCard}>
        <Text className={styles.summaryTitle}>预约详情</Text>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>座位</Text>
          <Text className={styles.summaryValue}>
            {selectedSeat?.seatNumber || '--'}
          </Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>日期</Text>
          <Text className={styles.summaryValue}>
            {formatDate(selectedDate, 'YYYY年MM月DD日')}
          </Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>时间</Text>
          <Text className={styles.summaryValue}>
            {selectedStartTime || '--'} - {endTime || '--'}
          </Text>
        </View>
        <View className={styles.summaryRow}>
          <Text className={styles.summaryLabel}>时长</Text>
          <Text className={styles.summaryValue}>{duration}小时</Text>
        </View>
        <View className={classnames(styles.summaryRow, styles.priceRow)}>
          <Text className={styles.summaryLabel}>预估费用</Text>
          <Text className={classnames(styles.summaryValue, styles.priceValue)}>¥ {price}</Text>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View className={styles.priceInfo}>
          <Text className={styles.priceLabel}>应付金额</Text>
          <Text className={styles.priceNumber}>¥ {price}</Text>
        </View>
        <Button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isEditing ? '确认修改' : '确认预约'}
        </Button>
      </View>
    </View>
  )
}

export default BookingEditPage
