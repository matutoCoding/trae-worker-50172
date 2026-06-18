import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, Switch, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { useBookingStore } from '@/store/useBookingStore'
import { useSeatStore } from '@/store/useSeatStore'
import BookingCard from '@/components/BookingCard'
import StatusTag from '@/components/StatusTag'
import Empty from '@/components/Empty'
import { getFrequencyText, getSeatTypeText } from '@/utils/priority'
import { formatDate, getWeekdaysText } from '@/utils/date'
import type { Booking, CycleRule } from '@/types/booking'
import type { SeatType } from '@/types/seat'
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
    regenerateCycleBookings,
    getCycleBookings,
  } = useBookingStore()

  const { seats, fetchSeats } = useSeatStore()

  const [activeTab, setActiveTab] = useState<TabType>('cycle')
  const [filterRuleId, setFilterRuleId] = useState<string>('')
  const [filterDate, setFilterDate] = useState<string>('')
  const [filterSeatType, setFilterSeatType] = useState<string>('')
  const [viewingRuleId, setViewingRuleId] = useState<string>('')

  useEffect(() => {
    console.log('[SchedulePage] 页面初始化')
    fetchBookings()
    fetchCycleRules()
    fetchSeats()
  }, [fetchBookings, fetchCycleRules, fetchSeats])

  useDidShow(() => {
    console.log('[SchedulePage] 页面显示，刷新数据')
    fetchBookings()
    fetchCycleRules()
    fetchSeats()
  })

  const stats = useMemo(() => {
    const activeCycles = cycleRules.filter(r => r.isActive).length
    const upcomingBookings = bookings.filter(b => b.status === 'upcoming' || b.status === 'ongoing').length
    const cycleBookings = bookings.filter(b => b.isCycleBooking).length
    return { activeCycles, upcomingBookings, cycleBookings }
  }, [cycleRules, bookings])

  const upcomingBookings = useMemo(() => {
    return bookings
      .filter(b => {
        if (viewingRuleId) return b.cycleRuleId === viewingRuleId
        if (filterRuleId && b.cycleRuleId !== filterRuleId) return false
        if (filterDate && b.date !== filterDate) return false
        if (filterSeatType) {
          const seat = seats.find(s => s.id === b.seatId)
          if (!seat || seat.type !== filterSeatType) return false
        }
        return b.status === 'upcoming' || b.status === 'ongoing' || b.status === 'completed' || b.status === 'cancelled'
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.startTime.localeCompare(b.startTime)
      })
  }, [bookings, filterRuleId, filterDate, filterSeatType, viewingRuleId, seats])

  const viewingRule = useMemo(() => {
    if (!viewingRuleId) return null
    return cycleRules.find(r => r.id === viewingRuleId) || null
  }, [viewingRuleId, cycleRules])

  const viewingRuleBookings = useMemo(() => {
    if (!viewingRuleId) return []
    return getCycleBookings(viewingRuleId)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        return a.startTime.localeCompare(b.startTime)
      })
  }, [viewingRuleId, getCycleBookings])

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
    const generated = regenerateCycleBookings(rule.id)
    Taro.showToast({
      title: `成功生成 ${generated.length} 条预约`,
      icon: 'success',
    })
  }

  const handleViewRuleBookings = (rule: CycleRule) => {
    setViewingRuleId(rule.id)
    setActiveTab('booking')
  }

  const handleBackToAll = () => {
    setViewingRuleId('')
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

  const handleRuleFilterChange = () => {
    const options = [
      { value: '', label: '全部规则' },
      ...cycleRules.map(r => ({ value: r.id, label: `${r.seatNumber} ${getFrequencyText(r.frequency)}` })),
    ]
    Taro.showActionSheet({
      itemList: options.map(o => o.label),
      success: (res) => {
        setFilterRuleId(options[res.tapIndex].value)
      },
    })
  }

  const handleDateFilterChange = () => {
    const today = new Date()
    const dates: { value: string; label: string }[] = [
      { value: '', label: '全部日期' },
    ]
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const value = d.toISOString().split('T')[0]
      const label = i === 0 ? '今天' : i === 1 ? '明天' : `${d.getMonth() + 1}/${d.getDate()}`
      dates.push({ value, label })
    }
    Taro.showActionSheet({
      itemList: dates.map(d => d.label),
      success: (res) => {
        setFilterDate(dates[res.tapIndex].value)
      },
    })
  }

  const handleSeatTypeFilterChange = () => {
    const options: { value: string; label: string }[] = [
      { value: '', label: '全部类型' },
      { value: 'single', label: '单人座' },
      { value: 'double', label: '双人座' },
      { value: 'quiet', label: '静音座' },
      { value: 'vip', label: 'VIP座' },
    ]
    Taro.showActionSheet({
      itemList: options.map(o => o.label),
      success: (res) => {
        setFilterSeatType(options[res.tapIndex].value)
      },
    })
  }

  const handleResetFilters = () => {
    setFilterRuleId('')
    setFilterDate('')
    setFilterSeatType('')
    setViewingRuleId('')
  }

  const activeFilterCount = [filterRuleId, filterDate, filterSeatType, viewingRuleId].filter(Boolean).length

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
          {activeFilterCount > 0 && (
            <Text className={styles.tabBadge}>{activeFilterCount}</Text>
          )}
        </Button>
      </View>

      {activeTab === 'booking' && (
        <View className={styles.filterBar}>
          {viewingRule ? (
            <View className={styles.filterRuleBanner}>
              <Text className={styles.filterRuleText}>
                查看规则: {viewingRule.seatNumber} {viewingRule.startTime}-{viewingRule.endTime}
              </Text>
              <Button className={styles.filterBackBtn} onClick={handleBackToAll}>
                返回全部
              </Button>
            </View>
          ) : (
            <ScrollView scrollX className={styles.filterScroll} showScrollbar={false}>
              <View className={styles.filterRow}>
                <Button
                  className={classnames(styles.filterChip, filterRuleId && styles.active)}
                  onClick={handleRuleFilterChange}
                >
                  {filterRuleId
                    ? cycleRules.find(r => r.id === filterRuleId)?.seatNumber || '选择规则'
                    : '全部规则'}
                </Button>
                <Button
                  className={classnames(styles.filterChip, filterDate && styles.active)}
                  onClick={handleDateFilterChange}
                >
                  {filterDate ? formatDate(filterDate, 'MM月DD日') : '全部日期'}
                </Button>
                <Button
                  className={classnames(styles.filterChip, filterSeatType && styles.active)}
                  onClick={handleSeatTypeFilterChange}
                >
                  {filterSeatType ? getSeatTypeText(filterSeatType as SeatType) : '座位类型'}
                </Button>
                {activeFilterCount > 0 && (
                  <Button className={styles.resetBtn} onClick={handleResetFilters}>
                    重置
                  </Button>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      )}

      <ScrollView scrollY className={styles.section}>
        {activeTab === 'cycle' ? (
          <View>
            {cycleRules.length === 0 ? (
              <Empty text="暂无周期规则" description="点击右下角按钮添加" icon="📅" />
            ) : (
              cycleRules.map(rule => {
                const ruleBookings = getCycleBookings(rule.id)
                return (
                  <View
                    key={rule.id}
                    className={styles.cycleCard}
                    onClick={() => handleViewRuleBookings(rule)}
                  >
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
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleCycle(rule.id)
                        }}
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
                      {ruleBookings.length > 0 && (
                        <View className={styles.cycleRow}>
                          <Text className={styles.cycleLabel}>已生成</Text>
                          <Text className={classnames(styles.cycleValue, styles.cycleCount)}>
                            {ruleBookings.length} 条预约 →
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className={styles.cycleFooter} onClick={(e) => e.stopPropagation()}>
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
                        {ruleBookings.length > 0 ? '重新生成' : '生成预约'}
                      </Button>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        ) : (
          <View className={styles.bookingList}>
            {viewingRule ? (
              <View className={styles.bookingSummary}>
                <Text className={styles.summaryLabel}>
                  共 {viewingRuleBookings.length} 条预约
                </Text>
              </View>
            ) : null}
            {upcomingBookings.length === 0 ? (
              <Empty
                text={viewingRule ? '该规则下暂无预约' : '暂无预约'}
                description={viewingRule ? '去生成一些预约吧' : '去创建一个预约吧'}
                icon="📆"
              />
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
