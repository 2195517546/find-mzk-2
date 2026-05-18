<template>
  <div class="level-placeholder">
    <h3 class="instruction">第6关</h3>
    <p class="coming-soon">敬请期待</p>
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
  margin-bottom: 16px;
}
.coming-soon {
  font-size: 16px;
  color: #999;
}
</style>
