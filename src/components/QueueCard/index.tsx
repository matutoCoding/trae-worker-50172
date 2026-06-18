import React from 'react'
import { View, Text, Button } from '@tarojs/components'
import classnames from 'classnames'
import type { QueueItem } from '@/types/queue'
import StatusTag from '@/components/StatusTag'
import { getPriorityText, getStatusText, getSeatTypeText } from '@/utils/priority'
import { formatTime } from '@/utils/date'
import styles from './index.module.scss'

interface QueueCardProps {
  queueItem: QueueItem
  rank?: number
  onLeave?: (item: QueueItem) => void
  showActions?: boolean
}

const QueueCard: React.FC<QueueCardProps> = ({ queueItem, rank, onLeave, showActions = true }) => {
  const getPriorityType = () => {
    switch (queueItem.priority) {
      case 'emergency': return 'error'
      case 'vip': return 'vip'
      case 'normal': return 'info'
      default: return 'default'
    }
  }

  const getStatusType = () => {
    switch (queueItem.status) {
      case 'waiting': return 'warning'
      case 'called': return 'success'
      case 'expired': return 'default'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const handleLeave = () => {
    if (onLeave) {
      onLeave(queueItem)
    }
  }

  return (
    <View className={classnames(styles.queueCard, queueItem.isVip && styles.vipCard)}>
      <View className={styles.queueHeader}>
        <View className={styles.userInfo}>
          {rank !== undefined && (
            <View className={classnames(styles.rank, rank <= 3 && styles.topRank)}>
              <Text className={styles.rankText}>{rank}</Text>
            </View>
          )}
          <View className={styles.userDetail}>
            <Text className={styles.userName}>{queueItem.userName}</Text>
            <View className={styles.tags}>
              <StatusTag text={getPriorityText(queueItem.priority)} type={getPriorityType()} size="small" />
              {queueItem.seatType && (
                <StatusTag text={getSeatTypeText(queueItem.seatType)} type="default" size="small" />
              )}
            </View>
          </View>
        </View>
        <StatusTag text={getStatusText(queueItem.status)} type={getStatusType()} size="small" />
      </View>

      <View className={styles.queueBody}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>取号时间</Text>
          <Text className={styles.infoValue}>{formatTime(queueItem.joinTime)}</Text>
        </View>
        {queueItem.status === 'waiting' && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>预计等待</Text>
            <Text className={classnames(styles.infoValue, styles.highlight)}>
              {queueItem.expectedWaitTime} 分钟
            </Text>
          </View>
        )}
        {queueItem.status === 'called' && queueItem.calledTime && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>叫号时间</Text>
            <Text className={styles.infoValue}>{formatTime(queueItem.calledTime)}</Text>
          </View>
        )}
      </View>

      {showActions && queueItem.status === 'waiting' && (
        <View className={styles.queueFooter}>
          <Button className={styles.leaveBtn} onClick={handleLeave}>
            取消排队
          </Button>
        </View>
      )}
    </View>
  )
}

export default QueueCard
