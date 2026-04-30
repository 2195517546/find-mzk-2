<template>
  <LoginForm @win="$emit('win')" />
</template>

<script setup>
import LoginForm from '@/components/level2/LoginForm.vue'

defineEmits(['win'])
</script>
