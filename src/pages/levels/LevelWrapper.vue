<template>
  <div class="level-wrapper">
    <TopBar
      :title="levelData.name"
      :subtitle="levelData.subtitle"
      :level-number="levelId"
    />

    <div class="level-content">
      <component
        :is="levelComponent"
        :level-data="levelData"
        @win="handleWin"
      />
    </div>

    <Footer />

    <WinDialog
      :show="showWinDialog"
      :current-level="levelId"
      :level-name="levelData.name"
      :total-levels="10"
      @close="showWinDialog = false"
      @next="goToNextLevel"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import TopBar from '@/components/TopBar.vue'
import Footer from '@/components/Footer.vue'
import WinDialog from '@/components/WinDialog.vue'
import levelsData from '@/data/levels.json'

const props = defineProps({
  levelId: {
    type: Number,
    required: true
  }
})

const router = useRouter()
const gameStore = useGameStore()

const showWinDialog = ref(false)

const levelData = computed(() => {
  return levelsData.find(l => l.id === props.levelId) || levelsData[0]
})

const levelComponent = computed(() => {
  // 动态导入关卡组件
  const componentMap = {
    1: defineAsyncComponent(() => import('./Level1.vue')),
    2: defineAsyncComponent(() => import('./Level2.vue')),
    3: defineAsyncComponent(() => import('./Level3.vue')),
    4: defineAsyncComponent(() => import('./Level4.vue')),
    5: defineAsyncComponent(() => import('./Level5.vue')),
    6: defineAsyncComponent(() => import('./Level6.vue')),
    7: defineAsyncComponent(() => import('./Level7.vue')),
    8: defineAsyncComponent(() => import('./Level8.vue')),
    9: defineAsyncComponent(() => import('./Level9.vue')),
    10: defineAsyncComponent(() => import('./Level10.vue'))
  }

  return componentMap[props.levelId] || componentMap[1]
})

onMounted(() => {
  // 检查关卡是否解锁
  if (!gameStore.isLevelUnlocked(props.levelId)) {
    alert('请先完成前面的关卡！')
    router.push('/')
  }
})

const handleWin = () => {
  gameStore.completeLevel(props.levelId)
  showWinDialog.value = true
}

const goToNextLevel = () => {
  if (props.levelId < 10) {
    router.push(`/level/${props.levelId + 1}`)
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.level-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.level-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
