<template>
  <div class="level-6-container">
    <!-- 开场动画 -->
    <Level6Intro
      :show="showIntro"
      @start="handleIntroStart"
    />

    <!-- 第一节点：寻找killamzk -->
    <StageOne
      v-if="!showIntro && currentStage === 1"
      @next="handleStageOneComplete"
    />

    <!-- 第二节点：复活仪式 -->
    <StageTwo
      v-if="!showIntro && currentStage === 2"
      @win="handleWin"
    />

    <!-- 通关弹窗 -->
    <WinDialog
      :show="showWinDialog"
      :current-level="6"
      level-name="救赎晓山瑞希"
      :message="winMessage"
      @next="handleNextLevel"
      @restart="handleRestart"
      @close="showWinDialog = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import Level6Intro from '@/components/level6/Level6Intro.vue'
import StageOne from '@/components/level6/StageOne.vue'
import StageTwo from '@/components/level6/StageTwo.vue'
import WinDialog from '@/components/WinDialog.vue'

const router = useRouter()
const gameStore = useGameStore()

const showIntro = ref(true)
const currentStage = ref(0)
const showWinDialog = ref(false)
const winMessage = ref('你成功救赎了晓山瑞希')

watch(showIntro, (newVal) => {
  console.log('showIntro changed:', newVal)
})

watch(currentStage, (newVal) => {
  console.log('currentStage changed:', newVal)
})

const handleIntroStart = () => {
  console.log('Intro start clicked')
  showIntro.value = false
  currentStage.value = 1
}

const handleStageOneComplete = () => {
  console.log('Stage one completed')
  currentStage.value = 2
}

const handleWin = () => {
  console.log('Level 6 completed')
  // 标记规则破坏第二条
  gameStore.breakRule2()

  // 保存进度
  gameStore.completeLevel(6)

  // 显示通关弹窗
  showWinDialog.value = true
}

const handleNextLevel = () => {
  console.log('Going to level 7')
  // 进入第七关（显示敬请期待）
  router.push('/level/7')
}

const handleRestart = () => {
  console.log('Restarting level 6')
  showWinDialog.value = false
  showIntro.value = true
  currentStage.value = 0
}

onMounted(() => {
  console.log('Level6 mounted')
  console.log('Initial showIntro:', showIntro.value)
})

defineEmits(['win'])
</script>

<style scoped>
.level-6-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a0000 0%, #330000 100%);
  display: flex;
  flex-direction: column;
  position: relative;
}
</style>