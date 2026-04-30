<template>
  <!-- 内联人机验证条 -->
  <div class="hcaptcha-bar" @click="openModal" :class="{ verified: verified }">
    <div class="checkbox-area">
      <div class="hc-checkbox" :class="{ checked: verified }">
        <svg v-if="verified" class="checkmark" viewBox="0 0 16 16">
          <polyline points="2,8 6,12 14,4" stroke="white" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <span class="hc-label">{{ verified ? '验证成功' : '人机验证' }}</span>
    <div class="hc-brand">
      <img :src="verified ? iconVerified : iconUnverified" class="hc-logo-img" alt="验证状态" />
    </div>
  </div>

  <!-- 九宫格/十六宫格弹窗 -->
  <Teleport to="body">
    <div v-if="modalOpen" class="gc-overlay">
      <div class="gc-panel">
        <!-- 顶部蓝色头部 -->
        <div class="gc-header">
          <div class="gc-header-text">
            <p class="gc-instruction">找出所有</p>
            <p class="gc-target">「mzk」图片</p>
          </div>
          <button class="gc-close" @click="closeModal">✕</button>
        </div>

        <!-- 进度点 -->
        <div class="gc-progress-row">
          <span
            v-for="n in REQUIRED_ROUNDS"
            :key="n"
            class="gc-dot"
            :class="{ done: passedRounds >= n }"
          ></span>
          <span class="gc-grid-label">{{ currentGridSize === 16 ? '4×4' : '3×3' }}</span>
          <span v-if="showWrongTip" class="gc-wrong-tip">❌ 点错了！进度归零</span>
        </div>

        <!-- 网格 -->
        <div class="gc-grid-area">
          <MzkGrid
            :key="roundKey"
            :grid-size="currentGridSize"
            :total-to-click="currentGridSize === 16 ? 10 : 6"
            :max-visible="3"
            @complete="onRoundComplete"
            @wrong="onWrong"
          />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { getImageUrl } from '@/utils/imageHelper'
import MzkGrid from './MzkGrid.vue'

const emit = defineEmits(['verified'])

const iconUnverified = getImageUrl('images/icon/人机验证_未完成.svg')
const iconVerified = getImageUrl('images/icon/人机验证_完成.svg')

const REQUIRED_ROUNDS = 3

const verified = ref(false)
const modalOpen = ref(false)
const passedRounds = ref(0)
const roundKey = ref(0)
const currentGridSize = ref(9)

function pickGridSize() {
  currentGridSize.value = Math.random() < 0.5 ? 9 : 16
}

function openModal() {
  if (verified.value) return
  passedRounds.value = 0
  pickGridSize()
  roundKey.value++
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}

function onRoundComplete() {
  passedRounds.value++
  if (passedRounds.value >= REQUIRED_ROUNDS) {
    verified.value = true
    modalOpen.value = false
    emit('verified')
  } else {
    pickGridSize()
    roundKey.value++
  }
}
</script>

<style scoped>
/* 内联验证条 */
.hcaptcha-bar {
  width: 100%;
  display: flex;
  align-items: center;
  border: 1.5px solid #c8d6e8;
  border-radius: 6px;
  background: #f9fbff;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
  gap: 12px;
}

.hcaptcha-bar:hover {
  border-color: #4a90d9;
  background: #f0f7ff;
}

.hcaptcha-bar.verified {
  border-color: #2e7d32;
  background: #f1fdf3;
  cursor: default;
}

.checkbox-area { flex-shrink: 0; }

.hc-checkbox {
  width: 24px;
  height: 24px;
  border: 2px solid #aab8cc;
  border-radius: 4px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.hc-checkbox.checked {
  background: #2e7d32;
  border-color: #2e7d32;
}

.checkmark { width: 16px; height: 16px; }

.hc-label {
  flex: 1;
  font-size: 14px;
  color: #444;
}

.hc-brand { flex-shrink: 0; }

.hc-logo-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
}

/* 弹窗遮罩 */
.gc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* 面板 */
.gc-panel {
  background: #fff;
  border-radius: 4px;
  width: 360px;
  max-width: 95vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 蓝色头部 */
.gc-header {
  background: #4a90d9;
  padding: 14px 16px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.gc-header-text { color: #fff; }

.gc-instruction {
  font-size: 13px;
  margin: 0;
  opacity: 0.9;
}

.gc-target {
  font-size: 18px;
  font-weight: 700;
  margin: 2px 0 0;
}

.gc-close {
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  font-size: 16px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.gc-close:hover { color: #fff; }

/* 进度行 */
.gc-progress-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-bottom: 1px solid #eee;
  background: #fafafa;
}

.gc-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ddd;
  transition: background 0.3s;
}

.gc-dot.done { background: #2e7d32; }

.gc-grid-label {
  font-size: 12px;
  color: #aaa;
  margin-left: auto;
}

/* 网格区域 */
.gc-grid-area {
  padding: 14px;
}
</style>
