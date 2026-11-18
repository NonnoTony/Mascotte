export type Scene = {
  action: string
  say: string
  x0: number
  x1: number
  ms: number
  seq: number
}

declare module 'claude-code' {
  interface PluginState {
    'clawd-mascotte': { scene: Shaped<Scene> }
  }
}
