<template>
  <div class="mini-game-page">
    <!-- 加载中 -->
    <div v-if="!imagesLoaded" class="loading-screen">
      <div class="loading-content">
        <h2>加载中...</h2>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: loadingProgress + '%' }"></div>
        </div>
        <p>{{ loadingProgress }}%</p>
      </div>
    </div>

    <!-- 难度选择 -->
    <div v-else-if="!gameStarted" class="difficulty-selector">
      <TopBar
        title="消除mzk"
        subtitle="选择难度开始游戏"
        :show-level-number="false"
      />
      <div class="selector-content">
        <h2>选择难度</h2>
        <div class="difficulty-cards">
          <div
            v-for="diff in difficulties"
            :key="diff.level"
            class="difficulty-card"
            @click="startGameWithDifficulty(diff.level)"
          >
            <div class="difficulty-icon">
              <img :src="getImageUrl(`images/${diff.icon}.webp`)" :alt="diff.name" class="difficulty-icon-img">
            </div>
            <h3>{{ diff.name }}</h3>
            <p class="difficulty-desc">{{ diff.description }}</p>
            <p class="difficulty-count">{{ diff.count }} 个角色</p>
            <p class="shuffle-count">洗牌 {{ diff.shuffles }} 次</p>
            <p class="shuffle-count">清空 {{ diff.clears }} 次</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 游戏区域 -->
    <div v-else class="game-area">
      <TopBar
        title="消除mzk"
        :subtitle="currentDifficultyName + ' 难度'"
        :show-level-number="false"
      >
        <template #right>
          <button class="reset-btn" @click="resetGame">重新选择</button>
        </template>
      </TopBar>

      <div class="game-info">
        <div class="info-row">
          <div class="info-item">
            <span class="label">剩余：</span>
            <span class="value">{{ remainingCount }}</span>
          </div>
          <div class="info-item">
            <span class="label">洗牌：</span>
            <span class="value">{{ shufflesLeft }}</span>
          </div>
          <div class="info-item">
            <span class="label">清空：</span>
            <span class="value">{{ clearsLeft }}</span>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn btn-small shuffle-btn" @click="shuffle" :disabled="shufflesLeft <= 0">
            <img :src="shuffleIconUrl" alt="洗牌" class="shuffle-icon">
            洗牌
          </button>
          <button class="btn btn-small clear-btn" @click="clearSlots" :disabled="clearsLeft <= 0">
            <img :src="clearIconUrl" alt="清空" class="clear-icon">
            清空
          </button>
          <button class="btn btn-small restart-btn" @click="replay">
            重新开始
          </button>
        </div>
      </div>

      <!-- 游乐场 -->
      <div class="playground">
        <div
          v-for="character in characterList"
          :key="character.id"
          v-show="!character.collected"
          class="character-item"
          :class="{
            'character-touching': character.touching,
            'character-blocked': !topOfStack.has(character.id)
          }"
          :style="{
            left: `${character.x}%`,
            top: `${character.y}%`,
            transform: `translate(-50%, -50%) rotate(${character.rotation}deg)`,
            zIndex: character.zIndex
          }"
          @click="collectCharacter(character)"
          @touchstart="handleTouchStart(character)"
          @touchend="handleTouchEnd(character)"
        >
          <img
            :src="getImageUrl(`images/${character.name}.webp`)"
            :alt="character.name"
            class="character-img"
            decoding="async"
          />
        </div>
      </div>

      <!-- 收集槽 -->
      <div class="collection-area">
        <div class="collection-slots">
          <div
            v-for="(slot, index) in slots"
            :key="index"
            class="slot"
            :class="{ empty: !slot }"
          >
            <img
              v-if="slot"
              :src="getImageUrl(`images/${slot}.webp`)"
              :alt="slot"
              class="slot-img"
              :class="{ removing: removingSlots.includes(index) }"
            />
          </div>
        </div>
      </div>

      <!-- 胜利提示 -->
      <div v-if="gameWon" class="win-overlay">
        <div class="win-message">
          <h2>🎉 恭喜通关！</h2>
          <p>你成功消除了所有角色！</p>
          <div class="win-buttons">
            <button class="btn" @click="replay">再玩一次</button>
            <button class="btn" @click="resetGame">选择难度</button>
            <button class="btn" @click="goBack">返回主页</button>
          </div>
        </div>
      </div>

      <!-- 失败提示 -->
      <div v-if="gameLost" class="lose-overlay">
        <div class="lose-message">
          <h2>😢 游戏失败</h2>
          <p>格子已满，无法继续消除</p>
          <div class="lose-buttons">
            <button class="btn" @click="replay">重新开始</button>
            <button class="btn" @click="resetGame">选择难度</button>
            <button class="btn" @click="goBack">返回主页</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import gameConfig from '@/data/minigame/eliminate-mzk.json'
import { getImageUrl } from '@/utils/imageHelper'

const router = useRouter()

const ALL_CHARACTERS = gameConfig.characters
const difficulties = gameConfig.difficulties
const STACK_DEPTH = 3 // 每个牌堆的层数

const gameStarted = ref(false)
const selectedDifficulty = ref(null)
const characterList = ref([])
const slots = ref([null, null, null, null, null, null])
const shufflesLeft = ref(0)
const clearsLeft = ref(0)
const gameWon = ref(false)
const gameLost = ref(false)
const removingSlots = ref([])
const isClearing = ref(false) // 是否正在消除中
const imagesLoaded = ref(false) // 图片是否加载完成
const loadingProgress = ref(0) // 加载进度

// 获取图标
const shuffleIconUrl = getImageUrl(`images/${gameConfig.icons.shuffle}.webp`)
const clearIconUrl = getImageUrl(`images/${gameConfig.icons.clear}.webp`)

// 预加载所有图片
function preloadImages() {
  return new Promise((resolve) => {
    const imagesToLoad = [
      ...ALL_CHARACTERS.map(char => getImageUrl(`images/${char}.webp`)),
      ...difficulties.map(diff => getImageUrl(`images/${diff.icon}.webp`)),
      shuffleIconUrl,
      clearIconUrl
    ]

    let loaded = 0
    const total = imagesToLoad.length

    if (total === 0) {
      resolve()
      return
    }

    imagesToLoad.forEach(src => {
      const img = new Image()
      img.onload = img.onerror = () => {
        loaded++
        loadingProgress.value = Math.round((loaded / total) * 100)
        if (loaded === total) {
          imagesLoaded.value = true
          resolve()
        }
      }
      img.src = src
    })
  })
}

// 页面加载时预加载图片
preloadImages()

const currentDifficultyName = computed(() => {
  const diff = difficulties.find(d => d.level === selectedDifficulty.value)
  return diff ? diff.name : ''
})

const remainingCount = computed(() => {
  return characterList.value.filter(c => !c.collected).length
})

// 计算每个牌堆最顶部的牌（可点击）
const topOfStack = computed(() => {
  const tops = new Map()
  characterList.value.forEach(c => {
    if (!c.collected) {
      const cur = tops.get(c.stackId)
      if (!cur || c.zIndex > cur.zIndex) {
        tops.set(c.stackId, c)
      }
    }
  })
  return new Set([...tops.values()].map(c => c.id))
})

function startGameWithDifficulty(level) {
  selectedDifficulty.value = level
  const diff = difficulties.find(d => d.level === level)
  shufflesLeft.value = diff.shuffles
  clearsLeft.value = diff.clears
  gameStarted.value = true
  characterList.value = generateCharacterList(diff.count)
  slots.value = [null, null, null, null, null, null]
  gameWon.value = false
  gameLost.value = false
}

function generateCharacterList(total) {
  // 确保每种角色数量是3的倍数
  const charactersPerType = 3
  const typesNeeded = Math.floor(total / charactersPerType)

  // 随机选择角色类型（允许重复使用角色）
  const selectedTypes = []

  for (let i = 0; i < typesNeeded; i++) {
    const randomIndex = Math.floor(Math.random() * ALL_CHARACTERS.length)
    selectedTypes.push(ALL_CHARACTERS[randomIndex])
  }

  // 生成角色列表（每种角色3个）
  const list = []
  let id = 0

  for (const type of selectedTypes) {
    for (let i = 0; i < charactersPerType; i++) {
      list.push({
        id: id++,
        name: type,
        collected: false,
        touching: false
      })
    }
  }

  // 随机打乱
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]]
  }

  // 分配位置
  return assignPositions(list)
}

function assignPositions(list) {
  const result = []
  const count = list.length
  const stackCount = Math.ceil(count / STACK_DEPTH)

  // 根据设备类型和数量计算最佳网格
  const isMobile = window.innerWidth < 768
  const playgroundWidth = isMobile ? window.innerWidth : Math.min(window.innerWidth * 0.8, 1200)

  // 计算合适的列数
  const itemSize = isMobile ? 100 : 120
  const minSpacing = isMobile ? 20 : 30
  const maxCols = Math.floor(playgroundWidth / (itemSize + minSpacing))

  // 根据牌堆数量计算列数
  let cols = Math.min(maxCols, Math.ceil(Math.sqrt(stackCount * 1.2)))
  cols = Math.max(3, Math.min(cols, isMobile ? 4 : 6))

  const rows = Math.ceil(stackCount / cols)

  // 计算实际可用空间（留出边距）
  const marginX = 8
  const marginY = 8
  const usableWidth = 100 - marginX * 2
  const usableHeight = 100 - marginY * 2

  const cellWidth = usableWidth / cols
  const cellHeight = usableHeight / rows

  // 生成牌堆位置
  const stackPositions = []
  for (let i = 0; i < stackCount; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)

    const x = marginX + col * cellWidth + cellWidth / 2
    const y = marginY + row * cellHeight + cellHeight / 2

    stackPositions.push({ x, y })
  }

  // 随机打乱牌堆位置
  for (let i = stackPositions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [stackPositions[i], stackPositions[j]] = [stackPositions[j], stackPositions[i]]
  }

  // 分配角色到牌堆
  list.forEach((char, index) => {
    const stackId = Math.floor(index / STACK_DEPTH)
    const layerIndex = index % STACK_DEPTH
    const pos = stackPositions[stackId]

    result.push({
      ...char,
      stackId,
      x: pos.x + layerIndex * 1.2,
      y: pos.y + layerIndex * 1.2,
      rotation: (Math.random() - 0.5) * 10,
      zIndex: stackId * STACK_DEPTH + layerIndex
    })
  })

  return result
}

function shuffle() {
  if (shufflesLeft.value <= 0) return

  shufflesLeft.value--

  // 重新分配未收集角色的位置和牌堆
  const uncollected = characterList.value.filter(c => !c.collected)
  const reassigned = assignPositions(uncollected)

  // 更新位置
  let reassignedIndex = 0
  characterList.value = characterList.value.map(char => {
    if (!char.collected) {
      return reassigned[reassignedIndex++]
    }
    return char
  })
}

function clearSlots() {
  if (clearsLeft.value <= 0) return

  clearsLeft.value--

  // 将槽位中的角色放回游戏区域
  const slotsToReturn = slots.value.filter(s => s !== null)

  if (slotsToReturn.length === 0) return

  // 清空槽位
  slots.value = [null, null, null, null, null, null]

  // 为要放回的角色生成随机位置
  const returnedCharacters = []

  slotsToReturn.forEach(slotName => {
    // 找到第一个匹配的已收集角色
    const char = characterList.value.find(c => c.name === slotName && c.collected)
    if (char) {
      char.collected = false
      returnedCharacters.push(char)
    }
  })

  // 重新分配所有未收集角色的牌堆和位置
  if (returnedCharacters.length > 0) {
    const allUncollected = characterList.value.filter(c => !c.collected)
    const newPositions = assignPositions(allUncollected)

    allUncollected.forEach((char, index) => {
      char.x = newPositions[index].x
      char.y = newPositions[index].y
      char.rotation = newPositions[index].rotation
      char.zIndex = newPositions[index].zIndex
      char.stackId = newPositions[index].stackId
    })
  }
}

function collectCharacter(character) {
  if (character.collected || gameWon.value || gameLost.value || isClearing.value) return

  // 只允许点击牌堆最顶部的牌
  if (!topOfStack.value.has(character.id)) return

  // 找到第一个空槽位
  const emptySlotIndex = slots.value.findIndex(slot => slot === null)

  if (emptySlotIndex === -1) {
    // 没有空槽位，游戏失败
    gameLost.value = true
    return
  }

  // 标记角色为已收集
  character.collected = true

  // 放入槽位
  slots.value[emptySlotIndex] = character.name

  // 检查是否有3个相同
  checkAndClear()
}

function checkAndClear() {
  // 统计每种角色的数量和位置
  const counts = {}
  const positions = {}

  slots.value.forEach((slot, index) => {
    if (slot) {
      if (!counts[slot]) {
        counts[slot] = 0
        positions[slot] = []
      }
      counts[slot]++
      positions[slot].push(index)
    }
  })

  // 找到数量>=3的角色
  for (const [name, count] of Object.entries(counts)) {
    if (count >= 3) {
      // 设置消除锁
      isClearing.value = true

      // 标记要移除的槽位（前3个）
      const slotsToRemove = positions[name].slice(0, 3)
      removingSlots.value = slotsToRemove

      // 等待动画完成后再移除
      setTimeout(() => {
        // 消除3个
        let removed = 0
        slots.value = slots.value.map((slot, index) => {
          if (slotsToRemove.includes(index)) {
            removed++
            return null
          }
          return slot
        })

        // 整理槽位（将null移到后面）
        const nonNull = slots.value.filter(s => s !== null)
        const nullCount = 6 - nonNull.length
        slots.value = [...nonNull, ...Array(nullCount).fill(null)]

        // 清空移除标记
        removingSlots.value = []

        // 递归检查是否还有可消除的
        checkAndClear()
      }, 500) // 动画持续时间

      return
    }
  }

  // 没有可消除的了，解除消除锁
  isClearing.value = false

  // 检查是否胜利（所有角色都已收集且槽位为空）
  if (remainingCount.value === 0 && slots.value.every(s => s === null)) {
    gameWon.value = true
    return
  }

  // 检查是否失败（槽位满了）
  if (slots.value.every(s => s !== null)) {
    gameLost.value = true
  }
}

function handleTouchStart(character) {
  if (!character.collected && !gameWon.value && !gameLost.value) {
    character.touching = true
  }
}

function handleTouchEnd(character) {
  if (character.touching) {
    character.touching = false
  }
}

function replay() {
  startGameWithDifficulty(selectedDifficulty.value)
}

function resetGame() {
  gameStarted.value = false
  selectedDifficulty.value = null
  characterList.value = []
  slots.value = [null, null, null, null, null, null]
  gameWon.value = false
  gameLost.value = false
}

function goBack() {
  router.push('/')
}
</script>

<style scoped>
.mini-game-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fff 0%, #fff5f6 100%);
}

/* 难度选择 */
.difficulty-selector {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.selector-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.selector-content h2 {
  font-size: 32px;
  margin-bottom: 40px;
  color: var(--text-color);
}

.difficulty-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  max-width: 900px;
  width: 100%;
  margin-bottom: 40px;
}

.difficulty-card {
  background: white;
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 30px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.difficulty-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.difficulty-icon {
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.difficulty-icon-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.difficulty-card h3 {
  font-size: 24px;
  margin-bottom: 12px;
  color: var(--text-color);
}

.difficulty-desc {
  color: #666;
  margin-bottom: 8px;
}

.difficulty-count,
.shuffle-count {
  font-weight: bold;
  color: var(--primary-color);
  margin: 4px 0;
}

/* 游戏区域 */
.game-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 20px;
  background: white;
  border-bottom: 2px solid var(--border-color);
}

.info-row {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.btn-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  color: #666;
}

.value {
  font-weight: bold;
  color: var(--primary-color);
}

.btn-small {
  padding: 8px 16px;
  font-size: 14px;
}

.btn-small:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.shuffle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.shuffle-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.clear-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.clear-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.restart-btn {
  display: flex;
  align-items: center;
}

.reset-btn {
  padding: 8px 16px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: all 0.3s;
  white-space: nowrap;
}

.reset-btn:hover {
  transform: scale(1.05);
}

/* 游乐场 */
.playground {
  position: relative;
  flex: 1;
  min-height: 500px;
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  overflow: hidden;
}

@media (max-width: 768px) {
  .playground {
    min-height: 400px;
  }
}

.character-item {
  position: absolute;
  cursor: pointer;
  transition: transform 0.2s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  touch-action: manipulation;
  padding: 10px;
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.character-touching {
  transform: translate(-50%, -50%) scale(1.15) !important;
  z-index: 9999 !important;
}

.character-blocked {
  filter: brightness(0.7) saturate(0.5);
  pointer-events: none;
  cursor: default;
}

@media (hover: hover) {
  .character-item:hover {
    transform: translate(-50%, -50%) scale(1.2) !important;
    z-index: 9999 !important;
  }

  .character-item:active {
    transform: translate(-50%, -50%) scale(1.1) !important;
  }
}

.character-img {
  width: 100px;
  height: 100px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  pointer-events: none;
}

@media (min-width: 768px) {
  .character-img {
    width: 120px;
    height: 120px;
  }
}

/* 收集槽 */
.collection-area {
  background: white;
  border-top: 3px solid var(--border-color);
  padding: 20px;
  display: flex;
  justify-content: center;
}

.collection-slots {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f8f8f8;
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.slot {
  width: 80px;
  height: 80px;
  background: white;
  border: 3px dashed #ddd;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.slot.empty {
  background: #fafafa;
}

.slot-img {
  width: 70px;
  height: 70px;
  object-fit: contain;
  animation: slideIn 0.3s ease-out;
}

.slot-img.removing {
  animation: removeEffect 0.5s ease-out forwards;
}

@keyframes slideIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes removeEffect {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  30% {
    transform: scale(1.3) rotate(10deg);
    opacity: 1;
  }
  50% {
    transform: scale(1.2) rotate(-10deg);
    opacity: 0.8;
  }
  70% {
    transform: scale(0.8) rotate(180deg);
    opacity: 0.5;
  }
  100% {
    transform: scale(0) rotate(360deg);
    opacity: 0;
  }
}

/* 胜利/失败提示 */
.win-overlay,
.lose-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.win-message,
.lose-message {
  background: white;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  max-width: 400px;
  animation: scaleIn 0.3s;
}

@keyframes scaleIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.win-message h2 {
  font-size: 32px;
  margin-bottom: 16px;
  color: var(--primary-color);
}

.lose-message h2 {
  font-size: 32px;
  margin-bottom: 16px;
  color: #ff4444;
}

.win-message p,
.lose-message p {
  font-size: 18px;
  margin-bottom: 24px;
  color: #666;
}

.win-buttons,
.lose-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (max-width: 768px) {
  .selector-content h2 {
    font-size: 24px;
  }

  .difficulty-cards {
    grid-template-columns: 1fr;
    max-width: 300px;
  }

  .collection-slots {
    gap: 8px;
    padding: 12px;
  }

  .slot {
    width: 60px;
    height: 60px;
  }

  .slot-img {
    width: 50px;
    height: 50px;
  }

  .game-info {
    font-size: 14px;
    gap: 8px;
  }
}

/* 加载屏幕 */
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #fff 0%, #fff5f6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  padding: 40px;
}

.loading-content h2 {
  font-size: 28px;
  margin-bottom: 24px;
  color: var(--text-color);
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 0 auto 16px;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.3s ease;
}

.loading-content p {
  font-size: 18px;
  color: #666;
  font-weight: bold;
}
</style>
