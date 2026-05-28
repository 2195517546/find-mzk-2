import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const MAX_LEVEL = 10 // 最大关卡数

export const useGameStore = defineStore('game', () => {
  // 状态
  const currentLevel = ref(1)
  const completedLevels = ref([])
  const hasAcceptedStorage = ref(false)
  const ruleBroken = ref(false)
  const hasSeenDisclaimer = ref(false)
  const rule2Broken = ref(false)

  // 从 localStorage 加载数据
  const loadFromStorage = () => {
    try {
      const saved = localStorage.getItem('find-mzk-2-save')
      if (saved) {
        const data = JSON.parse(saved)

        // 校验数据结构，异常时回退到默认值
        const level = Number(data.currentLevel)
        if (Number.isInteger(level) && level >= 1 && level <= MAX_LEVEL) {
          currentLevel.value = level
        }

        if (Array.isArray(data.completedLevels) &&
            data.completedLevels.every(v => Number.isInteger(v) && v >= 1 && v <= MAX_LEVEL)) {
          completedLevels.value = data.completedLevels
        }

        if (data.ruleBroken) {
          ruleBroken.value = true
        }

        if (data.hasSeenDisclaimer) {
          hasSeenDisclaimer.value = true
        }

        if (data.rule2Broken) {
          rule2Broken.value = true
        }

        hasAcceptedStorage.value = true
      }
    } catch (error) {
      console.error('加载存档失败:', error)
      localStorage.removeItem('find-mzk-2-save')
    }
  }

  // 保存到 localStorage
  const saveToStorage = () => {
    if (!hasAcceptedStorage.value) return

    try {
      const data = {
        currentLevel: currentLevel.value,
        completedLevels: completedLevels.value,
        ruleBroken: ruleBroken.value,
        hasSeenDisclaimer: hasSeenDisclaimer.value,
        rule2Broken: rule2Broken.value,
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

  // 标记已看过免责声明
  const markDisclaimerSeen = () => {
    hasSeenDisclaimer.value = true
    saveToStorage()
  }

  // 破坏第二条规则
  const breakRule2 = () => {
    rule2Broken.value = true
    saveToStorage()
  }

  // 完成关卡
  const completeLevel = (levelId) => {
    if (!completedLevels.value.includes(levelId)) {
      completedLevels.value.push(levelId)
    }

    // 第五关通关标记规则破坏
    if (levelId === 5) {
      ruleBroken.value = true
    }

    // 第六关通关恢复破坏模式（救赎成功，但规则划掉状态保留）
    if (levelId === 6) {
      ruleBroken.value = false
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
    ruleBroken.value = false
    hasSeenDisclaimer.value = false
    rule2Broken.value = false
    saveToStorage()
  }

  // 解锁所有关卡（管理员功能）
  const unlockAllLevels = () => {
    completedLevels.value = []
    for (let i = 1; i <= MAX_LEVEL; i++) {
      if (!completedLevels.value.includes(i)) {
        completedLevels.value.push(i)
      }
    }
    currentLevel.value = MAX_LEVEL
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
    ruleBroken,
    hasSeenDisclaimer,
    rule2Broken,

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
    resetProgress,
    unlockAllLevels,
    markDisclaimerSeen,
    breakRule2
  }
})
