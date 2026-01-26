/**
 * Worker Manager - Parallel.js setup for NFP calculation workers
 */

import { process, type NFPPair } from "./nfp-worker-process.js";

declare const Parallel: any;
declare const ipcRenderer: { send: (channel: string, data: any) => void };

export interface WorkerManagerOptions {
  nestindex: number;
  onProgress?: (progress: number) => void;
}

export interface ParallelInstance {
  map: (fn: typeof process) => {
    then: (cb: (processed: NFPPair[]) => void) => void;
  };
  require: (path: string) => void;
  _spawnMapWorker: (i: number, cb: any, done: any, env: any, wrk: any) => any;
}

/**
 * Creates and configures a Parallel.js instance for NFP calculation
 */
export function createNfpWorker(
  pairs: NFPPair[],
  options: WorkerManagerOptions,
): ParallelInstance {
  const { nestindex, onProgress } = options;

  const p = new Parallel(pairs, {
    evalPath: "../build/util/eval.js",
    synchronous: false,
  }) as ParallelInstance;

  let spawncount = 0;

  // 0.5 weight allocates first half of progress bar to NFP calculation phase,
  // second half to placement phase
  p._spawnMapWorker = function (
    i: number,
    cb: any,
    done: any,
    env: any,
    wrk: any,
  ) {
    const progress = 0.5 * (spawncount++ / pairs.length);

    ipcRenderer.send("background-progress", { index: nestindex, progress });

    if (onProgress) {
      onProgress(progress);
    }

    return Parallel.prototype._spawnMapWorker.call(p, i, cb, done, env, wrk);
  };

  p.require("../../main/util/clipper.js");
  p.require("../../main/util/geometryutil.js");

  return p;
}

export { process, type NFPPair };
