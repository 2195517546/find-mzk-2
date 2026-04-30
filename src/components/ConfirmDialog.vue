<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="show" class="dialog-overlay" @click="handleOverlayClick">
        <div class="dialog-content" @click.stop>
          <div class="dialog-header">
            <h2 class="pink-text">{{ title }}</h2>
          </div>
          <div class="dialog-body">
            <p class="message">{{ message }}</p>
          </div>
          <div class="dialog-footer">
            <button v-if="type === 'confirm'" class="btn btn-secondary" @click="handleCancel">
              {{ cancelText }}
            </button>
            <button class="btn btn-primary" @click="handleConfirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'alert',
    validator: (val) => ['alert', 'confirm'].includes(val)
  },
  confirmText: {
    type: String,
    default: '确定'
  },
  cancelText: {
    type: String,
    default: '取消'
  }
})

const emit = defineEmits(['confirm', 'cancel'])

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
}

const handleOverlayClick = () => {
  emit('cancel')
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
  z-index: 1500;
}

.dialog-content {
  background-color: white;
  border: 3px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  text-align: center;
  margin-bottom: 20px;
}

.dialog-header h2 {
  font-size: 24px;
  margin: 0;
}

.dialog-body {
  text-align: center;
  margin-bottom: 24px;
}

.message {
  font-size: 16px;
  color: var(--text-color);
  line-height: 1.6;
  margin: 0;
  word-break: break-word;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-primary {
  background-color: var(--primary-color);
}

.btn-secondary {
  background-color: #f0f0f0;
}

/* Transition */
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

  .message {
    font-size: 15px;
  }

  .dialog-footer {
    flex-direction: column;
  }
}
</style>
