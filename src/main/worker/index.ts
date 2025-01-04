import { ipcMain } from 'electron'
import * as os from 'node:os'
import { ResourceLimits } from 'node:worker_threads'

import BackgroundWorker from './background.worker?modulePath'

import Piscina, { TaskQueue } from 'piscina'
import { EnvSpecifier } from 'piscina/dist/types'
import { PiscinaLoadBalancer } from 'piscina/dist/worker_pool/balancer'
import { TransferList } from 'piscina/dist/task_queue'
import { AbortSignalAny } from 'piscina/dist/abort'

// NOTE: This interface is copied from node_modules/piscina
interface Options {
  filename?: string | null
  name?: string
  minThreads?: number
  maxThreads?: number
  idleTimeout?: number
  maxQueue?: number | 'auto'
  concurrentTasksPerWorker?: number
  atomics?: 'sync' | 'async' | 'disabled'
  resourceLimits?: ResourceLimits
  argv?: string[]
  execArgv?: string[]
  env?: EnvSpecifier
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  workerData?: any
  taskQueue?: TaskQueue
  niceIncrement?: number
  trackUnmanagedFds?: boolean
  closeTimeout?: number
  recordTiming?: boolean
  loadBalancer?: PiscinaLoadBalancer
  workerHistogram?: boolean
}

// NOTE: This interface is copied from node_modules/piscina
interface RunOptions {
  transferList?: TransferList
  filename?: string | null
  signal?: AbortSignalAny | null
  name?: string | null
}

interface TaskInfo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any
  options?: RunOptions
}

const defaultOptions: Options = {
  minThreads: os.availableParallelism() <= 2 ? os.availableParallelism() : 2,
  maxThreads: os.availableParallelism() <= 8 ? os.availableParallelism() : 8,
  maxQueue: 'auto'
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
  if (pool) {
    pool.destroy()
    pool = null
  }
  initializeWorkerPool(config)
  return true
})

ipcMain.handle('worker:run', async (_event, taskData) => {
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
