<template>
  <div class="level-placeholder">
    <h3 class="instruction">第8关待实现</h3>
    <button class="btn test-btn" @click="$emit('win')">测试通关</button>
  </div>
</template>

<script setup>
defineEmits(['win'])
</script>

<style scoped>
.level-placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.instruction {
  font-size: 24px;
  color: var(--primary-color);
  margin-bottom: 32px;
}
</style>
