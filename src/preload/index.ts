import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

import * as fs from 'graceful-fs'
import * as path from 'path'
import remote from '@electron/remote'
import * as svgPreProcessor from '@deepnest/svg-preprocessor'
import { GeometryUtil } from '@deepnest/geometryutil'
import axios from 'axios'
import FormData from 'form-data'
import clipper from '@doodle3d/clipper-lib/_clipper.js'

// Custom APIs for renderer
const api = {
  fs,
  path,
  remote,
  svgPreProcessor,
  axios,
  FormData,
  GeometryUtil,
  ClipperLib: clipper
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
