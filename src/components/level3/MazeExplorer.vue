<template>
  <div class="maze-explorer" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <!-- 迷宫视口 -->
    <div class="maze-viewport">
      <Transition :name="transitionName" mode="out-in" @after-enter="onTransitionEnd">
        <img
          class="maze-image"
          :src="currentImageUrl"
          :key="currentNodeId"
          :alt="currentNode.type"
          @click="handleImageClick"
          draggable="false"
        />
      </Transition>

      <!-- 方向指示区域 -->
      <div class="direction-hints">
        <div
          class="hint-area hint-top"
          :class="{ active: canMove.f }"
          @click="move('f')"
        >
          <span v-if="canMove.f" class="hint-icon">▲</span>
        </div>
        <div
          class="hint-area hint-left"
          :class="{ active: canMove.l }"
          @click="move('l')"
        >
          <span v-if="canMove.l" class="hint-icon">◄</span>
        </div>
        <div
          class="hint-area hint-right"
          :class="{ active: canMove.r }"
          @click="move('r')"
        >
          <span v-if="canMove.r" class="hint-icon">►</span>
        </div>
        <div
          class="hint-area hint-bottom"
          :class="{ active: canMove.b }"
          @click="move('b')"
        >
          <span v-if="canMove.b" class="hint-icon">▼</span>
        </div>
      </div>

      <!-- 终点提示 -->
      <Transition name="miku-toast">
        <div v-if="showEndHint" class="end-hint">
          {{ endHintMessage }}
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { getImageUrl } from '@/utils/imageHelper'
import mazeData from '@/data/level3/mazeMap.json'

const emit = defineEmits(['win'])

const currentNodeId = ref(mazeData.startNode)
const foundMikus = reactive(new Set())
const isTransitioning = ref(false)
const transitionDirection = ref('f')
const showEndHint = ref(false)
const endHintMessage = ref('')

let endHintTimer = null

const currentNode = computed(() => mazeData.nodes[currentNodeId.value])

const currentImageUrl = computed(() =>
  getImageUrl(`images/background/${currentNode.value.image}`)
)

const canMove = computed(() => ({
  f: !!currentNode.value.connections.f,
  b: !!currentNode.value.connections.b,
  l: !!currentNode.value.connections.l,
  r: !!currentNode.value.connections.r,
}))

const transitionName = computed(() => `move-${transitionDirection.value}`)

function move(direction) {
  if (isTransitioning.value) return
  const targetId = currentNode.value.connections[direction]
  if (!targetId) return

  transitionDirection.value = direction
  isTransitioning.value = true
  currentNodeId.value = targetId
}

// 处理图片点击：根据点击位置判断方向
function handleImageClick(event) {
  if (isTransitioning.value) return

  const rect = event.currentTarget.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const width = rect.width
  const height = rect.height

  // 定义有效区域：距离边缘30%的区域
  const threshold = 0.3
  const xThreshold = width * threshold
  const yThreshold = height * threshold

  let direction = null

  // 判断点击在哪个区域
  if (Math.abs(x - width / 2) > Math.abs(y - height / 2)) {
    // 左右区域
    if (x < xThreshold) {
      direction = 'l' // 点击左侧
    } else if (x > width - xThreshold) {
      direction = 'r' // 点击右侧
    }
  } else {
    // 上下区域
    if (y < yThreshold) {
      direction = 'f' // 点击上方
    } else if (y > height - yThreshold) {
      direction = 'b' // 点击下方
    }
  }

  if (direction) {
    move(direction)
  } else {
    // 点击中心区域，检查是否有miku
    checkMiku()
  }
}

function onTransitionEnd() {
  isTransitioning.value = false
  checkMiku()
  checkEnd()
}

function checkMiku() {
  const node = currentNode.value
  if (node.hasMiku && !foundMikus.has(node.mikuId)) {
    foundMikus.add(node.mikuId)
  }
}

function checkEnd() {
  if (currentNodeId.value === mazeData.endNode) {
    if (foundMikus.size >= mazeData.totalMikus) {
      // 找到全部7个miku
      endHintMessage.value = '🎉 恭喜通关！你找到了全部7个miku！'
      showEndHint.value = true
      clearTimeout(endHintTimer)
      endHintTimer = setTimeout(() => {
        showEndHint.value = false
        emit('win')
      }, 2000)
    } else {
      // 直接通关
      emit('win')
    }
  }
}

// 图片预加载
watch(currentNodeId, () => {
  const node = currentNode.value
  Object.values(node.connections).forEach(targetId => {
    if (targetId) {
      const targetNode = mazeData.nodes[targetId]
      if (targetNode) {
        const img = new Image()
        img.src = getImageUrl(`images/background/${targetNode.image}`)
      }
    }
  })
}, { immediate: true })

// 触摸手势
let touchStartX = 0
let touchStartY = 0

function onTouchStart(e) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function onTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  const MIN_SWIPE = 50

  if (Math.abs(dx) < MIN_SWIPE && Math.abs(dy) < MIN_SWIPE) return

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > MIN_SWIPE) move('l')      // 向右滑 = 左
    else if (dx < -MIN_SWIPE) move('r') // 向左滑 = 右
  } else {
    if (dy < -MIN_SWIPE) move('f')   // 向上滑 = 前
    else if (dy > MIN_SWIPE) move('b') // 向下滑 = 后
  }
}
</script>

<style scoped>
.maze-explorer {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  position: relative;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.miku-counter {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.miku-icon {
  color: #39c5bb;
  font-size: 16px;
}

.coordinate-display {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: monospace;
}

.coord-label {
  color: #ffa500;
  font-weight: bold;
}

.coord-value {
  color: #39c5bb;
  font-weight: bold;
}

.maze-viewport {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.maze-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  cursor: pointer;
}

/* 前进：放大淡出 → 缩小淡入 */
.move-f-leave-active,
.move-f-enter-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.move-f-leave-to {
  transform: scale(1.5);
  opacity: 0;
}
.move-f-enter-from {
  transform: scale(0.7);
  opacity: 0;
}

/* 后退：缩小淡出 → 放大淡入 */
.move-b-leave-active,
.move-b-enter-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.move-b-leave-to {
  transform: scale(0.6);
  opacity: 0;
}
.move-b-enter-from {
  transform: scale(1.5);
  opacity: 0;
}

/* 左转：场景向右滑出 → 从左滑入 */
.move-l-leave-active,
.move-l-enter-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.move-l-leave-to {
  transform: translateX(60%) rotateY(-10deg);
  opacity: 0;
}
.move-l-enter-from {
  transform: translateX(-60%) rotateY(10deg);
  opacity: 0;
}

/* 右转：场景向左滑出 → 从右滑入 */
.move-r-leave-active,
.move-r-enter-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.move-r-leave-to {
  transform: translateX(-60%) rotateY(10deg);
  opacity: 0;
}
.move-r-enter-from {
  transform: translateX(60%) rotateY(-10deg);
  opacity: 0;
}

/* Miku 发现提示 */
.miku-toast {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(57, 197, 187, 0.9);
  color: #fff;
  padding: 16px 28px;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 20;
  pointer-events: none;
}

.toast-icon {
  font-size: 24px;
}

.miku-toast-enter-active {
  transition: all 0.3s ease;
}
.miku-toast-leave-active {
  transition: all 0.5s ease;
}
.miku-toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.5);
}
.miku-toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -70%) scale(0.8);
}

/* 终点未集齐提示 */
.end-hint {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(200, 50, 50, 0.85);
  color: #fff;
  padding: 12px 24px;
  border-radius: 10px;
  font-size: 15px;
  white-space: nowrap;
  z-index: 20;
  pointer-events: none;
}

/* 方向提示区域 */
.direction-hints {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hint-area {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: auto;
  cursor: pointer;
}

.hint-area.active {
  opacity: 0;
}

.hint-area.active:hover {
  opacity: 0.8;
}

.hint-area.active:active {
  opacity: 0.6;
}

.hint-top {
  top: 0;
  left: 30%;
  right: 30%;
  height: 30%;
  background: linear-gradient(to bottom, rgba(57, 197, 187, 0.15), transparent);
}

.hint-bottom {
  bottom: 0;
  left: 30%;
  right: 30%;
  height: 30%;
  background: linear-gradient(to top, rgba(57, 197, 187, 0.15), transparent);
}

.hint-left {
  left: 0;
  top: 30%;
  bottom: 30%;
  width: 30%;
  background: linear-gradient(to right, rgba(57, 197, 187, 0.15), transparent);
}

.hint-right {
  right: 0;
  top: 30%;
  bottom: 30%;
  width: 30%;
  background: linear-gradient(to left, rgba(57, 197, 187, 0.15), transparent);
}

.hint-icon {
  font-size: 56px;
  color: #fff;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.9);
  filter: drop-shadow(0 0 16px rgba(57, 197, 187, 1));
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@media (max-width: 640px) {
  .hint-icon {
    font-size: 42px;
  }
}
</style>
