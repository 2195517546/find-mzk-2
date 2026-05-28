<template>
  <div class="level7-container">
    <!-- 阶段1：警告叙事 -->
    <Transition name="fade">
      <div v-if="phase === 1" class="warning-phase" @click="handleWarningClick">
        <div class="warning-overlay"></div>
        <div class="warning-text-container">
          <p
            v-for="(line, index) in warningLines"
            :key="index"
            class="warning-line"
            :class="{ visible: currentLineIndex >= index }"
          >
            {{ line }}
          </p>
        </div>
        <p v-if="showContinueHint" class="continue-hint">点击继续</p>
      </div>
    </Transition>

    <!-- 阶段2：图像记忆收集 -->
    <Transition name="fade">
      <div v-if="phase === 2" class="memory-phase">
        <div class="memory-dialog">
          <div class="paper-texture"></div>
          <h3 class="memory-title">你见过这幅画吗？</h3>
          <p class="memory-subtitle">（在这个网站之外）</p>
          <div class="memory-image-container">
            <img
              src="/assets/images/repository/晓山瑞希简笔.webp"
              alt="简笔画"
              class="memory-image"
            />
          </div>
          <div class="memory-buttons">
            <button class="memory-btn" @click="handleMemoryAnswer(true)">是</button>
            <button class="memory-btn" @click="handleMemoryAnswer(false)">否</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 阶段3：秘钥验证 -->
    <Transition name="fade">
      <div v-if="phase === 3" class="key-phase">
        <div class="key-panel">
          <h2 class="key-title">请输入文档库秘钥</h2>
          <input
            v-model="keyInput"
            type="text"
            class="key-input"
            :class="{ error: keyError }"
            placeholder="请输入数字"
            @keyup.enter="checkKey"
          />
          <p class="key-hint">视频链接：<a href="https://www.bilibili.com/video/BV1PcGH6KEkG/" target="_blank" rel="noopener">点击查看</a></p>
          <p class="key-subhint">画出晓山瑞希用了几笔？</p>
          <p v-if="keyError" class="key-error">秘钥不正确</p>
          <button class="key-submit-btn" @click="checkKey">确认</button>
        </div>
      </div>
    </Transition>

    <!-- 阶段4：松鼠文档库 -->
    <Transition name="fade">
      <div v-if="phase === 4" class="library-phase">
        <div class="library-container">
          <!-- 顶部标题栏 -->
          <div class="library-header">
            <button class="menu-toggle" @click="sidebarOpen = !sidebarOpen">
              {{ sidebarOpen ? '✕' : '☰' }}
            </button>
            <div class="header-text">
              <h1 class="library-title">松鼠文档库</h1>
              <p class="library-subtitle">松鼠。。。</p>
            </div>
            <!-- 收集进度（只有主线有进度显示） -->
            <div class="collect-progress" v-if="cluesFound.length > 0">
              <span class="progress-main">已发现 {{ cluesFound.length }}/{{ totalClues }}</span>
            </div>
          </div>

          <div class="library-main">
            <!-- 左侧导航（可关闭） -->
            <aside class="library-sidebar" :class="{ open: sidebarOpen }">
              <div class="squirrel-silhouette"></div>
              <ul class="doc-list">
                <li
                  v-for="doc in documents"
                  :key="doc.id"
                  class="doc-item"
                  :class="{ active: activeDoc?.id === doc.id }"
                  @click="selectDoc(doc)"
                >
                  <span class="doc-title">{{ doc.title }}</span>
                  <span class="doc-desc">{{ doc.description }}</span>
                  <!-- 主线收集标记 -->
                  <span v-if="getCluesForDoc(doc.id).length > 0 && getCluesForDoc(doc.id)[0].found" class="clue-marker">◈</span>
                </li>
              </ul>
            </aside>

            <!-- 遮罩层（移动端点击关闭） -->
            <div
              v-if="sidebarOpen && isMobile"
              class="sidebar-overlay"
              @click="sidebarOpen = false"
            ></div>

            <!-- 右侧阅读区 -->
            <main class="library-content">
              <div v-if="activeDoc" class="doc-content">
                <h2 class="doc-header">{{ activeDoc.title }}</h2>
                <div class="doc-tags">
                  <span v-for="tag in activeDoc.tags" :key="tag" class="doc-tag">{{ tag }}</span>
                </div>

                <!-- 主线关键词区域 - 现在隐藏，通过点击文字收集 -->
                <div
                  class="keyword-zone"
                  :class="{ found: getCluesForDoc(activeDoc.id)[0]?.found }"
                  style="display: none;"
                >
                  <span class="keyword-text" v-if="getCluesForDoc(activeDoc.id)[0]?.found">◈ 已收集</span>
                  <span class="keyword-hint" v-else>点击收集线索</span>
                </div>

                <div class="doc-body" v-html="formattedContent" @click="handleKeywordClick"></div>

                <!-- 彩蛋隐藏区域 -->
                <div
                  v-for="egg in getEasterEggsForDoc(activeDoc.id)"
                  :key="'egg-' + egg.id"
                  class="easter-clue"
                  :class="{ found: egg.found }"
                  :style="{ top: getEggPosition(egg.id).top, left: getEggPosition(egg.id).left, right: getEggPosition(egg.id).right, bottom: getEggPosition(egg.id).bottom }"
                  @click="collectEasterEgg(egg)"
                >
                  <span v-if="egg.found" class="egg-symbol">♥</span>
                </div>

                <!-- 找到彩蛋后的松鼠闪现 -->
                <Transition name="squirrel-pop">
                  <div v-if="squirrelFlash" class="squirrel-flash">
                    <img src="/assets/images/松鼠mzk.webp" alt="松鼠" class="squirrel-image" />
                  </div>
                </Transition>
              </div>

              <!-- 通关输入区 -->
              <div v-if="cluesFound.length === totalClues" class="final-answer">
                <p class="final-hint">你已收集完所有碎片...</p>
                <p class="final-hint-sub">拼凑碎片，还原她的名字</p>
                <input
                  v-model="answerInput"
                  type="text"
                  class="answer-input"
                  :class="{ error: answerError }"
                  placeholder="输入答案"
                  @keyup.enter="checkAnswer"
                />
                <p v-if="answerError" class="answer-error">答案不正确</p>
                <button class="answer-btn" @click="checkAnswer">确认</button>
              </div>

              <div v-else-if="activeDoc" class="empty-state">
                <p>仔细阅读，也许角落里藏着什么...</p>
              </div>
            </main>
          </div>

          <!-- 收集到主线的提示 -->
          <Transition name="clue-pop">
            <div v-if="showClueToast" class="clue-toast">
              <span class="clue-icon">◈</span>
              <span class="clue-text">发现线索：{{ lastClueFragment }}</span>
            </div>
          </Transition>

          <!-- 收集到彩蛋的提示 -->
          <Transition name="clue-pop">
            <div v-if="showEasterEggToast" class="egg-toast">
              <span class="clue-icon">♥</span>
              <span class="clue-text">发现线索：{{ lastEasterEggFragment }}</span>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import level7Index from '@/data/level7/index.json'

const emit = defineEmits(['win'])

// 使用 glob 批量导入所有 txt 文件
const docContents = import.meta.glob('@/data/level7/*.txt', { as: 'raw' })

// 阶段控制
const phase = ref(1)

// 侧边栏控制
const sidebarOpen = ref(true)
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    sidebarOpen.value = false
  } else {
    sidebarOpen.value = true
  }
}

// 警告叙事
const warningLines = [
  '你知道吗',
  '只要你不玩这个游戏。',
  '这些规则就不会被破坏',
  '你已经破坏两个规则了',
  '晓山瑞希的世界',
  '要崩溃了。',
  '于情于理……',
  '你要救赎我们',
  '否则……你……',
  '去找',
  '松鼠晓山瑞希。'
]
const currentLineIndex = ref(-1)
const showContinueHint = ref(false)

// 图像记忆
const memoryAnswered = ref(false)

// 秘钥验证
const keyInput = ref('')
const keyError = ref(false)

// 文档库
const documents = ref([])
const activeDoc = ref(null)
const docContent = ref('')
const squirrelFlash = ref(false)

// 线索系统 - 答案：复活吧晓山瑞希
// 关键词反映每个文档的主旨
const totalClues = 7
const clues = ref([
  { id: 1, docId: 'key_info', fragment: '规则', type: 'keyword', found: false },
  { id: 2, docId: 'squirrel_story', fragment: '矛盾', type: 'keyword', found: false },
  { id: 3, docId: 'human_squirrel', fragment: '希望', type: 'keyword', found: false },
  { id: 4, docId: 'ding_sutra', fragment: '创造', type: 'keyword', found: false },
  { id: 5, docId: 'shadow_record', fragment: '意识', type: 'keyword', found: false },
  { id: 6, docId: 'birth', fragment: '第七天', type: 'keyword', found: false },
  { id: 7, docId: 'letter_to_squirrel', fragment: '你自己', type: 'keyword', found: false },
])

// 彩蛋系统 - 答案：好可爱晓山瑞希
const totalEasterEggs = 7
const easterEggs = ref([
  { id: 1, docId: 'key_info', fragment: '好', found: false },
  { id: 2, docId: 'squirrel_story', fragment: '可', found: false },
  { id: 3, docId: 'human_squirrel', fragment: '爱', found: false },
  { id: 4, docId: 'ding_sutra', fragment: '晓', found: false },
  { id: 5, docId: 'shadow_record', fragment: '山', found: false },
  { id: 6, docId: 'birth', fragment: '瑞', found: false },
  { id: 7, docId: 'letter_to_squirrel', fragment: '希', found: false },
])

const cluesFound = computed(() => clues.value.filter(c => c.found))
const easterEggsFound = computed(() => easterEggs.value.filter(e => e.found))
const showClueToast = ref(false)
const lastClueFragment = ref('')
const showEasterEggToast = ref(false)
const lastEasterEggFragment = ref('')
const answerInput = ref('')
const answerError = ref(false)

// 获取当前文档的主线线索
const getCluesForDoc = (docId) => {
  return clues.value.filter(c => c.docId === docId)
}

// 获取当前文档的彩蛋线索
const getEasterEggsForDoc = (docId) => {
  return easterEggs.value.filter(e => e.docId === docId)
}

// 彩蛋位置映射
const eggPositions = {
  1: { top: 'auto', left: '10px', right: 'auto', bottom: '15px' },      // 关键信息 - 左下
  2: { top: '15px', left: 'auto', right: '10px', bottom: 'auto' },    // 松鼠的故事 - 右上
  3: { top: 'auto', left: '10px', right: 'auto', bottom: '15px' },     // 三只松鼠 - 左下
  4: { top: '15px', left: 'auto', right: '10px', bottom: 'auto' },     // 钉经 - 右上
  5: { top: 'auto', left: 'auto', right: '10px', bottom: '15px' },    // 影子记录 - 右下
  6: { top: '15px', left: '10px', right: 'auto', bottom: 'auto' },    // 诞生之初 - 左上
  7: { top: 'auto', left: 'auto', right: '10px', bottom: '15px' },    // 致松鼠 - 右下
}

const getEggPosition = (id) => eggPositions[id] || { top: '10px', right: '10px' }

// 收集主线线索
const collectClue = (clue) => {
  if (clue.found) return
  clue.found = true
  lastClueFragment.value = clue.fragment
  showClueToast.value = true
  localStorage.setItem(`mzk_level7_clue_${clue.id}`, 'true')
  setTimeout(() => {
    showClueToast.value = false
  }, 2000)
}

// 收集彩蛋线索
const collectEasterEgg = (egg) => {
  if (egg.found) return
  egg.found = true
  lastEasterEggFragment.value = egg.fragment
  showEasterEggToast.value = true
  localStorage.setItem(`mzk_level7_egg_${egg.id}`, 'true')
  setTimeout(() => {
    showEasterEggToast.value = false
  }, 2000)
}

// 验证主线答案
const checkAnswer = () => {
  const fullAnswer = clues.value.map(c => c.fragment).join('')
  if (answerInput.value === fullAnswer) {
    // 通关时显示发现的彩蛋数量
    const eggCount = easterEggsFound.value.length
    if (eggCount > 0) {
      alert(`恭喜通关！你还发现了 ${eggCount} 个额外线索。`)
    }
    emit('win')
  } else {
    answerError.value = true
    answerInput.value = ''
    setTimeout(() => {
      answerError.value = false
    }, 1000)
  }
}

// 格式化文档内容（保留换行，并使关键词可点击）
const formattedContent = computed(() => {
  if (!docContent.value) return ''
  const content = docContent.value.replace(/\n/g, '<br>')
  const clue = getCluesForDoc(activeDoc.value?.id)[0]
  if (clue && !clue.found) {
    // 将关键词包装成可点击的 span
    const keyword = clue.fragment
    const regex = new RegExp(keyword, 'g')
    return content.replace(regex, (match) => {
      return `<span class="clickable-keyword" data-clue-id="${clue.id}">${match}</span>`
    })
  }
  return content
})

// 处理关键词点击
const handleKeywordClick = (event) => {
  const target = event.target
  if (target.classList.contains('clickable-keyword')) {
    const clueId = parseInt(target.dataset.clueId)
    const clue = clues.value.find(c => c.id === clueId)
    if (clue) {
      collectClue(clue)
    }
  }
}

// 警告叙事逻辑
let lineTimer = null
const startWarning = () => {
  lineTimer = setInterval(() => {
    if (currentLineIndex.value < warningLines.length - 1) {
      currentLineIndex.value++
      if (currentLineIndex.value === warningLines.length - 1) {
        clearInterval(lineTimer)
        setTimeout(() => {
          showContinueHint.value = true
        }, 1500)
      }
    }
  }, 1500)
}

const handleWarningClick = () => {
  if (showContinueHint.value) {
    phase.value = 2
    clearInterval(lineTimer)
  } else if (currentLineIndex.value < warningLines.length - 1) {
    currentLineIndex.value = warningLines.length - 1
    clearInterval(lineTimer)
    setTimeout(() => {
      showContinueHint.value = true
    }, 500)
  }
}

// 图像记忆回答
const handleMemoryAnswer = (seen) => {
  localStorage.setItem('mzk_level7_seenImage', seen ? 'true' : 'false')
  phase.value = 3
}

// 秘钥验证
const checkKey = () => {
  if (keyInput.value === '7') {
    phase.value = 4
    loadDocuments()
  } else {
    keyError.value = true
    keyInput.value = ''
    setTimeout(() => {
      keyError.value = false
    }, 500)
  }
}

// 加载文档列表
const loadDocuments = () => {
  documents.value = level7Index
  if (documents.value.length > 0) {
    selectDoc(documents.value[0])
  }
}

// 选择文档
const selectDoc = async (doc) => {
  activeDoc.value = doc
  if (isMobile.value) {
    sidebarOpen.value = false
  }
  const path = `/src/data/level7/${doc.file}`
  if (docContents[path]) {
    docContent.value = await docContents[path]()
  } else {
    docContent.value = '加载失败...'
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)

  // 检查是否已有回答记录
  const hasAnswer = localStorage.getItem('mzk_level7_seenImage')
  if (hasAnswer) {
    memoryAnswered.value = true
  }

  // 加载已收集的线索 - 每次进入文档库时重置
  // 清除旧的收集状态
  clues.value.forEach(clue => {
    localStorage.removeItem(`mzk_level7_clue_${clue.id}`)
    clue.found = false
  })

  // 彩蛋状态不清除，保留记录
  easterEggs.value.forEach(egg => {
    const saved = localStorage.getItem(`mzk_level7_egg_${egg.id}`)
    if (saved === 'true') {
      egg.found = true
    }
  })

  startWarning()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})
</script>

<style scoped>
.level7-container {
  width: 100%;
  min-height: 100vh;
  position: relative;
}

/* 通用过渡 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ==================== 阶段1：警告叙事 ==================== */
.warning-phase {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 500;
}

.warning-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
}

.warning-text-container {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 40px;
}

.warning-line {
  font-size: 24px;
  color: #fff;
  margin: 20px 0;
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
  font-family: 'STKaiti', 'KaiTi', serif;
}

.warning-line.visible {
  opacity: 1;
  transform: translateY(0);
}

.continue-hint {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  color: #666;
  font-size: 14px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

/* ==================== 阶段2：图像记忆 ==================== */
.memory-phase {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.memory-dialog {
  position: relative;
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  border: 3px solid var(--border-color);
  border-radius: 12px;
  padding: 30px;
  max-width: 360px;
  width: 90%;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 101;
}

.paper-texture {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 28px,
      #f0d8dc 28px,
      #f0d8dc 29px
    );
  opacity: 0.3;
  pointer-events: none;
  border-radius: 10px;
  z-index: -1;
}

.memory-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 8px;
  font-family: 'STKaiti', 'KaiTi', serif;
  position: relative;
  z-index: 1;
}

.memory-subtitle {
  font-size: 13px;
  color: #666;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
}

.memory-image-container {
  margin: 16px 0;
  position: relative;
  z-index: 1;
}

.memory-image {
  width: 120px;
  height: 120px;
  object-fit: contain;
  border: 3px solid var(--border-color);
  border-radius: 8px;
  background: #fff;
}

.memory-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 20px;
  position: relative;
  z-index: 1;
}

.memory-btn {
  padding: 10px 32px;
  font-size: 15px;
  border: 2px solid var(--border-color);
  background-color: var(--primary-color);
  color: var(--border-color);
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'STKaiti', 'KaiTi', serif;
}

.memory-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* ==================== 阶段3：秘钥验证 ==================== */
.key-phase {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}

.key-panel {
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  border: 3px solid var(--border-color);
  border-radius: 12px;
  padding: 40px;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.key-title {
  font-size: 24px;
  color: #333;
  margin-bottom: 24px;
  font-family: 'STKaiti', 'KaiTi', serif;
}

.key-input {
  width: 100%;
  padding: 16px;
  font-size: 24px;
  text-align: center;
  background: #fff;
  border: 2px solid var(--border-color);
  color: #333;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
}

.key-input:focus {
  border-color: var(--primary-color);
}

.key-input.error {
  border-color: #e74c3c;
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-10px); }
  40%, 80% { transform: translateX(10px); }
}

.key-hint {
  margin-top: 16px;
  color: #666;
  font-size: 14px;
}

.key-hint a {
  color: var(--primary-color);
  text-decoration: underline;
}

.key-subhint {
  margin-top: 8px;
  color: #888;
  font-size: 12px;
  font-style: italic;
}

.key-error {
  margin-top: 12px;
  color: #e74c3c;
  font-size: 14px;
}

.key-submit-btn {
  margin-top: 20px;
  padding: 12px 48px;
  font-size: 16px;
  background: var(--primary-color);
  color: var(--border-color);
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
}

.key-submit-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* ==================== 阶段4：松鼠文档库 ==================== */
.library-phase {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.library-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(135deg, #f5e6d3 0%, #e8d4bc 100%);
  position: relative;
}

.library-header {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(to bottom, #8B6914, #6B4423);
  padding: 12px 16px;
  border-bottom: 3px solid #4a2c0f;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.menu-toggle {
  width: 36px;
  height: 36px;
  border: 2px solid #4a2c0f;
  background: #f5e6d3;
  border-radius: 6px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.menu-toggle:hover {
  background: #d4c4a8;
}

.header-text {
  flex: 1;
  text-align: center;
}

.library-title {
  font-size: 20px;
  margin: 0;
  color: #fff;
  font-family: 'SimHei', 'Microsoft YaHei', sans-serif;
  font-weight: bold;
}

.library-subtitle {
  font-size: 12px;
  color: #d4c4a8;
  margin: 0;
}

.clue-progress {
  background: rgba(0,0,0,0.3);
  padding: 4px 12px;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
}

.collect-progress {
  background: rgba(0,0,0,0.3);
  padding: 4px 10px;
  border-radius: 12px;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.progress-main {
  color: #d4c4a8;
}

.progress-sep {
  color: #888;
}

.progress-egg {
  color: #ffb8c6;
}

.library-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}

/* 侧边栏 */
.library-sidebar {
  background: linear-gradient(to right, #d4c4a8, #e8d4bc);
  border-right: 2px solid #8B6914;
  padding: 16px;
  overflow-y: auto;
  flex-shrink: 0;
}

/* 桌面端侧边栏 */
@media (min-width: 769px) {
  .library-sidebar {
    width: 260px;
  }

  .library-sidebar:not(.open) {
    display: none;
  }
}

/* 移动端侧边栏 */
@media (max-width: 768px) {
  .library-sidebar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 75%;
    max-width: 280px;
    z-index: 100;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
  }

  .library-sidebar.open {
    transform: translateX(0);
  }
}

/* 遮罩层 */
.sidebar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
}

.squirrel-silhouette {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  background: url('/assets/images/松鼠mzk.webp') center/contain no-repeat;
  opacity: 0.4;
  filter: grayscale(100%);
}

.doc-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.doc-item {
  padding: 14px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.5);
  border: 2px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.doc-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: #8B6914;
}

.doc-item.active {
  background: #fff;
  border-color: #8B6914;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.doc-title {
  display: block;
  font-size: 15px;
  font-weight: bold;
  color: #333;
  margin-bottom: 4px;
  font-family: 'STKaiti', 'KaiTi', serif;
}

.doc-desc {
  display: block;
  font-size: 12px;
  color: #666;
}

.clue-marker {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  background: #8B6914;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.egg-marker {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 16px;
  color: #e74c3c;
}

/* 阅读区 */
.library-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  position: relative;
}

.doc-content {
  max-width: 650px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.85);
  padding: 24px;
  border-radius: 12px;
  border: 2px solid #8B6914;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  position: relative;
}

.doc-header {
  font-size: 22px;
  margin-bottom: 12px;
  padding-bottom: 0;
  border-bottom: none;
  font-family: 'SimHei', 'Microsoft YaHei', sans-serif;
  text-align: center;
  font-weight: bold;
  color: #4a2c0f;
}

.doc-tags {
  margin-top: 0;
  margin-bottom: 16px;
  padding-top: 12px;
  padding-bottom: 12px;
  border-top: 2px dashed #8B6914;
  border-bottom: 2px dashed #8B6914;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.doc-body {
  font-size: 17px;
  line-height: 2;
  color: #3d2b1f;
  font-family: 'SimHei', 'Microsoft YaHei', sans-serif;
  white-space: pre-wrap;
  position: relative;
  z-index: 1;
}

/* 可点击的关键词样式 */
.clickable-keyword {
  color: #8B6914;
  background: rgba(139, 105, 20, 0.08);
  padding: 1px 4px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px dotted #8B6914;
}

.clickable-keyword:hover {
  background: rgba(139, 105, 20, 0.2);
  border-bottom: 2px solid #8B6914;
}

.doc-tag {
  padding: 4px 12px;
  background: #8B6914;
  color: #fff;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

/* 主线关键词区域 */
.keyword-zone {
  position: relative;
  margin: 16px 0;
  padding: 12px 20px;
  background: rgba(139, 105, 20, 0.1);
  border: 2px dashed #8B6914;
  border-radius: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
}

.keyword-zone:hover {
  background: rgba(139, 105, 20, 0.2);
  border-style: solid;
}

.keyword-zone.found {
  opacity: 0.5;
  pointer-events: none;
}

.keyword-text {
  font-size: 16px;
  font-weight: bold;
  color: #8B6914;
  font-family: 'SimHei', 'Microsoft YaHei', sans-serif;
}

.keyword-hint {
  font-size: 14px;
  color: #8B6914;
  font-family: 'SimHei', 'Microsoft YaHei', sans-serif;
}

/* 彩蛋隐藏区域 */
.easter-clue {
  position: absolute;
  width: 50px;
  height: 50px;
  cursor: pointer;
  opacity: 0.3;
  transition: opacity 0.3s ease;
  z-index: 100;
  border-radius: 8px;
  background: rgba(255, 183, 197, 0.6);
  border: 2px dashed rgba(255, 100, 150, 0.8);
}

.easter-clue:hover {
  opacity: 0.6;
  background: rgba(255, 183, 197, 0.8);
  border-color: rgba(255, 80, 120, 1);
}

.easter-clue.found {
  opacity: 0;
  pointer-events: none;
}

.egg-symbol {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  color: #e74c3c;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 16px;
}

.clue-hint {
  margin-top: 16px;
  font-size: 14px;
  color: #8B6914;
  font-weight: bold;
}

/* 通关输入区 */
.final-answer {
  max-width: 400px;
  margin: 40px auto;
  background: rgba(255, 255, 255, 0.9);
  border: 3px solid #8B6914;
  border-radius: 12px;
  padding: 30px;
  text-align: center;
}

.final-hint {
  font-size: 18px;
  color: #4a2c0f;
  margin-bottom: 8px;
  font-weight: bold;
}

.final-hint-sub {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
}

.answer-input {
  width: 100%;
  padding: 14px;
  font-size: 18px;
  text-align: center;
  border: 2px solid #8B6914;
  border-radius: 8px;
  outline: none;
  font-family: 'SimHei', 'Microsoft YaHei', sans-serif;
}

.answer-input:focus {
  border-color: #6B4423;
}

.answer-input.error {
  border-color: #c0392b;
  animation: shake 0.5s ease;
}

.answer-error {
  color: #c0392b;
  font-size: 14px;
  margin-top: 8px;
}

.answer-btn {
  margin-top: 16px;
  padding: 12px 40px;
  font-size: 16px;
  background: #8B6914;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

.answer-btn:hover {
  background: #6B4423;
  transform: scale(1.05);
}

/* 线索提示 */
.clue-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(139, 105, 20, 0.95);
  color: #fff;
  padding: 20px 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.clue-icon {
  font-size: 28px;
}

.clue-text {
  font-size: 18px;
  font-weight: bold;
  font-family: 'SimHei', 'Microsoft YaHei', sans-serif;
}

/* 彩蛋提示 */
.egg-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(231, 76, 60, 0.95);
  color: #fff;
  padding: 20px 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 2000;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.clue-pop-enter-active {
  animation: clueAppear 0.5s ease;
}

.clue-pop-leave-active {
  animation: clueDisappear 0.5s ease;
}

@keyframes clueAppear {
  0% { transform: translate(-50%, -50%) scale(0); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.1); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

@keyframes clueDisappear {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
}

.squirrel-flash {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
}

.squirrel-image {
  width: 180px;
  height: 180px;
  object-fit: contain;
  animation: squirrelPop 1s ease-out forwards;
}

@keyframes squirrelPop {
  0% { transform: scale(0); opacity: 0; }
  30% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
}

.squirrel-pop-enter-active {
  animation: squirrelPop 1s ease-out forwards;
}

/* 响应式 */
@media (max-width: 768px) {
  .library-content {
    padding: 16px;
  }

  .doc-content {
    padding: 16px;
  }

  .doc-body {
    font-size: 15px;
    line-height: 1.9;
  }

  .squirrel-silhouette {
    width: 50px;
    height: 50px;
  }

  .doc-title {
    font-size: 14px;
  }

  .doc-header {
    font-size: 20px;
  }

  .final-answer {
    margin: 20px;
    padding: 20px;
  }
}
</style>
