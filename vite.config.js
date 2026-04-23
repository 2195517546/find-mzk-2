import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5174,
    host: '0.0.0.0', // 允许外部访问（内网穿透需要）
    allowedHosts: [
      'frp.faceround.cn',
      '.faceround.cn' // 允许所有 faceround.cn 的子域名
    ],
    hmr: {
      protocol: 'ws',
      host: 'localhost', // 本地开发使用 localhost
      clientPort: 5174
    }
  },
  // 图片资源配置说明：
  // 开发环境：VITE_IMAGE_BASE_URL=/assets (使用本地 public/assets 目录)
  // 生产环境：VITE_IMAGE_BASE_URL=https://faceround.cn/games/find-mzk-2 (使用CDN)
  // 使用方式：import { getImageUrl } from '@/utils/imageHelper'
  //          const imgUrl = getImageUrl('images/大眼mzk.png')
})
