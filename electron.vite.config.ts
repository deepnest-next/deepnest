import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin, swcPlugin } from 'electron-vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared/src')
      }
    },
    plugins: [
      externalizeDepsPlugin({
        include: ['@deepnest/clipper2', 'piscina']
      }),
      swcPlugin()
    ],
    build: {
      rollupOptions: {
        external: ['@deepnest/clipper2', 'piscina'],
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
          'background.woker': resolve(__dirname, 'src/main/worker/index.ts')
          //worker: resolve(__dirname, 'node_modules/piscina/src/worker.ts')
        }
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared/src')
      }
    },
    plugins: [externalizeDepsPlugin()],
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
        input: {
          index: resolve(__dirname, 'src/renderer/index.html'),
          backend: resolve(__dirname, 'src/renderer/backend.html')
        }
      }
    }
  }
})
