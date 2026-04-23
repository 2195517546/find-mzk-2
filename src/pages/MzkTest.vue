<template>
  <div class="container">
    <!-- Intro Screen -->
    <div v-if="currentScreen === 'intro'" class="screen intro-screen">
      <TopBar
        title="测测你是哪种晓山瑞希"
        subtitle="找到属于你的那个MZK"
        :show-level-number="false"
      />

      <div class="intro-body">
        <img
          class="mzk-img"
          src="/assets/images/开心mzk.webp"
          alt="开心mzk"
        />

        <p class="subtitle">{{ mzkCount }}种瑞希，找到属于你的那个MZK</p>

        <div class="btns">
          <button class="btn btn-main" @click="startTest">开始测试</button>
        </div>

        <div class="card intro-content">
          <h2>🎀 可测出的MZK类型</h2>
          <div class="mzk-list">
            <div v-for="(mzk, name) in testData.mzkTypes" :key="name" class="mzk-item">
              <img :src="mzk.image" :alt="mzk.name" />
              <span>{{ mzk.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Test Screen -->
    <div v-if="currentScreen === 'test'" class="screen test-screen">
      <TopBar
        title="测测你是哪种晓山瑞希"
        :subtitle="`问题 ${currentQuestionIndex + 1} / ${testData.questions.length}`"
        :show-level-number="false"
      />

      <div class="card test-card">
        <div class="topbar">
          <div class="progress">
            <span :style="{ width: progressPercent + '%' }"></span>
          </div>
        </div>

        <div v-if="currentQuestion" class="question-container">
          <div class="question-number">问题 {{ currentQuestionIndex + 1 }}</div>
          <h3 class="question-text">{{ currentQuestion.text }}</h3>

          <div class="options">
            <button
              v-for="(opt, idx) in currentQuestion.options"
              :key="idx"
              class="option-btn"
              @click="selectOption(opt)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div class="test-actions">
          <button class="btn-secondary" @click="previousQuestion" :disabled="currentQuestionIndex === 0">
            上一题
          </button>
          <button class="btn-secondary" @click="currentScreen = 'intro'">退出</button>
        </div>
      </div>
    </div>

    <!-- Result Screen -->
    <div v-if="currentScreen === 'result'" class="screen result-screen">
      <TopBar
        title="测试结果"
        subtitle="你是..."
        :show-level-number="false"
      />

      <div class="card result-card">
        <div class="result-header">
          <h1>你是：{{ result.name }}</h1>
          <p class="result-subtitle">{{ result.subtitle }}</p>
        </div>

        <div class="result-image">
          <img :src="result.image" :alt="result.name" />
        </div>

        <div class="result-description">
          <h3>人格特征</h3>
          <p>{{ result.description }}</p>
        </div>

        <div class="result-keywords">
          <span v-for="keyword in result.keywords" :key="keyword" class="keyword-tag">
            {{ keyword }}
          </span>
        </div>

        <div class="result-actions">
          <button class="btn-primary" @click="copyLink">分享结果</button>
          <button class="btn-secondary" @click="startTest">重新测试</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import testData from '@/data/minigame/mzk-test.json'

const router = useRouter()
const currentScreen = ref('intro')
const currentQuestionIndex = ref(0)
const answers = ref({})
const result = ref(null)

const mzkCount = computed(() => {
  return Object.keys(testData.mzkTypes).length
})

const currentQuestion = computed(() => {
  return testData.questions[currentQuestionIndex.value]
})

const progressPercent = computed(() => {
  return ((currentQuestionIndex.value + 1) / testData.questions.length) * 100
})

function startTest() {
  answers.value = {}
  result.value = null
  currentQuestionIndex.value = 0
  currentScreen.value = 'test'
}

function selectOption(option) {
  const questionId = currentQuestion.value.id
  answers.value[questionId] = option.traits

  if (currentQuestionIndex.value < testData.questions.length - 1) {
    currentQuestionIndex.value++
  } else {
    calculateResult()
  }
}

function previousQuestion() {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
  }
}

function calculateResult() {
  const traitScores = {}

  Object.values(answers.value).forEach(traits => {
    Object.entries(traits).forEach(([trait, score]) => {
      traitScores[trait] = (traitScores[trait] || 0) + score
    })
  })

  let bestMatch = null
  let bestScore = -1

  Object.values(testData.mzkTypes).forEach(type => {
    let score = 0
    Object.entries(type.traits).forEach(([trait, weight]) => {
      if (traitScores[trait]) {
        score += traitScores[trait] * weight
      }
    })

    if (score > bestScore) {
      bestScore = score
      bestMatch = type
    }
  })

  result.value = bestMatch || testData.mzkTypes['开心mzk']
  currentScreen.value = 'result'
}

function copyLink() {
  const url = window.location.origin + window.location.pathname
  const shareText = `我测出来是${result.value.name}！快来测测你是哪种晓山瑞希：${url}`

  navigator.clipboard.writeText(shareText).then(() => {
    alert('分享内容已复制到剪贴板！')
  }).catch(() => {
    alert('复制失败，请手动复制：' + shareText)
  })
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(160deg, #fff0f5 0%, #fdf6ff 100%);
}

.screen {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.intro-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 40px 20px;
  gap: 24px;
}

.mzk-img {
  width: clamp(180px, 40vw, 280px);
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 8px 24px rgba(255, 105, 180, 0.25));
}

.subtitle {
  font-size: clamp(14px, 3vw, 18px);
  color: #666;
  margin: 0;
  text-align: center;
}

.btns {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  padding: 0 16px;
}

.btn {
  padding: 14px 28px;
  border-radius: 12px;
  border: none;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-main {
  background: #ff69b4;
  color: white;
  box-shadow: 0 4px 12px rgba(255, 105, 180, 0.3);
}

.btn-main:hover {
  background: #ff1493;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 105, 180, 0.4);
}

.btn-secondary {
  background: #f0f0f0;
  color: #666;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-screen, .result-screen {
  padding-bottom: 40px;
}

.card {
  background: #ffffff;
  border: 1px solid #dbe8dd;
  border-radius: 22px;
  box-shadow: 0 16px 40px rgba(47, 73, 55, 0.08);
  margin: 24px auto;
  max-width: 800px;
  width: calc(100% - 32px);
}

.intro-content {
  padding: 28px;
}

.intro-content h2 {
  font-size: 24px;
  margin-bottom: 20px;
  text-align: center;
  color: #ff69b4;
}

.mzk-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}

.mzk-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #fff0f5;
  border: 1px solid #ffc0cb;
  border-radius: 12px;
  text-align: center;
  font-size: 14px;
  color: #ff69b4;
  font-weight: 500;
}

.mzk-item img {
  width: 80px;
  height: 80px;
  object-fit: contain;
}

.test-card {
  padding: 28px;
}

.topbar {
  margin-bottom: 32px;
}

.progress {
  height: 10px;
  background: #edf6ef;
  border-radius: 999px;
  overflow: hidden;
}

.progress > span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #ff69b4, #ff1493);
  border-radius: inherit;
  transition: width 0.3s ease;
}

.question-container {
  margin-bottom: 32px;
}

.question-number {
  font-size: 12px;
  color: #6a786f;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.question-text {
  font-size: 22px;
  margin-bottom: 24px;
  line-height: 1.5;
  color: #333;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.option-btn {
  padding: 18px 24px;
  background: #fff0f5;
  border: 2px solid #ffc0cb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
  text-align: left;
  color: #333;
}

.option-btn:hover {
  background: #ffe0e5;
  border-color: #ff69b4;
  transform: translateX(4px);
}

.test-actions {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #dbe8dd;
}

.result-card {
  padding: 40px;
  text-align: center;
}

.result-header h1 {
  font-size: 36px;
  margin-bottom: 8px;
  color: #ff69b4;
}

.result-subtitle {
  font-size: 20px;
  color: #6a786f;
  margin-bottom: 12px;
}

.result-image {
  margin-bottom: 32px;
}

.result-image img {
  max-width: 280px;
  width: 100%;
  height: auto;
  border-radius: 16px;
  filter: drop-shadow(0 8px 24px rgba(255, 105, 180, 0.15));
}

.result-description {
  margin-bottom: 24px;
  text-align: left;
}

.result-description h3 {
  font-size: 20px;
  margin-bottom: 12px;
  color: #ff69b4;
}

.result-description p {
  font-size: 16px;
  line-height: 1.6;
  color: #6a786f;
}

.result-keywords {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.keyword-tag {
  padding: 8px 16px;
  background: #fff0f5;
  color: #ff69b4;
  border: 1px solid #ffc0cb;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
}

.result-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary {
  padding: 14px 28px;
  background: #ff69b4;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #ff1493;
  transform: translateY(-2px);
}

@media (max-width: 640px) {
  .intro-body {
    padding: 20px 16px;
  }

  .test-card, .result-card {
    padding: 20px;
  }

  .question-text {
    font-size: 18px;
  }

  .result-header h1 {
    font-size: 28px;
  }

  .result-subtitle {
    font-size: 18px;
  }

  .test-actions {
    flex-direction: column;
  }

  .test-actions button {
    width: 100%;
  }

  .result-actions {
    flex-direction: column;
  }

  .result-actions button {
    width: 100%;
  }

  .mzk-list {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
