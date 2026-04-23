<template>
  <footer class="footer">
    <div class="footer-content">
      <a href="https://space.bilibili.com/3493077794687210" target="_blank" class="author-link">
        by 尤珞理希
      </a>
      <span class="separator">|</span>
      <div class="beian-info">
        <a href="https://beian.mps.gov.cn/#/query/webSearch?code=35082302000267" target="_blank" class="beian-link">
          <img :src="beianIconUrl" alt="公安备案" class="beian-icon">
          闽公网安备35082302000267号
        </a>
        <span class="separator">|</span>
        <a href="https://beian.miit.gov.cn/" target="_blank" class="beian-link">
          闽ICP备2025113173号-1
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { getImageUrl } from '@/utils/imageHelper'

// 获取公安备案图片
const beianIconUrl = getImageUrl('images/公安.webp')
</script>

<style scoped>
.footer {
  width: 100%;
  padding: 20px;
  background-color: var(--bg-color);
  border-top: 2px solid var(--border-color);
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 14px;
  color: var(--text-color);
}

.author-link,
.beian-link {
  color: var(--text-color);
  text-decoration: none;
  transition: color 0.3s ease;
}

.author-link:hover,
.beian-link:hover {
  color: var(--primary-color);
}

.separator {
  color: #ccc;
  margin: 0 4px;
}

.beian-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.beian-icon {
  width: 16px;
  height: 16px;
  vertical-align: middle;
  margin-right: 4px;
}

@media (max-width: 768px) {
  .footer {
    padding: 16px;
  }

  .footer-content {
    font-size: 12px;
    flex-direction: column;
    gap: 4px;
  }

  .separator {
    display: none;
  }

  .beian-info {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
