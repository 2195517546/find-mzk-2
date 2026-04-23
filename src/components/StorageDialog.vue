<template>
  <Teleport to="body">
    <div class="storage-dialog-overlay">
      <div class="storage-dialog">
        <h2 class="pink-text">存储权限</h2>
        <p class="message">
          本游戏需要在浏览器本地存储您的游戏进度。
        </p>
        <p class="warning">
          如果不允许存储，每次打开网页都需要从头开始游戏。
        </p>
        <div class="button-group">
          <button class="btn btn-primary" @click="accept">
            允许存储
          </button>
          <button class="btn btn-secondary" @click="reject">
            不允许
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const emit = defineEmits(['accept', 'reject'])

const accept = () => {
  emit('accept')
}

const reject = () => {
  emit('reject')
}
</script>

<style scoped>
.storage-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.storage-dialog {
  background-color: white;
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.storage-dialog h2 {
  font-size: 24px;
  margin-bottom: 16px;
  text-align: center;
}

.message {
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 12px;
  line-height: 1.6;
}

.warning {
  font-size: 14px;
  color: #ff6b6b;
  margin-bottom: 24px;
  line-height: 1.6;
}

.button-group {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
}

.btn-primary {
  background-color: var(--primary-color);
}

.btn-secondary {
  background-color: #f0f0f0;
}

@media (max-width: 768px) {
  .storage-dialog {
    padding: 24px;
  }

  .storage-dialog h2 {
    font-size: 20px;
  }

  .message {
    font-size: 14px;
  }

  .warning {
    font-size: 12px;
  }
}
</style>
