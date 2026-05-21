<template>
  <ForumBrowser @win="$emit('win')" />
</template>

<script setup>
import ForumBrowser from '@/components/level4/ForumBrowser.vue'

defineEmits(['win'])
</script>
