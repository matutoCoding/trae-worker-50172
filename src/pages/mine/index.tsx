import React, { useEffect } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useUserStore } from '@/store/useUserStore'
import { useBookingStore } from '@/store/useBookingStore'
import StatusTag from '@/components/StatusTag'
import { formatDate } from '@/utils/date'
import styles from './index.module.scss'

const MinePage: React.FC = () => {
  const { user, userStats, fetchUser, fetchUserStats, isVip, getUserLevelText } = useUserStore()
  const { bookings } = useBookingStore()

  useEffect(() => {
    console.log('[MinePage] 页面初始化')
    fetchUser()
    fetchUserStats()
  }, [fetchUser, fetchUserStats])

  useDidShow(() => {
    console.log('[MinePage] 页面显示，刷新数据')
    fetchUser()
    fetchUserStats()
  })

  const handleMenuClick = (menu: string) => {
    console.log('[MinePage] 点击菜单:', menu)
    switch (menu) {
      case 'bookings':
        Taro.switchTab({ url: '/pages/schedule/index' })
        break
      case 'vip':
        Taro.showToast({ title: 'VIP开通功能开发中', icon: 'none' })
        break
      case 'recharge':
        Taro.showToast({ title: '充值功能开发中', icon: 'none' })
        break
      default:
        Taro.showToast({ title: '功能开发中', icon: 'none' })
    }
  }

  const isVipUser = isVip()
  const levelText = getUserLevelText()

  return (
    <View className={styles.page}>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <Image
            className={styles.avatar}
            src={user?.avatar || 'https://picsum.photos/id/64/200/200'}
            mode="aspectFill"
          />
          <View className={styles.userDetail}>
            <Text className={styles.userName}>{user?.name || '用户'}</Text>
            {isVipUser ? (
              <View className={styles.vipBadge}>
                <Text className={styles.vipIcon}>👑</Text>
                <Text>{levelText}</Text>
              </View>
            ) : (
              <View className={styles.normalBadge}>
                <Text>普通用户</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View className={styles.statsCard}>
        <View className={styles.statsGrid}>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{userStats.totalBookings}</Text>
            <Text className={styles.statLabel}>总预约</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{userStats.completedBookings}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{userStats.totalStudyHours}</Text>
            <Text className={styles.statLabel}>学习时长</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statNumber}>{userStats.consecutiveDays}</Text>
            <Text className={styles.statLabel}>连续天数</Text>
          </View>
        </View>
        <View className={styles.balanceRow}>
          <Text className={styles.balanceLabel}>账户余额</Text>
          <Text className={styles.balanceValue}>¥ {user?.balance?.toFixed(2) || '0.00'}</Text>
          <Button
            className={styles.rechargeBtn}
            onClick={() => handleMenuClick('recharge')}
          >
            充值
          </Button>
        </View>
      </View>

      {!isVipUser && (
        <View className={styles.vipCard} onClick={() => handleMenuClick('vip')}>
          <View className={styles.vipCardContent}>
            <View className={styles.vipCardInfo}>
              <Text className={styles.vipCardTitle}>开通VIP会员</Text>
              <Text className={styles.vipCardDesc}>优先排队·专属座位·更多权益</Text>
            </View>
            <Button className={styles.vipCardBtn}>立即开通</Button>
          </View>
        </View>
      )}

      {isVipUser && user?.vipExpireDate && (
        <View className={styles.vipCard} onClick={() => handleMenuClick('vip')}>
          <View className={styles.vipCardContent}>
            <View className={styles.vipCardInfo}>
              <Text className={styles.vipCardTitle}>👑 VIP会员</Text>
              <Text className={styles.vipCardDesc}>有效期至 {formatDate(user.vipExpireDate)}</Text>
            </View>
            <Button className={styles.vipCardBtn}>续费</Button>
          </View>
        </View>
      )}

      <Text className={styles.sectionTitle}>常用功能</Text>

      <View className={styles.menuSection}>
        <View className={styles.menuItem} onClick={() => handleMenuClick('bookings')}>
          <Text className={styles.menuIcon}>📅</Text>
          <Text className={styles.menuTitle}>我的预约</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => handleMenuClick('records')}>
          <Text className={styles.menuIcon}>📊</Text>
          <Text className={styles.menuTitle}>学习记录</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => handleMenuClick('favorites')}>
          <Text className={styles.menuIcon}>⭐</Text>
          <Text className={styles.menuTitle}>收藏座位</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => handleMenuClick('messages')}>
          <Text className={styles.menuIcon}>🔔</Text>
          <Text className={styles.menuTitle}>消息通知</Text>
          <View className={styles.menuBadge}>3</View>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>

      <Text className={styles.sectionTitle}>其他</Text>

      <View className={styles.menuSection}>
        <View className={styles.menuItem} onClick={() => handleMenuClick('help')}>
          <Text className={styles.menuIcon}>❓</Text>
          <Text className={styles.menuTitle}>帮助中心</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => handleMenuClick('feedback')}>
          <Text className={styles.menuIcon}>💬</Text>
          <Text className={styles.menuTitle}>意见反馈</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
        <View className={styles.menuItem} onClick={() => handleMenuClick('settings')}>
          <Text className={styles.menuIcon}>⚙️</Text>
          <Text className={styles.menuTitle}>设置</Text>
          <Text className={styles.menuArrow}>›</Text>
        </View>
      </View>
    </View>
  )
}

export default MinePage
