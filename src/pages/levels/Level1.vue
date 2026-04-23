<script setup>
import { ref, onMounted } from 'vue'
import levelConfig from '@/data/level1/config.json'

const emit = defineEmits(['win'])
const found = ref(false)

const TARGET = levelConfig.target
const FILLERS = levelConfig.fillers
const TOTAL = levelConfig.totalCharacters
const characterList = ref([])

// 生成随机位置的角色列表
function generateCharacterList() {
  const list = []
  const minDistance = 8 // 最小距离百分比，防止重叠

  // 检查两个位置是否太近
  function isTooClose(x1, y1, x2, y2) {
    const dx = x1 - x2
    const dy = y1 - y2
    return Math.sqrt(dx * dx + dy * dy) < minDistance
  }

  // 先生成目标（晓山瑞希），放在第一个（z-index最低）
  let targetX = Math.random() * 70 + 15
  let targetY = Math.random() * 70 + 15

  list.push({
    id: 0,
    name: TARGET,
    isTarget: true,
    x: targetX,
    y: targetY,
    rotation: Math.random() * 360,
    zIndex: 0, // 最底层
    touching: false // 触摸状态
  })

  // 然后生成所有干扰项，覆盖在目标上方
  for (let i = 1; i < TOTAL; i++) {
    const name = FILLERS[Math.floor(Math.random() * FILLERS.length)]

    let x, y, attempts = 0
    const maxAttempts = 50

    // 尝试找到一个不重叠的位置
    do {
      x = Math.random() * 70 + 15 // 15% - 85%
      y = Math.random() * 70 + 15 // 15% - 85%
      attempts++

      // 如果尝试太多次，放宽距离限制
      if (attempts > maxAttempts) break
    } while (list.some(char => isTooClose(x, y, char.x, char.y)))

    list.push({
      id: i,
      name,
      isTarget: false,
      x,
      y,
      rotation: Math.random() * 360,
      zIndex: i, // 层级递增
      touching: false // 触摸状态
    })
  }

  return list
}

onMounted(() => {
  characterList.value = generateCharacterList()
})

function getImageUrl(name) {
  // 对文件名进行 URL 编码，处理中文字符
  return `/assets/images/${encodeURIComponent(name)}.webp`
}

function onFound() {
  if (found.value) return
  found.value = true
  emit('win')
}

function handleClick(character) {
  if (character.isTarget) {
    onFound()
  } else if (!character.dismissed) {
    character.dismissed = true
  }
}

// 处理触摸开始（手机端）
function handleTouchStart(character) {
  if (!character.dismissed && !found.value) {
    character.touching = true
  }
}

// 处理触摸结束（手机端）
function handleTouchEnd(character) {
  if (character.touching) {
    character.touching = false
  }
}

function handleReplay() {
  characterList.value = generateCharacterList()
  found.value = false
}
</script>

<template>
  <!-- 游乐场 -->
  <div class="playground">
    <div
      v-for="character in characterList"
      :key="character.id"
      class="character-item"
      :class="{
        'character-dismissed': character.dismissed,
        'character-touching': character.touching
      }"
      :style="{
        left: `${character.x}%`,
        top: `${character.y}%`,
        transform: `translate(-50%, -50%) rotate(${character.rotation}deg)`,
        zIndex: character.zIndex
      }"
      @click="handleClick(character)"
      @touchstart="handleTouchStart(character)"
      @touchend="handleTouchEnd(character)"
    >
      <img
        :src="getImageUrl(character.name)"
        :alt="character.name"
        class="character-img"
        loading="lazy"
        decoding="async"
      />
    </div>
  </div>
</template>

<style scoped>
/* ── 游乐场 ── */
.playground {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: calc(100vh - 120px);
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  overflow: hidden;
  /* 性能优化 */
  will-change: scroll-position;
  transform: translateZ(0);
}

.character-item {
  position: absolute;
  cursor: pointer;
  transition: transform 0.2s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  /* 性能优化 */
  will-change: transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
}

.character-dismissed {
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

/* 手机端触摸效果 */
.character-touching {
  transform: translate(-50%, -50%) scale(1.1) !important;
}

/* 电脑端悬停效果 */
@media (hover: hover) {
  .character-item:hover {
    transform: translate(-50%, -50%) scale(1.15) !important;
  }

  .character-item:active {
    transform: translate(-50%, -50%) scale(1.1) !important;
  }
}

.character-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  pointer-events: none;
  /* 性能优化 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

@media (max-width: 640px) {
  .character-img {
    width: 96px;
    height: 96px;
  }
}
</style>
