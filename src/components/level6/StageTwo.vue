<template>
  <div class="stage-two">
    <div class="instruction">
      <h3 class="pink-text">复活<del class="struck-text">死去</del>的mzk</h3>
    </div>

    <div class="ritual-area">
      <!-- 打坐mzk -->
      <div class="meditating-mzk">
        <img :src="meditatingMzkUrl" alt="打坐mzk" class="mzk-image">
      </div>

      <!-- 倒五芒星 -->
      <div class="pentagram-container">
        <svg class="pentagram-svg" viewBox="0 0 400 400">
          <!-- 外层大圆 -->
          <circle cx="200" cy="200" r="190" fill="none" stroke="#cc3333" stroke-width="2" opacity="0.6" />

          <!-- 外层装饰圆（虚线） -->
          <circle cx="200" cy="200" r="185" fill="none" stroke="#cc3333" stroke-width="1" stroke-dasharray="8,12" opacity="0.4" />

          <!-- 中层圆 -->
          <circle cx="200" cy="200" r="150" fill="none" stroke="#cc3333" stroke-width="1" stroke-dasharray="10,5" opacity="0.3" />

          <!-- 内层圆 -->
          <circle cx="200" cy="200" r="100" fill="none" stroke="#cc3333" stroke-width="1" stroke-dasharray="5,10" opacity="0.2" />

          <!-- 旋转的装饰花纹 -->
          <g class="rotating-decoration" opacity="0.3">
            <!-- 外圈花纹 -->
            <g fill="none" stroke="#cc3333" stroke-width="1">
              <path d="M 200,10 L 200,30" />
              <path d="M 200,370 L 200,390" />
              <path d="M 10,200 L 30,200" />
              <path d="M 370,200 L 390,200" />

              <!-- 斜向线条 -->
              <path d="M 65.7,65.7 L 78.8,78.8" />
              <path d="M 334.3,65.7 L 321.2,78.8" />
              <path d="M 65.7,334.3 L 78.8,321.2" />
              <path d="M 334.3,334.3 L 321.2,321.2" />
            </g>

            <!-- 外圈三角形装饰 -->
            <polygon
              points="200,15 210,35 190,35"
              fill="none"
              stroke="#cc3333"
              stroke-width="1"
            />
            <polygon
              points="200,385 210,365 190,365"
              fill="none"
              stroke="#cc3333"
              stroke-width="1"
            />
            <polygon
              points="15,200 35,210 35,190"
              fill="none"
              stroke="#cc3333"
              stroke-width="1"
            />
            <polygon
              points="385,200 365,210 365,190"
              fill="none"
              stroke="#cc3333"
              stroke-width="1"
            />
          </g>

          <!-- 反向旋转的符文环 -->
          <g class="rotating-runes" opacity="0.25">
            <text x="200" y="30" text-anchor="middle" fill="#cc3333" font-size="12" font-family="serif">✧</text>
            <text x="340" y="120" text-anchor="middle" fill="#cc3333" font-size="12" font-family="serif">✦</text>
            <text x="340" y="280" text-anchor="middle" fill="#cc3333" font-size="12" font-family="serif">✧</text>
            <text x="60" y="280" text-anchor="middle" fill="#cc3333" font-size="12" font-family="serif">✦</text>
            <text x="60" y="120" text-anchor="middle" fill="#cc3333" font-size="12" font-family="serif">✧</text>
          </g>

          <!-- 静止层：第一层倒五芒星（物品槽位对应） -->
          <g stroke="#cc3333" fill="none" stroke-width="3" opacity="0.8">
            <!-- P1 -> P4 -> P2 -> P5 -> P3 -> P1 -->
            <line x1="200" y1="350" x2="288" y2="80" />
            <line x1="288" y1="80" x2="57" y2="246" />
            <line x1="57" y1="246" x2="343" y2="246" />
            <line x1="343" y1="246" x2="112" y2="80" />
            <line x1="112" y1="80" x2="200" y2="350" />
          </g>

          <!-- 转动层：第二层倒五芒星（装饰用，会旋转） -->
          <g stroke="#cc3333" fill="none" stroke-width="2" opacity="0.4" class="rotating-pentagram">
            <line x1="200" y1="350" x2="288" y2="80" />
            <line x1="288" y1="80" x2="57" y2="246" />
            <line x1="57" y1="246" x2="343" y2="246" />
            <line x1="343" y1="246" x2="112" y2="80" />
            <line x1="112" y1="80" x2="200" y2="350" />
          </g>

          <!-- 中心星形装饰 -->
          <g class="center-star" opacity="0.3">
            <polygon
              points="200,180 205,195 220,195 208,205 212,220 200,210 188,220 192,205 180,195 195,195"
              fill="#cc3333"
              stroke="#cc3333"
              stroke-width="1"
            />
          </g>
        </svg>

        <!-- 中心提示 -->
        <div v-if="allSlotsFilled" class="center-prompt" @click="startRitual">
          <span class="center-text">开始仪式</span>
        </div>

        <!-- 五个放置区域 -->
        <div
          v-for="(slot, index) in slots"
          :key="index"
          class="slot"
          :class="{ 'filled': slot.item }"
          :style="getSlotStyle(index)"
          @dragover.prevent
          @drop="handleDrop(index, $event)"
        >
          <span class="slot-number">{{ slot.level }}</span>
          <div
            v-if="slot.item"
            class="slot-item-wrapper"
            draggable="true"
            @dragstart="handleSlotDragStart(index, $event)"
          >
            <img :src="slot.item.url" :alt="slot.item.name" class="slot-item">
          </div>
        </div>
      </div>
    </div>

    <!-- 物品栏 -->
    <div class="items-container">
      <div class="items-title">拖动祭品</div>
      <div class="items-grid" @dragover.prevent @drop="handleDropToItems">
        <div
          v-for="(item, index) in availableItems"
          :key="index"
          class="item"
          draggable="true"
          @dragstart="handleDragStart(index, $event)"
        >
          <img :src="item.url" :alt="item.name" class="item-image">
          <div class="item-tooltip">{{ item.name }}</div>
        </div>
      </div>
    </div>

    <!-- 成功弹窗 -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showSuccessDialog" class="dialog-overlay" @click="showSuccessDialog = false">
          <div class="dialog-content" @click.stop>
            <h3 class="pink-text">你救赎了晓山瑞希</h3>
            <img :src="eavesdropMzkUrl" alt="偷听mzk" class="eavesdrop-mzk" :class="{ 'glitching': isGlitching }">
            <button class="btn" @click="handleWin">
              返回首页
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 失败弹窗 -->
    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showFailDialog" class="dialog-overlay" @click="showFailDialog = false">
          <div class="dialog-content" @click.stop>
            <h3>物品不正确</h3>
            <p class="message">请重新选择正确的祭品</p>
            <button class="btn" @click="handleRetry">
              重新尝试
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getImageUrl } from '@/utils/imageHelper'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// 正确的物品配置
const correctItems = [
  { level: 1, name: '真实之影', url: 'images/item/普通mzk.webp', isCorrect: true },
  { level: 2, name: '登录之印', url: 'images/item/nightcord_logo.webp', isCorrect: true },
  { level: 3, name: '论坛纹章', url: 'images/item/晓山瑞希发饰.webp', isCorrect: true },
  { level: 4, name: '七分之一的Miku', url: 'images/item/miku娃娃.webp', isCorrect: true },
  { level: 5, name: '弑逆之牌', url: 'images/item/killa晓山瑞希卡面.webp', isCorrect: true }
]

// 干扰物品
const distractorItems = [
  { name: '鲨鱼之牌', url: 'images/item/鲨鱼mzk卡面.png', isCorrect: false }
]

const slots = ref([
  { level: 1, item: null },
  { level: 2, item: null },
  { level: 3, item: null },
  { level: 4, item: null },
  { level: 5, item: null }
])

const availableItems = ref([])
const draggedItemIndex = ref(null)
const draggedSlotIndex = ref(null) // 新增：从插槽拖动的索引
const showSuccessDialog = ref(false)
const showFailDialog = ref(false)
const isGlitching = ref(false)

const meditatingMzkUrl = getImageUrl('images/打坐mzk.webp')
const eavesdropMzkUrl = getImageUrl('images/偷听mzk.webp')

// 获取放置区域的样式位置
const getSlotStyle = (index) => {
  // 倒五芒星的5个顶点在圆上的位置（基于400x400容器，圆心200,200，半径150）
  // 5个等距点，每隔72度，角度：90°, 162°, 234°, 306°, 18°
  // P1(200,350) P2(57,246) P3(112,80) P4(288,80) P5(343,246)
  // 转换成百分比（x/400*100, y/400*100）
  const positions = [
    { bottom: '12.5%', left: '50%', transform: 'translate(-50%, 50%)' },  // P1(200,350) - 第1关
    { bottom: '38.5%', left: '14.3%', transform: 'translate(-50%, 50%)' }, // P2(57,246) - 第2关
    { top: '20%', left: '28%', transform: 'translate(-50%, -50%)' },       // P3(112,80) - 第3关
    { top: '20%', left: '72%', transform: 'translate(-50%, -50%)' },       // P4(288,80) - 第4关
    { bottom: '38.5%', left: '85.7%', transform: 'translate(-50%, 50%)' }  // P5(343,246) - 第5关
  ]
  return positions[index] || {}
}

const allSlotsFilled = computed(() => {
  return slots.value.every(slot => slot.item !== null)
})

const loadItems = () => {
  const allItems = [
    ...correctItems.map(item => ({ ...item, url: getImageUrl(item.url) })),
    ...distractorItems.map(item => ({ ...item, url: getImageUrl(item.url) }))
  ]

  // 随机打乱
  for (let i = allItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[allItems[i], allItems[j]] = [allItems[j], allItems[i]]
  }

  availableItems.value = allItems
}

const handleDragStart = (index, event) => {
  draggedItemIndex.value = index
  draggedSlotIndex.value = null
  event.dataTransfer.effectAllowed = 'move'
}

const handleSlotDragStart = (slotIndex, event) => {
  draggedSlotIndex.value = slotIndex
  draggedItemIndex.value = null
  event.dataTransfer.effectAllowed = 'move'
}

const handleDrop = (slotIndex, event) => {
  // 如果从物品栏拖动到插槽
  if (draggedItemIndex.value !== null && draggedSlotIndex.value === null) {
    const item = availableItems.value[draggedItemIndex.value]

    if (slots.value[slotIndex].item) {
      return
    }

    slots.value[slotIndex].item = item
    availableItems.value.splice(draggedItemIndex.value, 1)
  }
  // 如果从插槽拖动到另一个插槽
  else if (draggedSlotIndex.value !== null) {
    if (draggedSlotIndex.value === slotIndex) {
      return
    }

    const sourceItem = slots.value[draggedSlotIndex.value].item
    const targetItem = slots.value[slotIndex].item

    slots.value[draggedSlotIndex.value].item = targetItem
    slots.value[slotIndex].item = sourceItem
  }

  draggedItemIndex.value = null
  draggedSlotIndex.value = null
}

const handleDropToItems = () => {
  // 如果从插槽拖动物品到物品栏，将物品放回物品栏
  if (draggedSlotIndex.value !== null) {
    const item = slots.value[draggedSlotIndex.value].item
    if (item) {
      slots.value[draggedSlotIndex.value].item = null
      availableItems.value.push(item)
    }
  }

  draggedItemIndex.value = null
  draggedSlotIndex.value = null
}

const startRitual = () => {
  const isAllCorrect = slots.value.every((slot, index) => {
    if (!slot.item) return false
    return slot.item.level === slot.level && slot.item.isCorrect
  })

  if (isAllCorrect) {
    showSuccessDialog.value = true
    setTimeout(() => {
      isGlitching.value = true
    }, 1000)
  } else {
    showFailDialog.value = true
  }
}

const handleWin = () => {
  showSuccessDialog.value = false

  gameStore.breakRule2()
  gameStore.completeLevel(6)

  router.push('/')
}

const handleRetry = () => {
  showFailDialog.value = false
  slots.value.forEach(slot => {
    slot.item = null
  })
  loadItems()
}

onMounted(() => {
  loadItems()
})
</script>

<style scoped>
.stage-two {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
  height: 100%;
  overflow: hidden;
}

.instruction {
  text-align: center;
  margin-bottom: 16px;
}

.instruction h3 {
  font-size: 24px;
  margin: 0;
}

.struck-text {
  text-decoration: line-through;
  text-decoration-color: #cc3333;
  text-decoration-thickness: 2px;
}

.ritual-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 16px;
}

.meditating-mzk {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.mzk-image {
  width: 150px;
  height: 150px;
  object-fit: contain;
  filter: drop-shadow(0 0 20px rgba(204, 51, 51, 0.5));
}

.pentagram-container {
  position: relative;
  width: 400px;
  height: 400px;
}

.pentagram-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.rotating-decoration {
  transform-origin: 200px 200px;
  animation: rotate-decoration 60s linear infinite;
}

.rotating-runes {
  transform-origin: 200px 200px;
  animation: rotate-runes 40s linear infinite reverse;
}

.rotating-pentagram {
  transform-origin: 200px 200px;
  animation: rotate-pentagram 30s linear infinite;
}

@keyframes rotate-decoration {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes rotate-runes {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

@keyframes rotate-pentagram {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.center-star {
  transform-origin: 200px 200px;
  animation: pulse-star 3s ease-in-out infinite;
}

@keyframes pulse-star {
  0%, 100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.6;
  }
}

@media (max-width: 768px) {
  .pentagram-container {
    width: 90vw;
    height: 90vw;
    max-width: 350px;
    max-height: 350px;
  }
}

.slot {
  position: absolute;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.slot:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.slot-number {
  position: absolute;
  top: -8px;
  left: -8px;
  width: 24px;
  height: 24px;
  background: var(--primary-color);
  color: var(--border-color);
  border: 2px solid var(--border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.slot-item {
  width: 60px;
  height: 60px;
  object-fit: contain;
  pointer-events: none;
}

.slot-item-wrapper {
  cursor: grab;
  pointer-events: auto;
}

.slot-item-wrapper:active {
  cursor: grabbing;
}

.center-prompt {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
  z-index: 20;
  animation: pulse 2s ease-in-out infinite;
  padding: 8px 16px;
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.8;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 1;
  }
}

.center-text {
  color: #cc3333;
  font-size: 20px;
  font-weight: bold;
  text-shadow: 0 0 10px rgba(204, 51, 51, 0.8);
  letter-spacing: 2px;
}

.items-container {
  padding: 16px;
  max-height: 30%;
}

.items-title {
  text-align: center;
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 12px;
  font-weight: bold;
}

.items-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  justify-content: center;
  min-height: 60px;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: grab;
  width: 60px;
  height: 60px;
  background: white;
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  padding: 4px;
  transition: all 0.3s;
  position: relative;
}

.item:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(204, 51, 51, 0.3);
}

.item:active {
  cursor: grabbing;
}

.item-image {
  width: 50px;
  height: 50px;
  object-fit: contain;
  pointer-events: none;
}

.item-tooltip {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s;
  z-index: 100;
}

.item:hover .item-tooltip {
  opacity: 1;
}

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background: white;
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.dialog-content h3 {
  font-size: 24px;
  margin: 0 0 16px 0;
}

.message {
  font-size: 16px;
  color: var(--text-color);
  margin: 0 0 24px 0;
}

.eavesdrop-mzk {
  width: 150px;
  height: 150px;
  object-fit: contain;
  margin: 16px 0;
}

.eavesdrop-mzk.glitching {
  animation: glitch 0.2s ease-in-out infinite;
}

@keyframes glitch {
  0%, 100% {
    filter: none;
  }
  50% {
    filter: brightness(0.4) saturate(0.3) hue-rotate(330deg);
  }
}

.btn {
  padding: 12px 32px;
  font-size: 16px;
  background-color: var(--primary-color);
  border: 2px solid var(--border-color);
  color: var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .pentagram-container {
    width: 200px;
    height: 200px;
  }

  .slot {
    width: 60px;
    height: 60px;
  }

  .slot-item {
    width: 45px;
    height: 45px;
  }

  .mzk-image {
    width: 100px;
    height: 100px;
  }

  .items-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .item-image {
    width: 40px;
    height: 40px;
  }
}
</style>