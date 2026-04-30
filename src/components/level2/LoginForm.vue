<template>
  <div class="login-wrapper">
    <div class="login-card">
      <img :src="logoUrl" class="logo" alt="Nightcord Logo" />
      <h2 class="login-title">{{ config.title }}</h2>

      <div class="form-group">
        <input
          v-model="username"
          type="text"
          class="form-input"
          :placeholder="config.fields.username.placeholder"
          autocomplete="username"
        />
      </div>

      <div class="form-group">
        <input
          v-model="password"
          type="password"
          class="form-input"
          :placeholder="config.fields.password.placeholder"
          autocomplete="current-password"
        />
      </div>

      <div class="form-group captcha-row">
        <input
          v-model="captchaInput"
          type="text"
          class="form-input captcha-input"
          :placeholder="config.fields.captcha.placeholder"
          maxlength="4"
          autocomplete="off"
        />
        <canvas
          ref="captchaCanvas"
          class="captcha-canvas"
          @click="resetCaptcha"
          title="点击刷新"
        ></canvas>
      </div>

      <!-- 流程1: 人机验证（第一次登录后出现） -->
      <div v-if="showHumanVerify" class="form-group">
        <CaptchaVerify @verified="onHumanVerified" />
      </div>

      <p class="hint-text">{{ config.hint }}</p>

      <button class="login-btn" @click="handleLogin">{{ config.loginButtonText }}</button>

      <p v-if="errorMsg" class="error-msg">❗ {{ errorMsg }}</p>
    </div>
  </div>

  <!-- 流程2: 生日验证（人机通过后出现） -->
  <BirthdayVerify
    v-if="showBirthdayVerify"
    @verified="onBirthdayVerified"
    @close="showBirthdayVerify = false"
  />
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { getImageUrl } from '@/utils/imageHelper'
import config from '@/data/level2/config.json'
import CaptchaVerify from './CaptchaVerify.vue'
import BirthdayVerify from './BirthdayVerify.vue'

const emit = defineEmits(['win'])

const logoUrl = computed(() => getImageUrl(config.logo))

const username = ref('')
const password = ref('')
const captchaInput = ref('')
const errorMsg = ref('')
const captchaCode = ref('')

// 流程状态
const hasClickedOnce = ref(false)     // 是否已第一次点登录
const showHumanVerify = ref(false)    // 显示人机验证条
const humanVerified = ref(false)      // 人机验证通过
const showBirthdayVerify = ref(false) // 显示生日验证弹窗
const birthdayVerified = ref(false)   // 生日验证通过

const captchaCanvas = ref(null)

const CHARS = ['O', 'o', '0', 'l', '1', 'Q', 'C', 'v', 'V']

function generateCaptcha() {
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)]
  }
  return code
}

function drawCaptcha() {
  const canvas = captchaCanvas.value
  if (!canvas) return
  const dpr = window.devicePixelRatio || 1
  const W = 100
  const H = 36
  canvas.width = W * dpr
  canvas.height = H * dpr
  canvas.style.width = W + 'px'
  canvas.style.height = H + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 背景
  ctx.fillStyle = '#eee8f8'
  ctx.fillRect(0, 0, W, H)

  // 噪点
  for (let i = 0; i < 40; i++) {
    ctx.beginPath()
    ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 1.2 + 0.3, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${ri(80,180)},${ri(60,160)},${ri(140,220)},${(Math.random() * 0.4 + 0.3).toFixed(2)})`
    ctx.fill()
  }

  // 干扰线
  for (let i = 0; i < 4; i++) {
    ctx.beginPath()
    ctx.moveTo(Math.random() * W, Math.random() * H)
    // 贝塞尔曲线让线更自然
    ctx.bezierCurveTo(
      Math.random() * W, Math.random() * H,
      Math.random() * W, Math.random() * H,
      Math.random() * W, Math.random() * H
    )
    ctx.strokeStyle = `rgba(${ri(80,160)},${ri(40,120)},${ri(150,220)},${(Math.random() * 0.35 + 0.25).toFixed(2)})`
    ctx.lineWidth = Math.random() * 1.2 + 0.6
    ctx.stroke()
  }

  // 字符
  const code = captchaCode.value
  const cellW = W / 4
  const colors = ['#5a2d9a', '#1a5cbf', '#b03020', '#0f7060', '#b05010', '#7a30a0']
  for (let i = 0; i < 4; i++) {
    ctx.save()
    const cx = cellW * i + cellW / 2
    const cy = H / 2 + (Math.random() - 0.5) * 4
    ctx.translate(cx, cy)
    ctx.rotate((Math.random() - 0.5) * 0.5)
    ctx.font = `bold ${ri(13, 16)}px monospace`
    ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    // 轻微拉伸
    ctx.scale(1 + (Math.random() - 0.5) * 0.25, 1 + (Math.random() - 0.5) * 0.2)
    ctx.fillText(code[i], 0, 0)
    ctx.restore()
  }

  // 右下角刷新图标
  ctx.font = '11px sans-serif'
  ctx.fillStyle = 'rgba(100,70,180,0.55)'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillText('↻', W - 3, H - 2)
}

function ri(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function refreshCaptcha() {
  captchaCode.value = generateCaptcha()
  captchaInput.value = ''
  nextTick(drawCaptcha)
}

function resetCaptcha() {
  errorMsg.value = ''
  refreshCaptcha()
}

function handleLogin() {
  errorMsg.value = ''

  if (!username.value.trim()) {
    errorMsg.value = config.errors.emptyUsername
    return
  }
  if (!password.value.trim()) {
    errorMsg.value = config.errors.emptyPassword
    return
  }
  if (!captchaInput.value.trim()) {
    errorMsg.value = config.errors.emptyCaptcha
    return
  }
  if (captchaInput.value.trim().toLowerCase() !== captchaCode.value.toLowerCase()) {
    errorMsg.value = config.errors.wrongCaptcha
    refreshCaptcha()
    return
  }
  if (
    username.value.trim() !== config.correctUsername ||
    password.value.trim() !== config.correctPassword
  ) {
    errorMsg.value = config.errors.wrongCredentials
    refreshCaptcha()
    return
  }

  // 凭证正确，第一次点登录 → 触发人机验证
  if (!hasClickedOnce.value) {
    hasClickedOnce.value = true
    showHumanVerify.value = true
    errorMsg.value = ''
    return
  }

  // 人机验证未完成
  if (!humanVerified.value) {
    errorMsg.value = '请先完成人机验证'
    return
  }

  // 人机验证已通过，触发生日验证
  if (!birthdayVerified.value) {
    showBirthdayVerify.value = true
    return
  }

  // 生日验证已通过，通关
  emit('win')
}

function onHumanVerified() {
  humanVerified.value = true
}

function onBirthdayVerified() {
  birthdayVerified.value = true
  showBirthdayVerify.value = false
}

onMounted(() => {
  captchaCode.value = generateCaptcha()
  nextTick(drawCaptcha)
})
</script>

<style scoped>
.login-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  min-height: 0;
}

.login-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  padding: 36px 32px 28px;
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 4px;
}

.login-title {
  font-size: 22px;
  font-weight: 700;
  color: #333;
  margin: 0;
}

.form-group {
  width: 100%;
}

.form-input {
  width: 100%;
  padding: 11px 14px;
  border: 1.5px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  background: #fafafa;
  color: #333;
}

.form-input:focus {
  border-color: #7c4dba;
  background: #fff;
}

.captcha-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.captcha-input {
  flex: 1;
  min-width: 0;
  width: auto;
}

.captcha-canvas {
  flex-shrink: 0;
  width: 100px;
  height: 36px;
  border-radius: 6px;
  border: 1.5px solid #c9b0e8;
  cursor: pointer;
  display: block;
}

.hint-text {
  font-size: 12px;
  color: #aaa;
  margin: 0;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 13px;
  background: #7c4dba;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  letter-spacing: 2px;
}

.login-btn:hover {
  background: #6a3da0;
}

.login-btn:active {
  transform: scale(0.98);
}

.error-msg {
  color: #e53935;
  font-size: 13px;
  margin: 0;
  text-align: center;
  min-height: 20px;
}

@media (max-width: 480px) {
  .login-card {
    padding: 28px 18px 22px;
    border-radius: 12px;
    gap: 12px;
  }

  .logo {
    width: 64px;
    height: 64px;
  }

  .login-title {
    font-size: 20px;
  }

  .form-input {
    font-size: 14px;
    padding: 10px 12px;
  }

  .captcha-canvas {
    width: 88px;
    height: 34px;
  }

  .login-btn {
    font-size: 15px;
    padding: 12px;
  }
}
</style>
