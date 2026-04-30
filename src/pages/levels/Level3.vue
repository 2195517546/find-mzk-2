<template>
  <MazeExplorer @win="$emit('win')" />
</template>

<script setup>
import MazeExplorer from '@/components/level3/MazeExplorer.vue'

defineEmits(['win'])
</script>
