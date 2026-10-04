import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import type { ProxyOptions } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables from workspace root .env
  const envDir = path.resolve(import.meta.dirname, '../../')
  const env = loadEnv(mode, envDir, '')
  const backendTarget = env.VITE_API_BASE_URL || env.VITE_BACKEND_URL

  const proxyConfig: Record<string, ProxyOptions> = backendTarget
    ? {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/v3/api-docs': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/swagger-ui': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/actuator': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
      }
    : {}

  return {
    envDir,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    server: {
      port: 5173,
      proxy: proxyConfig,
    },
  }
})
