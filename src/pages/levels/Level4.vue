<template>
  <MazeExplorer @win="handleWin" />
</template>

<script setup>
import MazeExplorer from '@/components/level3/MazeExplorer.vue'

const emit = defineEmits(['win'])

const handleWin = (data) => {
  emit('win', data)
}
</script>
