<template>
  <div class="level-wrapper" :class="{ 'hide-footer': levelId === 8 || levelId === 10 }">
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

    <WinDialog
      :show="showWinDialog"
      :current-level="levelId"
      :level-name="levelData.name"
      :total-levels="MAX_LEVEL"
      :message="winMessage"
      :variant="levelId === 5 ? 'dark' : 'normal'"
      @close="showWinDialog = false"
      @next="goToNextLevel"
      @restart="restartLevel"
    />

    <ConfirmDialog
      :show="showLockedAlert"
      type="alert"
      title="提示"
      message="请先完成前面的关卡！"
      @confirm="handleLockedAlertConfirm"
      @cancel="handleLockedAlertConfirm"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore, MAX_LEVEL } from '@/stores/game'
import TopBar from '@/components/TopBar.vue'
import Footer from '@/components/Footer.vue'
import WinDialog from '@/components/WinDialog.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
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
const showLockedAlert = ref(false)
const winMessage = ref('你成功找到了晓山瑞希！')

const levelData = computed(() => {
  return levelsData.find(l => l.id === props.levelId) || levelsData[0]
})

// 组件映射定义在 computed 外部，避免每次重新创建 defineAsyncComponent 包装器
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

const levelComponent = computed(() => {
  return componentMap[props.levelId] || componentMap[1]
})

onMounted(() => {
  // 检查关卡是否解锁
  if (!gameStore.isLevelUnlocked(props.levelId)) {
    showLockedAlert.value = true
  }
})

const handleLockedAlertConfirm = () => {
  showLockedAlert.value = false
  router.push('/')
}

const handleWin = (data) => {
  gameStore.completeLevel(props.levelId)
  if (props.levelId === 2) {
    winMessage.value = data
      ? '你成功进入了晓山瑞希！\n🎉 隐藏彩蛋：你发现了67号日期！'
      : '你成功进入了晓山瑞希！'
  } else if (props.levelId === 4) {
    if (data?.foundAllMikus) {
      winMessage.value = '你成功探索了晓山瑞希！\n🎉 隐藏结局：你找到了全部7个miku！'
    } else {
      winMessage.value = `你成功探索了晓山瑞希！\n（提示：还有 ${data?.missingCount || 0} 个miku未找到）`
    }
  } else if (props.levelId === 9) {
    winMessage.value = '你成功击败了怪核！\n晓山瑞希的世界恢复了和平！'
  } else {
    winMessage.value = '你成功找到了晓山瑞希！'
  }
  showWinDialog.value = true
}

const goToNextLevel = () => {
  if (props.levelId < MAX_LEVEL) {
    router.push(`/level/${props.levelId + 1}`)
  } else {
    router.push('/')
  }
}

const restartLevel = () => {
  router.go(0)
}
</script>

<style scoped>
.level-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  overflow: hidden;
}

.level-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hide-footer {
  height: 100vh;
}

.hide-footer .level-content {
  height: calc(100vh - 60px);
}
</style>
