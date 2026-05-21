<template>
  <div class="stage-one">
    <div class="playground">
      <div
        v-for="(mzk, index) in mzkList"
        :key="index"
        class="mzk-item"
        :class="{
          'mzk-dismissed': mzk.dismissed,
          'mzk-touching': mzk.touching
        }"
        :style="{
          left: `${mzk.x}%`,
          top: `${mzk.y}%`,
          transform: `translate(-50%, -50%) rotate(${mzk.rotation}deg)`,
          zIndex: mzk.zIndex
        }"
        @click="handleClick(mzk)"
        @touchstart="handleTouchStart(mzk)"
        @touchend="handleTouchEnd(mzk)"
      >
        <img
          :src="mzk.url"
          :alt="mzk.name"
          class="mzk-image"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>

    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showCorrectDialog" class="dialog-overlay">
          <div class="dialog-content" @click.stop>
            <h3 class="pink-text">找到了</h3>
            <p class="message">你找到了killamzk</p>
            <button class="btn" @click="handleNextStage">
              继续
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getImageUrl } from '@/utils/imageHelper'

const emit = defineEmits(['next'])

const mzkList = ref([])
const showCorrectDialog = ref(false)
const found = ref(false)

// 所有可用的干扰图片（每人只有一个）
const allImages = [
  // mzk 系列
  'images/emumzk.webp',
  'images/侦探mzk.webp',
  'images/倒立mzk.webp',
  'images/倒立走mzk.webp',
  'images/偷听mzk.webp',
  'images/右立mzk.webp',
  'images/吐舌mzk.webp',
  'images/呼啦啦mzk.webp',
  'images/大眼mzk.webp',
  'images/巴巴博一mzk.webp',
  'images/开心mzk.webp',
  'images/怪核mzk.webp',
  'images/惊吓mzk.webp',
  'images/打坐mzk.webp',
  'images/普通mzk.webp',
  'images/松鼠mzk.webp',
  'images/生气mzk.webp',
  'images/肌肉mzk.webp',
  'images/讲话mzk.webp',
  'images/走路mzk.webp',
  'images/跑mzk.webp',
  'images/通通mzk.webp',
  'images/飞行mzk.webp',
  'images/鲨鱼mzk.webp',
  // 普通人物系列（每人一个）
  'images/普通airi.webp',
  'images/普通akito.webp',
  'images/普通an.webp',
  'images/普通emu.webp',
  'images/普通ena.webp',
  'images/普通haruka.webp',
  'images/普通hiho.webp',
  'images/普通honami.webp',
  'images/普通ichika.webp',
  'images/普通kaito.webp',
  'images/普通knd.webp',
  'images/普通kohane.webp',
  'images/普通luka.webp',
  'images/普通meiko.webp',
  'images/普通mfy.webp',
  'images/普通miku.webp',
  'images/普通minori.webp',
  'images/普通nene.webp',
  'images/普通ren.webp',
  'images/普通rin.webp',
  'images/普通rui.webp',
  'images/普通saki.webp',
  'images/普通shizuku.webp',
  'images/普通toya.webp',
  'images/普通tsukasa.webp',
  'images/普通白miku.webp',
  'images/killa晓山瑞希.webp'
]

const TOTAL = allImages.length // 所有图片各一个
const TARGET = 'images/killa晓山瑞希.webp' // 目标 killamzk

// 生成随机位置的角色列表
function generateMzkList() {
  const list = []
  const minDistance = 8 // 最小距离百分比，防止重叠

  // 检查两个位置是否太近
  function isTooClose(x1, y1, x2, y2) {
    const dx = x1 - x2
    const dy = y1 - y2
    return Math.sqrt(dx * dx + dy * dy) < minDistance
  }

  // 创建包含目标的完整列表
  const shuffledImages = [...allImages]
  // 确保目标在列表中
  if (!shuffledImages.includes(TARGET)) {
    shuffledImages.push(TARGET)
  }
  // 随机打乱顺序
  for (let i = shuffledImages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffledImages[i], shuffledImages[j]] = [shuffledImages[j], shuffledImages[i]]
  }

  // 为每个图片生成一个角色
  for (let i = 0; i < shuffledImages.length; i++) {
    const image = shuffledImages[i]
    const isTarget = image === TARGET

    let x, y, attempts = 0
    const maxAttempts = 50

    // 尝试找到一个不重叠的位置
    do {
      x = Math.random() * 70 + 15 // 15% - 85%
      y = Math.random() * 70 + 15 // 15% - 85%
      attempts++

      if (attempts > maxAttempts) break
    } while (list.some(char => isTooClose(x, y, char.x, char.y)))

    list.push({
      id: i,
      name: isTarget ? 'killamzk' : 'character',
      isTarget,
      url: getImageUrl(image),
      x,
      y,
      rotation: Math.random() * 360,
      zIndex: i,
      touching: false,
      dismissed: false
    })
  }

  return list
}

const handleClick = (mzk) => {
  if (found.value) return

  if (mzk.isTarget) {
    found.value = true
    showCorrectDialog.value = true
  } else if (!mzk.dismissed) {
    mzk.dismissed = true
  }
}

const handleTouchStart = (mzk) => {
  if (!mzk.dismissed && !found.value) {
    mzk.touching = true
  }
}

const handleTouchEnd = (mzk) => {
  if (mzk.touching) {
    mzk.touching = false
  }
}

const handleNextStage = () => {
  showCorrectDialog.value = false
  emit('next')
}

onMounted(() => {
  mzkList.value = generateMzkList()
})
</script>

<style scoped>
.stage-one {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.playground {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #1a0000 0%, #330000 100%);
  overflow: hidden;
  contain: layout style;
}

.mzk-item {
  position: absolute;
  cursor: pointer;
  transition: transform 0.2s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  contain: layout style;
}

.mzk-dismissed {
  animation: spin-out 0.5s ease-in forwards;
  pointer-events: none;
}

@keyframes spin-out {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(0deg) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(720deg) scale(0);
  }
}

.mzk-touching {
  transform: translate(-50%, -50%) scale(1.1) !important;
}

@media (hover: hover) {
  .mzk-item:hover {
    transform: translate(-50%, -50%) scale(1.15) !important;
  }

  .mzk-item:active {
    transform: translate(-50%, -50%) scale(1.1) !important;
  }
}

.mzk-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(204, 51, 51, 0.3));
  pointer-events: none;
}

@media (max-width: 640px) {
  .mzk-image {
    width: 96px;
    height: 96px;
  }
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
</style>