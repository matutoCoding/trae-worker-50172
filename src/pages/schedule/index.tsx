import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, Switch, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { useBookingStore } from '@/store/useBookingStore'
import BookingCard from '@/components/BookingCard'
import StatusTag from '@/components/StatusTag'
import Empty from '@/components/Empty'
import { getFrequencyText } from '@/utils/priority'
import { formatDate, getWeekdaysText } from '@/utils/date'
import type { Booking, CycleRule } from '@/types/booking'
import styles from './index.module.scss'

type TabType = 'cycle' | 'booking'

const SchedulePage: React.FC = () => {
  const {
    bookings,
    cycleRules,
    fetchBookings,
    fetchCycleRules,
    toggleCycleRule,
    cancelBooking,
    generateCycleBookings,
    addBooking,
  } = useBookingStore()

  const [activeTab, setActiveTab] = useState<TabType>('cycle')

  useEffect(() => {
    console.log('[SchedulePage] 页面初始化')
    fetchBookings()
    fetchCycleRules()
  }, [fetchBookings, fetchCycleRules])

  useDidShow(() => {
    console.log('[SchedulePage] 页面显示，刷新数据')
    fetchBookings()
    fetchCycleRules()
  })

  const stats = useMemo(() => {
    const activeCycles = cycleRules.filter(r => r.isActive).length
    const upcomingBookings = bookings.filter(b => b.status === 'upcoming' || b.status === 'ongoing').length
    const cycleBookings = bookings.filter(b => b.isCycleBooking).length
    return { activeCycles, upcomingBookings, cycleBookings }
  }, [cycleRules, bookings])

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter(b => b.status === 'upcoming' || b.status === 'ongoing')
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.startTime.localeCompare(b.startTime)
      })
  }, [bookings])

  const handleRefresh = () => {
    console.log('[SchedulePage] 下拉刷新')
    Promise.all([fetchBookings(), fetchCycleRules()]).then(() => {
      Taro.stopPullDownRefresh()
    })
  }

  const handleAddCycle = () => {
    Taro.navigateTo({
      url: '/pages/cycle-rule/index',
    })
  }

  const handleToggleCycle = (ruleId: string) => {
    console.log('[SchedulePage] 切换周期规则状态:', ruleId)
    toggleCycleRule(ruleId)
  }

  const handleGenerateBookings = (rule: CycleRule) => {
    console.log('[SchedulePage] 批量生成预约:', rule.id)
    const generated = generateCycleBookings(rule.id)
    generated.forEach(booking => {
      const exists = bookings.some(b => b.date === booking.date && b.cycleRuleId === rule.id)
      if (!exists) {
        addBooking(booking)
      }
    })
    Taro.showToast({
      title: `成功生成 ${generated.length} 条预约`,
      icon: 'success',
    })
  }

  const handleEditCycle = (rule: CycleRule) => {
    Taro.navigateTo({
      url: `/pages/cycle-rule/index?id=${rule.id}`,
    })
  }

  const handleCancelBooking = (booking: Booking) => {
    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个预约吗？',
      success: (res) => {
        if (res.confirm) {
          cancelBooking(booking.id)
          Taro.showToast({ title: '已取消', icon: 'success' })
        }
      },
    })
  }

  const handleEditBooking = (booking: Booking) => {
    Taro.navigateTo({
      url: `/pages/booking-edit/index?id=${booking.id}`,
    })
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>周期预约</Text>
        <Text className={styles.headerSubtitle}>按周/月批量生成，省心高效</Text>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.activeCycles}</Text>
            <Text className={styles.statLabel}>进行中周期</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.upcomingBookings}</Text>
            <Text className={styles.statLabel}>待使用预约</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{stats.cycleBookings}</Text>
            <Text className={styles.statLabel}>周期预约数</Text>
          </View>
        </View>
      </View>

      <View className={styles.tabs}>
        <Button
          className={classnames(styles.tab, activeTab === 'cycle' && styles.active)}
          onClick={() => setActiveTab('cycle')}
        >
          周期规则
        </Button>
        <Button
          className={classnames(styles.tab, activeTab === 'booking' && styles.active)}
          onClick={() => setActiveTab('booking')}
        >
          预约列表
        </Button>
      </View>

      <ScrollView scrollY className={styles.section}>
        {activeTab === 'cycle' ? (
          <View>
            {cycleRules.length === 0 ? (
              <Empty text="暂无周期规则" description="点击右下角按钮添加" icon="📅" />
            ) : (
              cycleRules.map(rule => (
                <View key={rule.id} className={styles.cycleCard}>
                  <View className={styles.cycleHeader}>
                    <View className={styles.cycleSeat}>
                      <Text className={styles.seatNumber}>{rule.seatNumber}</Text>
                      <StatusTag
                        text={rule.isActive ? '启用中' : '已停用'}
                        type={rule.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </View>
                    <View
                      className={classnames(styles.switch, rule.isActive && styles.active)}
                      onClick={() => handleToggleCycle(rule.id)}
                    >
                      <View className={styles.switchDot} />
                    </View>
                  </View>

                  <View className={styles.cycleBody}>
                    <View className={styles.cycleRow}>
                      <Text className={styles.cycleLabel}>周期</Text>
                      <Text className={styles.cycleValue}>{getFrequencyText(rule.frequency)}</Text>
                    </View>
                    <View className={styles.cycleRow}>
                      <Text className={styles.cycleLabel}>时间</Text>
                      <Text className={styles.cycleValue}>{rule.startTime} - {rule.endTime}</Text>
                    </View>
                    <View className={styles.cycleRow}>
                      <Text className={styles.cycleLabel}>星期</Text>
                      <View className={styles.weekdayTags}>
                        {rule.weekdays.map(d => (
                          <Text key={d} className={styles.weekdayTag}>
                            {['日', '一', '二', '三', '四', '五', '六'][d]}
                          </Text>
                        ))}
                      </View>
                    </View>
                    <View className={styles.cycleRow}>
                      <Text className={styles.cycleLabel}>有效期</Text>
                      <Text className={styles.cycleValue}>
                        {formatDate(rule.startDate)} 至 {formatDate(rule.endDate)}
                      </Text>
                    </View>
                  </View>

                  <View className={styles.cycleFooter}>
                    <Button
                      className={classnames(styles.cycleBtn, styles.btnSecondary)}
                      onClick={() => handleEditCycle(rule)}
                    >
                      编辑规则
                    </Button>
                    <Button
                      className={classnames(styles.cycleBtn, styles.btnPrimary)}
                      onClick={() => handleGenerateBookings(rule)}
                    >
                      生成预约
                    </Button>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View className={styles.bookingList}>
            {upcomingBookings.length === 0 ? (
              <Empty text="暂无预约" description="去创建一个预约吧" icon="📆" />
            ) : (
              upcomingBookings.map(booking => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancel={handleCancelBooking}
                  onEdit={handleEditBooking}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {activeTab === 'cycle' && (
        <Button className={styles.addBtn} onClick={handleAddCycle}>
          <Text className={styles.addIcon}>+</Text>
        </Button>
      )}
    </View>
  )
}

export default SchedulePage
