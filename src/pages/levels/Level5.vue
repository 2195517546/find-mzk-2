<template>
  <CardBattle @win="$emit('win')" />
</template>

<script setup>
import CardBattle from '@/components/level5/CardBattle.vue'

defineEmits(['win'])
</script>
