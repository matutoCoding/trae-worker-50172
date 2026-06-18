import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import classnames from 'classnames'
import { useSeatStore } from '@/store/useSeatStore'
import { useUserStore } from '@/store/useUserStore'
import StatusTag from '@/components/StatusTag'
import { getStatusText, getSeatTypeText } from '@/utils/priority'
import styles from './index.module.scss'

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00',
]

const SeatDetailPage: React.FC = () => {
  const router = useRouter()
  const { getSeatById } = useSeatStore()
  const { isVip } = useUserStore()

  const [selectedTime, setSelectedTime] = useState<string>('')
  const [seat, setSeat] = useState<ReturnType<typeof getSeatById>>(undefined)

  useEffect(() => {
    const seatId = router.params.id
    console.log('[SeatDetailPage] 座位ID:', seatId)
    if (seatId) {
      const seatData = getSeatById(seatId)
      setSeat(seatData)
    }
  }, [router.params.id, getSeatById])

  const isVipUser = isVip()

  const handleTimeSelect = (time: string) => {
    if (seat?.status === 'maintenance') return
    setSelectedTime(time)
  }

  const handleBooking = () => {
    if (!selectedTime) {
      Taro.showToast({ title: '请选择时间', icon: 'none' })
      return
    }
    console.log('[SeatDetailPage] 预约座位:', seat?.id, '时间:', selectedTime)
    Taro.navigateTo({
      url: `/pages/booking-edit/index?seatId=${seat?.id}&time=${selectedTime}`,
    })
  }

  const handleQueue = () => {
    console.log('[SeatDetailPage] 加入排队:', seat?.id)
    Taro.switchTab({
      url: '/pages/queue/index',
    })
  }

  const getStatusClass = () => {
    switch (seat?.status) {
      case 'available': return 'statusValueSuccess'
      case 'occupied': return 'statusValueWarning'
      default: return ''
    }
  }

  if (!seat) {
    return (
      <View className={styles.page}>
        <View className={styles.seatHeader}>
          <Text className={styles.seatNumber}>--</Text>
        </View>
      </View>
    )
  }

  return (
    <View className={styles.page}>
      <View className={styles.seatHeader}>
        <Text className={styles.seatNumber}>{seat.seatNumber}</Text>
        <View className={styles.seatType}>
          <Text>{getSeatTypeText(seat.type)} · {seat.area}</Text>
        </View>
      </View>

      <View className={styles.statusCard}>
        <View className={styles.statusRow}>
          <Text className={styles.statusLabel}>当前状态</Text>
          <Text className={classnames(styles.statusValue, styles[getStatusClass()])}>
            {getStatusText(seat.status)}
          </Text>
        </View>
        <View className={styles.statusRow}>
          <Text className={styles.statusLabel}>楼层位置</Text>
          <Text className={styles.statusValue}>{seat.floor}楼 {seat.area}</Text>
        </View>
        <View className={styles.statusRow}>
          <Text className={styles.statusLabel}>座位描述</Text>
          <Text className={styles.statusValue}>{seat.description}</Text>
        </View>
      </View>

      <View className={styles.infoSection}>
        <Text className={styles.sectionTitle}>座位设施</Text>
        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>⚡</Text>
          <Text className={styles.infoText}>电源插座</Text>
          {seat.hasPower ? (
            <Text className={styles.infoCheck}>✓ 有</Text>
          ) : (
            <Text className={styles.infoNo}>无</Text>
          )}
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>🪟</Text>
          <Text className={styles.infoText}>靠窗位置</Text>
          {seat.hasWindow ? (
            <Text className={styles.infoCheck}>✓ 是</Text>
          ) : (
            <Text className={styles.infoNo}>否</Text>
          )}
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>🌙</Text>
          <Text className={styles.infoText}>静音区域</Text>
          {seat.type === 'quiet' ? (
            <Text className={styles.infoCheck}>✓ 是</Text>
          ) : (
            <Text className={styles.infoNo}>否</Text>
          )}
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoIcon}>👑</Text>
          <Text className={styles.infoText}>VIP专属</Text>
          {seat.type === 'vip' ? (
            <Text className={styles.infoCheck}>✓ 是</Text>
          ) : (
            <Text className={styles.infoNo}>否</Text>
          )}
        </View>
      </View>

      <View className={styles.timeSection}>
        <Text className={styles.sectionTitle}>选择时段</Text>
        <View className={styles.timeSlots}>
          {timeSlots.map(time => {
            const isAvailable = seat.status === 'available'
            return (
              <Button
                key={time}
                className={classnames(
                  styles.timeSlot,
                  isAvailable ? styles.available : styles.occupied,
                  selectedTime === time && styles.selected
                )}
                onClick={() => handleTimeSelect(time)}
                disabled={!isAvailable}
              >
                {time}
              </Button>
            )
          })}
        </View>
      </View>

      <View className={styles.bottomBar}>
        <Button className={styles.secondaryBtn} onClick={handleQueue}>
          排队等座
        </Button>
        <Button
          className={classnames(
            styles.primaryBtn,
            seat.type === 'vip' && styles.vipBtn
          )}
          onClick={handleBooking}
          disabled={seat.status === 'maintenance'}
        >
          {seat.status === 'maintenance' ? '维护中' : '立即预约'}
        </Button>
      </View>
    </View>
  )
}

export default SeatDetailPage
