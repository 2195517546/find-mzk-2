<template>
  <div class="card-battle" :style="{ backgroundImage: `url(${bgImageUrl})` }">
    <!-- 玩家区域（左侧） -->
    <div class="player-side">
      <!-- 玩家角色 -->
      <div class="player-character">
        <!-- 护甲显示在角色上方 -->
        <div v-if="playerArmor > 0" class="armor-display">
          🛡️ {{ playerArmor }}
        </div>

        <img
          :src="playerImageUrl"
          alt="晓山瑞希"
          class="player-image"
          :class="{ 'damage-flash': isDamaged }"
        />

        <!-- 生命值条在角色下方 -->
        <div class="player-hp-bar">
          <div class="hp-fill" :style="{ width: hpPercentage + '%' }"></div>
          <div class="hp-text">{{ playerHp }}/{{ playerMaxHp }}</div>
        </div>
      </div>

      <!-- 能量显示在左下角 -->
      <div class="energy-display">
        <div class="energy-orb" v-for="i in maxEnergy" :key="i" :class="{ active: i <= playerEnergy }">
          ⚡
        </div>
      </div>

      <!-- 手机端控制面板（右上角） -->
      <div class="mobile-control-panel">
        <!-- 第一行：盾条和体力 -->
        <div class="mobile-armor-display">
          🛡️ {{ playerArmor }}
        </div>
        <div class="mobile-energy-display">
          ⚡ {{ playerEnergy }}/{{ maxEnergy }}
        </div>

        <!-- 第二行：血条和结束回合 -->
        <div class="mobile-hp-bar">
          <div class="hp-fill" :style="{ width: hpPercentage + '%' }"></div>
          <div class="hp-text">{{ playerHp }}/{{ playerMaxHp }}</div>
        </div>
        <button class="btn end-turn-btn-mobile" @click="endTurn" :disabled="isAnimating">
          结束回合
        </button>
      </div>
    </div>

    <!-- 敌人区域（右侧） -->
    <div class="enemies-side">
      <!-- Boss在最右边 -->
      <div v-if="boss" class="enemy-unit boss-unit" :class="{ 'drop-target': isDropTarget(boss) }" @click="selectTarget(boss)" ref="bossRef">
        <!-- 护甲显示在上方 -->
        <div v-if="boss.armor > 0" class="armor-display">
          🛡️ {{ boss.armor }}
        </div>

        <!-- 行动意图在图片上方 -->
        <div v-if="boss.status === 'confused'" class="enemy-intent-float">
          <span class="intent-emoji">❓</span>
        </div>

        <img
          :src="getEnemyImageUrl(boss)"
          :alt="boss.name"
          class="enemy-image"
          :style="{ filter: boss.filter }"
          :class="{ 'enemy-attacking': boss.isAttacking }"
        />

        <!-- 生命值在下方 -->
        <div class="enemy-hp-bar">
          <div class="hp-fill" :style="{ width: (boss.hp / boss.maxHp) * 100 + '%' }"></div>
          <div class="hp-text">{{ boss.hp }}/{{ boss.maxHp }}</div>
        </div>

        <div class="enemy-name">{{ boss.name }}</div>
      </div>

      <!-- 小怪在中间和左边 -->
      <div
        v-for="minion in minions"
        :key="minion.id"
        class="enemy-unit minion-unit"
        :class="{ 'warning-unit': minion.type === 'anxiety', 'drop-target': isDropTarget(minion) }"
        @click="selectTarget(minion)"
        ref="minionRefs"
      >
        <!-- 护甲显示在上方 -->
        <div v-if="minion.armor > 0" class="armor-display">
          🛡️ {{ minion.armor }}
        </div>

        <!-- 行动意图在图片上方 -->
        <div v-if="getMinionNextAction(minion)" class="enemy-intent-float">
          <span v-if="getMinionNextAction(minion).action === 'attack'" class="intent-emoji">
            ⚔️
          </span>
          <span v-else-if="getMinionNextAction(minion).action === 'defend'" class="intent-emoji">
            🛡️
          </span>
          <span v-else-if="getMinionNextAction(minion).action === 'buff'" class="intent-emoji">
            ⏳
          </span>
          <span v-else-if="getMinionNextAction(minion).action === 'buff_all'" class="intent-emoji warning">
            ⚠️
          </span>
        </div>

        <img
          :src="getEnemyImageUrl(minion)"
          :alt="minion.name"
          class="enemy-image"
          :style="{ filter: minion.filter }"
          :class="{ 'enemy-attacking': minion.isAttacking }"
        />

        <!-- 生命值在下方 -->
        <div class="enemy-hp-bar">
          <div class="hp-fill" :style="{ width: (minion.hp / minion.maxHp) * 100 + '%' }"></div>
          <div class="hp-text">{{ minion.hp }}/{{ minion.maxHp }}</div>
        </div>

        <div class="enemy-name">{{ minion.name }}</div>
      </div>
    </div>

    <!-- 手牌区域（底部中间，堆叠显示） -->
    <div class="hand-area">
      <div class="hand-stack">
        <!-- 现有手牌 -->
        <Card
          v-for="(card, index) in hand"
          :key="`hand-${card.id}-${index}`"
          :card="card"
          :can-play="canPlayCard(card)"
          :index="index"
          :style="getCardStackStyle(index)"
          @dragStart="handleCardDragStart"
          @dragMove="handleCardDragMove"
          @dragEnd="handleCardDragEnd"
          @play="handleCardClick"
        />
      </div>

      <!-- 新抽的卡牌动画 -->
      <div
        v-for="newCard in newCards"
        :key="`new-${newCard.id}`"
        class="new-card-animation"
      >
        <Card
          :card="newCard.card"
          :can-play="false"
          :index="-1"
        />
      </div>

      <!-- 弃牌动画 -->
      <div
        v-for="discardCard in discardingCards"
        :key="`discard-${discardCard.id}`"
        class="discard-card-animation"
        :style="getCardStackStyle(discardCard.index)"
      >
        <Card
          :card="discardCard.card"
          :can-play="false"
          :index="-1"
        />
      </div>
    </div>

    <!-- 护甲获得动画 -->
    <Transition name="armor-gain">
      <div v-if="showArmorGain" class="armor-gain-effect">
        <div class="armor-gain-icon">🛡️</div>
        <div class="armor-gain-text">+{{ armorGainAmount }}</div>
      </div>
    </Transition>

    <!-- 飞向敌人的卡牌动画 -->
    <div v-if="flyingCard" class="flying-card" :style="{
      left: flyingCard.startX + 'px',
      top: flyingCard.startY + 'px',
      '--end-x': flyingCard.endX + 'px',
      '--end-y': flyingCard.endY + 'px'
    }">
      <Card
        :card="flyingCard.card"
        :can-play="false"
        :index="-1"
      />
    </div>

    <!-- 结束回合按钮（右下角，桌面端） -->
    <button class="btn end-turn-btn end-turn-btn-desktop" @click="endTurn" :disabled="isAnimating">
      结束回合
    </button>

    <!-- 胜利弹窗 -->
    <Transition name="modal">
      <div v-if="showVictory" class="victory-overlay" @click="handleVictory">
        <div class="victory-content" @click.stop>
          <img :src="victoryImageUrl" alt="晓山瑞希" class="victory-image" />
          <h2 class="victory-title">你找到了真正的晓山瑞希！</h2>
          <p class="victory-text">点击继续</p>
        </div>
      </div>
    </Transition>

    <!-- 失败弹窗 -->
    <Transition name="modal">
      <div v-if="showDefeat" class="defeat-overlay">
        <div class="defeat-content">
          <h2 class="defeat-title">战斗失败</h2>
          <p class="defeat-text">被负面情绪吞噬了...</p>
          <button class="btn" @click="restartBattle">重新开始</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getImageUrl } from '@/utils/imageHelper'
import Card from './Card.vue'
import cardsData from '@/data/level5/cards.json'
import enemiesData from '@/data/level5/enemies.json'

const emit = defineEmits(['win'])

// 图片资源
const bgImageUrl = getImageUrl('images/background/空无一人的世界0.webp')
const playerImageUrl = getImageUrl('images/大眼mzk.webp')
const victoryImageUrl = getImageUrl('images/普通mzk.webp')

// 玩家状态
const playerHp = ref(50)
const playerMaxHp = ref(50)
const playerArmor = ref(0)
const playerEnergy = ref(3)
const maxEnergy = ref(3)
const isDamaged = ref(false)

// Boss和小怪
const boss = ref(null)
const minions = ref([])
const buffValue = ref(0)

// 卡牌
const deck = ref([])
const hand = ref([])
const discardPile = ref([])

// 拖拽状态
const draggingCard = ref(null)
const draggingCardIndex = ref(null)
const dragPosition = ref({ x: 0, y: 0 })
const hoveredEnemy = ref(null)

// 敌人元素引用
const bossRef = ref(null)
const minionRefs = ref([])

// 选择状态
const selectedTarget = ref(null)

// 游戏状态
const currentTurn = ref(1)
const isAnimating = ref(false)
const showVictory = ref(false)
const showDefeat = ref(false)

// 动画状态
const showArmorGain = ref(false)
const armorGainAmount = ref(0)
const newCards = ref([]) // 新抽的卡牌动画
const discardingCards = ref([]) // 弃牌动画
const flyingCard = ref(null) // 飞向敌人的卡牌

const hpPercentage = computed(() => {
  return (playerHp.value / playerMaxHp.value) * 100
})

function getEnemyImageUrl(enemy) {
  return getImageUrl(`images/${enemy.image}`)
}

// 初始化游戏
onMounted(() => {
  initGame()
})

function initGame() {
  // 初始化Boss
  boss.value = {
    ...enemiesData.boss,
    hp: enemiesData.boss.maxHp,
    armor: 0,
    status: 'confused',
    turn: 0,
    isAttacking: false
  }

  // 初始化卡组
  deck.value = [...cardsData, ...cardsData] // 每张卡2份
  shuffleDeck()

  // 抽初始手牌
  for (let i = 0; i < 5; i++) {
    drawCard()
  }

  // Boss第一回合召唤小怪
  summonMinions(2)
}

function shuffleDeck() {
  for (let i = deck.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck.value[i], deck.value[j]] = [deck.value[j], deck.value[i]]
  }
}

function drawCard() {
  if (deck.value.length === 0) {
    // 牌堆空了，洗弃牌堆
    deck.value = [...discardPile.value]
    discardPile.value = []
    shuffleDeck()
  }

  if (deck.value.length > 0 && hand.value.length < 10) {
    const card = deck.value.pop()

    // 添加到新卡动画列表
    newCards.value.push({
      card,
      id: Date.now() + Math.random()
    })

    // 延迟添加到手牌，等待动画
    setTimeout(() => {
      hand.value.push(card)
      // 移除动画卡牌
      newCards.value = newCards.value.filter(nc => nc.card !== card)
    }, 500)
  }
}

// 显示护甲获得动画
function showArmorGainAnimation(amount) {
  armorGainAmount.value = amount
  showArmorGain.value = true

  setTimeout(() => {
    showArmorGain.value = false
  }, 1000)
}

function summonMinions(count) {
  const pool = [...enemiesData.minions]
  const summoned = []

  for (let i = 0; i < count && pool.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * pool.length)
    const minionData = pool.splice(randomIndex, 1)[0]

    summoned.push({
      ...minionData,
      hp: minionData.maxHp,
      armor: 0,
      turn: 1,
      isAttacking: false
    })
  }

  minions.value.push(...summoned)
}

function canPlayCard(card) {
  if (isAnimating.value) return false
  if (playerEnergy.value < card.cost) return false
  return true
}

// 卡牌堆叠样式
function getCardStackStyle(index) {
  const totalCards = hand.value.length
  const centerIndex = (totalCards - 1) / 2
  const offset = index - centerIndex

  // 根据屏幕宽度调整间隔 - 紧凑排列
  const isMobile = window.innerWidth <= 640
  const spacing = isMobile ? 80 : 100 // 移动端80px，桌面端100px

  return {
    position: 'absolute',
    bottom: '0',
    left: '50%',
    '--card-offset': `${offset * spacing}px`,
    transform: `translateX(calc(-50% + var(--card-offset))) translateY(0px) rotate(0deg)`,
    zIndex: index,
    transition: 'all 0.3s ease'
  }
}

// 卡牌点击（非攻击卡）
function handleCardClick(card, index) {
  if (!canPlayCard(card)) return
  if (card.type === 'attack') return // 攻击卡必须拖拽

  executeCardEffect(card, index, null)
}

// 拖拽开始
function handleCardDragStart(card, index) {
  if (!canPlayCard(card)) return

  draggingCard.value = card
  draggingCardIndex.value = index
}

// 拖拽移动
function handleCardDragMove(position) {
  dragPosition.value = position

  // 检测是否悬停在敌人上
  hoveredEnemy.value = null

  if (draggingCard.value && draggingCard.value.type === 'attack') {
    // 检查Boss
    if (bossRef.value) {
      const rect = bossRef.value.getBoundingClientRect()
      if (isPointInRect(position, rect)) {
        hoveredEnemy.value = boss.value
        return
      }
    }

    // 检查小怪
    minionRefs.value.forEach((ref, index) => {
      if (ref) {
        const rect = ref.getBoundingClientRect()
        if (isPointInRect(position, rect)) {
          hoveredEnemy.value = minions.value[index]
        }
      }
    })
  }
}

// 拖拽结束
function handleCardDragEnd(position, card, index) {
  if (!draggingCard.value) return

  // 检查是否拖到敌人上
  let targetEnemy = null

  if (card.type === 'attack') {
    // 检查Boss
    if (bossRef.value) {
      const rect = bossRef.value.getBoundingClientRect()
      if (isPointInRect(position, rect)) {
        targetEnemy = boss.value
      }
    }

    // 检查小怪
    if (!targetEnemy) {
      minionRefs.value.forEach((ref, idx) => {
        if (ref) {
          const rect = ref.getBoundingClientRect()
          if (isPointInRect(position, rect)) {
            targetEnemy = minions.value[idx]
          }
        }
      })
    }

    if (targetEnemy) {
      // 播放卡牌飞向敌人的动画
      playCardFlyAnimation(card, index, targetEnemy)
    }
  } else {
    // 防御卡和技能卡直接使用
    executeCardEffect(card, index, null)
  }

  // 重置拖拽状态
  draggingCard.value = null
  draggingCardIndex.value = null
  hoveredEnemy.value = null
}

// 卡牌飞向敌人动画
function playCardFlyAnimation(card, index, target) {
  // 添加到飞行动画列表
  const cardElement = document.querySelectorAll('.hand-stack .card')[index]
  if (!cardElement) {
    executeCardEffect(card, index, target)
    return
  }

  const cardRect = cardElement.getBoundingClientRect()
  const targetElement = target.id === boss.value?.id ? bossRef.value :
    minionRefs.value.find((ref, idx) => minions.value[idx]?.id === target.id)

  if (!targetElement) {
    executeCardEffect(card, index, target)
    return
  }

  const targetRect = targetElement.getBoundingClientRect()

  // 创建飞行卡牌
  flyingCard.value = {
    card,
    startX: cardRect.left + cardRect.width / 2,
    startY: cardRect.top + cardRect.height / 2,
    endX: targetRect.left + targetRect.width / 2,
    endY: targetRect.top + targetRect.height / 2,
    id: Date.now()
  }

  // 先移除手牌
  discardPile.value.push(hand.value.splice(index, 1)[0])

  // 等待动画完成后执行效果
  setTimeout(() => {
    flyingCard.value = null
    damageEnemy(target, card.damage)
    playerEnergy.value -= card.cost

    setTimeout(() => {
      checkEnemiesDefeated()
    }, 300)
  }, 500)
}

// 判断点是否在矩形内
function isPointInRect(point, rect) {
  return point.x >= rect.left &&
         point.x <= rect.right &&
         point.y >= rect.top &&
         point.y <= rect.bottom
}

// 判断是否是拖拽目标
function isDropTarget(enemy) {
  return hoveredEnemy.value && hoveredEnemy.value.id === enemy.id
}

function playCard(card, index) {
  // 保留点击功能作为备用
  if (!canPlayCard(card)) return

  if (card.type === 'attack') {
    // 攻击卡需要拖拽到目标
    return
  } else {
    executeCardEffect(card, index, null)
  }
}

function selectTarget(enemy) {
  selectedTarget.value = enemy
}

function executeCardEffect(card, index, target) {
  isAnimating.value = true

  // 消耗能量
  playerEnergy.value -= card.cost

  // 执行效果
  if (card.type === 'attack') {
    if (target) {
      damageEnemy(target, card.damage)
    }
  } else if (card.type === 'defense') {
    const armorGained = card.armor
    playerArmor.value += armorGained
    showArmorGainAnimation(armorGained)
  } else if (card.type === 'skill') {
    if (card.effect.type === 'draw') {
      for (let i = 0; i < card.effect.value; i++) {
        setTimeout(() => {
          drawCard()
        }, i * 300) // 每张卡间隔300ms
      }
    } else if (card.effect.type === 'heal') {
      playerHp.value = Math.min(playerMaxHp.value, playerHp.value + card.effect.value)
    } else if (card.effect.type === 'energy') {
      playerEnergy.value += card.effect.value
    }
  }

  // 移除手牌
  discardPile.value.push(hand.value.splice(index, 1)[0])

  setTimeout(() => {
    isAnimating.value = false
    checkEnemiesDefeated()
  }, 300)
}

function damageEnemy(enemy, damage) {
  const actualDamage = Math.max(0, damage - enemy.armor)
  enemy.armor = Math.max(0, enemy.armor - damage)
  enemy.hp = Math.max(0, enemy.hp - actualDamage)

  if (enemy.hp === 0) {
    // 移除死亡的敌人
    if (enemy.id === boss.value?.id) {
      // Boss死亡，胜利
      setTimeout(() => {
        showVictory.value = true
      }, 500)
    } else {
      minions.value = minions.value.filter(m => m.id !== enemy.id)
    }
  }
}

function checkEnemiesDefeated() {
  if (minions.value.length === 0 && boss.value && boss.value.hp > 0) {
    boss.value.status = 'confused'
  }
}

function getMinionNextAction(minion) {
  if (!minion.pattern) return null

  const patternIndex = (minion.turn - 1) % minion.pattern.length
  return minion.pattern[patternIndex]
}

function endTurn() {
  if (isAnimating.value) return

  isAnimating.value = true

  // 弃掉所有手牌
  const cardsToDiscard = [...hand.value]

  // 立即清空手牌显示，但保存到弃牌动画列表
  cardsToDiscard.forEach((card, index) => {
    discardingCards.value.push({
      card,
      id: Date.now() + Math.random() + index,
      index
    })
  })

  // 立即清空手牌
  hand.value = []

  // 等待弃牌动画完成
  setTimeout(() => {
    discardPile.value.push(...cardsToDiscard)
    discardingCards.value = []

    // 敌人回合
    enemyTurn()

    // 新回合开始
    setTimeout(() => {
      // 护甲在敌人回合结束后清零
      playerArmor.value = 0

      currentTurn.value++
      playerEnergy.value = maxEnergy.value

      // 抽5张新手牌
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          drawCard()
        }, i * 300)
      }

      setTimeout(() => {
        isAnimating.value = false

        // 检查玩家是否死亡
        if (playerHp.value <= 0) {
          showDefeat.value = true
        }
      }, 5 * 300 + 600)
    }, 1500)
  }, 600)
}

function enemyTurn() {
  // Boss行动
  if (boss.value && boss.value.hp > 0) {
    if (minions.value.length === 0) {
      // 召唤小怪
      summonMinions(2)
      boss.value.status = 'confused'
    }
  }

  // 小怪行动
  let bossAttackTriggered = false

  minions.value.forEach((minion, index) => {
    setTimeout(() => {
      const action = getMinionNextAction(minion)

      if (action.action === 'attack') {
        // 攻击动画
        minion.isAttacking = true
        setTimeout(() => {
          minion.isAttacking = false
          const damage = action.value + buffValue.value
          damagePlayer(damage)
        }, 300)
      } else if (action.action === 'defend') {
        minion.armor += action.value
      } else if (action.action === 'buff_all') {
        // 强化所有敌人
        buffValue.value += action.value
        bossAttackTriggered = true
      }

      minion.turn++
    }, index * 400)
  })

  // 如果触发了强化，Boss同步攻击
  if (bossAttackTriggered && boss.value && boss.value.hp > 0) {
    setTimeout(() => {
      boss.value.isAttacking = true
      setTimeout(() => {
        boss.value.isAttacking = false
        damagePlayer(12)
      }, 300)
    }, minions.value.length * 400)
  }
}

function damagePlayer(damage) {
  const actualDamage = Math.max(0, damage - playerArmor.value)
  playerArmor.value = Math.max(0, playerArmor.value - damage)
  playerHp.value = Math.max(0, playerHp.value - actualDamage)

  // 受伤闪现效果
  isDamaged.value = true
  setTimeout(() => {
    isDamaged.value = false
  }, 200)
}

function handleVictory() {
  emit('win')
}

function restartBattle() {
  // 重置所有状态
  playerHp.value = 50
  playerArmor.value = 0
  playerEnergy.value = 3
  isDamaged.value = false
  boss.value = null
  minions.value = []
  buffValue.value = 0
  deck.value = []
  hand.value = []
  discardPile.value = []
  currentTurn.value = 1
  showDefeat.value = false
  newCards.value = []
  discardingCards.value = []
  flyingCard.value = null

  initGame()
}
</script>

<style scoped>
.card-battle {
  flex: 1;
  display: flex;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  position: relative;
}

/* 玩家区域（左侧） */
.player-side {
  flex: 0 0 35%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.player-character {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-image {
  width: 300px;
  height: 300px;
  object-fit: contain;
  transform: scaleX(-1); /* 镜像翻转 */
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  transition: all 0.2s ease;
}

.player-image.damage-flash {
  animation: damage-flash 0.2s ease;
}

@keyframes damage-flash {
  0%, 100% {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.8)) brightness(1.5);
  }
}

.player-hp-bar {
  width: 250px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid var(--border-color);
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  margin-top: 16px;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color) 0%, #ff8a8a 100%);
  transition: width 0.3s ease;
}

.hp-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
}

/* 护甲显示 */
.armor-display {
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #4ECDC4;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 18px;
  font-weight: bold;
  border: 2px solid #4ECDC4;
  box-shadow: 0 4px 8px rgba(78, 205, 196, 0.5);
  z-index: 10;
  white-space: nowrap;
  animation: armor-pulse 1.5s ease-in-out infinite;
}

@keyframes armor-pulse {
  0%, 100% {
    box-shadow: 0 4px 8px rgba(78, 205, 196, 0.5);
  }
  50% {
    box-shadow: 0 4px 16px rgba(78, 205, 196, 0.8);
  }
}

/* 能量显示（左下角） */
.energy-display {
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  gap: 8px;
  background: rgba(0, 0, 0, 0.6);
  padding: 12px 16px;
  border-radius: 12px;
  border: 2px solid var(--border-color);
}

.energy-orb {
  font-size: 32px;
  opacity: 0.3;
  transition: all 0.3s ease;
  filter: grayscale(1);
}

.energy-orb.active {
  opacity: 1;
  filter: grayscale(0) drop-shadow(0 0 8px #ffd700);
  animation: energy-pulse 1.5s ease-in-out infinite;
}

@keyframes energy-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* 敌人区域（右侧） */
.enemies-side {
  flex: 1;
  display: flex;
  gap: 20px;
  align-items: center;
  justify-content: flex-end;
  padding: 40px;
  flex-direction: row-reverse; /* Boss在最右边 */
}

.enemy-unit {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.enemy-unit:hover {
  transform: scale(1.05);
}

.drop-target {
  animation: drop-target-pulse 0.5s ease-in-out infinite;
  transform: scale(1.1);
}

@keyframes drop-target-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(246, 177, 181, 0.7);
  }
  50% {
    box-shadow: 0 0 0 15px rgba(246, 177, 181, 0);
  }
}

.boss-unit .enemy-image {
  width: 280px;
  height: 280px;
}

.minion-unit .enemy-image {
  width: 200px;
  height: 200px;
}

.enemy-image {
  object-fit: contain;
  transition: all 0.3s ease;
}

.enemy-image.enemy-attacking {
  animation: attack-move 0.6s ease;
}

@keyframes attack-move {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(-100px);
  }
}

.warning-unit {
  animation: warning-pulse 1.5s ease-in-out infinite;
}

@keyframes warning-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 0 rgba(231, 76, 60, 0));
  }
  50% {
    filter: drop-shadow(0 0 20px rgba(231, 76, 60, 0.8));
  }
}

.status-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 32px;
  animation: float 2s ease-in-out infinite;
}

/* 敌人意图显示（浮动emoji） */
.enemy-intent-float {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
}

.intent-emoji {
  font-size: 36px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
  animation: intent-float 2s ease-in-out infinite;
  display: inline-block;
}

.intent-emoji.warning {
  animation: intent-warning 1s ease-in-out infinite;
}

@keyframes intent-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes intent-warning {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-10px) scale(1.2);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.enemy-hp-bar {
  width: 180px;
  height: 20px;
  background: rgba(0, 0, 0, 0.6);
  border: 2px solid var(--border-color);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  margin-top: 12px;
}

.boss-unit .enemy-hp-bar {
  width: 220px;
}

.enemy-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  margin-top: 8px;
}

/* 手牌区域（底部中间，堆叠显示） */
.hand-area {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  height: 220px;
  pointer-events: none;
}

.hand-stack {
  position: relative;
  width: 100%;
  height: 100%;
  pointer-events: auto;
}

.hand-stack :deep(.card) {
  pointer-events: auto;
}

/* 新卡抽取动画 */
.new-card-animation {
  position: absolute;
  bottom: 0;
  left: 50%;
  animation: card-draw 0.5s ease-out forwards;
  z-index: 200;
  pointer-events: none;
}

@keyframes card-draw {
  0% {
    transform: translateX(-50%) translateY(150px) scale(0.3) rotateY(90deg);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(0) scale(1) rotateY(0deg);
    opacity: 1;
  }
}

/* 弃牌动画 */
.discard-card-animation {
  position: absolute;
  bottom: 0;
  animation: card-discard 0.5s ease-in forwards;
  z-index: 150;
  pointer-events: none;
}

@keyframes card-discard {
  0% {
    transform: translateY(0) scale(1) rotateZ(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) translateX(200px) scale(0.3) rotateZ(45deg);
    opacity: 0;
  }
}

/* 飞向敌人的卡牌动画 */
.flying-card {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  animation: card-fly 0.5s ease-in-out forwards;
}

@keyframes card-fly {
  0% {
    transform: translate(-50%, -50%) scale(1.2) rotate(0deg);
    opacity: 1;
  }
  100% {
    left: var(--end-x);
    top: var(--end-y);
    transform: translate(-50%, -50%) scale(0.3) rotate(360deg);
    opacity: 0;
  }
}

/* 护甲获得动画 */
.armor-gain-effect {
  position: fixed;
  top: 50%;
  left: 30%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.armor-gain-icon {
  font-size: 80px;
  filter: drop-shadow(0 4px 12px rgba(78, 205, 196, 0.8));
  animation: armor-gain-bounce 0.6s ease-out;
}

.armor-gain-text {
  font-size: 48px;
  font-weight: bold;
  color: #4ECDC4;
  text-shadow:
    0 0 10px rgba(78, 205, 196, 1),
    0 0 20px rgba(78, 205, 196, 0.8),
    -2px -2px 0 #000,
    2px -2px 0 #000,
    -2px 2px 0 #000,
    2px 2px 0 #000;
  animation: armor-gain-text 0.6s ease-out;
}

@keyframes armor-gain-bounce {
  0% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.3) rotate(180deg);
  }
  100% {
    transform: scale(1) rotate(360deg);
    opacity: 1;
  }
}

@keyframes armor-gain-text {
  0% {
    transform: translateY(20px);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.armor-gain-enter-active {
  transition: opacity 0.3s ease;
}

.armor-gain-leave-active {
  transition: opacity 0.4s ease 0.6s;
}

.armor-gain-enter-from,
.armor-gain-leave-to {
  opacity: 0;
}
.end-turn-btn {
  padding: 16px 32px;
  font-size: 18px;
  min-width: 150px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.end-turn-btn-desktop {
  position: absolute;
  bottom: 20px;
  right: 20px;
}

.end-turn-btn-mobile {
  display: none;
}

.end-turn-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 胜利弹窗 */
.victory-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.victory-content {
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  border: 3px solid var(--primary-color);
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  animation: victory-appear 0.5s ease;
}

@keyframes victory-appear {
  from {
    transform: scale(0.5);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.victory-image {
  width: 200px;
  height: 200px;
  object-fit: contain;
  margin-bottom: 20px;
  animation: victory-float 2s ease-in-out infinite;
}

@keyframes victory-float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.victory-title {
  font-size: 28px;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 12px;
  text-shadow:
    -1px -1px 0 var(--border-color),
    1px -1px 0 var(--border-color),
    -1px 1px 0 var(--border-color),
    1px 1px 0 var(--border-color);
}

.victory-text {
  font-size: 16px;
  color: #666;
}

/* 失败弹窗 */
.defeat-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.defeat-content {
  background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
  border: 3px solid #e74c3c;
  border-radius: 16px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
}

.defeat-title {
  font-size: 28px;
  font-weight: bold;
  color: #e74c3c;
  margin-bottom: 12px;
}

.defeat-text {
  font-size: 16px;
  color: #fff;
  margin-bottom: 24px;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .player-side {
    flex: 0 0 30%;
  }

  .player-image {
    width: 200px;
    height: 200px;
  }

  .player-hp-bar {
    width: 180px;
  }

  .enemies-side {
    gap: 15px;
    padding: 20px;
  }

  .boss-unit .enemy-image {
    width: 200px;
    height: 200px;
  }

  .minion-unit .enemy-image {
    width: 150px;
    height: 150px;
  }
}

@media (max-width: 640px) {
  .card-battle {
    flex-direction: column;
    padding: 0;
  }

  /* 玩家区域在顶部 */
  .player-side {
    flex: 0 0 auto;
    width: 100%;
    padding: 16px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    background: rgba(0, 0, 0, 0.3);
    position: relative;
  }

  .player-character {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .player-image {
    width: 100px;
    height: 100px;
  }

  .player-hp-bar {
    width: 120px;
    height: 16px;
    margin-top: 0;
  }

  .armor-display {
    top: -30px;
    font-size: 14px;
    padding: 4px 8px;
  }

  /* 能量显示在玩家区域右侧 */
  .energy-display {
    position: relative;
    bottom: auto;
    left: auto;
    flex-direction: column;
    padding: 8px;
    gap: 4px;
  }

  .energy-orb {
    font-size: 20px;
  }

  /* 敌人区域在中间，横向排列 */
  .enemies-side {
    flex: 1;
    flex-direction: row-reverse; /* Boss在最右边 */
    justify-content: center;
    align-items: center;
    gap: 12px;
    padding: 16px 8px;
    overflow-x: auto;
    overflow-y: hidden;
    position: relative;
  }

  .end-turn-btn-desktop {
    display: none;
  }

  /* 手机端控制面板（右上角） */
  .mobile-control-panel {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    position: absolute;
    top: 16px;
    right: 16px;
    width: 200px;
    z-index: 100;
  }

  /* 盾条 */
  .mobile-armor-display {
    background: rgba(0, 0, 0, 0.8);
    color: #4ECDC4;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: bold;
    border: 2px solid #4ECDC4;
    text-align: center;
    white-space: nowrap;
  }

  /* 体力显示 */
  .mobile-energy-display {
    background: rgba(0, 0, 0, 0.8);
    color: #ffd700;
    padding: 10px 12px;
    border-radius: 10px;
    font-size: 16px;
    font-weight: bold;
    border: 2px solid #ffd700;
    text-align: center;
    white-space: nowrap;
  }

  /* 血条 */
  .mobile-hp-bar {
    width: 100%;
    height: 38px;
    background: rgba(0, 0, 0, 0.8);
    border: 2px solid var(--border-color);
    border-radius: 10px;
    overflow: hidden;
    position: relative;
  }

  .mobile-hp-bar .hp-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--primary-color) 0%, #ff8a8a 100%);
    transition: width 0.3s ease;
  }

  .mobile-hp-bar .hp-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 13px;
    font-weight: bold;
    color: #fff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  }

  /* 结束回合按钮 */
  .end-turn-btn-mobile {
    display: block;
    width: 100%;
    padding: 10px 12px;
    font-size: 13px;
    min-width: auto;
    height: 38px;
  }

  /* 手机端隐藏玩家角色旁边的体力条、护甲和能量显示 */
  .player-character .player-hp-bar {
    display: none;
  }

  .player-character .armor-display {
    display: none;
  }

  .energy-display {
    display: none;
  }

  .boss-unit .enemy-image {
    width: 100px;
    height: 100px;
  }

  .minion-unit .enemy-image {
    width: 80px;
    height: 80px;
  }

  .enemy-hp-bar {
    width: 100px;
    height: 12px;
  }

  .boss-unit .enemy-hp-bar {
    width: 100px;
  }

  .enemy-name {
    font-size: 11px;
  }

  .enemy-intent-float {
    top: -40px;
  }

  .intent-emoji {
    font-size: 24px;
  }

  /* 手牌区域在底部 */
  .hand-area {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    width: 100%;
    height: 180px;
    background: rgba(0, 0, 0, 0.3);
    padding: 8px;
  }

  .hand-stack {
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }


  .armor-gain-effect {
    left: 50%;
  }

  .armor-gain-icon {
    font-size: 60px;
  }

  .armor-gain-text {
    font-size: 36px;
  }

  /* 结束回合按钮在敌人区域右下角 */
  .end-turn-btn {
    position: fixed;
    bottom: 200px;
    right: 8px;
    padding: 10px 20px;
    font-size: 13px;
    min-width: 100px;
    z-index: 50;
  }

  .victory-content,
  .defeat-content {
    padding: 24px;
    max-width: 90%;
  }

  .victory-image {
    width: 150px;
    height: 150px;
  }

  .victory-title,
  .defeat-title {
    font-size: 24px;
  }
}
</style>
