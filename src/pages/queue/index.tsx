import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { useQueueStore } from '@/store/useQueueStore'
import { useUserStore } from '@/store/useUserStore'
import { useUsageStore } from '@/store/useUsageStore'
import QueueCard from '@/components/QueueCard'
import StatusTag from '@/components/StatusTag'
import Empty from '@/components/Empty'
import { getPriorityText, getSeatTypeText, getStatusText } from '@/utils/priority'
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
    callNext,
    expireQueue,
    confirmSeated,
    getPriorityQueue,
    getNormalQueue,
    getCalledQueue,
    loading,
  } = useQueueStore()

  const { user, isVip } = useUserStore()

  const { records: usageRecords, fetchRecords: fetchUsageRecords, getUsingRecords, getStats: getUsageStats } = useUsageStore()

  const [showModal, setShowModal] = useState(false)
  const [selectedSeatType, setSelectedSeatType] = useState('single')
  const [selectedPriority, setSelectedPriority] = useState<PriorityLevel>('normal')
  const [showStaffMode, setShowStaffMode] = useState(false)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    console.log('[QueuePage] 页面初始化')
    fetchQueue()
    fetchMyQueue()
    fetchUsageRecords()
  }, [fetchQueue, fetchMyQueue, fetchUsageRecords])

  useDidShow(() => {
    console.log('[QueuePage] 页面显示，刷新数据')
    fetchQueue()
    fetchMyQueue()
    fetchUsageRecords()
  })

  const priorityQueue = useMemo(() => getPriorityQueue(), [getPriorityQueue])
  const normalQueue = useMemo(() => getNormalQueue(), [getNormalQueue])
  const calledQueue = useMemo(() => getCalledQueue(), [getCalledQueue])
  const usingRecords = useMemo(() => getUsingRecords(), [getUsingRecords, usageRecords])
  const usageStats = useMemo(() => getUsageStats(), [getUsageStats, usageRecords])

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const timeoutMs = 5 * 60 * 1000
      let hasExpired = false

      queueItems.forEach(item => {
        if (item.status === 'called' && item.calledTime) {
          const calledAt = new Date(item.calledTime).getTime()
          if (now - calledAt > timeoutMs) {
            expireQueue(item.id)
            hasExpired = true
          }
        }
      })

      if (hasExpired) {
        forceUpdate(n => n + 1)
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [queueItems, expireQueue])

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

  const handleCallNext = async () => {
    const next = await callNext()
    if (next) {
      const priorityText = next.priority === 'emergency' ? '【应急】' : next.priority === 'vip' ? '【VIP】' : ''
      const seatText = next.occupiedSeatNumber
        ? `\n分配座位: ${next.occupiedSeatNumber}号`
        : `\n座位类型: ${getSeatTypeText(next.seatType)}\n（暂无可用同类型座位）`
      Taro.showModal({
        title: '叫号成功',
        content: `${priorityText}请 ${next.queueNumber} 号用户\n${next.userName}${seatText}\n\n5分钟内未入座将自动释放`,
        showCancel: false,
        confirmText: '知道了',
      })
      forceUpdate(n => n + 1)
    } else {
      Taro.showToast({ title: '暂无排队用户', icon: 'none' })
    }
  }

  const handleExpireManually = (item: QueueItem) => {
    Taro.showModal({
      title: '手动释放',
      content: `确认将 ${item.queueNumber} 号设置为已过期？\n（超时未入座或放弃座位）`,
      success: (res) => {
        if (res.confirm) {
          expireQueue(item.id)
          Taro.showToast({ title: '已释放', icon: 'success' })
          forceUpdate(n => n + 1)
        }
      },
    })
  }

  const handleConfirmSeated = (item: QueueItem) => {
    Taro.showModal({
      title: '确认入座',
      content: `确认 ${item.queueNumber} 号 ${item.userName}\n已就座于 ${item.occupiedSeatNumber || '指定座位'} ？`,
      success: (res) => {
        if (res.confirm) {
          const result = confirmSeated(item.id)
          if (result) {
            Taro.showToast({ title: '已确认入座', icon: 'success' })
            forceUpdate(n => n + 1)
          }
        }
      },
    })
  }

  const isVipUser = isVip()
  const isMyQueueVip = myQueueItem?.isVip

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.headerRow}>
          <View className={styles.headerTitleWrap}>
            <Text className={styles.headerTitle}>排队叫号</Text>
            <Text className={styles.headerSubtitle}>
              {myQueueItem ? `您的排名: 第 ${myQueueItem.queueNumber} 位` : '智能排队，高效入座'}
            </Text>
          </View>
          <Button
            className={classnames(styles.staffModeBtn, showStaffMode && styles.staffModeBtnActive)}
            onClick={() => setShowStaffMode(!showStaffMode)}
          >
            {showStaffMode ? '返回用户模式' : '店员模式'}
          </Button>
        </View>

        {showStaffMode && (
          <View className={styles.staffPanel}>
            <View className={styles.staffPanelHeader}>
              <Text className={styles.staffPanelTitle}>店员叫号控制台</Text>
            </View>
            <View className={styles.staffStats}>
              <View className={styles.staffStatItem}>
                <Text className={styles.staffStatNum}>{priorityQueue.length}</Text>
                <Text className={styles.staffStatLabel}>优先级等待</Text>
              </View>
              <View className={styles.staffStatItem}>
                <Text className={styles.staffStatNum}>{normalQueue.length}</Text>
                <Text className={styles.staffStatLabel}>普通等待</Text>
              </View>
              <View className={styles.staffStatItem}>
                <Text className={styles.staffStatNum}>{calledQueue.filter(c => c.status === 'called').length}</Text>
                <Text className={styles.staffStatLabel}>待入座</Text>
              </View>
              <View className={styles.staffStatItem}>
                <Text className={styles.staffStatNum}>{calledQueue.filter(c => c.status === 'expired').length}</Text>
                <Text className={styles.staffStatLabel}>已过期</Text>
              </View>
            </View>
            <Button
              className={styles.callNextBtn}
              onClick={handleCallNext}
              disabled={priorityQueue.length === 0 && normalQueue.length === 0}
            >
              🔔 叫下一位
            </Button>
          </View>
        )}
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
                {myQueueItem.occupiedSeatNumber
                  ? `${myQueueItem.occupiedSeatNumber}号座位`
                  : myQueueItem.seatType ? getSeatTypeText(myQueueItem.seatType) : '随机分配'}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>预计等待</Text>
              <Text className={classnames(styles.infoValue, styles.highlight)}>
                {myQueueItem.status === 'waiting' ? `${myQueueItem.expectedWaitTime}分钟` : '已安排'}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>排队状态</Text>
              <Text className={styles.infoValue}>
                {myQueueItem.status === 'waiting' ? '排队中' :
                 myQueueItem.status === 'called' ? '已叫号，请尽快入座' :
                 myQueueItem.status === 'seated' ? '已入座，学习中' :
                 myQueueItem.status === 'expired' ? '已过期' : '已取消'}
              </Text>
            </View>
          </View>

          <View className={styles.myQueueActions}>
            {(myQueueItem.status === 'waiting' || myQueueItem.status === 'called') && (
              <Button
                className={classnames(styles.actionBtn, styles.btnSecondary)}
                onClick={() => handleLeaveQueue(myQueueItem)}
              >
                取消排队
              </Button>
            )}
            <Button
              className={classnames(styles.actionBtn, isMyQueueVip ? styles.btnVip : styles.btnPrimary)}
              onClick={() => {
                if (myQueueItem.status === 'called') {
                  handleConfirmSeated(myQueueItem)
                } else if (myQueueItem.status === 'seated') {
                  Taro.showToast({ title: '学习中，加油！', icon: 'none' })
                } else {
                  Taro.showToast({ title: '叫号后会通知您', icon: 'none' })
                }
              }}
            >
              {myQueueItem.status === 'waiting' ? '等待叫号' :
               myQueueItem.status === 'called' ? '立即入座' :
               myQueueItem.status === 'seated' ? '学习中' : '已结束'}
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

          {calledQueue.length > 0 && (
            <View className={styles.queueSection}>
              <View className={styles.queueSectionTitle}>
                <Text className={styles.sectionIcon}>🔔</Text>
                <Text className={styles.sectionName}>叫号记录</Text>
                <Text className={styles.sectionCount}>{calledQueue.length} 条</Text>
              </View>
              {calledQueue.slice(0, 10).map((item) => (
                <View key={item.id} className={styles.calledCard}>
                  <View className={styles.calledLeft}>
                    <View className={styles.calledNumber}>
                      <Text className={styles.calledNumText}>{item.queueNumber}</Text>
                      <Text className={styles.calledNumUnit}>号</Text>
                    </View>
                  </View>
                  <View className={styles.calledMiddle}>
                    <View className={styles.calledUserRow}>
                      <Text className={styles.calledUserName}>{item.userName}</Text>
                      <StatusTag
                        text={getPriorityText(item.priority)}
                        type={item.priority === 'emergency' ? 'error' : item.priority === 'vip' ? 'vip' : 'default'}
                        size="small"
                      />
                    </View>
                    <Text className={styles.calledInfo}>
                      {item.occupiedSeatNumber ? `${item.occupiedSeatNumber}号 · ` : ''}
                      {getSeatTypeText(item.seatType)} · {item.calledTime ? new Date(item.calledTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '--'}
                    </Text>
                  </View>
                  <View className={styles.calledRight}>
                    {item.status === 'seated' ? (
                      <View className={styles.calledStatusCol}>
                        <StatusTag text="已入座" type="info" size="small" />
                        <Text className={styles.seatedTime}>
                          {item.seatedTime ? new Date(item.seatedTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>
                    ) : item.status === 'called' ? (
                      <View className={styles.calledStatusCol}>
                        <StatusTag text="待入座" type="warning" size="small" />
                        <View className={styles.actionRow}>
                          <Button
                            className={styles.seatedBtn}
                            onClick={() => handleConfirmSeated(item)}
                          >
                            确认入座
                          </Button>
                          {showStaffMode && (
                            <Button
                              className={styles.expireBtn}
                              onClick={() => handleExpireManually(item)}
                            >
                              超时释放
                            </Button>
                          )}
                        </View>
                      </View>
                    ) : (
                      <StatusTag text="已过期" type="error" size="small" />
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {showStaffMode && (
            <View className={styles.queueSection}>
              <View className={styles.queueSectionTitle}>
                <Text className={styles.sectionIcon}>📝</Text>
                <Text className={styles.sectionName}>使用记录</Text>
                <Text className={styles.sectionCount}>{usageStats.totalRecords} 条</Text>
              </View>
              {usageStats.totalRecords > 0 && (
                <View className={styles.usageStatsRow}>
                  <View className={styles.usageStatItem}>
                    <Text className={styles.usageStatNum}>{usageStats.usingCount}</Text>
                    <Text className={styles.usageStatLabel}>使用中</Text>
                  </View>
                  <View className={styles.usageStatItem}>
                    <Text className={styles.usageStatNum}>{usageStats.completedCount}</Text>
                    <Text className={styles.usageStatLabel}>已完成</Text>
                  </View>
                  <View className={styles.usageStatItem}>
                    <Text className={styles.usageStatNum}>{usageStats.timeoutCount}</Text>
                    <Text className={styles.usageStatLabel}>超时</Text>
                  </View>
                  <View className={styles.usageStatItem}>
                    <Text className={styles.usageStatNum}>{usageStats.cancelledCount}</Text>
                    <Text className={styles.usageStatLabel}>取消</Text>
                  </View>
                </View>
              )}
              {usingRecords.length > 0 && (
                <View className={styles.usageSectionTitle}>
                  <Text className={styles.usageSectionText}>当前使用中</Text>
                </View>
              )}
              {usingRecords.slice(0, 5).map(record => (
                <View key={record.id} className={styles.usageCard}>
                  <View className={styles.usageHeader}>
                    <Text className={styles.usageSeatNum}>{record.seatNumber}</Text>
                    <StatusTag
                      text={getStatusText(record.status)}
                      type={record.status === 'using' ? 'success' : 'default'}
                      size="small"
                    />
                  </View>
                  <View className={styles.usageBody}>
                    <Text className={styles.usageInfo}>
                      {record.userName} · {record.source === 'queue' ? `排队${record.queueNumber}号` : '预约到店'}
                    </Text>
                    <Text className={styles.usageTime}>
                      开始: {new Date(record.startTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      {record.expectedEndTime && ` · 预计结束: ${new Date(record.expectedEndTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`}
                    </Text>
                    {record.leaveReason && (
                      <Text className={styles.usageReason}>原因: {record.leaveReason}</Text>
                    )}
                  </View>
                </View>
              ))}
              {usageStats.totalRecords === 0 && (
                <Empty text="暂无使用记录" icon="📝" />
              )}
            </View>
          )}
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
