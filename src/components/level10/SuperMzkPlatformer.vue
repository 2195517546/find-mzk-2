<template>
  <div class="super-mario" ref="gameContainer" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp" @click="focusGame">
    <!-- 开场叙事 -->
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

    <!-- 游戏进行 -->
    <div v-if="gamePhase === 'playing' || gamePhase === 'win' || gamePhase === 'fail'" class="game-phase">
      <!-- 背景 -->
      <div class="game-background">
        <div class="stars-layer"></div>
      </div>

      <!-- 游戏画布 -->
      <canvas ref="gameCanvas" class="game-canvas"></canvas>

      <!-- UI覆盖层 -->
      <div class="game-ui">
        <!-- 顶部状态栏 -->
        <div class="status-bar">
          <div class="score-display">
            <span class="score-label">金币</span>
            <span class="score-value">{{ coins }}</span>
          </div>
          <div class="level-indicator">
            <span class="level-text">超级晓山瑞希</span>
          </div>
          <div class="lives-display">
            <span class="lives-label">生命</span>
            <span class="lives-value">{{ lives }}</span>
          </div>
        </div>
      </div>

      <!-- 移动端控制 -->
      <div class="mobile-controls">
        <div class="control-btn left-btn"
          @mousedown="mobileLeft = true" @mouseup="mobileLeft = false" @mouseleave="mobileLeft = false"
          @touchstart.prevent="mobileLeft = true" @touchend.prevent="mobileLeft = false">
          <span>◀</span>
        </div>
        <div class="control-btn jump-btn"
          @mousedown="mobileJump = true" @mouseup="mobileJump = false" @mouseleave="mobileJump = false"
          @touchstart.prevent="mobileJump = true" @touchend.prevent="mobileJump = false">
          <span>▲</span>
        </div>
        <div class="control-btn right-btn"
          @mousedown="mobileRight = true" @mouseup="mobileRight = false" @mouseleave="mobileRight = false"
          @touchstart.prevent="mobileRight = true" @touchend.prevent="mobileRight = false">
          <span>▶</span>
        </div>
      </div>
    </div>

    <!-- 通关结算 -->
    <Transition name="fade">
      <div v-if="gamePhase === 'win'" class="win-phase">
        <div class="win-overlay"></div>
        <div class="win-content">
          <h1 class="win-title">你找到了晓山瑞希！</h1>
          <div class="win-image-container">
            <img src="/assets/images/item/普通mzk.webp" alt="晓山瑞希" class="win-image" />
          </div>
          <div class="win-stats">
            <div class="stat-item">
              <span class="stat-label">收集金币</span>
              <span class="stat-value">{{ coins }}</span>
            </div>
          </div>
          <div class="win-buttons">
            <button class="win-btn primary" @click="$emit('win')">完成</button>
            <button class="win-btn secondary" @click="restartGame">再玩一次</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 失败结算 -->
    <Transition name="fade">
      <div v-if="gamePhase === 'fail'" class="fail-phase">
        <div class="fail-overlay"></div>
        <div class="fail-content">
          <h1 class="fail-title">游戏结束</h1>
          <p class="fail-subtitle">你收集了 {{ coins }} 个金币</p>
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
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits(['win'])

// ============ 游戏状态 ============
const gamePhase = ref('intro')
const gameContainer = ref(null)
const gameCanvas = ref(null)
let ctx = null
let animationId = null

// 移动端控制
const mobileLeft = ref(false)
const mobileRight = ref(false)
const mobileJump = ref(false)

// ============ 开场叙事 ============
const introLines = [
  '超级晓山瑞希',
  '在像素的世界里，她等待着你的到来',
  '用你灵活的操作，',
  '穿越重重障碍，',
  '找到隐藏的她吧！'
]
const currentLineIndex = ref(-1)
const showStartHint = ref(false)
let introTimer = null

// ============ 游戏数据 ============
const coins = ref(0)
const lives = ref(3)

// ============ 胜负判定 ============
const triggerWin = () => {
  gamePhase.value = 'win'
  stopGame()
}

const triggerFail = () => {
  lives.value--
  if (lives.value <= 0) {
    gamePhase.value = 'fail'
    stopGame()
  } else {
    resetPlayerPosition()
  }
}

const restartGame = () => {
  coins.value = 0
  lives.value = 3
  cameraX = 0
  initGame()
  startGame()
}

const goHome = () => {
  emit('win')
}

// ============ 游戏常量 ============
const GRAVITY = 0.5
const JUMP_SPEED = -12
const MOVE_SPEED = 4
const MAX_FALL_SPEED = 10
const PLAYER_WIDTH = 40
const PLAYER_HEIGHT = 56
const GROUND_Y = 450
const LEVEL_WIDTH = 4000
const PLATFORM_WIDTH = 40
const PLATFORM_HEIGHT = 40

// ============ 游戏变量 ============
let platforms = [] // 所有可碰撞的平台（包括地面、方块）
let breakables = [] // 可顶掉的砖块和问号方块
let floatingCoins = [] // 从方块顶出的金币
let enemies = []
let flagpole = null
let player = {
  x: 100,
  y: GROUND_Y - PLAYER_HEIGHT,
  vx: 0,
  vy: 0,
  direction: 1,
  isRunning: false,
  isJumping: false,
  isDead: false
}
let keys = {
  left: false,
  right: false,
  jump: false
}
let cameraX = 0
let canvasWidth = 0
let canvasHeight = 0

// ============ 图片 ============
let images = {}
let imagesLoaded = false

// ============ 随机关卡生成 ============
const generateLevel = () => {
  platforms = []
  breakables = []
  floatingCoins = []
  enemies = []
  flagpole = null

  // 生成地面 - 分段式
  const groundSegments = []
  let groundX = 0
  while (groundX < LEVEL_WIDTH) {
    const segmentWidth = 300 + Math.random() * 400
    groundSegments.push({
      x: groundX,
      y: GROUND_Y,
      width: segmentWidth,
      height: 50,
      type: 'ground'
    })
    groundX += segmentWidth + 100 + Math.random() * 150 // 间隙
  }

  // 添加初始地面（玩家出生点）
  groundSegments[0] = { x: 0, y: GROUND_Y, width: 600, height: 50, type: 'ground' }

  // 添加终点地面
  const lastSegment = groundSegments[groundSegments.length - 1]
  if (lastSegment) {
    lastSegment.width = Math.max(lastSegment.width, LEVEL_WIDTH - lastSegment.x)
  }

  platforms.push(...groundSegments)

  // 生成空中平台
  const platformCount = Math.floor(LEVEL_WIDTH / 200)
  for (let i = 0; i < platformCount; i++) {
    const x = 400 + i * 200 + Math.random() * 100
    const y = 280 + Math.random() * 120
    const width = 80 + Math.random() * 120

    platforms.push({
      x,
      y,
      width,
      height: 20,
      type: 'normal'
    })

    // 随机添加可顶掉的方块在平台上方
    if (Math.random() > 0.5) {
      addBreakableAbovePlatform(x, y, width)
    }
  }

  // 生成问号方块列（3-4个叠在一起）
  const questionBlockX = 600 + Math.floor(Math.random() * 5) * 300
  const questionCount = 2 + Math.floor(Math.random() * 2)
  for (let i = 0; i < questionCount; i++) {
    breakables.push({
      x: questionBlockX,
      y: GROUND_Y - PLATFORM_HEIGHT * (i + 1),
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'question',
      hit: false,
      used: false
    })
  }

  // 生成砖块区域
  const brickAreas = 3 + Math.floor(Math.random() * 3)
  for (let a = 0; a < brickAreas; a++) {
    const areaX = 1000 + a * 600 + Math.random() * 300
    const rows = 1 + Math.floor(Math.random() * 2)
    const cols = 2 + Math.floor(Math.random() * 3)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.random() > 0.3) { // 30%概率为空
          breakables.push({
            x: areaX + c * PLATFORM_WIDTH,
            y: GROUND_Y - PLATFORM_HEIGHT * (rows - r),
            width: PLATFORM_WIDTH,
            height: PLATFORM_HEIGHT,
            type: 'brick',
            hit: false,
            broken: false
          })
        }
      }
    }
  }

  // 生成更多问号方块（分散放置）
  const questionCount = 5 + Math.floor(Math.random() * 5)
  for (let i = 0; i < questionCount; i++) {
    const qx = 300 + Math.random() * (LEVEL_WIDTH - 500)
    const qy = 200 + Math.random() * 200
    breakables.push({
      x: qx,
      y: qy,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type: 'question',
      hit: false,
      used: false
    })
  }

  // 生成敌人
  const enemyCount = 8 + Math.floor(Math.random() * 6)
  const placedEnemies = []
  for (let i = 0; i < enemyCount; i++) {
    let ex, ey, attempts = 0
    do {
      ex = 400 + Math.random() * (LEVEL_WIDTH - 600)
      ey = GROUND_Y - 40
      attempts++
    } while (attempts < 10 && placedEnemies.some(p => Math.abs(p.x - ex) < 150))

    if (attempts < 10) {
      enemies.push({
        x: ex,
        y: ey,
        vx: (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random()),
        width: 40,
        height: 40,
        type: 'walk',
        dead: false
      })
      placedEnemies.push({ x: ex })
    }
  }

  // 终点旗杆
  flagpole = {
    x: LEVEL_WIDTH - 150,
    y: GROUND_Y - 200,
    width: 20,
    height: 200
  }

  // 在终点前添加一些平台
  platforms.push({
    x: LEVEL_WIDTH - 400,
    y: GROUND_Y - 80,
    width: 80,
    height: 20,
    type: 'normal'
  })
  platforms.push({
    x: LEVEL_WIDTH - 280,
    y: GROUND_Y - 160,
    width: 100,
    height: 20,
    type: 'normal'
  })
}

const addBreakableAbovePlatform = (platformX, platformY, platformWidth) => {
  const breakableCount = Math.floor(platformWidth / PLATFORM_WIDTH)
  for (let i = 0; i < breakableCount; i++) {
    if (Math.random() > 0.4) { // 60%概率放置
      const type = Math.random() > 0.3 ? 'brick' : 'question'
      breakables.push({
        x: platformX + i * PLATFORM_WIDTH,
        y: platformY - PLATFORM_HEIGHT,
        width: PLATFORM_WIDTH,
        height: PLATFORM_HEIGHT,
        type,
        hit: false,
        broken: type === 'brick' ? false : undefined,
        used: false
      })
    }
  }
}

// ============ 初始化 ============
const initGame = () => {
  const canvas = gameCanvas.value
  if (!canvas) return

  ctx = canvas.getContext('2d')

  const container = gameContainer.value
  canvasWidth = container.clientWidth
  canvasHeight = container.clientHeight
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  resetPlayerPosition()
  generateLevel()
}

const resetPlayerPosition = () => {
  player.x = 100
  player.y = GROUND_Y - PLAYER_HEIGHT
  player.vx = 0
  player.vy = 0
  player.isDead = false
  cameraX = 0
}

// ============ 游戏循环 ============
const startGame = () => {
  gamePhase.value = 'playing'
  startGameLoop()
}

const stopGame = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
}

const startGameLoop = () => {
  const loop = () => {
    if (gamePhase.value !== 'playing') return
    update()
    render()
    animationId = requestAnimationFrame(loop)
  }
  animationId = requestAnimationFrame(loop)
}

// ============ 更新逻辑 ============
const update = () => {
  // 玩家输入
  player.vx = 0
  player.isRunning = false

  if (keys.left || mobileLeft.value) {
    player.vx = -MOVE_SPEED
    player.direction = -1
    player.isRunning = true
  }
  if (keys.right || mobileRight.value) {
    player.vx = MOVE_SPEED
    player.direction = 1
    player.isRunning = true
  }
  if ((keys.jump || mobileJump.value) && player.y >= GROUND_Y - PLAYER_HEIGHT - 5) {
    player.vy = JUMP_SPEED
    player.isJumping = true
    keys.jump = false
    mobileJump.value = false
  }

  // 重力
  player.vy += GRAVITY
  if (player.vy > MAX_FALL_SPEED) player.vy = MAX_FALL_SPEED

  // 移动
  player.x += player.vx
  player.y += player.vy

  // 更新跳跃状态
  player.isJumping = player.vy < 0

  // 平台碰撞检测
  for (const platform of platforms) {
    if (platform.type === 'ground') {
      // 地面碰撞
      if (player.y + PLAYER_HEIGHT > platform.y &&
          player.x + PLAYER_WIDTH > platform.x &&
          player.x < platform.x + platform.width) {
        if (player.y + PLAYER_HEIGHT - player.vy <= platform.y + 10) {
          player.y = platform.y - PLAYER_HEIGHT
          player.vy = 0
          player.isJumping = false
        }
      }
    } else {
      // 普通平台碰撞
      if (player.vy >= 0) {
        const playerBottom = player.y + PLAYER_HEIGHT
        const prevBottom = playerBottom - player.vy

        if (prevBottom <= platform.y + 5 && playerBottom >= platform.y &&
            player.x + PLAYER_WIDTH > platform.x && player.x < platform.x + platform.width) {
          player.y = platform.y - PLAYER_HEIGHT
          player.vy = 0
          player.isJumping = false
        }
      }
    }
  }

  // 可顶掉方块碰撞检测
  for (const block of breakables) {
    if (block.broken || (block.used && block.type === 'question')) continue

    // 只检测从下方顶撞
    if (player.vy > 0) {
      const playerBottom = player.y + PLAYER_HEIGHT
      const prevBottom = playerBottom - player.vy

      if (prevBottom <= block.y + 5 && playerBottom >= block.y &&
          player.x + PLAYER_WIDTH > block.x && player.x < block.x + block.width) {

        // 顶撞方块
        player.y = block.y - PLAYER_HEIGHT
        player.vy = 0
        player.isJumping = false

        // 只有未使用过的方块才能被顶
        if (!block.hit) {
          block.hit = true

          if (block.type === 'brick') {
            // 砖块破碎
            block.broken = true
            block.breakParticles = createBreakParticles(block.x, block.y)
          } else if (block.type === 'question') {
            // 问号方块顶出金币
            block.used = true
            floatingCoins.push({
              x: block.x,
              y: block.y - 30,
              vy: -8,
              collected: false,
              startY: block.y - 30
            })
          }
        }
      }
    }
  }

  // 更新破碎粒子
  for (const block of breakables) {
    if (block.breakParticles) {
      block.breakParticles = block.breakParticles.filter(p => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.5
        p.life--
        return p.life > 0
      })
    }
  }

  // 更新浮空金币
  for (const coin of floatingCoins) {
    if (coin.collected) continue

    coin.vy += 0.5
    coin.y += coin.vy

    // 停止上升
    if (coin.vy >= 0 && coin.y >= coin.startY) {
      coin.y = coin.startY
      coin.vy = 0
    }

    // 收集检测
    const playerWorldX = player.x + cameraX
    if (Math.abs(coin.x - playerWorldX) < 30 && Math.abs(coin.y - player.y) < 40) {
      coin.collected = true
      coins.value++
    }
  }

  // 地面碰撞（备用）
  if (player.y + PLAYER_HEIGHT > GROUND_Y) {
    player.y = GROUND_Y - PLAYER_HEIGHT
    player.vy = 0
    player.isJumping = false
  }

  // 摄像机跟随
  const targetCameraX = player.x - canvasWidth / 3
  cameraX = Math.max(0, Math.min(targetCameraX, LEVEL_WIDTH - canvasWidth))

  // 边界
  if (player.x < -cameraX) player.x = -cameraX
  if (player.x > LEVEL_WIDTH - cameraX - PLAYER_WIDTH) {
    player.x = LEVEL_WIDTH - cameraX - PLAYER_WIDTH
  }

  // 敌人更新和碰撞
  for (const enemy of enemies) {
    if (enemy.dead) continue

    enemy.x += enemy.vx

    // 敌人边界 - 在其活动范围内
    if (enemy.x < 200 || enemy.x > LEVEL_WIDTH - 200) {
      enemy.vx *= -1
    }

    // 碰撞检测
    const enemyWorldX = enemy.x
    const playerWorldX = player.x + cameraX
    if (playerWorldX < enemyWorldX + enemy.width &&
        playerWorldX + PLAYER_WIDTH > enemy.x &&
        player.y + PLAYER_HEIGHT > enemy.y &&
        player.y < enemy.y + enemy.height) {
      // 从上方踩死敌人
      if (player.vy > 0 && player.y + PLAYER_HEIGHT - player.vy <= enemy.y + 10) {
        enemy.dead = true
        player.vy = JUMP_SPEED * 0.6
      } else {
        // 死亡
        player.isDead = true
        setTimeout(() => triggerFail(), 500)
      }
    }
  }

  // 移除死亡敌人
  enemies = enemies.filter(e => !e.dead)

  // 旗杆碰撞 - 胜利
  if (flagpole) {
    const flagWorldX = flagpole.x
    const playerWorldX = player.x + cameraX
    if (playerWorldX + PLAYER_WIDTH > flagWorldX && playerWorldX < flagWorldX + flagpole.width) {
      triggerWin()
    }
  }

  // 掉落死亡
  if (player.y > canvasHeight) {
    triggerFail()
  }
}

// 创建砖块破碎粒子
const createBreakParticles = (x, y) => {
  const particles = []
  for (let i = 0; i < 6; i++) {
    particles.push({
      x: x + PLATFORM_WIDTH / 2,
      y: y + PLATFORM_HEIGHT / 2,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 6 - 2,
      life: 30 + Math.random() * 20
    })
  }
  return particles
}

// ============ 渲染 ============
const render = () => {
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 背景渐变
  const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight)
  bgGradient.addColorStop(0, '#1a1a3d')
  bgGradient.addColorStop(0.5, '#2d2d5a')
  bgGradient.addColorStop(1, '#3d3d6b')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 星星
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  for (let i = 0; i < 50; i++) {
    const x = (i * 97 + cameraX * 0.1) % canvasWidth
    const y = (i * 53) % (canvasHeight * 0.6)
    ctx.beginPath()
    ctx.arc(x, y, 1 + (i % 2), 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.save()
  ctx.translate(-cameraX, 0)

  // 绘制地面
  for (const platform of platforms) {
    if (platform.type !== 'ground') continue

    // 泥土层
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height)

    // 草地顶层
    ctx.fillStyle = '#228B22'
    ctx.fillRect(platform.x, platform.y, platform.width, 10)

    // 草地纹理
    ctx.fillStyle = '#32CD32'
    for (let i = 0; i < platform.width; i += 20) {
      if (Math.random() > 0.5) {
        ctx.fillRect(platform.x + i, platform.y, 8, 6)
      }
    }
  }

  // 绘制普通平台
  for (const platform of platforms) {
    if (platform.type === 'ground') continue

    const gradient = ctx.createLinearGradient(platform.x, platform.y, platform.x, platform.y + platform.height)
    gradient.addColorStop(0, '#F6B1C8')
    gradient.addColorStop(1, '#D4729E')
    ctx.fillStyle = gradient
    ctx.fillRect(platform.x, platform.y, platform.width, platform.height)

    // 高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillRect(platform.x, platform.y, platform.width, 4)
  }

  // 绘制可顶掉的方块
  for (const block of breakables) {
    if (block.broken) {
      // 绘制破碎粒子
      if (block.breakParticles) {
        ctx.fillStyle = '#CD853F'
        for (const p of block.breakParticles) {
          ctx.fillRect(p.x - 6, p.y - 6, 12, 12)
        }
      }
      continue
    }

    if (block.type === 'brick') {
      // 砖块
      ctx.fillStyle = '#CD853F'
      ctx.fillRect(block.x, block.y, block.width, block.height)

      // 砖块纹理
      ctx.strokeStyle = '#8B4513'
      ctx.lineWidth = 2
      ctx.strokeRect(block.x, block.y, block.width, block.height)

      // 横线
      ctx.beginPath()
      ctx.moveTo(block.x, block.y + block.height / 2)
      ctx.lineTo(block.x + block.width, block.y + block.height / 2)
      ctx.stroke()

      // 竖线
      ctx.beginPath()
      ctx.moveTo(block.x + block.width / 2, block.y)
      ctx.lineTo(block.x + block.width / 2, block.y + block.height / 2)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(block.x + block.width / 4, block.y + block.height / 2)
      ctx.lineTo(block.x + block.width / 4, block.y + block.height)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(block.x + block.width * 3 / 4, block.y + block.height / 2)
      ctx.lineTo(block.x + block.width * 3 / 4, block.y + block.height)
      ctx.stroke()

    } else if (block.type === 'question') {
      // 问号方块
      const baseColor = block.used ? '#8B8B8B' : '#FFD700'
      const darkColor = block.used ? '#696969' : '#DAA520'

      ctx.fillStyle = baseColor
      ctx.fillRect(block.x, block.y, block.width, block.height)

      // 边框
      ctx.strokeStyle = darkColor
      ctx.lineWidth = 3
      ctx.strokeRect(block.x, block.y, block.width, block.height)

      // 问号或点
      ctx.fillStyle = darkColor
      ctx.font = 'bold 28px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(block.used ? '·' : '?', block.x + block.width / 2, block.y + block.height / 2 + 2)
    }
  }

  // 绘制浮空金币
  for (const coin of floatingCoins) {
    if (coin.collected) continue

    // 金币旋转动画
    const scale = Math.abs(Math.cos(Date.now() / 150 + coin.x))
    ctx.save()
    ctx.translate(coin.x + PLATFORM_WIDTH / 2, coin.y + PLATFORM_HEIGHT / 2)
    ctx.scale(scale, 1)

    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(0, 0, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFA500'
    ctx.beginPath()
    ctx.arc(0, 0, 8, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // 绘制敌人
  for (const enemy of enemies) {
    if (enemy.dead) continue
    ctx.save()
    ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)

    if (enemy.vx > 0) {
      ctx.scale(-1, 1)
    }

    if (images['enemy']) {
      ctx.drawImage(images['enemy'], -enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height)
    } else {
      ctx.fillStyle = '#8B008B'
      ctx.fillRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height)
      // 眼睛
      ctx.fillStyle = '#fff'
      ctx.fillRect(-12, -10, 8, 8)
      ctx.fillRect(4, -10, 8, 8)
      ctx.fillStyle = '#000'
      ctx.fillRect(-10, -8, 4, 4)
      ctx.fillRect(6, -8, 4, 4)
    }
    ctx.restore()
  }

  // 绘制旗杆
  if (flagpole) {
    // 旗杆
    ctx.fillStyle = '#8B4513'
    ctx.fillRect(flagpole.x, flagpole.y, flagpole.width, flagpole.height)

    // 顶部球
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(flagpole.x + flagpole.width / 2, flagpole.y, 12, 0, Math.PI * 2)
    ctx.fill()

    // 旗帜
    ctx.fillStyle = '#FF4444'
    ctx.beginPath()
    ctx.moveTo(flagpole.x + flagpole.width, flagpole.y + 10)
    ctx.lineTo(flagpole.x + flagpole.width + 50, flagpole.y + 30)
    ctx.lineTo(flagpole.x + flagpole.width, flagpole.y + 50)
    ctx.fill()
  }

  // 绘制玩家
  if (!player.isDead) {
    ctx.save()
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT)

    // 镜像朝向
    ctx.scale(player.direction === 1 ? -1 : 1, 1)

    // 跳跃拉伸效果
    let scaleY = 1
    let scaleX = 1
    if (player.isJumping) {
      scaleY = 1.1
      scaleX = 0.9
    } else if (player.vy > 3) {
      scaleY = 0.9
      scaleX = 1.1
    }
    ctx.scale(scaleX, scaleY)

    // 选择图片
    let img = images['normal']
    if (player.isJumping) {
      img = images['flying']
    } else if (player.isRunning) {
      img = images['running']
    }

    if (img) {
      ctx.drawImage(img, -PLAYER_WIDTH / 2, -PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT)
    } else {
      ctx.fillStyle = '#F6B1C8'
      ctx.fillRect(-PLAYER_WIDTH / 2, -PLAYER_HEIGHT, PLAYER_WIDTH, PLAYER_HEIGHT)
    }
    ctx.restore()
  } else {
    // 死亡动画
    ctx.save()
    ctx.translate(player.x + PLAYER_WIDTH / 2, player.y + PLAYER_HEIGHT / 2)

    if (images['scared']) {
      ctx.drawImage(images['scared'], -PLAYER_WIDTH / 2, -PLAYER_HEIGHT / 2, PLAYER_WIDTH, PLAYER_HEIGHT)
    } else {
      ctx.fillStyle = '#FF4444'
      ctx.beginPath()
      ctx.arc(0, 0, PLAYER_WIDTH / 2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  ctx.restore()
}

// ============ 输入处理 ============
const handleKeyDown = (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = true
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = true
  }
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
    keys.jump = true
    e.preventDefault()
  }
}

const handleKeyUp = (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
    keys.left = false
  }
  if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
    keys.right = false
  }
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
    keys.jump = false
  }
}

const focusGame = () => {
  if (gameContainer.value) {
    gameContainer.value.focus()
  }
}

// ============ 生命周期 ============
onMounted(() => {
  // 预加载图片
  const imagePaths = {
    normal: '/assets/images/普通mzk.webp',
    running: '/assets/images/跑mzk.webp',
    flying: '/assets/images/飞行mzk.webp',
    scared: '/assets/images/惊吓mzk.webp',
    enemy: '/assets/images/怪核mzk.webp'
  }

  let loadedCount = 0
  const totalImages = Object.keys(imagePaths).length

  for (const [key, path] of Object.entries(imagePaths)) {
    const img = new Image()
    img.src = path
    img.onload = () => {
      images[key] = img
      loadedCount++
      if (loadedCount === totalImages) {
        imagesLoaded = true
      }
    }
    img.onerror = () => {
      loadedCount++
      if (loadedCount === totalImages) {
        imagesLoaded = true
      }
    }
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

  if (gameContainer.value) {
    gameContainer.value.focus()
  }

  window.addEventListener('resize', () => {
    if (gamePhase.value === 'playing') {
      initGame()
    }
  })
})

onUnmounted(() => {
  stopGame()
  clearInterval(introTimer)
})
</script>

<style scoped>
.super-mario {
  width: 100%;
  height: calc(100vh - 60px);
  max-height: 600px;
  position: relative;
  overflow: hidden;
  outline: none;
  background: #1a1a3d;
  margin: 0 auto;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

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
  font-size: 22px;
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
}

.stars-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 60%;
  background-image: radial-gradient(2px 2px at 20px 30px, white, transparent),
                    radial-gradient(2px 2px at 40px 70px, rgba(255,255,255,0.8), transparent),
                    radial-gradient(1px 1px at 90px 40px, white, transparent),
                    radial-gradient(2px 2px at 130px 80px, rgba(255,255,255,0.6), transparent),
                    radial-gradient(1px 1px at 160px 20px, white, transparent);
  background-size: 200px 100px;
  animation: starsMove 20s linear infinite;
}

@keyframes starsMove {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100px); }
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
  padding: 12px;
  z-index: 10;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.score-display, .lives-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-label, .lives-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.score-value, .lives-value {
  font-size: 20px;
  font-weight: bold;
  color: #FFD700;
}

.lives-value {
  color: #FF6B6B;
}

.level-indicator {
  text-align: center;
}

.level-text {
  font-size: 16px;
  color: #F6B1C8;
  font-weight: bold;
}

.mobile-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 20;
}

.control-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.control-btn:active {
  background: rgba(255, 255, 255, 0.4);
}

.jump-btn {
  width: 80px;
  height: 80px;
  background: rgba(246, 177, 200, 0.4);
  border-color: rgba(246, 177, 200, 0.6);
}

.win-phase, .fail-phase {
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

.win-overlay, .fail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
}

.win-content, .fail-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
  max-width: 400px;
}

.win-title {
  font-size: 28px;
  color: #F6B1C8;
  margin-bottom: 24px;
  font-family: 'STKaiti', 'KaiTi', serif;
  text-shadow: 0 0 20px rgba(246, 177, 200, 0.5);
}

.win-image-container {
  margin: 20px 0;
}

.win-image {
  width: 120px;
  height: 168px;
  object-fit: contain;
  border-radius: 12px;
  border: 3px solid #F6B1C8;
  box-shadow: 0 0 30px rgba(246, 177, 200, 0.4);
}

.win-stats, .fail-stats {
  margin: 24px 0;
}

.stat-item {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  margin-bottom: 8px;
}

.stat-label {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.stat-value {
  color: #FFD700;
  font-size: 20px;
  font-weight: bold;
}

.win-buttons, .fail-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.win-btn, .fail-btn {
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

.win-btn.secondary, .fail-btn.secondary {
  background: transparent;
  color: #fff;
  border-color: rgba(255, 255, 255, 0.5);
}

.win-btn.secondary:hover, .fail-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #fff;
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

@media (max-width: 768px) {
  .intro-line {
    font-size: 16px;
  }

  .win-title, .fail-title {
    font-size: 22px;
  }

  .control-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }

  .jump-btn {
    width: 70px;
    height: 70px;
  }
}
</style>
