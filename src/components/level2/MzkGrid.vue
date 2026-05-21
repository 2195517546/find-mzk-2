<template>
  <div class="mzk-grid-wrap">
    <!-- 网格 -->
    <div
      class="grid"
      :class="gridSize === 16 ? 'grid-4x4' : 'grid-3x3'"
    >
      <div
        v-for="cell in cells"
        :key="cell.id"
        class="grid-cell"
        :class="{
          'cell-mzk':    cell.type === 'mzk',
          'cell-empty':  cell.type === 'empty',
          'cell-fade-in': cell.spawning,
          'cell-wrong':  cell.wrong,
        }"
        @click="onCellClick(cell)"
      >
        <img
          v-if="cell.type !== 'empty'"
          :src="cell.src"
          class="cell-img"
          draggable="false"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getImageUrl } from '@/utils/imageHelper'

const props = defineProps({
  gridSize:     { type: Number, default: 9 },
  totalToClick: { type: Number, default: 6 },
  maxVisible:   { type: Number, default: 3 },
})

const emit = defineEmits(['complete', 'wrong', 'skip-fail']) // 添加 skip-fail 事件

const MZK_IMAGES = [
  'emumzk', '侦探mzk', '倒立mzk', '倒立走mzk', '偷听mzk', '右立mzk',
  '吐舌mzk', '呼啦啦mzk', '大眼mzk', '巴巴博一mzk', '开心mzk', '怪核mzk',
  '惊吓mzk', '打坐mzk', '普通mzk', '松鼠mzk', '生气mzk', '肌肉mzk',
  '讲话mzk', '走路mzk', '跑mzk', '通通mzk', '飞行mzk', '鲨鱼mzk',
]

const OTHER_IMAGES = [
  '普通airi', '普通akito', '普通an', '普通emu', '普通ena',
  '普通haruka', '普通hiho', '普通honami', '普通ichika', '普通kaito',
  '普通knd', '普通kohane', '普通luka', '普通meiko', '普通mfy',
  '普通miku', '普通minori', '普通nene', '普通ren', '普通rin',
  '普通rui', '普通saki', '普通shizuku', '普通toya', '普通tsukasa', '普通白miku',
]

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const cells = ref([])
const clickedCount = ref(0)
let pendingSpawns = 0
const timers = []

function buildGrid() {
  clickedCount.value = 0
  pendingSpawns = props.totalToClick - Math.min(props.maxVisible, props.totalToClick)

  const grid = Array.from({ length: props.gridSize }, (_, i) => ({
    id: i,
    type: 'other',
    src: getImageUrl(`images/${randomFrom(OTHER_IMAGES)}.webp`),
    spawning: false,
    wrong: false,
  }))

  const indices = shuffle(Array.from({ length: props.gridSize }, (_, i) => i))
  const mzkSlots = indices.slice(0, Math.min(props.maxVisible, props.totalToClick))
  mzkSlots.forEach(idx => {
    grid[idx].type = 'mzk'
    grid[idx].src = getImageUrl(`images/${randomFrom(MZK_IMAGES)}.webp`)
  })

  cells.value = grid
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function onCellClick(cell) {
  if (cell.type === 'empty') return

  if (cell.type === 'mzk') {
    // 正确点击
    cell.type = 'empty'
    cell.src = ''
    clickedCount.value++

    // 检查是否还有 mzk 在界面上
    checkCompletion()

    // 点击后补充一个随机人物（可能是 mzk，也可能是其他角色）
    // 在其他空格子里随机生成，而不是在当前格子
    if (pendingSpawns > 0) {
      pendingSpawns--
      const delay = 800 + Math.random() * 1200
      const t = setTimeout(() => {
        spawnRandomCharacter()
        // 补充后再次检查是否完成
        checkCompletion()
      }, delay)
      timers.push(t)
    } else {
      // 即使没有待生成的 mzk，也要补充一个其他角色
      const delay = 800 + Math.random() * 1200
      const t = setTimeout(() => {
        spawnOtherCharacter()
        // 补充后再次检查是否完成
        checkCompletion()
      }, delay)
      timers.push(t)
    }
  } else {
    // 点错 —— 红色抖动，通知父组件重置关卡进度
    cell.wrong = true
    const t = setTimeout(() => { cell.wrong = false }, 500)
    timers.push(t)
    emit('wrong')
  }
}

function checkCompletion() {
  const remainingMzk = cells.value.filter(c => c.type === 'mzk').length

  if (remainingMzk === 0 && pendingSpawns <= 0) {
    const t = setTimeout(() => emit('complete'), 500)
    timers.push(t)
  }
}

function handleSkip() {
  // 检查是否还有待刷新的 mzk
  if (pendingSpawns > 0) {
    // 还有未刷新的 mzk，跳过失败
    emit('skip-fail')
  } else {
    // 没有待刷新的 mzk，跳过成功
    emit('complete')
  }
}

// 暴露方法给父组件调用
defineExpose({
  handleSkip
})

function spawnRandomCharacter(targetCell) {
  // 不使用 targetCell，而是随机选择一个空格子
  const emptyCells = cells.value.filter(c => c.type === 'empty')
  if (emptyCells.length === 0) return

  const target = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  target.type = 'mzk'
  target.src = getImageUrl(`images/${randomFrom(MZK_IMAGES)}.webp`)
  target.spawning = true
  setTimeout(() => { target.spawning = false }, 400)
}

function spawnOtherCharacter() {
  // 只生成其他角色，在随机空格子里生成
  const emptyCells = cells.value.filter(c => c.type === 'empty')
  if (emptyCells.length === 0) return

  const target = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  target.type = 'other'
  target.src = getImageUrl(`images/${randomFrom(OTHER_IMAGES)}.webp`)
  target.spawning = true
  setTimeout(() => { target.spawning = false }, 400)
}

function spawnMzk() {
  const emptyCells = cells.value.filter(c => c.type === 'empty')
  if (emptyCells.length === 0) {
    const t = setTimeout(spawnMzk, 500)
    timers.push(t)
    return
  }
  const target = emptyCells[Math.floor(Math.random() * emptyCells.length)]
  target.type = 'mzk'
  target.src = getImageUrl(`images/${randomFrom(MZK_IMAGES)}.webp`)
  target.spawning = true
  setTimeout(() => { target.spawning = false }, 400)
}

onMounted(() => buildGrid())
onUnmounted(() => { timers.forEach(clearTimeout) })
</script>

<style scoped>
.mzk-grid-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.grid {
  display: grid;
  gap: 4px;
  width: 100%;
  max-width: 320px;
}

.grid-3x3 { grid-template-columns: repeat(3, 1fr); }
.grid-4x4 { grid-template-columns: repeat(4, 1fr); }

.grid-cell {
  aspect-ratio: 1;
  background: #f5f0ff;
  border: 2px solid #e0d4f5;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, transform 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-mzk:hover {
  border-color: #7c4dba;
  background: #ede5ff;
}

.cell-mzk:active {
  transform: scale(0.93);
}

.cell-empty {
  background: #fff;
  border-color: #ebebeb;
  cursor: default;
}

/* 点错闪红 */
.cell-wrong {
  background: #ffebee !important;
  border-color: #e53935 !important;
  animation: shake 0.4s ease;
}

@keyframes shake {
  0%,100% { transform: translateX(0); }
  20%      { transform: translateX(-5px); }
  60%      { transform: translateX(5px); }
}

.cell-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.7); }
  to   { opacity: 1; transform: scale(1); }
}

.cell-fade-in .cell-img {
  animation: fadeIn 0.35s ease-out;
}

.grid-penalty {
  font-size: 13px;
  color: #e53935;
  margin: 0;
  font-weight: 600;
}
</style>
