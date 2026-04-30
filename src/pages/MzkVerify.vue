<template>
  <div class="mv-page">
    <TopBar title="mzk验证" subtitle="找出所有mzk" :show-level-number="false" />

    <!-- 难度选择 -->
    <div v-if="!started" class="mv-selector">
      <h2 class="mv-selector-title">选择难度</h2>
      <div class="mv-difficulty-cards">
        <div
          v-for="d in difficulties"
          :key="d.rounds"
          class="mv-card"
          @click="startGame(d)"
        >
          <div class="mv-card-icon">{{ d.icon }}</div>
          <h3>{{ d.name }}</h3>
          <p>通过 {{ d.rounds }} 关</p>
        </div>
      </div>
    </div>

    <!-- 游戏中 -->
    <div v-else-if="!gameOver" class="mv-game">
      <div class="mv-progress-bar">
        <span
          v-for="n in selectedDifficulty.rounds"
          :key="n"
          class="mv-dot"
          :class="{ done: passedRounds >= n, current: passedRounds === n - 1 }"
        ></span>
        <span class="mv-progress-text">{{ passedRounds }} / {{ selectedDifficulty.rounds }}</span>
      </div>

      <div class="mv-grid-area">
        <MzkGrid
          :key="roundKey"
          :grid-size="currentGridSize"
          :total-to-click="currentTotalToClick"
          :max-visible="3"
          @complete="onRoundComplete"
        />
      </div>

      <div class="mv-grid-label">
        第 {{ passedRounds + 1 }} 关 · {{ currentGridSize === 16 ? '4×4' : '3×3' }} 宫格
      </div>
    </div>

    <!-- 通关 -->
    <div v-else-if="won" class="mv-result">
      <div class="mv-result-card">
        <p class="mv-result-emoji">🎉</p>
        <h2>验证完成！</h2>
        <p>你通过了全部 {{ selectedDifficulty.rounds }} 关 mzk 验证</p>
        <div class="mv-result-btns">
          <button class="btn" @click="restart">再玩一次</button>
          <button class="btn" @click="backHome">返回首页</button>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import Footer from '@/components/Footer.vue'
import MzkGrid from '@/components/level2/MzkGrid.vue'

const router = useRouter()

const difficulties = [
  { name: '简单', rounds: 3, icon: '😊' },
  { name: '普通', rounds: 5, icon: '🤔' },
  { name: '困难', rounds: 7, icon: '😤' },
]

const started = ref(false)
const gameOver = ref(false)
const won = ref(false)
const selectedDifficulty = ref(null)
const passedRounds = ref(0)
const roundKey = ref(0)

// 每关随机 9 或 16 宫格
const currentGridSize = ref(9)
// 9宫格要点6个mzk，16宫格要点10个
const currentTotalToClick = computed(() => currentGridSize.value === 16 ? 10 : 6)

function startGame(d) {
  selectedDifficulty.value = d
  passedRounds.value = 0
  started.value = true
  gameOver.value = false
  won.value = false
  nextRound()
}

function nextRound() {
  currentGridSize.value = Math.random() < 0.5 ? 9 : 16
  roundKey.value++
}

function onRoundComplete() {
  passedRounds.value++
  if (passedRounds.value >= selectedDifficulty.value.rounds) {
    gameOver.value = true
    won.value = true
  } else {
    nextRound()
  }
}

function restart() {
  started.value = false
  gameOver.value = false
  won.value = false
  selectedDifficulty.value = null
}

function backHome() {
  router.push('/')
}
</script>

<style scoped>
.mv-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fff 0%, #fff5f6 100%);
}

/* 难度选择 */
.mv-selector {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 32px;
}

.mv-selector-title {
  font-size: 28px;
  color: #333;
  margin: 0;
}

.mv-difficulty-cards {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  justify-content: center;
}

.mv-card {
  background: #fff;
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 28px 24px;
  min-width: 140px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.mv-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  border-color: #7c4dba;
}

.mv-card-icon {
  font-size: 36px;
  margin-bottom: 10px;
}

.mv-card h3 {
  font-size: 20px;
  margin: 0 0 6px;
  color: #333;
}

.mv-card p {
  font-size: 13px;
  color: #888;
  margin: 0;
}

/* 游戏区 */
.mv-game {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px;
  gap: 16px;
}

.mv-progress-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mv-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ddd;
  transition: background 0.3s;
}

.mv-dot.done {
  background: #2e7d32;
}

.mv-dot.current {
  background: #7c4dba;
  box-shadow: 0 0 0 3px rgba(124,77,186,0.25);
}

.mv-progress-text {
  font-size: 13px;
  color: #888;
  margin-left: 6px;
}

.mv-grid-area {
  width: 100%;
  max-width: 340px;
}

.mv-grid-label {
  font-size: 13px;
  color: #aaa;
}

/* 通关结果 */
.mv-result {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.mv-result-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 32px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(0,0,0,0.1);
  max-width: 340px;
  width: 100%;
}

.mv-result-emoji {
  font-size: 48px;
  margin: 0 0 12px;
}

.mv-result-card h2 {
  font-size: 24px;
  color: #7c4dba;
  margin: 0 0 10px;
}

.mv-result-card p {
  color: #666;
  margin: 0 0 24px;
}

.mv-result-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
