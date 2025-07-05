import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// Pythonスクリプトを実行してIPアドレスを取得
const getIPAddress = () => {
  try {
    const ip = execSync('python3 backend/util/get_ip.py').toString().trim()
    return ip
  } catch (error) {
    console.error('IPアドレスの取得に失敗しました:', error)
    return '127.0.0.1' // デフォルト値
  }
}

const ipAddress = getIPAddress()

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 5173,
    },
    allowedHosts: [
      'eagle',
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
    ],
    proxy: {
      '/eagle': {
        target: `http://${ipAddress}:8000/`, // 動的に取得したIPアドレスを使用
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/eagle/, ''),
      }
    }
  },
})