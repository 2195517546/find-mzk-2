<template>
  <div class="forum-browser" :style="{ backgroundImage: `url(${bgImageUrl})` }">
    <!-- 论坛头部 -->
    <div class="forum-header">
      <h1 class="forum-title">
        <span>晓山瑞希</span>
        <img :src="logoUrl" alt="logo" class="forum-logo" />
        <span>波波播客</span>
      </h1>
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索帖子标题或标签..."
          class="search-input"
          @keyup.enter="handleSearch"
        />
        <button class="search-btn" @click="handleSearch">搜索</button>
      </div>
    </div>

    <!-- 帖子列表 -->
    <div class="posts-container">
      <div v-if="filteredPosts.length === 0" class="no-results">
        <p>没有找到相关帖子</p>
      </div>
      <div
        v-for="post in filteredPosts"
        :key="post.post_id"
        class="post-card"
        :class="{ pinned: post.pinned }"
        @click="openPost(post.post_id)"
      >
        <div class="post-header">
          <span v-if="post.pinned" class="pin-badge">
            <img :src="pinIconUrl" alt="置顶" class="pin-icon" />
            置顶
          </span>
          <h3 class="post-title">{{ post.title }}</h3>
        </div>
        <div class="post-meta">
          <span class="post-author">{{ post.author }}</span>
          <span class="post-time">{{ post.release_time }}</span>
        </div>
        <div class="post-tags">
          <span v-for="tag in post.tags" :key="tag" class="tag">{{ tag }}</span>
        </div>
      </div>
    </div>

    <!-- 帖子详情弹窗 -->
    <Transition name="modal">
      <div v-if="selectedPost" class="modal-overlay" @click="closePost">
        <div class="modal-content" @click.stop>
          <button class="close-btn" @click="closePost">×</button>

          <div class="post-detail">
            <h2 class="detail-title">{{ selectedPostMeta?.title }}</h2>
            <div class="detail-meta">
              <span class="detail-author">{{ selectedPostMeta?.author }}</span>
              <span class="detail-time">{{ selectedPostMeta?.release_time }}</span>
            </div>

            <div class="detail-content" v-html="renderedContent"></div>

            <!-- 评论区 -->
            <div v-if="selectedPost.comments?.length" class="comments-section">
              <h3 class="comments-title">评论 ({{ selectedPost.comments.length }})</h3>
              <div
                v-for="comment in selectedPost.comments"
                :key="comment.comment_id"
                class="comment"
              >
                <div class="comment-header">
                  <span class="comment-author">{{ comment.author }}</span>
                </div>
                <p class="comment-text">{{ comment.text }}</p>

                <!-- 回复 -->
                <div v-if="comment.replies?.length" class="replies">
                  <div
                    v-for="(reply, idx) in comment.replies"
                    :key="idx"
                    class="reply"
                  >
                    <span class="reply-author">{{ reply.author }}:</span>
                    <span class="reply-text">{{ reply.text }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getImageUrl } from '@/utils/imageHelper'
import registryData from '@/data/level4/registry.json'

const emit = defineEmits(['win'])

// 获取背景图片
const bgImageUrl = getImageUrl('images/forum/晓山瑞希背景.webp')
// 获取logo图片
const logoUrl = getImageUrl('images/forum/晓山瑞希发饰.webp')
// 获取置顶图标
const pinIconUrl = getImageUrl('images/icon/置顶pin.svg')

const searchQuery = ref('')
const selectedPostId = ref(null)
const allPosts = ref(registryData)
const selectedPost = ref(null)

// 过滤后的帖子列表
const filteredPosts = computed(() => {
  if (!searchQuery.value.trim()) {
    // 没有搜索词时，显示所有帖子，置顶帖在前
    return [...allPosts.value].sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return 0
    })
  }

  const query = searchQuery.value.toLowerCase().trim()
  return allPosts.value.filter(post => {
    const titleMatch = post.title.toLowerCase().includes(query)
    const tagsMatch = post.tags.some(tag => tag.toLowerCase().includes(query))
    return titleMatch || tagsMatch
  })
})

// 当前选中帖子的元数据
const selectedPostMeta = computed(() => {
  if (!selectedPostId.value) return null
  return allPosts.value.find(p => p.post_id === selectedPostId.value)
})

// 渲染后的内容（处理图片占位符）
const renderedContent = computed(() => {
  if (!selectedPost.value) return ''

  const content = selectedPost.value.content
  return content.replace(/\${(.*?)}/g, (match, filename) => {
    const imgUrl = getImageUrl(`images/forum/${filename}`)
    return `<img src="${imgUrl}" alt="${filename}" class="content-image" />`
  })
})

// 搜索处理
function handleSearch() {
  const query = searchQuery.value.toLowerCase().trim()

  // 检查是否搜索了通关关键词
  if (query === 'dingding10') {
    emit('win')
  }
}

// 打开帖子详情
async function openPost(postId) {
  selectedPostId.value = postId

  try {
    // 动态导入帖子内容
    const contentModule = await import(`@/data/level4/posts/${postId}/content.json`)
    selectedPost.value = contentModule.default
  } catch (error) {
    console.error('Failed to load post content:', error)
    selectedPost.value = null
  }
}

// 关闭帖子详情
function closePost() {
  selectedPostId.value = null
  selectedPost.value = null
}
</script>

<style scoped>
.forum-browser {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #fff 0%, #fff5f6 100%);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  position: relative;
}

.forum-browser::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.85);
  pointer-events: none;
  z-index: 0;
}

.forum-browser > * {
  position: relative;
  z-index: 1;
}

.forum-header {
  background: var(--primary-color);
  padding: 24px 20px;
  border-bottom: 3px solid var(--border-color);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.forum-title {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 16px 0;
  text-align: center;
  color: var(--border-color);
  text-shadow:
    -1px -1px 0 #fff,
    1px -1px 0 #fff,
    -1px 1px 0 #fff,
    1px 1px 0 #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.forum-logo {
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.search-bar {
  display: flex;
  gap: 8px;
  max-width: 600px;
  margin: 0 auto;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #fff;
  font-weight: 500;
}

.search-input:focus {
  box-shadow: 0 0 0 3px rgba(246, 177, 181, 0.3);
}

.search-btn {
  padding: 12px 24px;
  background: var(--border-color);
  color: #fff;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.search-btn:active {
  transform: scale(0.95);
}

.posts-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.no-results {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 16px;
}

.post-card {
  background: #fff;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-card:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.post-card.pinned {
  border: 3px solid var(--primary-color);
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  box-shadow: 0 4px 8px rgba(246, 177, 181, 0.3);
}

.post-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.pin-badge {
  font-size: 12px;
  color: var(--primary-color);
  font-weight: bold;
  background: var(--border-color);
  padding: 2px 8px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pin-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.post-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--border-color);
  margin: 0;
}

.post-meta {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}

.post-author {
  font-weight: 600;
  color: var(--primary-color);
}

.post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-block;
  padding: 4px 10px;
  background: var(--primary-color);
  color: var(--border-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: #fff;
  border: 3px solid var(--border-color);
  border-radius: 8px;
  max-width: 700px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.close-btn {
  position: sticky;
  top: 12px;
  right: 12px;
  float: right;
  width: 36px;
  height: 36px;
  border: 2px solid var(--border-color);
  background: var(--primary-color);
  color: var(--border-color);
  font-size: 24px;
  line-height: 1;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  font-weight: bold;
}

.close-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.close-btn:active {
  transform: scale(0.95);
}

.post-detail {
  padding: 24px;
}

.detail-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--border-color);
  margin: 0 0 12px 0;
  padding-right: 40px;
}

.detail-meta {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--primary-color);
}

.detail-author {
  font-weight: 600;
  color: var(--primary-color);
}

.detail-content {
  font-size: 16px;
  line-height: 1.8;
  color: var(--border-color);
  margin-bottom: 24px;
  white-space: pre-wrap;
}

.detail-content :deep(.content-image) {
  max-width: 100%;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  margin: 16px 0;
  display: block;
}

.comments-section {
  border-top: 3px solid var(--primary-color);
  padding-top: 20px;
}

.comments-title {
  font-size: 18px;
  font-weight: bold;
  color: var(--border-color);
  margin: 0 0 16px 0;
}

.comment {
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  border: 2px solid var(--primary-color);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.comment-header {
  margin-bottom: 6px;
}

.comment-author {
  font-weight: bold;
  color: var(--primary-color);
  font-size: 14px;
}

.comment-text {
  font-size: 14px;
  color: var(--border-color);
  margin: 0;
  line-height: 1.6;
}

.replies {
  margin-top: 8px;
  padding-left: 16px;
  border-left: 3px solid var(--primary-color);
}

.reply {
  padding: 6px 0;
  font-size: 13px;
  color: #555;
}

.reply-author {
  font-weight: 600;
  color: var(--primary-color);
  margin-right: 4px;
}

.reply-text {
  color: #666;
}

/* 动画 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

@media (max-width: 640px) {
  .forum-header {
    padding: 16px;
  }

  .forum-title {
    font-size: 22px;
  }

  .posts-container {
    padding: 12px;
  }

  .post-card {
    padding: 12px;
  }

  .post-title {
    font-size: 16px;
  }

  .modal-content {
    max-height: 90vh;
  }

  .post-detail {
    padding: 16px;
  }

  .detail-title {
    font-size: 20px;
  }
}
</style>
