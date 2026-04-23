<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="show" class="dialog-overlay" @click="handleOverlayClick">
        <div class="dialog-content" @click.stop>
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
          </div>
          <div class="dialog-footer">
            <button class="btn btn-secondary" @click="goHome">
              返回首页
            </button>
            <button v-if="hasNextLevel" class="btn btn-primary" @click="nextLevel">
              下一关 →
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

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
    default: 10
  }
})

const emit = defineEmits(['close', 'next'])

const router = useRouter()

const hasNextLevel = computed(() => props.currentLevel < props.totalLevels)

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
}

.level-info {
  font-size: 14px;
  color: #666;
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
</style>
