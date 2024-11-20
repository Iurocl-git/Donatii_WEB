import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import fs from 'fs';


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:443',
        secure: false, // Отключение проверки сертификата в разработке
        changeOrigin: true
      }
    },
    https: {
      key: fs.readFileSync('./tls/server.key'),
      cert: fs.readFileSync('./tls/server.cert'),
    },
    port: 8080
  },
})
