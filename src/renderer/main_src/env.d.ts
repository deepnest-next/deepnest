/// <reference types="vite/client" />
import type { DeepNestConfig, NestingResult, SheetPlacement } from '../index'

interface Config {
  resetToDefaultsSync: () => void
  saveSync: (k, v) => void
  getSync: (k?) => string | number | boolean | null | undefined | DeepNestConfig
}

interface DeepNest {
  config: () => DeepNestConfig
  nests: NestingResult
}

declare global {
  interface Window {
    DeepNest: DeepNest
    config: Config
  }
}

export { Config, DeepNest, type SheetPlacement, type NestingResult, type DeepNestConfig }
