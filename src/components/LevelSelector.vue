<template>
  <div class="level-selector">
    <h3 class="selector-title pink-text">选择关卡</h3>
    <div class="level-list">
      <div
        v-for="level in levels"
        :key="level.id"
        class="level-item"
        :class="{
          'locked': !isLevelUnlocked(level.id),
          'completed': isLevelCompleted(level.id),
          'broken-level': level.id === 5 && gameStore.ruleBroken
        }"
        @click="selectLevel(level)"
      >
        <div class="level-number" :class="{ 'broken-number': level.id === 5 && gameStore.ruleBroken }">{{ level.id }}</div>
        <div class="level-details">
          <div v-if="level.id === 5 && gameStore.ruleBroken" class="level-name broken-name">
            <span class="strikethrough">杀戮晓山瑞希</span>
          </div>
          <div v-else class="level-name">{{ level.name }}</div>
          <div class="level-subtitle">{{ level.subtitle }}</div>
        </div>
        <div class="level-status">
          <span v-if="!isLevelUnlocked(level.id)" class="lock-icon">🔒</span>
          <span v-else-if="isLevelCompleted(level.id)" class="check-icon">✓</span>
          <span v-else class="arrow-icon">→</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import levelsData from '@/data/levels.json'

const router = useRouter()
const gameStore = useGameStore()

const levels = computed(() => {
  // 过滤已实现的关卡（排除 pending 类型）
  let filtered = levelsData.filter(level => level.type !== 'pending')

  // 如果第五关未完成，只显示前五关
  if (!gameStore.isLevelCompleted(5)) {
    return filtered.filter(level => level.id <= 5)
  }

  // 第五关已完成，第六关未完成，显示前六关
  if (!gameStore.isLevelCompleted(6)) {
    return filtered.filter(level => level.id <= 6)
  }

  // 第六关已完成，显示所有已实现的关卡（包括第7-10关）
  return filtered
})

const isLevelUnlocked = (levelId) => {
  return gameStore.isLevelUnlocked(levelId)
}

const isLevelCompleted = (levelId) => {
  return gameStore.isLevelCompleted(levelId)
}

const selectLevel = (level) => {
  if (!isLevelUnlocked(level.id)) {
    return
  }
  router.push(`/level/${level.id}`)
}
</script>

<style scoped>
.level-selector {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.selector-title {
  font-size: 24px;
  text-align: center;
  margin-bottom: 20px;
}

.level-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 8px;
}

.level-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background-color: white;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.level-item:hover:not(.locked) {
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: #fff5f6;
}

.level-item.locked {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f5f5f5;
}

.level-item.completed {
  background-color: #f0fff0;
}

.level-number {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  color: white;
  font-size: 20px;
  font-weight: bold;
  border-radius: 50%;
  flex-shrink: 0;
}

.level-details {
  flex: 1;
}

.level-name {
  font-size: 18px;
  font-weight: bold;
  color: var(--text-color);
  margin-bottom: 4px;
}

.level-subtitle {
  font-size: 14px;
  color: #666;
}

.level-status {
  font-size: 24px;
  flex-shrink: 0;
}

.lock-icon {
  opacity: 0.5;
}

.check-icon {
  color: #4caf50;
}

.arrow-icon {
  color: var(--primary-color);
}

@media (max-width: 768px) {
  .level-selector {
    padding: 16px;
  }

  .selector-title {
    font-size: 20px;
  }

  .level-item {
    padding: 12px;
    gap: 12px;
  }

  .level-number {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .level-name {
    font-size: 16px;
  }

  .level-subtitle {
    font-size: 12px;
  }
}

/* 第五关规则破坏样式 */
.broken-level {
  background-color: #1a0000 !important;
  border-color: #cc3333 !important;
}

.broken-level:hover {
  background-color: #2a0000 !important;
}

.broken-number {
  background-color: #cc3333 !important;
}

.broken-name {
  color: #cc3333;
  font-weight: bold;
}

.strikethrough {
  position: relative;
  display: inline-block;
}

.strikethrough::after {
  content: '';
  position: absolute;
  left: -4px;
  right: -4px;
  top: 50%;
  height: 2px;
  background: #cc3333;
  animation: strike-through 0.6s ease forwards;
}

@keyframes strike-through {
  0% { width: 0; }
  100% { width: calc(100% + 8px); }
}

.broken-level .level-subtitle {
  color: #993333;
}

.broken-level .check-icon {
  color: #cc3333 !important;
}
</style>
