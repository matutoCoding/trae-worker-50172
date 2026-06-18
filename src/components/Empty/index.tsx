import React from 'react'
import { View, Text } from '@tarojs/components'
import styles from './index.module.scss'

interface EmptyProps {
  text?: string
  description?: string
  icon?: string
}

const Empty: React.FC<EmptyProps> = ({ text = '暂无数据', description, icon = '📭' }) => {
  return (
    <View className={styles.empty}>
      <Text className={styles.icon}>{icon}</Text>
      <Text className={styles.text}>{text}</Text>
      {description && <Text className={styles.description}>{description}</Text>}
    </View>
  )
}

export default Empty
