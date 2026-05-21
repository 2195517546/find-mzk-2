<template>
  <div class="stage-two">
    <div class="instruction">
      <h3 class="pink-text">复活死去的mzk</h3>
    </div>

    <div class="ritual-area">
      <!-- 打坐mzk -->
      <div class="meditating-mzk">
        <img :src="meditatingMzkUrl" alt="打坐mzk" class="mzk-image">
      </div>

      <!-- 倒五芒星 -->
      <div class="pentagram-container">
        <svg class="pentagram" viewBox="0 0 300 300">
          <!-- 倒五芒星 -->
          <polygon
            points="150,30 250,240 50,240"
            fill="none"
            stroke="#cc3333"
            stroke-width="2"
          />
          <polygon
            points="150,30 250,240"
            fill="none"
            stroke="#cc3333"
            stroke-width="2"
          />
          <polygon
            points="250,240 50,240"
            fill="none"
            stroke="#cc3333"
            stroke-width="2"
          />
          <polygon
            points="50,240 150,30"
            fill="none"
            stroke="#cc3333"
            stroke-width="2"
          />
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
          <img v-if="slot.item" :src="slot.item.url" :alt="slot.item.name" class="slot-item">
        </div>
      </div>
    </div>

    <!-- 物品栏 -->
    <div class="items-container">
      <div class="items-title">选择祭品</div>
      <div class="items-grid">
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

const emit = defineEmits(['win'])

const router = useRouter()
const gameStore = useGameStore()

// 正确的物品配置
const correctItems = [
  { level: 1, name: '真实之影', url: 'images/普通mzk.webp', isCorrect: true },
  { level: 2, name: '登录之印', url: 'images/nightcord_logo.webp', isCorrect: true },
  { level: 3, name: '论坛纹章', url: 'images/晓山瑞希发饰.webp', isCorrect: true },
  { level: 4, name: '七分之一的Miku', url: 'images/miku娃娃.webp', isCorrect: true },
  { level: 5, name: '弑逆之牌', url: 'images/killa晓山瑞希卡面.webp', isCorrect: true }
]

// 干扰物品
const distractorItems = [
  { name: '鲨鱼之牌', url: 'images/鲨鱼mzk卡面.png', isCorrect: false },
  { name: '普通mzk', url: 'images/普通mzk.webp', isCorrect: false },
  { name: '开心mzk', url: 'images/开心mzk.webp', isCorrect: false },
  { name: '生气mzk', url: 'images/生气mzk.webp', isCorrect: false },
  { name: '惊吓mzk', url: 'images/惊吓mzk.webp', isCorrect: false },
  { name: '难过mzk', url: 'images/难过mzk.webp', isCorrect: false },
  { name: '哭泣mzk', url: 'images/哭泣mzk.webp', isCorrect: false }
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
const showSuccessDialog = ref(false)
const showFailDialog = ref(false)
const isGlitching = ref(false)

const meditatingMzkUrl = getImageUrl('images/打坐mzk.webp')
const eavesdropMzkUrl = getImageUrl('images/偷听mzk.webp')
const killaMzkUrl = getImageUrl('images/killa晓山瑞希.webp')

// 获取放置区域的样式位置
const getSlotStyle = (index) => {
  const positions = [
    { top: '0%', left: '50%', transform: 'translate(-50%, -50%)' }, // 顶部
    { top: '50%', right: '0%', transform: 'translate(50%, -50%)' }, // 右侧
    { bottom: '0%', left: '50%', transform: 'translate(-50%, 50%)' }, // 底部
    { top: '50%', left: '0%', transform: 'translate(-50%, -50%)' }, // 左侧
    { bottom: '10%', left: '10%' } // 底部偏左
  ]
  return positions[index] || {}
}

const allSlotsFilled = computed(() => {
  return slots.value.every(slot => slot.item !== null)
}

const loadItems = () => {
  // 合并所有物品并打乱顺序
  const allItems = [
    ...correctItems.map(item => ({ ...item, url: getImageUrl(item.url) })),
    ...distractorItems.map(item => ({ ...item, url: getImageUrl(item.url) }))
  ]

  // Fisher-Yates 洗牌算法
  for (let i = allItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[allItems[i], allItems[j]] = [allItems[j], allItems[i]]
  }

  availableItems.value = allItems
}

const handleDragStart = (index, event) => {
  draggedItemIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

const handleDrop = (slotIndex, event) => {
  if (draggedItemIndex.value === null) return

  const item = availableItems.value[draggedItemIndex.value]

  // 检查该位置是否已放置物品
  if (slots.value[slotIndex].item) {
    return
  }

  // 放置物品
  slots.value[slotIndex].item = item

  // 从可用物品中移除
  availableItems.value.splice(draggedItemIndex.value, 1)

  draggedItemIndex.value = null
}

const startRitual = () => {
  // 验证所有物品是否正确
  const isAllCorrect = slots.value.every((slot, index) => {
    if (!slot.item) return false
    return slot.item.level === slot.level && slot.item.isCorrect
  })

  if (isAllCorrect) {
    showSuccessDialog.value = true
    // 开始闪烁效果
    setTimeout(() => {
      isGlitching.value = true
    }, 1000)
  } else {
    showFailDialog.value = true
  }
}

const handleWin = () => {
  showSuccessDialog.value = false

  // 标记规则破坏第二条
  gameStore.breakRule2()

  // 保存进度
  gameStore.completeLevel(6)

  // 跳转到首页
  router.push('/')
}

const handleRetry = () => {
  showFailDialog.value = false
  // 清空所有放置的物品
  slots.value.forEach(slot => {
    slot.item = null
  })
  // 重新加载物品
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
  width: 300px;
  height: 300px;
}

.pentagram {
  width: 100%;
  height: 100%;
  animation: rotate 60s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.slot {
  position: absolute;
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.9);
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
}

.center-prompt {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 16px 32px;
  background: var(--primary-color);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  z-index: 20;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.05);
  }
}

.center-text {
  color: var(--border-color);
  font-size: 16px;
  font-weight: bold;
}

.items-container {
  background: #fff5f6;
  border: 2px solid var(--primary-color);
  border-radius: 12px;
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
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
  overflow-y: auto;
  max-height: 150px;
}

.item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: grab;
  padding: 4px;
  border: 2px solid transparent;
  border-radius: 8px;
  transition: all 0.3s;
}

.item:hover {
  background: white;
  border-color: var(--primary-color);
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
    grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  }

  .item-image {
    width: 40px;
    height: 40px;
  }
}
</style>