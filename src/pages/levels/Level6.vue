<template>
  <div class="level-6-container">
    <!-- 开场动画 -->
    <Level6Intro
      :show="showIntro"
      @start="handleIntroStart"
    />

    <!-- 第一节点：寻找killamzk -->
    <StageOne
      v-if="currentStage === 1"
      @next="handleStageOneComplete"
    />

    <!-- 第二节点：复活仪式 -->
    <StageTwo
      v-if="currentStage === 2"
      @win="handleWin"
    />

    <!-- 顶部导航 -->
    <TopBar />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import TopBar from '@/components/TopBar.vue'
import Level6Intro from '@/components/level6/Level6Intro.vue'
import StageOne from '@/components/level6/StageOne.vue'
import StageTwo from '@/components/level6/StageTwo.vue'

const router = useRouter()
const gameStore = useGameStore()

const showIntro = ref(true)
const currentStage = ref(0)

const handleIntroStart = () => {
  showIntro.value = false
  currentStage.value = 1
}

const handleStageOneComplete = () => {
  currentStage.value = 2
}

const handleWin = () => {
  // 标记规则破坏第二条
  gameStore.breakRule2()

  // 保存进度
  gameStore.completeLevel(6)

  // 跳转到首页
  router.push('/')
}

defineEmits(['win'])
</script>

<style scoped>
.level-6-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a0000 0%, #330000 100%);
  display: flex;
  flex-direction: column;
}
</style>