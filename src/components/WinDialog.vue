<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="show" class="dialog-overlay" @click="handleOverlayClick">
        <!-- 第五关特殊弹窗 -->
        <div v-if="variant === 'dark'" class="dialog-content dark-variant" @click.stop>
          <div class="dialog-header">
            <h2 class="dark-text">不恭喜通关</h2>
          </div>
          <div class="dialog-body">
            <p class="message dark-text">{{ message }}</p>
            <div class="level-info dark-text">
              <span>第{{ currentLevel }}关</span>
              <span class="separator">·</span>
              <span>{{ levelName }}</span>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-dark" @click="goHome">
              返回首页
            </button>
          </div>
        </div>
        <!-- 普通弹窗 -->
        <div v-else class="dialog-content" @click.stop>
          <div class="dialog-header">
            <h2 class="pink-text">🎉 恭喜通关！</h2>
          </div>
          <div class="dialog-body">
            <p class="message">{{ message }}</p>
            <div class="level-info">
              <span>第{{ currentLevel }}关</span>
              <span class="separator">·</span>
              <span>{{ levelName }}</span>
            </div>
            <div v-if="tip" class="tip-box">
              <p class="tip-text">{{ tip }}</p>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" @click="goHome">
              返回首页
            </button>
            <button class="btn btn-restart" @click="restart">
              重新开始
            </button>
            <button v-if="hasNextLevel" class="btn btn-primary" @click="nextLevel">
              下一关
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { MAX_LEVEL } from '@/stores/game'
import tipsData from '@/data/tips.json'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  currentLevel: {
    type: Number,
    required: true
  },
  levelName: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: '你成功找到了晓山瑞希！'
  },
  totalLevels: {
    type: Number,
    default: MAX_LEVEL
  },
  variant: {
    type: String,
    default: 'normal'
  }
})

const emit = defineEmits(['close', 'next', 'restart'])

const router = useRouter()

const hasNextLevel = computed(() => props.currentLevel < props.totalLevels)

const tips = ref([])
const tip = ref('')

const loadTips = () => {
  try {
    tips.value = tipsData
    // 加载完成后立即生成一个tip
    if (props.show && props.currentLevel !== 5) {
      generateTip()
    }
  } catch (error) {
    console.error('加载tips失败:', error)
  }
}

const getRandomTip = () => {
  if (tips.value.length === 0) return ''
  const randomIndex = Math.floor(Math.random() * tips.value.length)
  return tips.value[randomIndex]
}

const generateTip = () => {
  tip.value = getRandomTip()
}

onMounted(() => {
  loadTips()
})

watch(() => props.show, (newVal) => {
  if (newVal && props.currentLevel !== 5 && tips.value.length > 0) {
    generateTip()
  }
})

const handleOverlayClick = () => {
  emit('close')
}

const goHome = () => {
  emit('close')
  router.push('/')
}

const nextLevel = () => {
  emit('next')
  emit('close')
}

const restart = () => {
  emit('restart')
  emit('close')
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  text-align: center;
  margin-bottom: 24px;
}

.dialog-header h2 {
  font-size: 28px;
  margin: 0;
}

.dialog-body {
  text-align: center;
  margin-bottom: 24px;
}

.message {
  font-size: 18px;
  margin-bottom: 16px;
  color: var(--text-color);
  white-space: pre-line;
}

.level-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.tip-box {
  background: white;
  border: 2px solid var(--border-color);
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 16px;
}

.tip-text {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.separator {
  margin: 0 8px;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-primary {
  background-color: var(--primary-color);
}

.btn-secondary {
  background-color: #f0f0f0;
}

.btn-restart {
  background-color: #fff3e0;
  color: #e65100;
}

/* 动画效果 */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-active .dialog-content,
.dialog-leave-active .dialog-content {
  transition: transform 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.8);
}

@media (max-width: 768px) {
  .dialog-content {
    padding: 24px;
  }

  .dialog-header h2 {
    font-size: 24px;
  }

  .message {
    font-size: 16px;
  }

  .dialog-footer {
    flex-direction: column;
  }
}

/* 第五关黑暗变体 */
.dark-variant {
  background-color: #1a1a1a;
  border: 3px solid #cc3333;
}

.dark-text {
  color: #cc3333 !important;
}

.dark-variant .dialog-header h2 {
  font-size: 28px;
}

.dark-variant .message {
  color: #cc3333;
}

.dark-variant .level-info {
  color: #cc3333;
}

.btn-dark {
  background-color: #330000;
  color: #cc3333;
  border: 2px solid #cc3333;
}

.btn-dark:hover {
  background-color: #cc3333;
  color: #1a1a1a;
}
</style>
