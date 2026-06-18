import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { useQueueStore } from '@/store/useQueueStore'
import { useUserStore } from '@/store/useUserStore'
import QueueCard from '@/components/QueueCard'
import StatusTag from '@/components/StatusTag'
import Empty from '@/components/Empty'
import { getPriorityText, getSeatTypeText } from '@/utils/priority'
import type { QueueItem, PriorityLevel } from '@/types/queue'
import styles from './index.module.scss'

const seatTypes = ['single', 'double', 'quiet', 'vip']
const priorityOptions: { value: PriorityLevel; label: string; vipOnly?: boolean }[] = [
  { value: 'normal', label: '普通排队' },
  { value: 'vip', label: 'VIP优先', vipOnly: true },
  { value: 'emergency', label: '应急插队', vipOnly: true },
]

const QueuePage: React.FC = () => {
  const {
    queueItems,
    queueStats,
    myQueueItem,
    fetchQueue,
    fetchMyQueue,
    joinQueue,
    leaveQueue,
    getPriorityQueue,
    getNormalQueue,
    loading,
  } = useQueueStore()

  const { user, isVip } = useUserStore()

  const [showModal, setShowModal] = useState(false)
  const [selectedSeatType, setSelectedSeatType] = useState('single')
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>('normal')

  useEffect(() => {
    console.log('[QueuePage] 页面初始化')
    fetchQueue()
    fetchMyQueue()
  }, [fetchQueue, fetchMyQueue])

  useDidShow(() => {
    console.log('[QueuePage] 页面显示，刷新数据')
    fetchQueue()
    fetchMyQueue()
  })

  const priorityQueue = useMemo(() => getPriorityQueue(), [getPriorityQueue])
  const normalQueue = useMemo(() => getNormalQueue(), [getNormalQueue])

  const handleRefresh = () => {
    console.log('[QueuePage] 下拉刷新')
    Promise.all([fetchQueue(), fetchMyQueue()]).then(() => {
      Taro.stopPullDownRefresh()
    })
  }

  const handleTakeNumber = () => {
    if (myQueueItem) {
      Taro.showToast({ title: '您已在排队中', icon: 'none' })
      return
    }
    setShowModal(true)
  }

  const handleConfirmTake = async () => {
    console.log('[QueuePage] 取号排队:', selectedSeatType, selectedPriority)
    try {
      await joinQueue(selectedSeatType, selectedPriority)
      setShowModal(false)
      Taro.showToast({ title: '取号成功', icon: 'success' })
    } catch (error) {
      console.error('[QueuePage] 取号失败:', error)
      Taro.showToast({ title: '取号失败', icon: 'error' })
    }
  }

  const handleLeaveQueue = (item: QueueItem) => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消排队吗？',
      success: (res) => {
        if (res.confirm) {
          leaveQueue(item.id)
          Taro.showToast({ title: '已取消', icon: 'success' })
        }
      },
    })
  }

  const handleSeatTypeChange = (type: string) => {
    setSelectedSeatType(type)
    if (type === 'vip' && isVip()) {
      setSelectedPriority('vip')
    }
  }

  const handlePriorityChange = (priority: PriorityLevel) => {
    const option = priorityOptions.find(o => o.value === priority)
    if (option?.vipOnly && !isVip()) {
      Taro.showToast({ title: '请先开通VIP', icon: 'none' })
      return
    }
    setSelectedPriority(priority)
  }

  const isVipUser = isVip()
  const isMyQueueVip = myQueueItem?.isVip

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>排队叫号</Text>
        <Text className={styles.headerSubtitle}>
          {myQueueItem ? `您的排名: 第 ${myQueueItem.queueNumber} 位` : '智能排队，高效入座'}
        </Text>
      </View>

      {myQueueItem ? (
        <View className={classnames(styles.myQueueCard, isMyQueueVip && styles.vipCard)}>
          <View className={styles.myQueueHeader}>
            <Text className={styles.myQueueTitle}>我的排队</Text>
            <StatusTag
              text={getPriorityText(myQueueItem.priority)}
              type={myQueueItem.priority === 'emergency' ? 'error' : myQueueItem.priority === 'vip' ? 'vip' : 'info'}
              size="small"
            />
          </View>

          <View className={styles.myQueueNumber}>
            <Text className={styles.numberText}>{myQueueItem.queueNumber}</Text>
            <Text className={styles.numberLabel}>号</Text>
          </View>

          <View className={styles.myQueueInfo}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>座位类型</Text>
              <Text className={styles.infoValue}>
                {myQueueItem.seatType ? getSeatTypeText(myQueueItem.seatType) : '随机分配'}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>预计等待</Text>
              <Text className={classnames(styles.infoValue, styles.highlight)}>
                {myQueueItem.expectedWaitTime}分钟
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>排队状态</Text>
              <Text className={styles.infoValue}>
                {myQueueItem.status === 'waiting' ? '排队中' : '已叫号'}
              </Text>
            </View>
          </View>

          <View className={styles.myQueueActions}>
            <Button
              className={classnames(styles.actionBtn, styles.btnSecondary)}
              onClick={() => handleLeaveQueue(myQueueItem)}
            >
              取消排队
            </Button>
            <Button
              className={classnames(styles.actionBtn, isMyQueueVip ? styles.btnVip : styles.btnPrimary)}
              onClick={() => Taro.showToast({ title: '叫号后会通知您', icon: 'none' })}
            >
              {myQueueItem.status === 'called' ? '立即入座' : '等待叫号'}
            </Button>
          </View>
        </View>
      ) : (
        <View className={classnames(styles.myQueueCard)}>
          <View className={styles.queueNumberCard}>
            <Text className={styles.bigNumber}>--</Text>
            <Text className={styles.queueTip}>点击下方按钮取号排队</Text>
          </View>
        </View>
      )}

      <View className={styles.statsGrid}>
        <View className={styles.statCard}>
          <Text className={styles.statNumber}>{queueStats.totalWaiting}</Text>
          <Text className={styles.statLabel}>总等待</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statVip)}>
          <Text className={styles.statNumber}>{queueStats.vipWaiting}</Text>
          <Text className={styles.statLabel}>VIP优先</Text>
        </View>
        <View className={classnames(styles.statCard, styles.statAvailable)}>
          <Text className={styles.statNumber}>{queueStats.availableSeats}</Text>
          <Text className={styles.statLabel}>可用座位</Text>
        </View>
      </View>

      <ScrollView scrollY>
        <View className={styles.section}>
          <View className={styles.queueSection}>
            <View className={styles.queueSectionTitle}>
              <Text className={styles.sectionIcon}>⭐</Text>
              <Text className={styles.sectionName}>优先级队列</Text>
              <Text className={styles.sectionCount}>{priorityQueue.length} 人</Text>
            </View>
            {priorityQueue.length === 0 ? (
              <Empty text="暂无优先级排队" icon="⭐" />
            ) : (
              priorityQueue.slice(0, 5).map((item, index) => (
                <QueueCard
                  key={item.id}
                  queueItem={item}
                  rank={index + 1}
                  onLeave={handleLeaveQueue}
                  showActions={false}
                />
              ))
            )}
          </View>

          <View className={styles.queueSection}>
            <View className={styles.queueSectionTitle}>
              <Text className={styles.sectionIcon}>📋</Text>
              <Text className={styles.sectionName}>普通队列</Text>
              <Text className={styles.sectionCount}>{normalQueue.length} 人</Text>
            </View>
            {normalQueue.length === 0 ? (
              <Empty text="暂无普通排队" icon="📋" />
            ) : (
              normalQueue.slice(0, 5).map((item, index) => (
                <QueueCard
                  key={item.id}
                  queueItem={item}
                  rank={priorityQueue.length + index + 1}
                  onLeave={handleLeaveQueue}
                  showActions={false}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {!myQueueItem && (
        <Button
          className={classnames(styles.takeNumberBtn, isVipUser && styles.vipBtn)}
          onClick={handleTakeNumber}
        >
          {isVipUser ? 'VIP优先取号' : '立即取号'}
        </Button>
      )}

      {showModal && (
        <View className={styles.modalMask} onClick={() => setShowModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <View className={styles.modalHeader}>
              <Text className={styles.modalTitle}>取号排队</Text>
              <Text className={styles.modalClose} onClick={() => setShowModal(false)}>✕</Text>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>选择座位类型</Text>
              <View className={styles.optionList}>
                {seatTypes.map(type => (
                  <Button
                    key={type}
                    className={classnames(
                      styles.optionItem,
                      selectedSeatType === type && styles.active
                    )}
                    onClick={() => handleSeatTypeChange(type)}
                  >
                    {getSeatTypeText(type)}
                  </Button>
                ))}
              </View>
            </View>

            <View className={styles.formGroup}>
              <Text className={styles.formLabel}>选择优先级</Text>
              <View className={styles.optionList}>
                {priorityOptions.map(option => (
                  <Button
                    key={option.value}
                    className={classnames(
                      styles.optionItem,
                      selectedPriority === option.value && styles.active,
                      option.vipOnly && styles.vipOption
                    )}
                    onClick={() => handlePriorityChange(option.value)}
                  >
                    {option.label}
                    {option.vipOnly && !isVipUser && ' 🔒'}
                  </Button>
                ))}
              </View>
            </View>

            <Button
              className={classnames(styles.confirmBtn, selectedPriority !== 'normal' && styles.vipConfirm)}
              onClick={handleConfirmTake}
            >
              确认取号
            </Button>
          </View>
        </View>
      )}
    </View>
  )
}

export default QueuePage
