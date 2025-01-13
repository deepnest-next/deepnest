import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import path from 'node:path'
import url from 'node:url'
import cacheDB from './shared/cache'
import fs from 'graceful-fs'
import {
  minkowskiSumF64,
  minkowskiSumI64,
  Clipper,
  PolyType,
  ClipType,
  FillType,
  ClipperFloat64,
  Point,
  PointFloat64
} from '@deepnest/clipper2'

import clipperV1 from '@doodle3d/clipper-lib'
// Custom APIs for renderer
const backend_api = {
  calculateNFP: require('@deepnest/calculate-nfp').calculateNFP,
  path: path,
  url: url,
  fs: fs,
  db: cacheDB,
  ClipperLib: clipperV1,
  clipperV2: {
    PolyType: PolyType,
    ClipType: ClipType,
    FillType: FillType,
    Clipper: Clipper,
    ClipperFloat64: ClipperFloat64,
    minkowskiSumFloat: (
      a: Array<PointFloat64>,
      b: Array<PointFloat64>,
      closed: boolean,
      precision: number = Math.pow(10, -8)
    ): Array<Array<PointFloat64>> => minkowskiSumF64(a, b, closed, precision),
    minkowskiSumInt: (a: Array<Point>, b: Array<Point>, closed: boolean): Array<Array<Point>> =>
      minkowskiSumI64(a, b, closed)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('backend_api', backend_api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.backend_api = backend_api
}
