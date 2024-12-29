import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import path from 'node:path'
import url from 'node:url'
import cacheDB from './shared/cache'
import fs from 'graceful-fs'

// Custom APIs for renderer
const backend_api = {
  calculateNFP: require('@deepnest/calculate-nfp').calculateNFP,
  path: path,
  url: url,
  fs: fs,
  db: cacheDB
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
