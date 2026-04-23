import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const MAX_LEVEL = 10 // 最大关卡数

export const useGameStore = defineStore('game', () => {
  // 状态
  const currentLevel = ref(1)
  const completedLevels = ref([])
  const hasAcceptedStorage = ref(false)

  // 从 localStorage 加载数据
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('find-mzk-2-save')
      if (saved) {
        const data = JSON.parse(saved)
        currentLevel.value = data.currentLevel || 1
        completedLevels.value = data.completedLevels || []
        hasAcceptedStorage.value = true
      }
    } catch (error) {
      console.error('加载存档失败:', error)
    }
  }

  // 保存到 localStorage
  const saveToStorage = () => {
    if (!hasAcceptedStorage.value) return

    try {
      const data = {
        currentLevel: currentLevel.value,
        completedLevels: completedLevels.value,
        lastSaved: new Date().toISOString()
      }
      localStorage.setItem('find-mzk-2-save', JSON.stringify(data))
    } catch (error) {
      console.error('保存存档失败:', error)
    }
  }

  // 接受存储权限
  const acceptStorage = () => {
    hasAcceptedStorage.value = true
    saveToStorage()
  }

  // 拒绝存储权限
  const rejectStorage = () => {
    hasAcceptedStorage.value = false
    localStorage.removeItem('find-mzk-2-save')
  }

  // 完成关卡
  const completeLevel = (levelId) => {
    if (!completedLevels.value.includes(levelId)) {
      completedLevels.value.push(levelId)
    }

    // 更新当前关卡为下一关，但不超过最大关卡数
    if (levelId >= currentLevel.value && levelId < MAX_LEVEL) {
      currentLevel.value = levelId + 1
    }

    saveToStorage()
  }

  // 检查关卡是否已完成
  const isLevelCompleted = (levelId) => {
    return completedLevels.value.includes(levelId)
  }

  // 检查关卡是否已解锁
  const isLevelUnlocked = (levelId) => {
    // 第一关总是解锁的
    if (levelId === 1) return true
    // 前一关完成后解锁
    return completedLevels.value.includes(levelId - 1)
  }

  // 重置游戏进度
  const resetProgress = () => {
    currentLevel.value = 1
    completedLevels.value = []
    saveToStorage()
  }

  // 计算属性
  const hasProgress = computed(() => {
    return completedLevels.value.length > 0
  })

  const totalCompleted = computed(() => {
    return completedLevels.value.length
  })

  // 初始化时加载数据
  loadFromStorage()

  return {
    // 状态
    currentLevel,
    completedLevels,
    hasAcceptedStorage,

    // 计算属性
    hasProgress,
    totalCompleted,

    // 方法
    loadFromStorage,
    saveToStorage,
    acceptStorage,
    rejectStorage,
    completeLevel,
    isLevelCompleted,
    isLevelUnlocked,
    resetProgress
  }
})
