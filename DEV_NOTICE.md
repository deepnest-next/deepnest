# Developer Notices

## Worker implementation

To implement a worker, you need to add the Worker from `piscina` as worker in the main folder.
Then you can create other Wokers, like `src/main/worker/background.worker.ts` which need also to be exported, via the `electron.vite.config.ts`

```
//...
main: {
  //...
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/main/index.ts'),
        'background.woker': resolve(__dirname, 'src/main/worker/background.worker.ts'),
        worker: resolve(__dirname, 'node_modules/piscina/src/worker.ts')
      }
    }
  }
}
//...
```
