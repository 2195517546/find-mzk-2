<template>
  <div class="player-status">
    <div class="status-item">
      <div class="status-label">生命值</div>
      <div class="status-bar hp-bar">
        <div class="status-fill hp-fill" :style="{ width: hpPercentage + '%' }"></div>
      </div>
      <div class="status-text">{{ hp }}/{{ maxHp }}</div>
    </div>
    <div class="status-item">
      <div class="status-label">护甲</div>
      <div class="status-value armor-value">🛡️ {{ armor }}</div>
    </div>
    <div class="status-item">
      <div class="status-label">能量</div>
      <div class="status-value energy-value">
        <span v-for="i in maxEnergy" :key="i" class="energy-orb" :class="{ active: i <= energy }">
          ⚡
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  hp: {
    type: Number,
    required: true
  },
  maxHp: {
    type: Number,
    required: true
  },
  armor: {
    type: Number,
    default: 0
  },
  energy: {
    type: Number,
    required: true
  },
  maxEnergy: {
    type: Number,
    default: 3
  }
})

const hpPercentage = computed(() => {
  return (props.hp / props.maxHp) * 100
})
</script>

<style scoped>
.player-status {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 16px 24px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.status-label {
  font-size: 12px;
  font-weight: bold;
  color: #666;
  text-transform: uppercase;
}

.status-bar {
  width: 120px;
  height: 16px;
  background: rgba(0, 0, 0, 0.1);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.status-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.hp-fill {
  background: linear-gradient(90deg, var(--primary-color) 0%, #ff8a8a 100%);
}

.status-text {
  font-size: 14px;
  font-weight: bold;
  color: var(--border-color);
}

.status-value {
  font-size: 18px;
  font-weight: bold;
  color: var(--border-color);
}

.armor-value {
  color: #4ECDC4;
}

.energy-value {
  display: flex;
  gap: 4px;
}

.energy-orb {
  font-size: 20px;
  opacity: 0.3;
  transition: all 0.3s ease;
}

.energy-orb.active {
  opacity: 1;
  filter: drop-shadow(0 0 4px #ffd700);
}

@media (max-width: 640px) {
  .player-status {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }

  .status-bar {
    width: 100px;
  }

  .status-value {
    font-size: 16px;
  }

  .energy-orb {
    font-size: 18px;
  }
}
</style>
