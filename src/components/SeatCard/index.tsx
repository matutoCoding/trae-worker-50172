import React from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import type { Seat } from '@/types/seat'
import StatusTag from '@/components/StatusTag'
import { getStatusText, getSeatTypeText } from '@/utils/priority'
import styles from './index.module.scss'

interface SeatCardProps {
  seat: Seat
  onClick?: (seat: Seat) => void
}

const SeatCard: React.FC<SeatCardProps> = ({ seat, onClick }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(seat)
    } else {
      Taro.navigateTo({
        url: `/pages/seat-detail/index?id=${seat.id}`,
      })
    }
  }

  const getStatusType = () => {
    switch (seat.status) {
      case 'available': return 'success'
      case 'occupied': return 'warning'
      case 'reserved': return 'info'
      case 'maintenance': return 'default'
      default: return 'default'
    }
  }

  return (
    <View
      className={classnames(styles.seatCard, styles[seat.status], seat.type === 'vip' && styles.vipSeat)}
      onClick={handleClick}
    >
      <View className={styles.seatHeader}>
        <Text className={styles.seatNumber}>{seat.seatNumber}</Text>
        <StatusTag text={getStatusText(seat.status)} type={getStatusType()} size="small" />
      </View>

      <View className={styles.seatBody}>
        <View className={styles.seatType}>
          <Text className={styles.typeText}>{getSeatTypeText(seat.type)}</Text>
        </View>
        <View className={styles.seatFeatures}>
          {seat.hasPower && <Text className={styles.feature}>⚡ 充电</Text>}
          {seat.hasWindow && <Text className={styles.feature}>🪟 靠窗</Text>}
        </View>
      </View>

      <View className={styles.seatFooter}>
        <Text className={styles.areaText}>{seat.area} · {seat.floor}楼</Text>
      </View>
    </View>
  )
}

export default SeatCard
