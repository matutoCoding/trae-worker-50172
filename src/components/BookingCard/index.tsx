import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import classnames from 'classnames'
import type { Booking } from '@/types/booking'
import StatusTag from '@/components/StatusTag'
import { getStatusText } from '@/utils/priority'
import { formatDate, getDurationMinutes, formatDuration } from '@/utils/date'
import styles from './index.module.scss'

interface BookingCardProps {
  booking: Booking
  onCancel?: (booking: Booking) => void
  onEdit?: (booking: Booking) => void
  onArrived?: (booking: Booking) => void
  onStartUsing?: (booking: Booking) => void
  onLeaveEarly?: (booking: Booking) => void
  onNoShow?: (booking: Booking) => void
  showActions?: boolean
}

const BookingCard: React.FC<BookingCardProps> = ({ booking, onCancel, onEdit, onArrived, onStartUsing, onLeaveEarly, onNoShow, showActions = true }) => {
  const getStatusType = () => {
    switch (booking.status) {
      case 'ongoing': return 'success'
      case 'upcoming': return 'info'
      case 'arrived': return 'warning'
      case 'completed': return 'default'
      case 'cancelled': return 'default'
      case 'noshow': return 'error'
      default: return 'default'
    }
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(booking)
    } else {
      Taro.navigateTo({
        url: `/pages/booking-edit/index?id=${booking.id}`,
      })
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel(booking)
    }
  }

  const handleArrived = () => onArrived?.(booking)
  const handleStartUsing = () => onStartUsing?.(booking)
  const handleLeaveEarly = () => onLeaveEarly?.(booking)
  const handleNoShow = () => onNoShow?.(booking)

  const duration = getDurationMinutes(booking.startTime, booking.endTime)

  return (
    <View className={styles.bookingCard}>
      <View className={styles.bookingHeader}>
        <View className={styles.seatInfo}>
          <Text className={styles.seatNumber}>{booking.seatNumber}</Text>
          {booking.isCycleBooking && <StatusTag text="周期预约" type="vip" size="small" />}
        </View>
        <StatusTag text={getStatusText(booking.status)} type={getStatusType()} size="small" />
      </View>

      <View className={styles.bookingBody}>
        <View className={styles.row}>
          <Text className={styles.label}>日期</Text>
          <Text className={styles.value}>{formatDate(booking.date, 'YYYY年MM月DD日')}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>时间</Text>
          <Text className={styles.value}>{booking.startTime} - {booking.endTime}</Text>
        </View>
        <View className={styles.row}>
          <Text className={styles.label}>时长</Text>
          <Text className={styles.value}>{formatDuration(duration)}</Text>
        </View>
      </View>

      {showActions && (
        <View className={styles.bookingFooter}>
          {booking.status === 'upcoming' && (
            <>
              <Button className={classnames(styles.actionBtn, styles.cancelBtn)} onClick={handleCancel}>
                取消预约
              </Button>
              <Button className={classnames(styles.actionBtn, styles.editBtn)} onClick={handleEdit}>
                修改
              </Button>
              <Button className={classnames(styles.actionBtn, styles.arrivedBtn)} onClick={handleArrived}>
                到店
              </Button>
              {onNoShow && (
                <Button className={classnames(styles.actionBtn, styles.noshowBtn)} onClick={handleNoShow}>
                  爽约
                </Button>
              )}
            </>
          )}
          {booking.status === 'arrived' && (
            <>
              <Button className={classnames(styles.actionBtn, styles.cancelBtn)} onClick={handleCancel}>
                取消
              </Button>
              <Button className={classnames(styles.actionBtn, styles.startBtn)} onClick={handleStartUsing}>
                开始使用
              </Button>
            </>
          )}
          {booking.status === 'ongoing' && (
            <>
              <Button className={classnames(styles.actionBtn, styles.editBtn)} onClick={handleEdit}>
                详情
              </Button>
              <Button className={classnames(styles.actionBtn, styles.leaveBtn)} onClick={handleLeaveEarly}>
                提前离座
              </Button>
            </>
          )}
        </View>
      )}
    </View>
  )
}

export default BookingCard
