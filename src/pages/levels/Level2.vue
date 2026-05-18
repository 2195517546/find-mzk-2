<template>
  <LoginForm @win="handleWin" />
</template>

<script setup>
import LoginForm from '@/components/level2/LoginForm.vue'

const emit = defineEmits(['win'])

function handleWin(hasFoundEgg) {
  emit('win', hasFoundEgg)
}
</script>
