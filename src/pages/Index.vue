<template>
  <div class="home-page" :class="{ 'broken-mode': gameStore.ruleBroken }">
    <!-- 乱码闪现层 -->
    <div v-if="gameStore.ruleBroken" class="glitch-overlay">
      <span class="glitch-text" v-for="i in 8" :key="i" :style="{ top: glitchPositions[i]?.top, left: glitchPositions[i]?.left, animationDelay: (i * 0.7) + 's' }">{{ glitchChars[i % glitchChars.length] }}</span>
    </div>

    <div class="content">
      <!-- Logo -->
      <div class="logo-container">
        <img
          :src="logoUrl"
          alt="倒立走mzk"
          class="logo"
          :class="{ 'logo-broken': gameStore.ruleBroken }"
          @click="showRulesDialog = true"
        >
      </div>

      <!-- 游戏标题 -->
      <h1 v-if="!gameStore.ruleBroken" class="game-title pink-text">寻找晓山瑞希 2</h1>
      <h1 v-else class="game-title broken-title">你破坏了规则</h1>

      <!-- 按钮组（正常模式） -->
      <div v-if="!gameStore.ruleBroken" class="button-group">
        <button class="btn btn-large" @click="startGame">
          {{ hasProgress ? '继续游戏' : '开始游戏' }}
        </button>
        <button class="btn btn-large" @click="newGame">
          新游戏
        </button>
        <button class="btn btn-large" @click="showLevelSelector = !showLevelSelector">
          选择关卡
        </button>
        <button class="btn btn-large" @click="goToMiniGame">
          <img :src="miniGameIconUrl" alt="小游戏" class="mini-game-icon">
          小游戏
        </button>
      </div>

      <!-- 按钮组（规则破坏模式） -->
      <div v-else class="button-group">
        <button class="btn btn-large btn-broken" @click="goToLevel6">
          你破坏了规则
        </button>
        <button class="btn btn-large btn-broken" @click="newGame">
          你破坏了规则
        </button>
        <button class="btn btn-large btn-broken" @click="showLevelSelector = !showLevelSelector">
          你破坏了规则
        </button>
        <button class="btn btn-large btn-broken" @click="goToMiniGame">
          你破坏了规则
        </button>
      </div>

      <!-- 选关界面 -->
      <Transition name="slide">
        <LevelSelector v-if="showLevelSelector" />
      </Transition>
    </div>

    <!-- Footer -->
    <Footer />

    <!-- 存储权限弹窗 -->
    <StorageDialog
      v-if="showStorageDialog"
      @accept="handleAcceptStorage"
      @reject="handleRejectStorage"
    />

    <!-- 免责声明弹窗 -->
    <DisclaimerDialog
      v-if="showDisclaimerDialog"
      :show="showDisclaimerDialog"
      :is-rule3-violated="gameStore.ruleBroken"
      @accept="handleAcceptDisclaimer"
      @close="showDisclaimerDialog = false"
    />

    <!-- 规则弹窗 -->
    <DisclaimerDialog
      v-if="showRulesDialog"
      :show="showRulesDialog"
      :is-rule3-violated="gameStore.ruleBroken"
      @accept="showRulesDialog = false"
      @close="showRulesDialog = false"
    />

    <!-- 小游戏选择弹窗 -->
    <Transition name="fade">
      <div v-if="showMiniGameDialog" class="mini-game-overlay" @click="showMiniGameDialog = false">
        <div class="mini-game-dialog" @click.stop>
          <div class="dialog-header">
            <h2 class="pink-text">选择小游戏</h2>
            <button class="close-btn" @click="showMiniGameDialog = false">✕</button>
          </div>
          <div class="mini-game-list">
            <div class="mini-game-item" @click="goToEliminateMzk">
              <img :src="miniGameIconUrl" alt="消除mzk" class="game-icon">
              <div class="game-info">
                <h3>消除mzk</h3>
                <p>凑齐三个，消除</p>
              </div>
            </div>
            <div class="mini-game-item" @click="goToMzkTest">
              <img :src="mzkTestIconUrl" alt="测测你是哪种晓山瑞希" class="game-icon">
              <div class="game-info">
                <h3>测测你是哪种晓山瑞希</h3>
                <p>找到属于你的那个MZK</p>
              </div>
            </div>
            <div class="mini-game-item" @click="goToMineSweeper">
              <img :src="mineSweeperIconUrl" alt="扫晓山瑞希" class="game-icon">
              <div class="game-info">
                <h3>扫晓山瑞希</h3>
                <p>你扫不扫晓山瑞希！？</p>
              </div>
            </div>
            <div class="mini-game-item" @click="goToMzkVerify">
              <img :src="mzkVerifyIconUrl" alt="mzk验证" class="game-icon">
              <div class="game-info">
                <h3>mzk验证</h3>
                <p>找出所有mzk，证明你不是机器人</p>
              </div>
            </div>
            <!-- 未来可以在这里添加更多小游戏 -->
          </div>
        </div>
      </div>
    </Transition>

    <!-- 新游戏确认弹窗 -->
    <ConfirmDialog
      :show="showNewGameConfirm"
      type="confirm"
      title="确认"
      message="确定要开始新游戏吗？这将清除当前进度。"
      @confirm="handleConfirmNewGame"
      @cancel="handleCancelNewGame"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { getImageUrl } from '@/utils/imageHelper'
import Footer from '@/components/Footer.vue'
import LevelSelector from '@/components/LevelSelector.vue'
import StorageDialog from '@/components/StorageDialog.vue'
import DisclaimerDialog from '@/components/DisclaimerDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const gameStore = useGameStore()

const showLevelSelector = ref(false)
const showStorageDialog = ref(false)
const showDisclaimerDialog = ref(false)
const showRulesDialog = ref(false)
const showMiniGameDialog = ref(false)
const showNewGameConfirm = ref(false)

const hasProgress = computed(() => gameStore.hasProgress)

// 获取Logo图片
const logoUrl = getImageUrl('images/倒立走mzk.webp')
// 获取小游戏图标
const miniGameIconUrl = getImageUrl('images/生气mzk.webp')
const mzkTestIconUrl = getImageUrl('images/开心mzk.webp')
const mineSweeperIconUrl = getImageUrl('images/惊吓mzk.webp')

// 乱码字符
const glitchChars = ['̷̢̛̝̣', '̸̨̻͎̈́', '̶͖̈́̚', '̴̡̛̱', '█̷▓', '░̸̛', '▒̴█', '̶̢̛͔']
const glitchPositions = {}
for (let i = 0; i < 12; i++) {
  glitchPositions[i] = {
    top: Math.random() * 90 + '%',
    left: Math.random() * 90 + '%'
  }
}

onMounted(() => {
  // 检查是否需要显示存储权限弹窗
  if (!gameStore.hasAcceptedStorage && !sessionStorage.getItem('find-mzk-2-storage-rejected')) {
    showStorageDialog.value = true
  }
})

const startGame = () => {
  router.push(`/level/${gameStore.currentLevel}`)
}

const newGame = () => {
  if (hasProgress.value) {
    showNewGameConfirm.value = true
  } else {
    router.push('/level/1')
  }
}

const handleConfirmNewGame = () => {
  showNewGameConfirm.value = false
  gameStore.resetProgress()
  router.push('/level/1')
}

const handleCancelNewGame = () => {
  showNewGameConfirm.value = false
}

const handleAcceptStorage = () => {
  gameStore.acceptStorage()
  showStorageDialog.value = false
  // 显示免责声明
  if (!gameStore.hasSeenDisclaimer) {
    showDisclaimerDialog.value = true
  }
}

const handleAcceptDisclaimer = () => {
  gameStore.markDisclaimerSeen()
  showDisclaimerDialog.value = false
}

const handleRejectStorage = () => {
  gameStore.rejectStorage()
  sessionStorage.setItem('find-mzk-2-storage-rejected', 'true')
  showStorageDialog.value = false
}

const goToMiniGame = () => {
  showMiniGameDialog.value = true
}

const goToEliminateMzk = () => {
  router.push('/eliminate-mzk')
}

const goToMzkTest = () => {
  router.push('/mzk-test')
}

const goToMineSweeper = () => {
  router.push('/minesweeper')
}

const mzkVerifyIconUrl = getImageUrl('images/普通mzk.webp')
const goToMzkVerify = () => {
  router.push('/mzk-verify')
}

const goToLevel6 = () => {
  router.push('/level/6')
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fff 0%, #fff5f6 100%);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.logo-container {
  margin-top: 40px;
  margin-bottom: 16px;
  animation: float 3s ease-in-out infinite;
}

.logo {
  width: 280px;
  height: 280px;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

.game-title {
  font-size: 48px;
  margin-bottom: 48px;
  text-align: center;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 300px;
}

.btn-large {
  padding: 16px 32px;
  font-size: 18px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.mini-game-icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* 动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .content {
    padding: 20px;
  }

  .logo {
    width: 220px;
    height: 220px;
  }

  .game-title {
    font-size: 32px;
    margin-bottom: 32px;
  }

  .btn-large {
    padding: 14px 28px;
    font-size: 16px;
  }
}

/* ===== 规则破坏模式 ===== */
.broken-mode {
  background: linear-gradient(135deg, #0a0a0a 0%, #1a0000 100%) !important;
}

.broken-title {
  color: #cc3333 !important;
  text-shadow: 0 0 10px rgba(204, 51, 51, 0.5);
  animation: title-flicker 3s ease-in-out infinite;
}

@keyframes title-flicker {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
  93% { opacity: 1; }
  94% { opacity: 0.3; }
  95% { opacity: 1; }
}

.logo-broken {
  filter: brightness(0.4) saturate(0.3) hue-rotate(330deg) drop-shadow(0 0 20px rgba(204, 51, 51, 0.5)) !important;
}

.btn-broken {
  background: transparent !important;
  border: 2px solid #cc3333 !important;
  color: #cc3333 !important;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(204, 51, 51, 0.4);
  animation: btn-glitch 4s ease-in-out infinite;
}

.btn-broken:hover {
  background: rgba(204, 51, 51, 0.1) !important;
}

@keyframes btn-glitch {
  0%, 100% { transform: none; }
  96% { transform: none; }
  97% { transform: translateX(-2px) skewX(-1deg); }
  98% { transform: translateX(2px) skewX(1deg); }
  99% { transform: translateX(-1px); }
}

/* 乱码闪现层 */
.glitch-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 999;
  overflow: hidden;
}

.glitch-text {
  position: absolute;
  color: rgba(204, 51, 51, 0.6);
  font-size: 20px;
  font-family: monospace;
  animation: glitch-flash 5s ease-in-out infinite;
  opacity: 0;
}

@keyframes glitch-flash {
  0%, 85%, 100% { opacity: 0; }
  87% { opacity: 0.8; transform: translate(-2px, 1px); }
  89% { opacity: 0; }
  91% { opacity: 0.6; transform: translate(3px, -1px); }
  93% { opacity: 0; }
}

/* 小游戏弹窗 */
.mini-game-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.mini-game-dialog {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.dialog-header h2 {
  font-size: 28px;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.3s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.mini-game-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mini-game-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  border: 2px solid var(--border-color);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.mini-game-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  border-color: var(--primary-color);
}

.game-icon {
  width: 64px;
  height: 64px;
  object-fit: contain;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.15));
}

.game-info {
  flex: 1;
}

.game-info h3 {
  font-size: 20px;
  margin: 0 0 8px 0;
  color: var(--text-color);
}

.game-info p {
  font-size: 14px;
  margin: 0;
  color: #666;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .mini-game-dialog {
    padding: 20px;
  }

  .dialog-header h2 {
    font-size: 24px;
  }

  .mini-game-item {
    padding: 16px;
    gap: 16px;
  }

  .game-icon {
    width: 48px;
    height: 48px;
  }

  .game-info h3 {
    font-size: 18px;
  }

  .game-info p {
    font-size: 13px;
  }
}
</style>
