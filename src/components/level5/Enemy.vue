<template>
  <div
    class="enemy"
    :class="{ 'enemy-boss': isBoss, 'enemy-warning': isWarning, 'enemy-target': isTarget }"
    @click="handleClick"
  >
    <div class="enemy-image">
      <img :src="enemyImageUrl" :alt="enemy.name" :style="{ filter: enemy.filter }" />
      <div v-if="enemy.status === 'confused'" class="status-icon">❓</div>
    </div>
    <div class="enemy-name">{{ enemy.name }}</div>
    <div class="enemy-hp">
      <div class="hp-bar">
        <div class="hp-fill" :style="{ width: hpPercentage + '%' }"></div>
      </div>
      <div class="hp-text">{{ enemy.hp }}/{{ enemy.maxHp }}</div>
    </div>
    <div v-if="enemy.armor > 0" class="enemy-armor">
      🛡️ {{ enemy.armor }}
    </div>
    <div class="enemy-intent">
      <span v-if="nextAction">
        <span v-if="nextAction.action === 'attack'">⚔️ 攻击 {{ nextAction.value + buffValue }}</span>
        <span v-else-if="nextAction.action === 'defend'">🛡️ 防御 {{ nextAction.value }}</span>
        <span v-else-if="nextAction.action === 'buff'">⏳ {{ nextAction.description }}</span>
        <span v-else-if="nextAction.action === 'buff_all'">⚠️ {{ nextAction.description }}</span>
        <span v-else-if="nextAction.action === 'summon'">🌀 召唤中...</span>
        <span v-else-if="nextAction.action === 'confused'">❓ 疑惑中...</span>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { getImageUrl } from '@/utils/imageHelper'

const props = defineProps({
  enemy: {
    type: Object,
    required: true
  },
  isBoss: {
    type: Boolean,
    default: false
  },
  isWarning: {
    type: Boolean,
    default: false
  },
  isTarget: {
    type: Boolean,
    default: false
  },
  nextAction: {
    type: Object,
    default: null
  },
  buffValue: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['select'])

const enemyImageUrl = computed(() => getImageUrl(`images/${props.enemy.image}`))

const hpPercentage = computed(() => {
  return (props.enemy.hp / props.enemy.maxHp) * 100
})

function handleClick() {
  if (props.enemy.hp > 0) {
    emit('select', props.enemy)
  }
}
</script>

<style scoped>
.enemy {
  background: linear-gradient(135deg, #2a2a3e 0%, #1a1a2e 100%);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 12px;
  min-width: 140px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.enemy:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.enemy-boss {
  border-width: 3px;
  border-color: #9b59b6;
  min-width: 160px;
}

.enemy-warning {
  border-color: #e74c3c;
  animation: warning-pulse 1.5s ease-in-out infinite;
}

.enemy-target {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(246, 177, 181, 0.5);
}

@keyframes warning-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(231, 76, 60, 0);
  }
}

.enemy-image {
  width: 100%;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-bottom: 8px;
}

.enemy-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.status-icon {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 24px;
  animation: float 2s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.enemy-name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
  text-align: center;
  margin-bottom: 8px;
}

.enemy-hp {
  margin-bottom: 4px;
}

.hp-bar {
  width: 100%;
  height: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 4px;
}

.hp-fill {
  height: 100%;
  background: linear-gradient(90deg, #e74c3c 0%, #c0392b 100%);
  transition: width 0.3s ease;
}

.hp-text {
  font-size: 12px;
  color: #fff;
  text-align: center;
  font-weight: bold;
}

.enemy-armor {
  font-size: 12px;
  color: #4ECDC4;
  text-align: center;
  font-weight: bold;
  margin-bottom: 4px;
}

.enemy-intent {
  font-size: 12px;
  color: #f39c12;
  text-align: center;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  padding: 4px;
  margin-top: 8px;
}

@media (max-width: 640px) {
  .enemy {
    min-width: 110px;
    padding: 8px;
  }

  .enemy-boss {
    min-width: 130px;
  }

  .enemy-image {
    height: 80px;
  }

  .enemy-name {
    font-size: 12px;
  }

  .enemy-intent {
    font-size: 11px;
  }
}
</style>
