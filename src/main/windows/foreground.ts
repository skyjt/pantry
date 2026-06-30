import type { BrowserWindow } from 'electron'

type ForegroundWindow = Pick<
  BrowserWindow,
  'focus' | 'isDestroyed' | 'isMinimized' | 'restore' | 'setAlwaysOnTop' | 'show'
>

export interface ShowWindowForegroundOptions {
  forceForeground?: boolean
  releaseMs?: number
}

export function showWindowForeground(
  win: ForegroundWindow,
  options: ShowWindowForegroundOptions = {}
): void {
  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
  if (!options.forceForeground) return

  try {
    win.setAlwaysOnTop(true, 'screen-saver')
    win.focus()
    const timer = setTimeout(() => {
      if (!win.isDestroyed()) win.setAlwaysOnTop(false)
    }, options.releaseMs ?? 180)
    timer.unref?.()
  } catch {
    // 某些窗口管理器可能拒绝前台提升；show/focus 已经完成，失败不影响主流程。
  }
}
