import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, bytecodePlugin } from 'electron-vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin(), bytecodePlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts'),
          backend: resolve(__dirname, 'src/preload/backend.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [solid()],
    build: {
      rollupOptions: {
        output: {
          format: 'cjs'
        },
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          backend: resolve(__dirname, 'src/renderer/backend.html')
        }
      }
    }
  }
})
