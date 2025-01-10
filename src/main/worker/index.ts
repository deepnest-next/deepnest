import { ipcMain } from 'electron'
import * as os from 'node:os'

import Piscina from 'piscina'
import { Options, TaskInfo } from './types'

import BackgroundWorker from './background.worker.ts?modulePath'

const defaultOptions: Options = {
  minThreads: os.availableParallelism() <= 2 ? os.availableParallelism() : 2,
  maxThreads: os.availableParallelism() <= 8 ? os.availableParallelism() : 8,
  maxQueue: 100000
}
const fixedOptions: Options = {
  filename: BackgroundWorker
}

let pool: Piscina | null = null

pool = initializeWorkerPool({
  ...defaultOptions,
  ...fixedOptions
})

function initializeWorkerPool(config: Options): Piscina {
  if (pool !== null) {
    throw new Error('Worker pool already initialized')
  }
  pool = new Piscina({
    ...defaultOptions,
    ...config,
    ...fixedOptions
  })
  return pool
}

ipcMain.handle('worker:initialize', async (_event, config: Options): Promise<boolean> => {
  //console.log('Worker pool initialized with config:', config)
  if (pool) {
    pool.destroy()
    pool = null
  }
  initializeWorkerPool(config)
  return true
})

ipcMain.handle('worker:run', async (_event, taskData) => {
  //console.log('Worker task received:', taskData)
  if (!pool) {
    throw new Error('Worker pool not initialized')
  }
  const taskInfo: TaskInfo = JSON.parse(taskData)
  const { task, options } = taskInfo
  return pool.run(task, options)
})

// NOTE: This is a test code snippet
;(async (): Promise<void> => {
  const result = await pool.run({ a: 2, b: 3 }, { name: 'addNumbers' })
  console.log('Result:', result)
})()
