<template>
  <Teleport to="body">
    <div v-if="show" class="intro-overlay" @click="handleOverlayClick">
      <Transition name="flash" appear>
        <div class="flash-text" :key="flashText">{{ flashText }}</div>
      </Transition>
      <Transition name="fade" appear>
        <div v-if="showConfirm" class="dialog-container">
          <div class="dialog-content">
            <p class="question">{{ questionText }}</p>
            <button class="btn" @click="handleConfirm">
              确定
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['start'])

const flashText = ref('')
const questionText = ref('可能莫?')
const showConfirm = ref(false)
let typingInterval = null

watch(() => props.show, (newVal) => {
  console.log('Level6Intro show changed:', newVal)
  if (newVal) {
    // 清除之前的计时器
    if (typingInterval) {
      clearInterval(typingInterval)
    }

    flashText.value = ''
    showConfirm.value = false

    console.log('Starting text animation')

    const text = '6代表恶魔，你却要在这里救赎晓山瑞希'
    let index = 0

    // 延迟一点开始动画，确保DOM已渲染
    setTimeout(() => {
      flashText.value = text[0]
      index = 1

      typingInterval = setInterval(() => {
        if (index < text.length) {
          flashText.value += text[index]
          index++
          console.log('Current text:', flashText.value)
        } else {
          clearInterval(typingInterval)
          console.log('Text animation complete, showing confirm after delay')

          setTimeout(() => {
            showConfirm.value = true
            console.log('Show confirm dialog')
          }, 1500)
        }
      }, 100)
    }, 300)
  } else {
    // 组件隐藏时清除计时器
    if (typingInterval) {
      clearInterval(typingInterval)
      typingInterval = null
    }
  }
}, { immediate: true })

const handleOverlayClick = () => {
  // 点击遮罩层不关闭，必须点击确定
}

const handleConfirm = () => {
  console.log('Confirm clicked')
  emit('start')
}
</script>

<style scoped>
.intro-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: black;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.flash-text {
  font-size: 24px;
  color: #cc3333;
  text-align: center;
  max-width: 80%;
  line-height: 1.8;
  text-shadow: 0 0 10px rgba(204, 51, 51, 0.8);
  white-space: pre-wrap;
  margin-bottom: 40px;
  animation: text-flicker 0.1s ease-in-out infinite;
}

@keyframes text-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.dialog-container {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.dialog-content {
  background: white;
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 8px 32px rgba(204, 51, 51, 0.5);
}

.question {
  font-size: 20px;
  color: #cc3333;
  margin: 0 0 24px 0;
  font-weight: bold;
}

.btn {
  padding: 12px 40px;
  font-size: 16px;
  background-color: var(--primary-color);
  border: 2px solid var(--border-color);
  color: var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.btn:hover {
  transform: scale(1.05);
}

.flash-enter-active,
.flash-leave-active {
  transition: opacity 1s ease;
}

.flash-enter-from,
.flash-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .flash-text {
    font-size: 18px;
  }

  .dialog-content {
    padding: 24px;
  }

  .question {
    font-size: 16px;
  }
}
</style>