<template>
  <div class="stage-one">
    <div class="instruction">
      <h3 class="pink-text">寻找尸体正确的mzk</h3>
    </div>

    <div class="mzk-grid">
      <div
        v-for="(mzk, index) in mzks"
        :key="index"
        class="mzk-item"
        :class="{ 'correct': mzk.isKillamzk, 'selected': selectedMzk === index }"
        @click="handleMzkClick(index, mzk.isKillamzk)"
      >
        <img :src="mzk.url" :alt="mzk.name" class="mzk-image">
        <p class="mzk-name">{{ mzk.name }}</p>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="dialog">
        <div v-if="showCorrectDialog" class="dialog-overlay" @click="showCorrectDialog = false">
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

const mzks = ref([])
const selectedMzk = ref(null)
const showCorrectDialog = ref(false)

const mzkNames = [
  '普通mzk', '开心mzk', '生气mzk', '难过mzk',
  '惊讶mzk', '疑惑mzk', '哭泣mzk', '大笑mzk',
  '调皮mzk', '害羞mzk', '生气mzk', '睡觉mzk',
  '普通mzk', '惊吓mzk', '开心mzk', '难过mzk',
  '疑惑mzk', '普通mzk', '哭泣mzk', '大笑mzk'
]

const loadMzks = () => {
  const mzkUrls = [
    'images/普通mzk.webp',
    'images/开心mzk.webp',
    'images/生气mzk.webp',
    'images/难过mzk.webp',
    'images/惊讶mzk.webp',
    'images/疑惑mzk.webp',
    'images/哭泣mzk.webp',
    'images/大笑mzk.webp',
    'images/调皮mzk.webp',
    'images/害羞mzk.webp',
    'images/生气mzk.webp',
    'images/睡觉mzk.webp',
    'images/普通mzk.webp',
    'images/惊吓mzk.webp',
    'images/开心mzk.webp',
    'images/难过mzk.webp',
    'images/疑惑mzk.webp',
    'images/普通mzk.webp',
    'images/哭泣mzk.webp',
    'images/大笑mzk.webp'
  ]

  // 随机选择一个位置放置killamzk
  const killamzkIndex = Math.floor(Math.random() * mzkUrls.length)

  mzks.value = mzkUrls.map((url, index) => ({
    url: getImageUrl(url),
    name: mzkNames[index],
    isKillamzk: index === killamzkIndex
  }))
}

const handleMzkClick = (index, isKillamzk) => {
  selectedMzk.value = index

  if (isKillamzk) {
    showCorrectDialog.value = true
  }
}

const handleNextStage = () => {
  showCorrectDialog.value = false
  emit('next')
}

onMounted(() => {
  loadMzks()
})
</script>

<style scoped>
.stage-one {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.instruction {
  text-align: center;
  margin-bottom: 24px;
}

.instruction h3 {
  font-size: 24px;
  margin: 0;
}

.mzk-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
  padding: 20px;
  overflow-y: auto;
}

.mzk-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 8px;
  transition: all 0.3s;
}

.mzk-item:hover {
  background: #fff5f6;
  transform: scale(1.05);
}

.mzk-item.selected {
  border-color: var(--primary-color);
  background: #fff5f6;
}

.mzk-item.correct {
  border-color: #cc3333;
  background: #1a0000;
}

.mzk-image {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 8px;
}

.mzk-name {
  font-size: 12px;
  color: #666;
  margin: 0;
  text-align: center;
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

@media (max-width: 768px) {
  .mzk-grid {
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 8px;
  }

  .mzk-image {
    width: 45px;
    height: 45px;
  }

  .mzk-name {
    font-size: 10px;
  }
}
</style>