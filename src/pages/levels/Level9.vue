<template>
  <div class="tower-defense" ref="gameContainer">
    <!-- 游戏界面 -->
    <div v-if="gamePhase === 'playing'" class="game-phase">
      <!-- 状态栏 -->
      <div class="status-bar">
        <div class="wave-indicator">
          <span class="wave-label">第</span>
          <span class="wave-number">{{ currentWave }}</span>
          <span class="wave-label">/ {{ totalWaves }} 波</span>
        </div>
        <div class="stats">
          <div class="stat-item gold">
            <span class="stat-icon">💰</span>
            <span class="stat-value">{{ gold }}</span>
          </div>
          <div class="stat-item lives">
            <span class="stat-icon">❤️</span>
            <span class="stat-value">{{ lives }}</span>
          </div>
        </div>
        <button class="pause-btn" @click="togglePause">
          {{ isPaused ? '▶' : '⏸' }}
        </button>
      </div>

      <!-- 游戏画布 -->
      <canvas ref="gameCanvas" class="game-canvas"></canvas>

      <!-- 防御单位选择栏 -->
      <div class="defender-bar">
        <div
          v-for="defender in defenders"
          :key="defender.id"
          class="defender-btn"
          :class="{ selected: selectedDefender === defender.id, disabled: gold < defender.cost }"
          @click="selectDefender(defender.id)"
        >
          <img :src="defender.image" :alt="defender.name" class="defender-icon" />
          <span class="defender-name">{{ defender.name }}</span>
          <span class="defender-cost">{{ defender.cost }}💰</span>
        </div>
      </div>

      <!-- 波次开始按钮 -->
      <div v-if="waveState === 'waiting'" class="wave-start-overlay">
        <button class="wave-start-btn" @click="startWave">
          开始第 {{ currentWave }} 波
        </button>
      </div>

      <!-- 暂停遮罩 -->
      <div v-if="isPaused" class="pause-overlay">
        <div class="pause-content">
          <h2>游戏暂停</h2>
          <button class="resume-btn" @click="togglePause">继续游戏</button>
        </div>
      </div>
    </div>

    <!-- 胜利界面 -->
    <div v-if="gamePhase === 'win'" class="result-phase win">
      <div class="result-overlay"></div>
      <div class="result-content">
        <h1 class="result-title">你成功阻止了怪核入侵！</h1>
        <div class="result-image">
          <img src="/assets/images/普通mzk.webp" alt="胜利" />
        </div>
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">波次</span>
            <span class="stat-value">{{ totalWaves }}/{{ totalWaves }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">剩余生命</span>
            <span class="stat-value">{{ lives }}</span>
          </div>
        </div>
        <button class="result-btn primary" @click="$emit('win')">完成</button>
        <button class="result-btn secondary" @click="restartGame">再玩一次</button>
      </div>
    </div>

    <!-- 失败界面 -->
    <div v-if="gamePhase === 'fail'" class="result-phase fail">
      <div class="result-overlay"></div>
      <div class="result-content">
        <h1 class="result-title">防线崩溃了...</h1>
        <div class="result-stats">
          <div class="stat-item">
            <span class="stat-label">到达波次</span>
            <span class="stat-value">{{ currentWave }}/{{ totalWaves }}</span>
          </div>
        </div>
        <button class="result-btn primary" @click="restartGame">重新开始</button>
        <button class="result-btn secondary" @click="$emit('win')">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const emit = defineEmits(['win'])

// ============ 游戏配置 ============
const CELL_SIZE = 40
const MAP_WIDTH = 20
const MAP_HEIGHT = 15
const TOTAL_WAVES = 3
const INITIAL_GOLD = 100
const INITIAL_LIVES = 20
const STEP_INTERVAL = 500 // 每步移动间隔(ms)

// 背景色调 - 空无一人的世界风格
const BG_COLOR = '#e8e4e1'
const BLOCK_COLOR = '#d4d0cd'
const PATH_COLOR = '#4a4a5a'

// 防守单位定义
const defenders = [
  {
    id: 'ena',
    name: 'ena',
    cost: 30,
    cooldown: 5000,
    hp: 150,
    range: 0,
    damage: 0,
    attackSpeed: 0,
    type: 'blocker',
    image: '/assets/images/普通ena.webp',
    color: '#FFB6C1'
  },
  {
    id: 'knd',
    name: 'knd',
    cost: 25,
    cooldown: 3000,
    hp: 50,
    range: 2,
    damage: 0,
    attackSpeed: 0,
    slowEffect: 0.5,
    type: 'slow',
    image: '/assets/images/普通knd.webp',
    color: '#87CEEB'
  },
  {
    id: 'mfy',
    name: 'mfy',
    cost: 40,
    cooldown: 4000,
    hp: 50,
    range: 2,
    damage: 10,
    attackSpeed: 1500,
    sleepChance: 0.3,
    sleepDuration: 2000,
    type: 'controller',
    image: '/assets/images/普通mfy.webp',
    color: '#9370DB'
  },
  {
    id: 'akito',
    name: 'akito',
    cost: 35,
    cooldown: 2000,
    hp: 50,
    range: 2,
    damage: 25,
    attackSpeed: 1000,
    type: 'damage',
    image: '/assets/images/普通akito.webp',
    color: '#FFA500'
  },
  {
    id: 'rui',
    name: 'rui',
    cost: 45,
    cooldown: 6000,
    hp: 80,
    range: 3,
    damage: 15,
    attackSpeed: 800,
    type: 'turret',
    image: '/assets/images/普通rui.webp',
    color: '#8A2BE2'
  }
]

// 波次配置
const waveConfig = [
  { count: 10, hp: 100 },
  { count: 15, hp: 120 },
  { count: 20, hp: 150 }
]

// ============ 游戏状态 ============
const gameContainer = ref(null)
const gameCanvas = ref(null)
let ctx = null
let animationId = null
let gameLoop = null
let lastTime = 0

const gamePhase = ref('playing') // playing, win, fail
const waveState = ref('waiting') // waiting, spawning, active, completed
const currentWave = ref(1)
const totalWaves = ref(TOTAL_WAVES)
const gold = ref(INITIAL_GOLD)
const lives = ref(INITIAL_LIVES)
const isPaused = ref(false)
const selectedDefender = ref(null)

// 怪物列表
let monsters = []
let spawnTimer = null
let monstersToSpawn = 0

// 防御单位列表
let placedDefenders = []
let defenderCooldowns = {}

// 地图数据
let mapData = []
let pathCells = []
let portals = []

// 粒子效果
let particles = []

// ============ 地图生成 ============
const generateMap = () => {
  // 初始化为空地图
  mapData = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(0))
  pathCells = []

  // 定义路径点
  const startY = MAP_HEIGHT - 2
  const endY = 1

  // 路径: 起点(左下) -> 分叉点1 -> 分叉点2 -> 终点(右上)
  // 添加水平底部路径
  for (let x = 0; x < 8; x++) {
    mapData[startY][x] = 1
    pathCells.push({ x, y: startY })
  }

  // 左侧垂直路径 (分叉点1到传送门A)
  for (let y = startY - 1; y >= 6; y--) {
    mapData[y][0] = 1
    pathCells.push({ x: 0, y })
  }

  // 传送门A (0, 6) -> 传送门B (19, 3)
  mapData[6][0] = 2 // 传送门A
  mapData[3][19] = 3 // 传送门B
  portals.push({ from: { x: 0, y: 6 }, to: { x: 19, y: 3 } })
  portals.push({ from: { x: 19, y: 3 }, to: { x: 0, y: 6 } })

  // 传送门C -> 传送门A
  mapData[10][19] = 4 // 传送门C
  mapData[6][0] = 2 // 传送门A (双向)
  portals.push({ from: { x: 19, y: 10 }, to: { x: 0, y: 6 } })

  // 顶部水平路径 (传送门B到分叉点2)
  for (let x = 10; x < 20; x++) {
    mapData[3][x] = 1
    pathCells.push({ x, y: 3 })
  }

  // 分叉点2到传送门C
  for (let y = 3; y <= 10; y++) {
    mapData[y][19] = 1
    pathCells.push({ x: 19, y })
  }

  // 中间垂直路径 (分叉点1到分叉点2)
  for (let y = startY - 1; y >= 3; y--) {
    if (mapData[y][7] === 0) {
      mapData[y][7] = 1
      pathCells.push({ x: 7, y })
    }
  }

  // 分叉点1水平路径
  for (let x = 0; x < 8; x++) {
    if (mapData[startY][x] === 0) {
      mapData[startY][x] = 1
      pathCells.push({ x, y: startY })
    }
  }

  // 分叉点1到中间
  mapData[startY][7] = 1
  pathCells.push({ x: 7, y: startY })

  // 中间平台
  for (let x = 8; x < 12; x++) {
    for (let y = 7; y < 10; y++) {
      if (mapData[y][x] === 0) {
        mapData[y][x] = 0 // 非路径但可达
      }
    }
  }

  // 右侧小道
  for (let y = 7; y <= 10; y++) {
    if (mapData[y][15] === 0) {
      mapData[y][15] = 1
      pathCells.push({ x: 15, y })
    }
  }

  // 添加一些装饰性方块
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (mapData[y][x] === 0 && Math.random() < 0.1) {
        mapData[y][x] = -1 // 装饰方块
      }
    }
  }
}

// ============ 怪物类 ============
class Monster {
  constructor(hp) {
    this.x = 0
    this.y = MAP_HEIGHT - 2
    this.hp = hp
    this.maxHp = hp
    this.speed = 1
    this.baseSpeed = 1
    this.targetX = 0
    this.targetY = MAP_HEIGHT - 2
    this.moveProgress = 0
    this.isSleeping = false
    this.sleepTimer = 0
    this.isSlowed = false
    this.slowTimer = 0
    this.lastAttackTime = 0
    this.alive = true
    this.deathParticles = []
  }

  update(deltaTime, currentTime) {
    if (!this.alive) return

    // 处理沉睡
    if (this.isSleeping) {
      this.sleepTimer -= deltaTime
      if (this.sleepTimer <= 0) {
        this.isSleeping = false
      }
      return
    }

    // 处理减速
    if (this.isSlowed) {
      this.slowTimer -= deltaTime
      if (this.slowTimer <= 0) {
        this.isSlowed = false
        this.speed = this.baseSpeed
      }
    }

    // 移动逻辑
    this.moveProgress += deltaTime

    const effectiveInterval = STEP_INTERVAL * (this.isSlowed ? 2 : 1)

    if (this.moveProgress >= effectiveInterval) {
      this.moveProgress = 0

      // 到达目标点
      if (Math.abs(this.x - this.targetX) < 0.1 && Math.abs(this.y - this.targetY) < 0.1) {
        this.findNextTarget()
      }

      // 移动向目标
      if (this.x < this.targetX) this.x += 1
      else if (this.x > this.targetX) this.x -= 1
      else if (this.y < this.targetY) this.y += 1
      else if (this.y > this.targetY) this.y -= 1

      // 检测传送门
      this.checkPortal()
    }
  }

  findNextTarget() {
    // 获取可行的邻居
    const neighbors = this.getNeighbors()
    if (neighbors.length === 0) {
      // 到达终点
      this.reachEnd()
      return
    }

    // 过滤掉返回的路
    const prevX = this.targetX
    const prevY = this.targetY

    const validNeighbors = neighbors.filter(n => {
      // 允许回到上一个点
      if (n.x === prevX && n.y === prevY) return true
      // 随机选择其他方向
      return Math.random() > 0.3
    })

    if (validNeighbors.length > 0) {
      const next = validNeighbors[Math.floor(Math.random() * validNeighbors.length)]
      this.targetX = next.x
      this.targetY = next.y
    }
  }

  getNeighbors() {
    const neighbors = []
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 }
    ]

    for (const dir of directions) {
      const nx = this.x + dir.dx
      const ny = this.y + dir.dy

      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
        const cell = mapData[ny][nx]
        if (cell === 1 || cell === 2 || cell === 3 || cell === 4) {
          neighbors.push({ x: nx, y: ny })
        }
      }
    }

    return neighbors
  }

  checkPortal() {
    for (const portal of portals) {
      if (Math.abs(this.x - portal.from.x) < 0.5 && Math.abs(this.y - portal.from.y) < 0.5) {
        // 进入传送门
        this.x = portal.to.x
        this.y = portal.to.y
        this.targetX = portal.to.x
        this.targetY = portal.to.y

        // 传送特效
        this.spawnPortalParticles(portal.to)
        break
      }
    }
  }

  spawnPortalParticles(pos) {
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: pos.x * CELL_SIZE + CELL_SIZE / 2,
        y: pos.y * CELL_SIZE + CELL_SIZE / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 500,
        maxLife: 500,
        color: '#FFD700',
        size: 4
      })
    }
  }

  reachEnd() {
    this.alive = false
    lives.value--
    if (lives.value <= 0) {
      gamePhase.value = 'fail'
      stopGame()
    }
  }

  takeDamage(damage, currentTime) {
    if (!this.alive) return

    this.hp -= damage
    this.lastAttackTime = currentTime

    // 伤害数字
    spawnDamageNumber(this.x, this.y, damage)

    if (this.hp <= 0) {
      this.die()
    }
  }

  applySlow(duration) {
    this.isSlowed = true
    this.slowTimer = duration
    this.speed = this.baseSpeed * 0.5
  }

  applySleep(duration) {
    this.isSleeping = true
    this.sleepTimer = duration
  }

  die() {
    this.alive = false
    gold.value += 10
    this.spawnDeathParticles()
  }

  spawnDeathParticles() {
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2
      particles.push({
        x: this.x * CELL_SIZE + CELL_SIZE / 2,
        y: this.y * CELL_SIZE + CELL_SIZE / 2,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 300,
        maxLife: 300,
        color: '#DDA0DD',
        size: 6
      })
    }
  }

  draw(ctx, currentTime) {
    if (!this.alive) return

    const screenX = this.x * CELL_SIZE + CELL_SIZE / 2
    const screenY = this.y * CELL_SIZE + CELL_SIZE / 2

    // 计算平滑位置
    const progress = this.moveProgress / STEP_INTERVAL
    const drawX = (this.x + (this.targetX - this.x) * progress) * CELL_SIZE + CELL_SIZE / 2
    const drawY = (this.y + (this.targetY - this.y) * progress) * CELL_SIZE + CELL_SIZE / 2

    ctx.save()

    // 绘制怪物
    ctx.drawImage(
      monsterImage,
      drawX - CELL_SIZE / 2,
      drawY - CELL_SIZE / 2,
      CELL_SIZE,
      CELL_SIZE
    )

    // 睡眠特效
    if (this.isSleeping) {
      ctx.fillStyle = '#9370DB'
      ctx.font = '16px sans-serif'
      ctx.fillText('💤', drawX - 8, drawY - CELL_SIZE / 2 - 5)
    }

    // 减速特效
    if (this.isSlowed) {
      ctx.fillStyle = 'rgba(135, 206, 235, 0.5)'
      ctx.beginPath()
      ctx.arc(drawX, drawY, CELL_SIZE / 2 + 5, 0, Math.PI * 2)
      ctx.fill()
    }

    // 受伤闪红
    if (currentTime - this.lastAttackTime < 100) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
      ctx.beginPath()
      ctx.arc(drawX, drawY, CELL_SIZE / 2, 0, Math.PI * 2)
      ctx.fill()
    }

    // 血条
    const hpRatio = this.hp / this.maxHp
    const barWidth = CELL_SIZE - 4
    const barHeight = 4
    ctx.fillStyle = '#333'
    ctx.fillRect(drawX - barWidth / 2, drawY + CELL_SIZE / 2 - 8, barWidth, barHeight)
    ctx.fillStyle = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FFC107' : '#F44336'
    ctx.fillRect(drawX - barWidth / 2, drawY + CELL_SIZE / 2 - 8, barWidth * hpRatio, barHeight)

    ctx.restore()
  }
}

// ============ 防御单位 ============
class Defender {
  constructor(type, x, y) {
    const def = defenders.find(d => d.id === type)
    this.type = type
    this.x = x
    this.y = y
    this.hp = def.hp
    this.maxHp = def.hp
    this.range = def.range
    this.damage = def.damage
    this.attackSpeed = def.attackSpeed
    this.slowEffect = def.slowEffect
    this.sleepChance = def.sleepChance
    this.sleepDuration = def.sleepDuration
    this.lastAttackTime = 0
    this.alive = true
    this.target = null
    this.rotation = 0
    this.attackAnimation = 0
  }

  update(deltaTime, currentTime, monsters) {
    if (!this.alive) return

    const def = defenders.find(d => d.id === this.type)

    // 阻挡类型不需要攻击逻辑
    if (def.type === 'blocker') return

    // 查找目标
    if (!this.target || !this.target.alive) {
      this.target = this.findTarget(monsters)
    }

    if (this.target) {
      const dist = this.getDistance(this.target)
      if (dist <= this.range * CELL_SIZE) {
        // 在攻击范围内
        if (currentTime - this.lastAttackTime >= this.attackSpeed) {
          this.attack(this.target, currentTime, def)
        }

        // Rui 炮台旋转
        if (this.type === 'rui') {
          const dx = this.target.x - this.x
          const dy = this.target.y - this.y
          this.rotation = Math.atan2(dy, dx)
        }
      } else {
        this.target = null
      }
    }

    // 减速光环持续效果
    if (def.type === 'slow') {
      for (const monster of monsters) {
        if (monster.alive && this.getDistance(monster) <= this.range * CELL_SIZE) {
          monster.applySlow(1000)
        }
      }
    }

    // 攻击动画消退
    if (this.attackAnimation > 0) {
      this.attackAnimation -= deltaTime
    }
  }

  findTarget(monsters) {
    let closest = null
    let closestDist = Infinity

    for (const monster of monsters) {
      if (!monster.alive) continue
      const dist = this.getDistance(monster)
      if (dist <= this.range * CELL_SIZE && dist < closestDist) {
        closest = monster
        closestDist = dist
      }
    }

    return closest
  }

  getDistance(target) {
    const dx = (target.x - this.x) * CELL_SIZE
    const dy = (target.y - this.y) * CELL_SIZE
    return Math.sqrt(dx * dx + dy * dy)
  }

  attack(target, currentTime, def) {
    this.lastAttackTime = currentTime
    this.attackAnimation = 200

    if (def.type === 'controller') {
      // 睡眠攻击
      target.takeDamage(this.damage, currentTime)
      if (Math.random() < this.sleepChance) {
        target.applySleep(this.sleepDuration)
      }
    } else if (def.type === 'damage' || def.type === 'turret') {
      target.takeDamage(this.damage, currentTime)

      // 攻击特效
      spawnProjectile(this, target, def.color)
    }
  }

  takeDamage(damage) {
    this.hp -= damage
    if (this.hp <= 0) {
      this.die()
    }
  }

  die() {
    this.alive = false
  }

  draw(ctx) {
    if (!this.alive) return

    const screenX = this.x * CELL_SIZE + CELL_SIZE / 2
    const screenY = this.y * CELL_SIZE + CELL_SIZE / 2
    const def = defenders.find(d => d.id === this.type)

    ctx.save()

    // 攻击动画效果
    if (this.attackAnimation > 0) {
      ctx.globalAlpha = 0.7
    }

    // 绘制防御单位
    const img = defenderImages[this.type]
    if (img) {
      ctx.drawImage(img, screenX - CELL_SIZE / 2, screenY - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE)
    }

    // 范围光环 (非阻挡类型)
    if (def.type !== 'blocker') {
      ctx.strokeStyle = def.color
      ctx.lineWidth = 2
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.arc(screenX, screenY, this.range * CELL_SIZE, 0, Math.PI * 2)
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    // Rui炮台旋转指示
    if (this.type === 'rui') {
      ctx.strokeStyle = '#8A2BE2'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(screenX, screenY)
      ctx.lineTo(screenX + Math.cos(this.rotation) * CELL_SIZE, screenY + Math.sin(this.rotation) * CELL_SIZE)
      ctx.stroke()
    }

    // 血条
    if (this.hp < this.maxHp) {
      const hpRatio = this.hp / this.maxHp
      ctx.fillStyle = '#333'
      ctx.fillRect(screenX - CELL_SIZE / 2, screenY + CELL_SIZE / 2, CELL_SIZE, 4)
      ctx.fillStyle = '#4CAF50'
      ctx.fillRect(screenX - CELL_SIZE / 2, screenY + CELL_SIZE / 2, CELL_SIZE * hpRatio, 4)
    }

    ctx.restore()
  }
}

// ============ 特效 ============
let projectiles = []
let damageNumbers = []
let monsterImage = null
let defenderImages = {}

const spawnProjectile = (defender, target, color) => {
  projectiles.push({
    x: defender.x * CELL_SIZE + CELL_SIZE / 2,
    y: defender.y * CELL_SIZE + CELL_SIZE / 2,
    targetX: target.x * CELL_SIZE + CELL_SIZE / 2,
    targetY: target.y * CELL_SIZE + CELL_SIZE / 2,
    progress: 0,
    color,
    alive: true
  })
}

const spawnDamageNumber = (x, y, damage) => {
  damageNumbers.push({
    x: x * CELL_SIZE + CELL_SIZE / 2,
    y: y * CELL_SIZE + CELL_SIZE / 2,
    damage,
    life: 800,
    vy: -2
  })
}

// ============ 游戏初始化 ============
let canvasWidth = 0
let canvasHeight = 0

const initGame = () => {
  const canvas = gameCanvas.value
  if (!canvas) return

  ctx = canvas.getContext('2d')

  const container = gameContainer.value
  canvasWidth = container.clientWidth
  canvasHeight = container.clientHeight - 150 // 减去UI高度

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  // 生成地图
  generateMap()

  // 重置状态
  monsters = []
  placedDefenders = []
  defenderCooldowns = {}
  particles = []
  projectiles = []
  damageNumbers = []
  currentWave.value = 1
  gold.value = INITIAL_GOLD
  lives.value = INITIAL_LIVES
  waveState.value = 'waiting'
  selectedDefender.value = null
  gamePhase.value = 'playing'
  isPaused.value = false
}

const restartGame = () => {
  stopGame()
  initGame()
  startGame()
}

// ============ 游戏循环 ============
const startGame = () => {
  lastTime = performance.now()
  gameLoop = requestAnimationFrame(update)
}

const stopGame = () => {
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
    gameLoop = null
  }
  if (spawnTimer) {
    clearInterval(spawnTimer)
    spawnTimer = null
  }
}

const update = (currentTime) => {
  if (gamePhase.value !== 'playing' || isPaused.value) {
    gameLoop = requestAnimationFrame(update)
    return
  }

  const deltaTime = currentTime - lastTime
  lastTime = currentTime

  // 更新怪物
  for (const monster of monsters) {
    monster.update(deltaTime, currentTime)
  }

  // 更新防御单位
  for (const defender of placedDefenders) {
    defender.update(deltaTime, currentTime, monsters)
  }

  // 检查防御单位碰撞
  checkDefenderCollisions()

  // 更新粒子
  updateParticles(deltaTime)

  // 更新投射物
  updateProjectiles(deltaTime)

  // 更新伤害数字
  updateDamageNumbers(deltaTime)

  // 检查波次完成
  checkWaveComplete()

  // 渲染
  render(currentTime)

  gameLoop = requestAnimationFrame(update)
}

const checkDefenderCollisions = () => {
  for (const monster of monsters) {
    if (!monster.alive) continue

    for (const defender of placedDefenders) {
      if (!defender.alive || defender.type !== 'ena') continue

      // 检查是否有ena在目标格子
      if (Math.abs(monster.x - defender.x) < 0.5 && Math.abs(monster.y - defender.y) < 0.5) {
        // 被ena阻挡，停止移动
        monster.x = defender.x
        monster.y = defender.y
        monster.targetX = defender.x
        monster.targetY = defender.y

        // ena受到攻击
        defender.takeDamage(10)
      }
    }
  }
}

const updateParticles = (deltaTime) => {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]
    p.x += p.vx
    p.y += p.vy
    p.life -= deltaTime
    if (p.life <= 0) {
      particles.splice(i, 1)
    }
  }
}

const updateProjectiles = (deltaTime) => {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i]
    p.progress += deltaTime / 200 // 200ms飞行时间

    if (p.progress >= 1) {
      projectiles.splice(i, 1)
    }
  }
}

const updateDamageNumbers = (deltaTime) => {
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const d = damageNumbers[i]
    d.y += d.vy
    d.life -= deltaTime
    if (d.life <= 0) {
      damageNumbers.splice(i, 1)
    }
  }
}

const checkWaveComplete = () => {
  if (waveState.value === 'active') {
    const aliveMonsters = monsters.filter(m => m.alive)
    if (aliveMonsters.length === 0 && monstersToSpawn === 0) {
      waveState.value = 'completed'

      if (currentWave.value >= TOTAL_WAVES) {
        gamePhase.value = 'win'
        stopGame()
      } else {
        currentWave.value++
        gold.value += 50 // 波次奖励
        waveState.value = 'waiting'
      }
    }
  }
}

// ============ 渲染 ============
const render = (currentTime) => {
  if (!ctx) return

  // 清空画布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight)

  // 绘制背景
  ctx.fillStyle = BG_COLOR
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  // 绘制地图
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const cell = mapData[y][x]
      const screenX = x * CELL_SIZE
      const screenY = y * CELL_SIZE

      if (cell === 1 || cell === 2 || cell === 3 || cell === 4) {
        // 路径
        ctx.fillStyle = PATH_COLOR
        ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE)

        // 传送门特效
        if (cell === 2) {
          ctx.fillStyle = '#FFD700'
          ctx.globalAlpha = 0.5 + Math.sin(currentTime / 200) * 0.3
          ctx.beginPath()
          ctx.arc(screenX + CELL_SIZE / 2, screenY + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        } else if (cell === 3) {
          ctx.fillStyle = '#87CEEB'
          ctx.globalAlpha = 0.5 + Math.sin(currentTime / 200) * 0.3
          ctx.beginPath()
          ctx.arc(screenX + CELL_SIZE / 2, screenY + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        } else if (cell === 4) {
          ctx.fillStyle = '#FF6B6B'
          ctx.globalAlpha = 0.5 + Math.sin(currentTime / 200) * 0.3
          ctx.beginPath()
          ctx.arc(screenX + CELL_SIZE / 2, screenY + CELL_SIZE / 2, CELL_SIZE / 3, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
      } else if (cell === -1) {
        // 装饰方块
        ctx.fillStyle = BLOCK_COLOR
        ctx.fillRect(screenX + 2, screenY + 2, CELL_SIZE - 4, CELL_SIZE - 4)
      } else {
        // 普通方块
        ctx.fillStyle = BLOCK_COLOR
        ctx.fillRect(screenX, screenY, CELL_SIZE, CELL_SIZE)
      }
    }
  }

  // 绘制防御单位
  for (const defender of placedDefenders) {
    defender.draw(ctx)
  }

  // 绘制怪物
  for (const monster of monsters) {
    monster.draw(ctx, currentTime)
  }

  // 绘制投射物
  for (const p of projectiles) {
    const currentX = p.x + (p.targetX - p.x) * p.progress
    const currentY = p.y + (p.targetY - p.y) * p.progress

    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(currentX, currentY, 4, 0, Math.PI * 2)
    ctx.fill()
  }

  // 绘制粒子
  for (const p of particles) {
    ctx.fillStyle = p.color
    ctx.globalAlpha = p.life / p.maxLife
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * (p.life / p.maxLife), 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
  }

  // 绘制伤害数字
  for (const d of damageNumbers) {
    ctx.fillStyle = '#FF6B6B'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.globalAlpha = d.life / 800
    ctx.fillText(`-${d.damage}`, d.x, d.y)
    ctx.globalAlpha = 1
  }
}

// ============ 交互 ============
const selectDefender = (type) => {
  const def = defenders.find(d => d.id === type)
  if (gold.value >= def.cost) {
    selectedDefender.value = selectedDefender.value === type ? null : type
  }
}

const handleCanvasClick = (event) => {
  if (!selectedDefender.value) return

  const canvas = gameCanvas.value
  const rect = canvas.getBoundingClientRect()
  const x = Math.floor((event.clientX - rect.left) / CELL_SIZE)
  const y = Math.floor((event.clientY - rect.top) / CELL_SIZE)

  // 检查是否在路径上
  const cell = mapData[y]?.[x]
  if (cell !== 1 && cell !== 2 && cell !== 3 && cell !== 4) return

  // 检查是否已有防御单位
  const existing = placedDefenders.find(d => d.x === x && d.y === y && d.alive)
  if (existing) return

  // 检查冷却
  const now = performance.now()
  if (defenderCooldowns[selectedDefender.value] && now < defenderCooldowns[selectedDefender.value]) {
    return
  }

  const def = defenders.find(d => d.id === selectedDefender.value)
  if (gold.value >= def.cost) {
    gold.value -= def.cost
    placedDefenders.push(new Defender(selectedDefender.value, x, y))
    defenderCooldowns[selectedDefender.value] = now + def.cooldown

    // 如果是ena，不需要持续消耗金币
    // selectedDefender.value = null
  }
}

const togglePause = () => {
  isPaused.value = !isPaused.value
}

const startWave = () => {
  waveState.value = 'spawning'
  const config = waveConfig[currentWave.value - 1]
  monstersToSpawn = config.count

  spawnTimer = setInterval(() => {
    if (monstersToSpawn > 0) {
      monsters.push(new Monster(config.hp))
      monstersToSpawn--
    } else {
      clearInterval(spawnTimer)
      spawnTimer = null
      waveState.value = 'active'
    }
  }, 500)
}

// ============ 预加载 ============
const preloadImages = () => {
  monsterImage = new Image()
  monsterImage.src = '/assets/images/怪核mzk.webp'

  for (const def of defenders) {
    defenderImages[def.id] = new Image()
    defenderImages[def.id].src = def.image
  }
}

// ============ 生命周期 ============
onMounted(() => {
  preloadImages()
  initGame()
  startGame()

  const canvas = gameCanvas.value
  if (canvas) {
    canvas.addEventListener('click', handleCanvasClick)
  }
})

onUnmounted(() => {
  stopGame()
  const canvas = gameCanvas.value
  if (canvas) {
    canvas.removeEventListener('click', handleCanvasClick)
  }
})
</script>

<style scoped>
.tower-defense {
  width: 100%;
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  background: #1a1a2e;
  overflow: hidden;
  position: relative;
}

.game-phase {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
}

.wave-indicator {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.wave-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
}

.wave-number {
  font-size: 24px;
  font-weight: bold;
  color: #F6B1C8;
}

.stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stat-icon {
  font-size: 18px;
}

.stat-value {
  font-size: 18px;
  font-weight: bold;
}

.stat-item.gold .stat-value {
  color: #FFD700;
}

.stat-item.lives .stat-value {
  color: #FF6B6B;
}

.pause-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}

.pause-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.game-canvas {
  flex: 1;
  width: 100%;
  cursor: crosshair;
}

.defender-bar {
  display: flex;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.8);
  overflow-x: auto;
  justify-content: center;
}

.defender-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 70px;
}

.defender-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.defender-btn.selected {
  border-color: #F6B1C8;
  background: rgba(246, 177, 200, 0.2);
}

.defender-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.defender-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.defender-name {
  font-size: 12px;
  color: #fff;
}

.defender-cost {
  font-size: 11px;
  color: #FFD700;
}

.wave-start-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.wave-start-btn {
  padding: 16px 32px;
  font-size: 18px;
  background: #F6B1C8;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
}

.wave-start-btn:hover {
  transform: scale(1.05);
}

.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.pause-content {
  text-align: center;
  color: #fff;
}

.pause-content h2 {
  font-size: 28px;
  margin-bottom: 20px;
}

.resume-btn {
  padding: 12px 32px;
  font-size: 16px;
  background: #F6B1C8;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.result-phase {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.result-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
}

.result-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
  max-width: 400px;
}

.result-title {
  font-size: 28px;
  color: #fff;
  margin-bottom: 24px;
}

.win .result-title {
  color: #F6B1C8;
}

.fail .result-title {
  color: #FF6B6B;
}

.result-image {
  margin: 20px 0;
}

.result-image img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border-radius: 12px;
  border: 3px solid #F6B1C8;
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 24px 0;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
}

.result-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 24px;
}

.result-btn {
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.result-btn.primary {
  background: #F6B1C8;
  color: #333;
}

.result-btn.primary:hover {
  transform: scale(1.05);
}

.result-btn.secondary {
  background: transparent;
  color: #fff;
  border: 2px solid rgba(255, 255, 255, 0.5);
}

.result-btn.secondary:hover {
  border-color: #fff;
}
</style>
