import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { execSync } from 'node:child_process'

function safeExec(command: string, fallback = 'unknown') {
  try {
    return execSync(command, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback
  } catch {
    return fallback
  }
}

const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? safeExec('git rev-parse --short HEAD')
const buildTime = new Date().toISOString()
const deployTarget = process.env.VERCEL === '1' ? 'vercel' : 'local'
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    __BUILD_INFO__: JSON.stringify({
      commitSha,
      buildTime,
      deployTarget,
      vercelUrl,
    }),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
  },
})
