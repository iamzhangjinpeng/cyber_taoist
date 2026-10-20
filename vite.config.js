import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 相对路径，兼容 https://<user>.github.io/<repo>/ 子路径与自定义域名
  base: './',
})
