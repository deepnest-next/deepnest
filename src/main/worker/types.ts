import { PointFloat64 } from '@deepnest/clipper2'
import { ResourceLimits } from 'node:worker_threads'
import { TaskQueue } from 'piscina'
import { EnvSpecifier } from 'piscina/dist/types'
import { PiscinaLoadBalancer } from 'piscina/dist/worker_pool/balancer'
import { TransferList } from 'piscina/dist/task_queue'
import { AbortSignalAny } from 'piscina/dist/abort'
// NOTE: This interface is copied from node_modules/piscina
export interface Options {
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
export interface RunOptions {
  transferList?: TransferList
  filename?: string | null
  signal?: AbortSignalAny | null
  name?: string | null
}

export interface TaskInfo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any
  options?: RunOptions
}

export interface Pair {
  A: Array<PointFloat64> | null
  B: Array<PointFloat64> | null
  Arotation: number
  Brotation: number
  nfp: number
}
