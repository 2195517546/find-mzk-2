<template>
  <SuperMzkPlatformer @win="$emit('win')" />
</template>

<script setup>
import SuperMzkPlatformer from '@/components/level10/SuperMzkPlatformer.vue'

defineEmits(['win'])
</script>
