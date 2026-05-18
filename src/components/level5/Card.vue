<template>
  <div
    class="card"
    :class="[`card-${card.type}`, { 'card-disabled': !canPlay, 'card-dragging': isDragging }]"
    :style="cardStyle"
    @mousedown="handleMouseDown"
    @touchstart="handleTouchStart"
  >
    <div class="card-cost">{{ card.cost }}</div>
    <div class="card-image">
      <img :src="cardImageUrl" :alt="card.name" />
    </div>
    <div class="card-name">{{ card.name }}</div>
    <div class="card-effect">
      <span v-if="card.type === 'attack'">伤害: {{ card.damage }}</span>
      <span v-else-if="card.type === 'defense'">护甲: {{ card.armor }}</span>
      <span v-else>{{ card.description }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getImageUrl } from '@/utils/imageHelper'

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  canPlay: {
    type: Boolean,
    default: true
  },
  index: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['dragStart', 'dragMove', 'dragEnd', 'play'])

const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const currentPos = ref({ x: 0, y: 0 })
const dragStartTime = ref(0)
const dragStartPos = ref({ x: 0, y: 0 })
const hasMoved = ref(false)

const cardImageUrl = computed(() => getImageUrl(`images/${props.card.image}`))

const cardStyle = computed(() => {
  if (isDragging.value) {
    return {
      transform: 'translateY(-60px) scale(1.15)',
      zIndex: 1000,
      transition: 'transform 0.2s ease',
      filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4))'
    }
  }
  return {}
})

function handleMouseDown(e) {
  if (!props.canPlay) return

  e.preventDefault()

  dragStartTime.value = Date.now()
  dragStartPos.value = { x: e.clientX, y: e.clientY }
  hasMoved.value = false

  const rect = e.currentTarget.getBoundingClientRect()
  dragOffset.value = {
    x: e.clientX - rect.left - rect.width / 2,
    y: e.clientY - rect.top - rect.height / 2
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

function handleTouchStart(e) {
  if (!props.canPlay) return

  e.preventDefault()
  const touch = e.touches[0]

  dragStartTime.value = Date.now()
  dragStartPos.value = { x: touch.clientX, y: touch.clientY }
  hasMoved.value = false

  const rect = e.currentTarget.getBoundingClientRect()
  dragOffset.value = {
    x: touch.clientX - rect.left - rect.width / 2,
    y: touch.clientY - rect.top - rect.height / 2
  }

  document.addEventListener('touchmove', handleTouchMove, { passive: false })
  document.addEventListener('touchend', handleTouchEnd)
}

function handleMouseMove(e) {
  const moveDistance = Math.sqrt(
    Math.pow(e.clientX - dragStartPos.value.x, 2) +
    Math.pow(e.clientY - dragStartPos.value.y, 2)
  )

  // 移动超过10px才开始拖拽
  if (moveDistance > 10 && !isDragging.value) {
    isDragging.value = true
    hasMoved.value = true
    emit('dragStart', props.card, props.index)
  }

  if (!isDragging.value) return

  currentPos.value = {
    x: e.clientX - dragOffset.value.x,
    y: e.clientY - dragOffset.value.y
  }

  emit('dragMove', { x: e.clientX, y: e.clientY })
}

function handleTouchMove(e) {
  e.preventDefault()
  const touch = e.touches[0]

  const moveDistance = Math.sqrt(
    Math.pow(touch.clientX - dragStartPos.value.x, 2) +
    Math.pow(touch.clientY - dragStartPos.value.y, 2)
  )

  // 移动超过10px才开始拖拽
  if (moveDistance > 10 && !isDragging.value) {
    isDragging.value = true
    hasMoved.value = true
    emit('dragStart', props.card, props.index)
  }

  if (!isDragging.value) return

  currentPos.value = {
    x: touch.clientX - dragOffset.value.x,
    y: touch.clientY - dragOffset.value.y
  }

  emit('dragMove', { x: touch.clientX, y: touch.clientY })
}

function handleMouseUp(e) {
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', handleMouseUp)

  // 如果没有移动或拖拽时间很短，视为点击
  const duration = Date.now() - dragStartTime.value
  if (!hasMoved.value || duration < 150) {
    // 点击事件：非攻击卡直接使用
    if (props.card.type !== 'attack') {
      emit('play', props.card, props.index)
    }
    isDragging.value = false
    return
  }

  if (!isDragging.value) return

  endDrag(e.clientX, e.clientY)
}

function handleTouchEnd(e) {
  document.removeEventListener('touchmove', handleTouchMove)
  document.removeEventListener('touchend', handleTouchEnd)

  // 如果没有移动或拖拽时间很短，视为点击
  const duration = Date.now() - dragStartTime.value
  if (!hasMoved.value || duration < 150) {
    // 点击事件：非攻击卡直接使用
    if (props.card.type !== 'attack') {
      emit('play', props.card, props.index)
    }
    isDragging.value = false
    return
  }

  if (!isDragging.value) return

  const touch = e.changedTouches[0]
  endDrag(touch.clientX, touch.clientY)
}

function endDrag(clientX, clientY) {
  isDragging.value = false
  emit('dragEnd', { x: clientX, y: clientY }, props.card, props.index)
}
</script>

<style scoped>
.card {
  width: 140px;
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  cursor: grab;
  transition: all 0.3s ease;
  position: relative;
  user-select: none;
}

.card:active {
  cursor: grabbing;
}

.card:hover:not(.card-disabled) {
  transform: translateX(calc(-50% + var(--card-offset, 0px))) translateY(-50px) scale(1.1) !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  z-index: 100 !important;
}

.card-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-dragging {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
  transform: scale(1.1);
}

.card-attack {
  border-color: #FF6B6B;
}

.card-defense {
  border-color: #4ECDC4;
}

.card-skill {
  border-color: #95E1D3;
}

.card-cost {
  position: absolute;
  top: 4px;
  left: 4px;
  width: 28px;
  height: 28px;
  background: var(--border-color);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.card-image {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
}

.card-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.card-name {
  font-size: 14px;
  font-weight: bold;
  color: var(--border-color);
  text-align: center;
  margin-bottom: 4px;
}

.card-effect {
  font-size: 12px;
  color: #666;
  text-align: center;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 640px) {
  .card {
    width: 110px;
    padding: 6px;
  }

  .card-image {
    height: 60px;
  }

  .card-name {
    font-size: 12px;
  }

  .card-effect {
    font-size: 11px;
  }
}
</style>

