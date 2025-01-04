import { resolve } from 'path'
//import { workerData } from 'node:worker_threads'
export const filename = resolve(__filename)

//const { binaryPath } = workerData

interface Inputs {
  a: number
  b: number
}

export function addNumbers({ a, b }: Inputs): number {
  return a + b
}
