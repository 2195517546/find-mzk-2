<template>
  <Teleport to="body">
    <div class="bv-overlay" @click="emit('close')">
      <div class="bv-panel" @click.stop>
        <div class="bv-header">
          <h3 class="bv-title">验证消息</h3>
          <p class="bv-subtitle">请输入以下信息以继续<span class="bv-hint">（提示：2010年）</span></p>
        </div>

        <div class="bv-body">
          <!-- 三列选择器 -->
          <div class="bv-pickers">

            <!-- 年份 -->
            <div class="bv-picker-col">
              <div class="bv-col-label">年份</div>
              <div class="bv-col-scroll" ref="yearEl">
                <div
                  v-for="y in years"
                  :key="y"
                  class="bv-col-item"
                  :class="{ active: selectedYear === y }"
                  @click="selectedYear = y"
                >{{ y }}</div>
              </div>
            </div>

            <!-- 月份：长列表，前两轮无8，第三轮起才有8 -->
            <div class="bv-picker-col">
              <div class="bv-col-label">月份</div>
              <div class="bv-col-scroll" ref="monthEl" @scroll="onMonthScroll">
                <div
                  v-for="(item, i) in monthList"
                  :key="i"
                  class="bv-col-item"
                  :class="{ active: selectedMonthIdx === i }"
                  @click="selectedMonthIdx = i; selectedMonth = item.value"
                >{{ item.value }}</div>
              </div>
              <div class="bv-col-hint" v-if="monthPassCount < 3">↓ 继续往下找</div>
            </div>

            <!-- 日期 -->
            <div class="bv-picker-col bv-day-col">
              <div class="bv-col-label">日期</div>
              <div class="bv-day-body">
                <!-- 0–9 -->
                <div class="bv-day-group">
                  <div
                    v-for="d in dayGroups[0]"
                    :key="d"
                    class="bv-day-item"
                    :class="{ active: selectedDay === d }"
                    @click="selectedDay = d"
                  >{{ d }}</div>
                  <button v-if="!expanded[1]" class="bv-expand-btn" @click="expand(1)">更多 ▼</button>
                </div>
                <!-- 10–19 -->
                <div v-if="expanded[1]" class="bv-day-group">
                  <div
                    v-for="d in dayGroups[1]"
                    :key="d"
                    class="bv-day-item"
                    :class="{ active: selectedDay === d }"
                    @click="selectedDay = d"
                  >{{ d }}</div>
                  <button v-if="!expanded[2]" class="bv-expand-btn" @click="expand(2)">更多 ▼</button>
                </div>
                <!-- 20–29 -->
                <div v-if="expanded[2]" class="bv-day-group">
                  <div
                    v-for="d in dayGroups[2]"
                    :key="d"
                    class="bv-day-item"
                    :class="{ active: selectedDay === d }"
                    @click="selectedDay = d"
                  >{{ d }}</div>
                  <button v-if="!expanded[3]" class="bv-expand-btn" @click="expand(3)">更多 ▼</button>
                </div>
                <!-- 30–39 -->
                <div v-if="expanded[3]" class="bv-day-group">
                  <div
                    v-for="d in dayGroups[3]"
                    :key="d"
                    class="bv-day-item"
                    :class="{ active: selectedDay === d }"
                    @click="selectedDay = d"
                  >{{ d }}</div>
                  <button v-if="!expanded[4]" class="bv-expand-btn" @click="expand(4)">更多 ▼</button>
                </div>
                <!-- 40–49 -->
                <div v-if="expanded[4]" class="bv-day-group">
                  <div
                    v-for="d in dayGroups[4]"
                    :key="d"
                    class="bv-day-item"
                    :class="{ active: selectedDay === d }"
                    @click="selectedDay = d"
                  >{{ d }}</div>
                  <button v-if="!expanded[5]" class="bv-expand-btn" @click="expand(5)">更多 ▼</button>
                </div>
                <!-- 50–59 -->
                <div v-if="expanded[5]" class="bv-day-group">
                  <div
                    v-for="d in dayGroups[5]"
                    :key="d"
                    class="bv-day-item"
                    :class="{ active: selectedDay === d }"
                    @click="selectedDay = d"
                  >{{ d }}</div>
                  <button v-if="!expanded[6]" class="bv-expand-btn" @click="expand(6)">更多 ▼</button>
                </div>
                <!-- 60–67 彩蛋 -->
                <div v-if="expanded[6]" class="bv-day-group bv-day-egg">
                  <div
                    v-for="d in dayGroups[6]"
                    :key="d"
                    class="bv-day-item"
                    :class="{ active: selectedDay === d }"
                    @click="selectedDay = d"
                  >{{ d }}</div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="bv-footer">
          <p v-if="errorMsg" class="bv-error">{{ errorMsg }}</p>
          <button class="bv-submit" @click="handleSubmit">确认</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['verified', 'close'])

const CORRECT_YEAR = 2010
const CORRECT_MONTH = 8
const CORRECT_DAY = 27
const EASTER_EGG_KEY = 'find-mzk-2-egg-67'

const selectedYear = ref(null)
const selectedMonth = ref(null)
const selectedMonthIdx = ref(null)
const selectedDay = ref(null)
const errorMsg = ref('')
const expanded = ref({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false })
const hasFoundEgg = ref(false) // 本次是否发现彩蛋

const yearEl = ref(null)
const monthEl = ref(null)

// 年份列表：1920–2025
const years = Array.from({ length: 2025 - 1920 + 1 }, (_, i) => 1920 + i)

// 月份长列表：
// 第1轮 1-12 无8，第2轮 1-12 无8，第3轮 1-12 含8
// 每一项存 { value, pass } 方便追踪
const NO8 = [1,2,3,4,5,6,7,9,10,11,12]
const FULL = [1,2,3,4,5,6,7,8,9,10,11,12]
const monthList = [
  ...NO8.map(v => ({ value: v, pass: 1 })),
  ...NO8.map(v => ({ value: v, pass: 2 })),
  ...FULL.map(v => ({ value: v, pass: 3 })),
]

// 记录用户最深滚动到了第几轮
const monthPassCount = ref(1)

function onMonthScroll(e) {
  const el = e.target
  // 每个 item 约 40px，计算当前可见区域底部到了第几轮
  const scrollBottom = el.scrollTop + el.clientHeight
  // 第一轮结束位置（11项）
  const pass1End = 11 * 40
  const pass2End = 22 * 40
  if (scrollBottom >= pass2End) {
    monthPassCount.value = 3
  } else if (scrollBottom >= pass1End) {
    if (monthPassCount.value < 2) monthPassCount.value = 2
  }
}

// 日期分组
const dayGroups = [
  Array.from({ length: 10 }, (_, i) => i),        // 0–9
  Array.from({ length: 10 }, (_, i) => 10 + i),   // 10–19
  Array.from({ length: 10 }, (_, i) => 20 + i),   // 20–29
  Array.from({ length: 10 }, (_, i) => 30 + i),   // 30–39
  Array.from({ length: 10 }, (_, i) => 40 + i),   // 40–49
  Array.from({ length: 10 }, (_, i) => 50 + i),   // 50–59
  Array.from({ length: 8 },  (_, i) => 60 + i),   // 60–67
]

function expand(group) {
  expanded.value[group] = true
  if (group === 6) {
    hasFoundEgg.value = true
    try { localStorage.setItem(EASTER_EGG_KEY, '1') } catch (_) {}
  }
}

function handleSubmit() {
  errorMsg.value = ''
  if (!selectedYear.value)                   { errorMsg.value = '请选择年份'; return }
  if (selectedYear.value !== CORRECT_YEAR)   { errorMsg.value = '年份不正确'; return }
  if (selectedMonth.value === null)          { errorMsg.value = '请选择月份'; return }
  if (selectedMonth.value !== CORRECT_MONTH) { errorMsg.value = '月份不正确'; return }
  if (selectedDay.value === null)            { errorMsg.value = '请选择日期'; return }
  if (selectedDay.value !== CORRECT_DAY)    { errorMsg.value = '日期不正确'; return }
  emit('verified', hasFoundEgg.value) // 传递是否发现彩蛋
}
</script>

<style scoped>
.bv-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
}

.bv-panel {
  background: #fff;
  border-radius: 12px;
  width: 520px;
  max-width: 96vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.28);
  display: flex;
  flex-direction: column;
}

.bv-header {
  padding: 18px 22px 12px;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}

.bv-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #222;
}

.bv-subtitle {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.bv-hint {
  color: #7c4dba;
  margin-left: 4px;
}

.bv-body {
  padding: 16px 22px;
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 三列并排 */
.bv-pickers {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.bv-picker-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.bv-col-label {
  font-size: 12px;
  font-weight: 700;
  color: #888;
  text-align: center;
  letter-spacing: 1px;
}

.bv-col-hint {
  font-size: 11px;
  color: #b39ddb;
  text-align: center;
  margin-top: 2px;
}

/* 滚动列 */
.bv-col-scroll {
  border: 1.5px solid #e0d4f5;
  border-radius: 8px;
  height: 200px;
  overflow-y: auto;
  background: #faf8ff;
  scroll-behavior: smooth;
}

.bv-col-item {
  padding: 9px 10px;
  font-size: 14px;
  text-align: center;
  cursor: pointer;
  border-bottom: 1px solid #f0ebfa;
  transition: background 0.1s, color 0.1s;
  user-select: none;
}

.bv-col-item:last-child {
  border-bottom: none;
}

.bv-col-item:hover {
  background: #ede5ff;
}

.bv-col-item.active {
  background: #7c4dba;
  color: #fff;
  font-weight: 700;
}

/* 日期列：可滚动 */
.bv-day-col {
  flex: 1.4;
}

.bv-day-body {
  border: 1.5px solid #e0d4f5;
  border-radius: 8px;
  height: 200px;
  overflow-y: auto;
  background: #faf8ff;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bv-day-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-bottom: 6px;
  border-bottom: 1px dashed #e8e0f5;
}

.bv-day-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.bv-day-item {
  padding: 5px 8px;
  border-radius: 5px;
  background: #f0ebff;
  font-size: 13px;
  cursor: pointer;
  min-width: 32px;
  text-align: center;
  user-select: none;
  transition: background 0.1s, color 0.1s;
}

.bv-day-item:hover {
  background: #ede5ff;
}

.bv-day-item.active {
  background: #7c4dba;
  color: #fff;
  font-weight: 700;
}

.bv-day-egg {
  border-top: 1px dashed #f9a825;
  padding-top: 6px;
  position: relative;
  margin-top: 2px;
}

.bv-day-egg::before {
  content: '✨';
  font-size: 11px;
  color: #f9a825;
  position: absolute;
  top: -9px;
  left: 2px;
}

.bv-expand-btn {
  width: 100%;
  padding: 4px 6px;
  background: #f0ebfa;
  border: 1.5px dashed #c8b0e8;
  border-radius: 5px;
  font-size: 12px;
  color: #7c4dba;
  cursor: pointer;
  transition: background 0.15s;
}

.bv-expand-btn:hover {
  background: #e4d8f5;
}

/* footer */
.bv-footer {
  padding: 12px 22px 18px;
  border-top: 1px solid #eee;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bv-error {
  color: #e53935;
  font-size: 13px;
  margin: 0;
  text-align: center;
}

.bv-submit {
  width: 100%;
  padding: 12px;
  background: #7c4dba;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s;
  letter-spacing: 1px;
}

.bv-submit:hover {
  background: #6a3da0;
}

@media (max-width: 480px) {
  .bv-pickers {
    gap: 8px;
  }

  .bv-col-item {
    padding: 8px 6px;
    font-size: 13px;
  }

  .bv-col-scroll,
  .bv-day-body {
    height: 160px;
  }
}
</style>
