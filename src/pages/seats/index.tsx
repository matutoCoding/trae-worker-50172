import React, { useState, useEffect, useMemo } from 'react'
import { View, Text, Button, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import classnames from 'classnames'
import { useSeatStore } from '@/store/useSeatStore'
import SeatCard from '@/components/SeatCard'
import Empty from '@/components/Empty'
import type { SeatArea } from '@/types/seat'
import styles from './index.module.scss'

const SeatsPage: React.FC = () => {
  const { seats, seatAreas, selectedArea, selectedFloor, setSelectedArea, setSelectedFloor, fetchSeats, loading } = useSeatStore()
  const [activeArea, setActiveArea] = useState<string>('')
  const [activeFloor, setActiveFloor] = useState<number>(1)

  useEffect(() => {
    console.log('[SeatsPage] 页面初始化，加载座位数据')
    fetchSeats()
  }, [fetchSeats])

  useDidShow(() => {
    console.log('[SeatsPage] 页面显示，刷新数据')
    fetchSeats()
  })

  const stats = useMemo(() => {
    const available = seats.filter(s => s.status === 'available').length
    const occupied = seats.filter(s => s.status === 'occupied').length
    const reserved = seats.filter(s => s.status === 'reserved').length
    return { available, occupied, reserved, total: seats.length }
  }, [seats])

  const filteredSeats = useMemo(() => {
    let result = seats.filter(s => s.floor === activeFloor)
    if (activeArea) {
      result = result.filter(s => s.area === activeArea)
    }
    return result
  }, [seats, activeArea, activeFloor])

  const seatsByArea = useMemo(() => {
    const grouped: Record<string, typeof seats> = {}
    filteredSeats.forEach(seat => {
      if (!grouped[seat.area]) {
        grouped[seat.area] = []
      }
      grouped[seat.area].push(seat)
    })
    return grouped
  }, [filteredSeats])

  const floors = useMemo(() => {
    const floorSet = new Set(seats.map(s => s.floor))
    return Array.from(floorSet).sort((a, b) => a - b)
  }, [seats])

  const handleAreaChange = (area: string) => {
    const newValue = activeArea === area ? '' : area
    setActiveArea(newValue)
    setSelectedArea(newValue)
  }

  const handleFloorChange = (floor: number) => {
    setActiveFloor(floor)
    setSelectedFloor(floor)
  }

  const handleRefresh = () => {
    console.log('[SeatsPage] 下拉刷新')
    fetchSeats().then(() => {
      Taro.stopPullDownRefresh()
    })
  }

  const handleQuickBooking = () => {
    Taro.navigateTo({
      url: '/pages/booking-edit/index',
    })
  }

  const handleQueue = () => {
    Taro.switchTab({
      url: '/pages/queue/index',
    })
  }

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.headerTitle}>座位排期</Text>
        <Text className={styles.headerSubtitle}>实时座位状态，一键预约</Text>
      </View>

      <View className={styles.statsBar}>
        <View className={classnames(styles.statItem, styles.statAvailable)}>
          <Text className={styles.statNumber}>{stats.available}</Text>
          <Text className={styles.statLabel}>空闲</Text>
        </View>
        <View className={classnames(styles.statItem, styles.statOccupied)}>
          <Text className={styles.statNumber}>{stats.occupied}</Text>
          <Text className={styles.statLabel}>使用中</Text>
        </View>
        <View className={classnames(styles.statItem, styles.statReserved)}>
          <Text className={styles.statNumber}>{stats.reserved}</Text>
          <Text className={styles.statLabel}>已预约</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statNumber}>{stats.total}</Text>
          <Text className={styles.statLabel}>总座位</Text>
        </View>
      </View>

      <View className={styles.filterSection}>
        <Text className={styles.sectionTitle}>楼层选择</Text>
        <View className={styles.floorTabs}>
          {floors.map(floor => (
            <Button
              key={floor}
              className={classnames(styles.floorTab, activeFloor === floor && styles.active)}
              onClick={() => handleFloorChange(floor)}
            >
              {floor}楼
            </Button>
          ))}
        </View>
      </View>

      <View className={styles.filterSection}>
        <Text className={styles.sectionTitle}>区域筛选</Text>
        <View className={styles.filterTabs}>
          {seatAreas.map(area => (
            <Button
              key={area.id}
              className={classnames(styles.filterTab, activeArea === area.name && styles.active)}
              onClick={() => handleAreaChange(area.name)}
            >
              {area.name}
            </Button>
          ))}
        </View>
      </View>

      <ScrollView
        className={styles.seatList}
        scrollY
        onScrollToLower={() => console.log('[SeatsPage] 滚动到底部')}
      >
        {filteredSeats.length === 0 ? (
          <Empty text="暂无座位" description="请尝试其他筛选条件" icon="🪑" />
        ) : (
          Object.entries(seatsByArea).map(([area, areaSeats]) => (
            <View key={area} className={styles.areaSection}>
              <View className={styles.areaHeader}>
                <Text className={styles.areaName}>{area}</Text>
                <Text className={styles.areaCount}>{areaSeats.length} 个座位</Text>
              </View>
              {areaSeats.map(seat => (
                <SeatCard key={seat.id} seat={seat} />
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <View className={styles.quickActions}>
        <Button className={styles.quickBtn} onClick={handleQuickBooking}>
          <Text className={styles.quickBtnIcon}>📅</Text>
          <Text>预约</Text>
        </Button>
        <Button className={styles.quickBtn} onClick={handleQueue}>
          <Text className={styles.quickBtnIcon}>📋</Text>
          <Text>排队</Text>
        </Button>
      </View>
    </View>
  )
}

export default SeatsPage
