<template>
  <div class="top-bar">
    <button class="back-btn" @click="goHome">
      首页
    </button>
    <div class="level-info">
      <h2 class="level-title pink-text">{{ title }}</h2>
      <p class="level-subtitle">{{ subtitle }}</p>
    </div>
    <div v-if="showLevelNumber" class="level-number">
      第{{ levelNumber }}关
    </div>
    <div v-else-if="$slots.right" class="right-slot">
      <slot name="right"></slot>
    </div>
    <div v-else class="placeholder"></div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    default: '关卡标题'
  },
  subtitle: {
    type: String,
    default: '副标题'
  },
  levelNumber: {
    type: Number,
    default: 1
  },
  showLevelNumber: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped>
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: var(--bg-color);
  border-bottom: 2px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  padding: 8px 16px;
  border: 2px solid var(--border-color);
  background-color: var(--primary-color);
  color: var(--border-color);
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.back-btn:hover {
  transform: scale(1.05);
}

.level-info {
  flex: 1;
  text-align: center;
  padding: 0 16px;
}

.level-title {
  font-size: 20px;
  margin-bottom: 4px;
}

.level-subtitle {
  font-size: 14px;
  color: #666;
}

.level-number {
  font-size: 14px;
  font-weight: bold;
  color: var(--text-color);
  white-space: nowrap;
}

.placeholder {
  width: 60px;
}

.right-slot {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .top-bar {
    padding: 12px 16px;
  }

  .back-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .level-title {
    font-size: 16px;
  }

  .level-subtitle {
    font-size: 12px;
  }

  .level-number {
    font-size: 12px;
  }
}
</style>
