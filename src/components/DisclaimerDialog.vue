<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="show" class="dialog-overlay" @click="handleOverlayClick">
        <div class="dialog-content" @click.stop>
          <div class="dialog-header">
            <h2 class="pink-text">免责声明</h2>
          </div>
          <div class="dialog-body">
            <div class="disclaimer-section">
              <h3>光敏性癫痫警告</h3>
              <p>本游戏包含闪烁的图像和光线变化。如果您有光敏性癫痫或对闪烁光敏感，请立即停止游戏。</p>
            </div>

            <div class="disclaimer-section">
              <h3>微恐元素</h3>
              <p>本游戏包含轻微的恐怖元素，适合青少年及以上玩家游玩。</p>
            </div>

            <div class="rules-section">
              <h3 class="rules-title pink-text">晓山瑞希的规则</h3>
              <div class="rules-list">
                <div class="rule-item">
                  <span class="rule-number">1</span>
                  <span class="rule-text">晓山瑞希永远不消逝~~</span>
                </div>
                <div class="rule-item" :class="{ 'rule-violated': isRule2Violated }">
                  <span class="rule-number">2</span>
                  <span class="rule-text" :class="{ 'rule-text-violated': isRule2Violated }">每一种晓山瑞希只存在一个</span>
                </div>
                <div class="rule-item" :class="{ 'rule-violated': isRule3Violated }">
                  <span class="rule-number">3</span>
                  <span class="rule-text" :class="{ 'rule-text-violated': isRule3Violated }">晓山瑞希之间严禁相互伤害</span>
                </div>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="btn" @click="handleAccept">
              我已知晓
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  isRule3Violated: {
    type: Boolean,
    default: false
  },
  isRule2Violated: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['accept', 'close'])

const handleOverlayClick = () => {
  emit('close')
}

const handleAccept = () => {
  emit('accept')
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  text-align: center;
  margin-bottom: 24px;
}

.dialog-header h2 {
  font-size: 24px;
  margin: 0;
}

.dialog-body {
  text-align: left;
  margin-bottom: 24px;
}

.disclaimer-section {
  background: #fff5f6;
  border: 2px solid #F6B1B5;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.disclaimer-section h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--text-color);
}

.disclaimer-section p {
  margin: 0;
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.rules-section {
  background: #fff5f6;
  border: 2px solid #F6B1B5;
  border-radius: 12px;
  padding: 20px;
}

.rules-title {
  margin: 0 0 16px 0;
  font-size: 20px;
  text-align: center;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 2px solid var(--primary-color);
  transition: all 0.3s;
}

.rule-item.rule-violated {
  background: #1a0000;
  border-color: #cc3333;
  box-shadow: 0 0 10px rgba(204, 51, 51, 0.3);
}

.rule-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--primary-color);
  color: var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  flex-shrink: 0;
  border: 2px solid var(--border-color);
}

.rule-text {
  font-size: 16px;
  color: var(--text-color);
  flex: 1;
}

.rule-text.rule-text-violated {
  color: #cc3333;
  text-decoration: line-through;
  font-weight: bold;
}

.dialog-footer {
  display: flex;
  justify-content: center;
}

.btn {
  padding: 12px 40px;
  font-size: 16px;
}

/* 动画效果 */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-active .dialog-content,
.dialog-leave-active .dialog-content {
  transition: transform 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-content,
.dialog-leave-to .dialog-content {
  transform: scale(0.8);
}

@media (max-width: 768px) {
  .dialog-content {
    padding: 24px;
  }

  .dialog-header h2 {
    font-size: 20px;
  }

  .disclaimer-section h3 {
    font-size: 16px;
  }

  .disclaimer-section p {
    font-size: 13px;
  }

  .rules-title {
    font-size: 18px;
  }

  .rule-text {
    font-size: 14px;
  }

  .btn {
    padding: 10px 32px;
    font-size: 14px;
  }
}
</style>