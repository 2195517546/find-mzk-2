<template>
  <div class="platform-descent" ref="gameContainer" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp" @click="focusGame">
    <!-- 阶段1：开场叙事 -->
    <Transition name="fade">
      <div v-if="gamePhase === 'intro'" class="intro-phase" @click.stop="startGame">
        <div class="intro-overlay"></div>
        <div class="intro-text-container">
          <p
            v-for="(line, index) in introLines"
            :key="index"
            class="intro-line"
            :class="{ visible: currentLineIndex >= index }"
          >
            {{ line }}
          </p>
        </div>
        <p v-if="showStartHint" class="start-hint">点击任意位置开始</p>
      </div>
    </Transition>

    <!-- 阶段2：游戏进行 -->
    <div v-if="gamePhase === 'playing' || gamePhase === 'win' || gamePhase === 'fail'" class="game-phase">
      <!-- 背景 -->
      <div class="game-background" :class="backgroundClass"></div>

      <!-- 粒子效果层 -->
      <div class="particle-layer" ref="particleLayer"></div>

      <!-- 游戏画布 -->
      <canvas ref="gameCanvas" class="game-canvas"></canvas>

      <!-- UI覆盖层 -->
      <div class="game-ui">
        <!-- 顶部状态栏 -->
        <div class="status-bar">
          <div class="floor-indicator">
            <span class="floor-label">第</span>
            <span class="floor-number">{{ currentFloor }}</span>
            <span class="floor-label">/ 100 层</span>
          </div>
          <div class="time-display">
            <span class="time-icon">⏱</span>
            <span class="time-value">{{ formattedTime }}</span>
          </div>
        </div>

        <!-- 碎片收集指示 -->
        <div class="fragment-bar">
          <div class="fragment-progress" :style="{ width: fragmentProgressWidth }"></div>
          <span class="fragment-count">{{ fragmentsCollected }} / 100</span>
        </div>

        <!-- 彩蛋提示 -->
        <Transition name="easter-egg-pop">
          <div v-if="showEasterEgg" class="easter-egg-hint" :class="easterEggClass">
            {{ easterEggMessage }}
          </div>
        </Transition>
      </div>

      <!-- 控制按钮 -->
      <div class="mobile-controls">
        <div class="control-btn left-btn" @mousedown="mobileMoveLeft = true" @mouseup="mobileMoveLeft = false" @mouseleave="mobileMoveLeft = false">
          <span>◀</span>
        </div>
        <div class="control-btn jump-btn" @mousedown="mobileJump = true" @mouseup="mobileJump = false" @mouseleave="mobileJump = false">
          <span>▲</span>
        </div>
        <div class="control-btn right-btn" @mousedown="mobileMoveRight = true" @mouseup="mobileMoveRight = false" @mouseleave="mobileMoveRight = false">
          <span>▶</span>
        </div>
      </div>
    </div>

    <!-- 阶段3：通关结算 -->
    <Transition name="fade">
      <div v-if="gamePhase === 'win'" class="win-phase">
        <div class="win-overlay"></div>
        <div class="win-content">
          <div class="win-flash" :class="{ active: winFlash }"></div>
          <h1 class="win-title">你找到了晓山瑞希！</h1>
          <div class="win-image-container">
            <img
              :src="winImageSrc"
              alt="晓山瑞希"
              class="win-image"
              :class="{ flash: imageFlash }"
            />
          </div>
          <div class="win-stats">
            <div class="stat-item">
              <span class="stat-label">总用时</span>
              <span class="stat-value">{{ formattedTime }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">收集碎片</span>
              <span class="stat-value">{{ fragmentsCollected }} / 100</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">跳跃次数</span>
              <span class="stat-value">{{ jumpCount }}</span>
            </div>
          </div>
          <div class="win-buttons">
            <button class="win-btn primary" @click="$emit('win')">完成</button>
            <button class="win-btn secondary" @click="restartGame">再玩一次</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 阶段4：失败结算 -->
    <Transition name="fade">
      <div v-if="gamePhase === 'fail'" class="fail-phase">
        <div class="fail-overlay"></div>
        <div class="fail-content">
          <h1 class="fail-title">{{ failMessage }}</h1>
          <p class="fail-subtitle">你到达了第 {{ currentFloor }} 层</p>
          <div class="fail-stats">
            <div class="stat-item">
              <span class="stat-label">最佳记录</span>
              <span class="stat-value">{{ bestFloor }} 层</span>
            </div>
          </div>
          <div class="fail-buttons">
            <button class="fail-btn primary" @click="restartGame">重新开始</button>
            <button class="fail-btn secondary" @click="goHome">返回首页</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const emit = defineEmits(['win'])

// ============ 游戏状态 ============
const gamePhase = ref('intro') // intro, playing, win, fail
const gameContainer = ref(null)
const gameCanvas = ref(null)
const particleLayer = ref(null)
let ctx = null
let animationId = null

// 移动端
const isMobile = ref(false)
const mobileMoveLeft = ref(false)
const mobileMoveRight = ref(false)
const mobileJump = ref(false)

// ============ 开场叙事 ============
const introLines = [
  '晓山瑞希全部消失了。',
  '这一次，她藏在不断上升的世界深处。',
  '你要跟随她上升100层，',
  '才能再次找到她。',
  '',
  '准备好了吗？'
]
const currentLineIndex = ref(-1)
const showStartHint = ref(false)
let introTimer = null

// ============ 游戏数据 ============
const currentFloor = ref(1)
const fragmentsCollected = ref(0)
const elapsedTime = ref(0)
const jumpCount = ref(0)
const bestFloor = ref(parseInt(localStorage.getItem('mzk_level8_bestFloor') || '0'))

// 时间和图像
let gameTimer = null
const formattedTime = computed(() => {
  const mins = Math.floor(elapsedTime.value / 60)
  const secs = elapsedTime.value % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
})

const fragmentProgressWidth = computed(() => {
  return `${Math.min(100, fragmentsCollected.value)}%`
})

// ============ 彩蛋 ============
const showEasterEgg = ref(false)
const easterEggMessage = ref('')
const easterEggClass = ref('')
let easterEggTimer = null

const backgroundClass = computed(() => {
  if (currentFloor.value === 33) return 'easter-egg-33'
  if (currentFloor.value === 66) return 'easter-egg-66'
  return ''
})

const triggerEasterEgg = (floor) => {
  if (floor === 33) {
    easterEggMessage.value = '她在看着你...'
    easterEggClass.value = 'egg-33'
  } else if (floor === 66) {
    easterEggMessage.value = '晓山瑞希的祝福'
    easterEggClass.value = 'egg-66'
  }
  showEasterEgg.value = true
  clearTimeout(easterEggTimer)
  easterEggTimer = setTimeout(() => {
    showEasterEgg.value = false
  }, 3000)
}

// ============ 通关/失败 ============
const winFlash = ref(false)
const imageFlash = ref(false)
const winImageSrc = ref('/assets/images/倒立mzk.webp')
const failMessage = ref('你掉出了世界...')

const triggerWin = () => {
  gamePhase.value = 'win'
  stopGame()

  // 更新记录
  const currentBest = parseInt(localStorage.getItem('mzk_level8_bestTime') || '999999')
  if (elapsedTime.value < currentBest) {
    localStorage.setItem('mzk_level8_bestTime', elapsedTime.value.toString())
  }
  localStorage.setItem('mzk_level8_totalPlays', (parseInt(localStorage.getItem('mzk_level8_totalPlays') || '0') + 1).toString())

  // 通关动画
  setTimeout(() => {
    winFlash.value = true
    setTimeout(() => {
      winFlash.value = false
    }, 200)
  }, 500)

  // 100层彩蛋
  if (currentFloor.value === 100) {
    setTimeout(() => {
      imageFlash.value = true
      winImageSrc.value = killaImage ? '/assets/images/item/killa晓山瑞希卡面.webp' : '/assets/images/倒立mzk.webp'
      setTimeout(() => {
        imageFlash.value = false
        winImageSrc.value = '/assets/images/倒立mzk.webp'
      }, 1000)
    }, 1000)
  }
}

const triggerFail = (reason) => {
  gamePhase.value = 'fail'
  failMessage.value = reason
  stopGame()

  if (currentFloor.value > bestFloor.value) {
    bestFloor.value = currentFloor.value
    localStorage.setItem('mzk_level8_bestFloor', currentFloor.value.toString())
  }
}

const restartGame = () => {
  resetGame()
  startGame()
}

const goHome = () => {
  emit('win')
}

// ============ 游戏循环 ============
const PLATFORM_BASE_SPEED = 0.5
const GRAVITY = 0.15
const JUMP_SPEED = -14
const MAX_FALL_SPEED = 8
const PLAYER_SPEED = 4
const KEY_REPEAT_DELAY = 100 // 按键重复延迟(ms)
const KEY_REPEAT_INTERVAL = 50 // 按键重复间隔(ms)

let platforms = []
let platformIdCounter = 0
let player = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  width: 48,
  height: 64,
  onGround: false,
  currentPlatformId: null,
  hasJumped: false,
  stayTimer: 0
}
let keys = {
  left: false,
  right: false,
  up: false
}
// 按键冷却
let keyTimers = {
  left: 0,
  right: 0
}
let lastKeyTime = 0
let canvasWidth = 0
let canvasHeight = 0
let platformSpeed = PLATFORM_BASE_SPEED

// ============ 难度曲线 ============
const getDifficultyParams = (floor) => {
  if (floor <= 20) {
    return { widthMin: 120, widthMax: 150, gapMin: 120, gapMax: 150, speed: 0.5, specialChance: 0 }
  } else if (floor <= 40) {
    return { widthMin: 100, widthMax: 130, gapMin: 100, gapMax: 130, speed: 0.6, specialChance: 0.2 }
  } else if (floor <= 60) {
    return { widthMin: 80, widthMax: 120, gapMin: 90, gapMax: 120, speed: 0.8, specialChance: 0.35 }
  } else if (floor <= 80) {
    return { widthMin: 70, widthMax: 100, gapMin: 80, gapMax: 110, speed: 1.0, specialChance: 0.45 }
  } else {
    return { widthMin: 60, widthMax: 90, gapMin: 75, gapMax: 100, speed: 1.2, specialChance: 0.5 }
  }
}

// ============ 平台类 ============
class Platform {
  constructor(x, y, width, type = 'normal') {
    this.id = ++platformIdCounter
    this.x = x
    this.y = y
    this.width = width
    this.height = 16
    this.type = type
    this.vx = 0
    this.shrinkTimer = 0
    this.originalWidth = width
    this.fadeOut = false
    this.opacity = 0

    if (type === 'moving') {
      this.vx = (Math.random() > 0.5 ? 1 : -1) * 1.5
    }
  }

  update() {
    // 淡入效果
    if (this.opacity < 1) {
      this.opacity = Math.min(1, this.opacity + 0.05)
    }

    // 移动平台
    if (this.type === 'moving') {
      this.x += this.vx
      if (this.x <= 10 || this.x + this.width >= canvasWidth - 10) {
        this.vx *= -1
      }
    }

    // 缩小平台
    if (this.type === 'shrink') {
      this.shrinkTimer++
      if (this.shrinkTimer > 180) { // 3秒后开始缩小
        const progress = (this.shrinkTimer - 180) / 60
        this.width = this.originalWidth * (1 - progress)
        if (this.width <= 0) {
          this.fadeOut = true
        }
      }
    }

    // 下沉
    this.y += platformSpeed
  }

  draw(ctx) {
    ctx.save()
    ctx.globalAlpha = this.opacity

    // 根据类型绘制不同颜色
    let gradient
    switch (this.type) {
      case 'moving':
        gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y)
        gradient.addColorStop(0, '#E89BC4')
        gradient.addColorStop(1, '#D4729E')
        break
      case 'shrink':
        gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y)
        gradient.addColorStop(0, 'rgba(200, 150, 220, 0.8)')
        gradient.addColorStop(0.5, '#C896D4')
        gradient.addColorStop(1, 'rgba(200, 150, 220, 0.8)')
        break
      case 'boost':
        gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y)
        gradient.addColorStop(0, '#98D8C8')
        gradient.addColorStop(1, '#7FC4AF')
        break
      default:
        gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y)
        gradient.addColorStop(0, '#F6B1C8')
        gradient.addColorStop(0.5, '#F8C4D4')
        gradient.addColorStop(1, '#F6B1C8')
    }

    // 66层彩蛋：金色平台
    if (currentFloor.value === 66) {
      gradient = ctx.createLinearGradient(this.x, this.y, this.x + this.width, this.y)
      gradient.addColorStop(0, '#FFD700')
      gradient.addColorStop(0.5, '#FFEC8B')
      gradient.addColorStop(1, '#FFD700')
    }

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.roundRect(this.x, this.y, this.width, this.height, 4)
    ctx.fill()

    // 发光效果
    ctx.shadowColor = 'rgba(246, 177, 200, 0.6)'
    ctx.shadowBlur = 10
    ctx.fill()
    ctx.shadowBlur = 0

    // 绘制图标
    if (this.type === 'moving') {
      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('◀▶', this.x + this.width / 2, this.y - 5)
    } else if (this.type === 'boost') {
      ctx.fillStyle = '#fff'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('▲', this.x + this.width / 2, this.y - 5)
    }

    ctx.restore()
  }

  collidesWith(px, py, pw, ph) {
    return px < this.x + this.width &&
           px + pw > this.x &&
           py < this.y + this.height &&
           py + ph > this.y
  }
}

// ============ 初始化游戏 ============
const initGame = () => {
  const canvas = gameCanvas.value
  if (!canvas) return

  ctx = canvas.getContext('2d')

  // 设置画布尺寸
  const container = gameContainer.value
  canvasWidth = container.clientWidth
  canvasHeight = container.clientHeight
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  // 重置平台ID计数器
  platformIdCounter = 0

  // 初始化玩家
  player.x = canvasWidth / 2 - player.width / 2
  player.y = 0
  player.vx = 0
  player.vy = platformSpeed // 初始跟随平台下沉
  player.onGround = false
  player.currentPlatformId = null
  player.hasJumped = false
  player.stayTimer = 0

  // 初始化平台
  platforms = []
  const params = getDifficultyParams(1)

  // 初始平台（在玩家脚下）
  const initialPlatform = new Platform(
    canvasWidth / 2 - 80,
    canvasHeight * 0.5,
    160,
    'normal'
  )
  platforms.push(initialPlatform)
  player.y = initialPlatform.y - player.height
  player.currentPlatformId = initialPlatform.id

  // 生成初始平台（确保有足够的平台在下方）
  let lastY = initialPlatform.y
  for (let i = 0; i < 15; i++) {
    const width = params.widthMin + Math.random() * (params.widthMax - params.widthMin)
    const x = Math.random() * (canvasWidth - width - 20) + 10
    lastY += params.gapMin + Math.random() * (params.gapMax - params.gapMin)
    platforms.push(new Platform(x, lastY, width, 'normal'))
  }

  // 更新难度参数
  platformSpeed = params.speed
}

const resetGame = () => {
  currentFloor.value = 1
  fragmentsCollected.value = 0
  elapsedTime.value = 0
  jumpCount.value = 0
  platformSpeed = PLATFORM_BASE_SPEED
  player.stayTimer = 0
}

const startGame = () => {
  gamePhase.value = 'playing'
  initGame()
  startGameLoop()
  startTimer()
}

const stopGame = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  if (gameTimer) {
    clearInterval(gameTimer)
    gameTimer = null
  }
}

const startTimer = () => {
  gameTimer = setInterval(() => {
    elapsedTime.value++
  }, 1000)
}

// ============ 游戏循环 ============
const startGameLoop = () => {
  const loop = () => {
    if (gamePhase.value !== 'playing') return

    update()
    render()

    animationId = requestAnimationFrame(loop)
  }
  animationId = requestAnimationFrame(loop)
}

const update = () => {
  const params = getDifficultyParams(currentFloor.value)
  platformSpeed = params.speed

  // 更新平台
  for (let i = platforms.length - 1; i >= 0; i--) {
    platforms[i].update()

    // 移除超出屏幕的平台
    if (platforms[i].y > canvasHeight + 50) {
      platforms.splice(i, 1)
    }
  }

  // 生成新平台
  const topPlatform = platforms.reduce((min, p) => p.y < min.y ? p : min, platforms[0])
  if (topPlatform && topPlatform.y > -100) {
    const floor = currentFloor.value
    const width = params.widthMin + Math.random() * (params.widthMax - params.widthMin)
    const x = Math.random() * (canvasWidth - width - 20) + 10
    const y = topPlatform.y - params.gapMin - Math.random() * (params.gapMax - params.gapMin)

    // 确定平台类型
    let type = 'normal'
    if (params.specialChance > 0 && Math.random() < params.specialChance) {
      const rand = Math.random()
      if (floor <= 40) {
        type = 'moving'
      } else if (floor <= 70) {
        type = rand > 0.5 ? 'shrink' : 'moving'
      } else {
        const r = Math.random()
        if (r < 0.33) type = 'moving'
        else if (r < 0.66) type = 'shrink'
        else type = 'boost'
      }
    }

    platforms.push(new Platform(x, y, width, type))
  }

  // 玩家输入（带冷却机制）
  const now = Date.now()
  player.vx = 0

  // 左侧移动（带按键冷却）
  if (keys.left) {
    const elapsed = now - keyTimers.left
    if (elapsed > KEY_REPEAT_DELAY) {
      const effectiveInterval = elapsed > KEY_REPEAT_DELAY + KEY_REPEAT_INTERVAL
        ? KEY_REPEAT_INTERVAL
        : KEY_REPEAT_DELAY
      if (now - lastKeyTime >= effectiveInterval) {
        player.vx = -PLAYER_SPEED
        lastKeyTime = now
      }
    } else {
      // 首次响应
      player.vx = -PLAYER_SPEED
      lastKeyTime = now
    }
  }

  // 右侧移动（带按键冷却）
  if (keys.right) {
    const elapsed = now - keyTimers.right
    if (elapsed > KEY_REPEAT_DELAY) {
      const effectiveInterval = elapsed > KEY_REPEAT_DELAY + KEY_REPEAT_INTERVAL
        ? KEY_REPEAT_INTERVAL
        : KEY_REPEAT_DELAY
      if (now - lastKeyTime >= effectiveInterval) {
        player.vx = PLAYER_SPEED
        lastKeyTime = now
      }
    } else {
      // 首次响应
      player.vx = PLAYER_SPEED
      lastKeyTime = now
    }
  }

  // 跳跃（直接响应，无冷却）
  if ((keys.up || mobileJump.value) && player.onGround) {
    player.vy = JUMP_SPEED
    player.onGround = false
    player.hasJumped = true
    player.currentPlatformId = null
    jumpCount.value++
    keys.up = false // 防止按住跳跃
  }

  // 重力
  if (!player.onGround) {
    player.vy += GRAVITY
    if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED
  } else {
    // 在平台上时跟随下沉
    player.vy = platformSpeed
  }

  // 移动
  player.x += player.vx
  player.y += player.vy

  // 屏幕边界
  if (player.x < 0) player.x = 0
  if (player.x + player.width > canvasWidth) player.x = canvasWidth - player.width

  // 碰撞检测
  player.onGround = false
  let landedOnPlatform = null

  for (const platform of platforms) {
    if (platform.fadeOut) continue

    // 只检测下落时的碰撞
    if (player.vy >= 0) {
      const playerBottom = player.y + player.height
      const playerPrevBottom = playerBottom - player.vy

      // 碰撞条件：从上方落下，落在平台上
      if (playerPrevBottom <= platform.y + 8 &&
          playerBottom >= platform.y &&
          playerBottom <= platform.y + platform.height + 5 &&
          player.x + player.width > platform.x + 5 &&
          player.x < platform.x + platform.width - 5) {

        player.y = platform.y - player.height
        player.vy = platformSpeed // 跟随平台下沉
        player.onGround = true
        landedOnPlatform = platform

        // 加速平台效果
        if (platform.type === 'boost') {
          player.vy = platformSpeed + 3 // 加速下沉
        }

        break
      }
    }
  }

  // 处理落地逻辑
  if (landedOnPlatform && landedOnPlatform.id !== player.currentPlatformId) {
    // 落到新平台
    if (player.currentPlatformId !== null && player.hasJumped) {
      // 从之前的平台跳起后落到新平台，增加层数
      currentFloor.value++
      fragmentsCollected.value++

      // 彩蛋检测
      if (currentFloor.value === 33 || currentFloor.value === 66) {
        triggerEasterEgg(currentFloor.value)
      }

      // 通关检测
      if (currentFloor.value > 100) {
        triggerWin()
        return
      }
    }
    player.currentPlatformId = landedOnPlatform.id
    player.hasJumped = false
    player.stayTimer = 0
  }

  // 记录是否在平台上
  if (player.onGround) {
    player.stayTimer = 0
  } else {
    player.stayTimer++
  }

  // 失败检测
  if (player.y > canvasHeight + 50) {
    triggerFail('你掉出了世界...')
    return
  }

  if (player.y < -canvasHeight) {
    triggerFail('你上浮失败了...')
    return
  }

  // 停留超时检测（但玩家在下落不算停留）
  if (player.onGround && player.stayTimer > 900) { // 15秒
    triggerFail('你在平台上停留太久了...')
    return
  }
}

const render = () => {
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 绘制背景渐变
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight)
  if (currentFloor.value === 33) {
    bgGradient.addColorStop(0, '#1a3a2a')
    bgGradient.addColorStop(1, '#2d5a3d')
  } else {
    bgGradient.addColorStop(0, '#1a1a3d')
    bgGradient.addColorStop(0.5, '#2d2d5a')
    bgGradient.addColorStop(1, '#3d3d6b')
  }
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 绘制星空
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
  for (let i = 0; i < 50; i++) {
    const x = (i * 73 + elapsedTime.value * 0.1) % canvasWidth
    const y = (i * 91 + elapsedTime.value * 0.2) % canvasHeight
    ctx.beginPath()
    ctx.arc(x, y, 1, 0, Math.PI * 2)
    ctx.fill()
  }

  // 绘制平台
  for (const platform of platforms) {
    platform.draw(ctx)
  }

  // 绘制玩家（带拉伸动画）
  ctx.save()
  const stretchY = player.vy > 0 ? 1 + player.vy * 0.015 : 1 - player.vy * 0.008

  ctx.translate(player.x + player.width / 2, player.y + player.height)
  ctx.scale(1, stretchY)
  ctx.drawImage(
    playerImage,
    -player.width / 2,
    -player.height,
    player.width,
    player.height
  )
  ctx.restore()

  // 绘制下落尾迹
  if (player.vy > 3) {
    ctx.globalAlpha = 0.3
    ctx.fillStyle = '#F6B1C8'
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath()
      ctx.arc(
        player.x + player.width / 2,
        player.y - i * 15,
        5 - i,
        0,
        Math.PI * 2
      )
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}

// 预加载玩家图片
let playerImage = null
let killaImage = null

const fallbackImage = new Image()
fallbackImage.src = '/assets/images/普通mzk.webp'

// ============ 输入处理 ============
const handleKeyDown = (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    if (!keys.left) {
      keys.left = true
      keyTimers.left = Date.now()
    }
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    if (!keys.right) {
      keys.right = true
      keyTimers.right = Date.now()
    }
  }
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
    keys.up = true
  }
  // 阻止默认行为
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) {
    e.preventDefault()
  }
}

const handleKeyUp = (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = false
    keyTimers.left = 0
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = false
    keyTimers.right = 0
  }
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') keys.up = false
}

const focusGame = () => {
  if (gameContainer.value) {
    gameContainer.value.focus()
  }
}

// ============ 生命周期 ============
onMounted(() => {
  // 检测移动端
  isMobile.value = 'ontouchstart' in window

  // 预加载图片
  playerImage = new Image()
  playerImage.src = '/assets/images/item/普通mzk.webp'
  playerImage.onload = () => {
    console.log('Player image loaded')
  }
  playerImage.onerror = () => {
    playerImage = fallbackImage
  }

  killaImage = new Image()
  killaImage.src = '/assets/images/item/killa晓山瑞希卡面.webp'
  killaImage.onerror = () => {
    killaImage = null
  }

  // 开场叙事计时器
  introTimer = setInterval(() => {
    if (currentLineIndex.value < introLines.length - 1) {
      currentLineIndex.value++
      if (currentLineIndex.value === introLines.length - 1) {
        clearInterval(introTimer)
        setTimeout(() => {
          showStartHint.value = true
        }, 1000)
      }
    }
  }, 1200)

  // 聚焦游戏容器
  if (gameContainer.value) {
    gameContainer.value.focus()
  }

  // 窗口大小变化
  window.addEventListener('resize', () => {
    if (gamePhase.value === 'playing') {
      initGame()
    }
  })
})

onUnmounted(() => {
  stopGame()
  clearInterval(introTimer)
  clearTimeout(easterEggTimer)
})
</script>

<style scoped>
.platform-descent {
  width: 100%;
  height: calc(100vh - 60px);
  max-height: 700px;
  position: relative;
  overflow: hidden;
  outline: none;
  background: #1a1a3d;
  margin: 0 auto;
}

/* ============ 通用过渡 ============ */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ============ 阶段1：开场叙事 ============ */
.intro-phase {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 100;
}

.intro-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
}

.intro-text-container {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
}

.intro-line {
  font-size: 20px;
  color: #fff;
  margin: 16px 0;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s ease, transform 0.8s ease;
  font-family: 'STKaiti', 'KaiTi', serif;
  line-height: 1.8;
}

.intro-line.visible {
  opacity: 1;
  transform: translateY(0);
}

.start-hint {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

/* ============ 阶段2：游戏 ============ */
.game-phase {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.game-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1a1a3d 0%, #2d2d5a 50%, #3d3d6b 100%);
  transition: background 1s ease;
}

.game-background.easter-egg-33 {
  background: linear-gradient(180deg, #1a3a2a 0%, #2d5a3d 50%, #3d7a5d 100%);
}

.game-background.easter-egg-66 {
  background: linear-gradient(180deg, #3d3a1a 0%, #5a5a2d 50%, #6b6b3d 100%);
}

.particle-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.game-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.game-ui {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  padding: 16px;
  z-index: 10;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.floor-indicator {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.floor-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.floor-number {
  font-size: 28px;
  font-weight: bold;
  color: #F6B1C8;
  text-shadow: 0 0 10px rgba(246, 177, 200, 0.5);
}

.time-display {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time-icon {
  font-size: 16px;
}

.time-value {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  font-family: monospace;
}

.fragment-bar {
  margin-top: 12px;
  height: 8px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.fragment-progress {
  height: 100%;
  background: linear-gradient(90deg, #F6B1C8, #D4729E);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.fragment-count {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.easter-egg-hint {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 20px 40px;
  border-radius: 12px;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  z-index: 100;
  animation: easterEggAppear 0.5s ease;
}

.easter-egg-hint.egg-33 {
  background: rgba(0, 80, 0, 0.9);
  color: #90EE90;
  border: 2px solid #228B22;
  box-shadow: 0 0 30px rgba(34, 139, 34, 0.5);
}

.easter-egg-hint.egg-66 {
  background: rgba(80, 80, 0, 0.9);
  color: #FFD700;
  border: 2px solid #DAA520;
  box-shadow: 0 0 30px rgba(218, 165, 32, 0.5);
}

@keyframes easterEggAppear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.1); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.easter-egg-pop-enter-active {
  animation: easterEggAppear 0.5s ease;
}

.easter-egg-pop-leave-active {
  animation: easterEggDisappear 0.5s ease;
}

@keyframes easterEggDisappear {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
}

/* 移动端控制 */
.mobile-controls {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 20;
}

.control-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.control-btn:active {
  background: rgba(255, 255, 255, 0.4);
}

.left-btn, .right-btn {
  width: 60px;
  height: 60px;
}

.jump-btn {
  width: 80px;
  height: 80px;
  background: rgba(246, 177, 200, 0.4);
  border-color: rgba(246, 177, 200, 0.6);
}

/* ============ 阶段3：通关 ============ */
.win-phase {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.win-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
}

.win-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
  max-width: 400px;
}

.win-flash {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #fff;
  opacity: 0;
  pointer-events: none;
  z-index: 300;
}

.win-flash.active {
  animation: flash 0.2s ease;
}

@keyframes flash {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

.win-title {
  font-size: 32px;
  color: #F6B1C8;
  margin-bottom: 24px;
  font-family: 'STKaiti', 'KaiTi', serif;
  text-shadow: 0 0 20px rgba(246, 177, 200, 0.5);
}

.win-image-container {
  margin: 20px 0;
}

.win-image {
  width: 150px;
  height: 200px;
  object-fit: contain;
  border-radius: 12px;
  border: 3px solid #F6B1C8;
  box-shadow: 0 0 30px rgba(246, 177, 200, 0.4);
  transition: all 0.3s ease;
}

.win-image.flash {
  animation: imageFlash 1s ease;
}

@keyframes imageFlash {
  0%, 20%, 40% { filter: brightness(1); }
  10%, 30% { filter: brightness(3) hue-rotate(180deg); }
  50%, 100% { filter: brightness(1); }
}

.win-stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 24px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.stat-value {
  color: #fff;
  font-size: 16px;
  font-weight: bold;
}

.win-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.win-btn {
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.win-btn.primary {
  background: #F6B1C8;
  color: #333;
  border-color: #F6B1C8;
}

.win-btn.primary:hover {
  background: #D4729E;
  border-color: #D4729E;
  transform: scale(1.05);
}

.win-btn.secondary {
  background: transparent;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.5);
}

.win-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
}

/* ============ 阶段4：失败 ============ */
.fail-phase {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.fail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
}

.fail-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
  max-width: 400px;
}

.fail-title {
  font-size: 28px;
  color: #e74c3c;
  margin-bottom: 16px;
  font-family: 'STKaiti', 'KaiTi', serif;
}

.fail-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 24px;
}

.fail-stats {
  margin: 24px 0;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.fail-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.fail-btn {
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.fail-btn.primary {
  background: #e74c3c;
  color: #fff;
  border-color: #e74c3c;
}

.fail-btn.primary:hover {
  background: #c0392b;
  border-color: #c0392b;
  transform: scale(1.05);
}

.fail-btn.secondary {
  background: transparent;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.5);
}

.fail-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
}

/* ============ 响应式 ============ */
@media (max-width: 768px) {
  .intro-line {
    font-size: 16px;
  }

  .status-bar {
    padding: 6px 12px;
  }

  .floor-number {
    font-size: 22px;
  }

  .win-title {
    font-size: 24px;
  }

  .win-content, .fail-content {
    padding: 24px;
  }
}
</style>
