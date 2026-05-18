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
          <span v-if="showFailTip" class="gc-fail-tip">❌ 你没有通过人机验证，重新尝试</span>
        </div>

        <!-- 网格 -->
        <div class="gc-grid-area">
          <MzkGrid
            ref="mzkGridRef"
            :key="roundKey"
            :grid-size="currentGridSize"
            :total-to-click="currentGridSize === 16 ? 10 : 6"
            :max-visible="3"
            @complete="onRoundComplete"
            @wrong="onWrong"
            @skip-fail="onSkipFail"
          />
        </div>

        <!-- 底部操作栏 -->
        <div class="gc-footer">
          <div class="gc-tech-info">
            <span class="gc-tech-support">由gluglu提供技术支持</span>
            <span class="gc-skip-hint">如果没有请点击跳过</span>
          </div>
          <button class="gc-skip-btn" @click="handleSkip">跳过</button>
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
const showFailTip = ref(false)
const mzkGridRef = ref(null)

let failTipTimer = null

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

function onWrong() {
  // 点错了，显示失败提示，进度归零，重新开始
  showFailTip.value = true
  passedRounds.value = 0
  clearTimeout(failTipTimer)

  // 立即重新生成网格
  pickGridSize()
  roundKey.value++

  // 2秒后隐藏提示
  failTipTimer = setTimeout(() => {
    showFailTip.value = false
  }, 2000)
}

function onSkipFail() {
  // 跳过失败，显示失败提示，进度归零，重新开始
  showFailTip.value = true
  passedRounds.value = 0
  clearTimeout(failTipTimer)

  // 立即重新生成网格
  pickGridSize()
  roundKey.value++

  // 2秒后隐藏提示
  failTipTimer = setTimeout(() => {
    showFailTip.value = false
  }, 2000)
}

function handleSkip() {
  // 调用 MzkGrid 的跳过方法
  if (mzkGridRef.value) {
    mzkGridRef.value.handleSkip()
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

.gc-wrong-tip {
  font-size: 12px;
  color: #e53935;
  font-weight: 600;
  margin-left: 8px;
  animation: shake 0.4s ease;
}

.gc-skip-fail-tip {
  font-size: 12px;
  color: #e53935;
  font-weight: 600;
  margin-left: 8px;
  animation: shake 0.4s ease;
}

.gc-fail-tip {
  font-size: 12px;
  color: #e53935;
  font-weight: 600;
  margin-left: 8px;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-3px); }
  60% { transform: translateX(3px); }
}

/* 网格区域 */
.gc-grid-area {
  padding: 14px;
  position: relative;
}

/* 底部操作栏 */
.gc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-top: 1px solid #eee;
  background: #fafafa;
}

.gc-tech-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gc-tech-support {
  font-size: 11px;
  color: #999;
}

.gc-skip-hint {
  font-size: 10px;
  color: #bbb;
}

.gc-skip-btn {
  padding: 6px 16px;
  background: #4a90d9;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.gc-skip-btn:hover {
  background: #3a7bc8;
}

.gc-skip-btn:active {
  transform: scale(0.98);
}
</style>
