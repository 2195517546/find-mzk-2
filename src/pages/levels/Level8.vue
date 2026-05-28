<template>
  <PlatformDescent @win="$emit('win')" />
</template>

<script setup>
import PlatformDescent from '@/components/level8/PlatformDescent.vue'

defineEmits(['win'])
</script>
