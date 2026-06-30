import { describe, expect, it, vi } from 'vitest'
import { showWindowForeground } from './foreground'

class FakeWindow {
  minimized = false
  destroyed = false
  restored = 0
  shown = 0
  focused = 0
  alwaysOnTop: Array<{ flag: boolean; level?: string }> = []

  isMinimized(): boolean {
    return this.minimized
  }

  restore(): void {
    this.restored += 1
    this.minimized = false
  }

  show(): void {
    this.shown += 1
  }

  focus(): void {
    this.focused += 1
  }

  setAlwaysOnTop(flag: boolean, level?: string): void {
    this.alwaysOnTop.push({ flag, level })
  }

  isDestroyed(): boolean {
    return this.destroyed
  }
}

describe('showWindowForeground', () => {
  it('强制前台时短暂置顶并释放', () => {
    vi.useFakeTimers()
    const win = new FakeWindow()

    showWindowForeground(win, { forceForeground: true })

    expect(win.shown).toBe(1)
    expect(win.focused).toBe(2)
    expect(win.alwaysOnTop).toEqual([{ flag: true, level: 'screen-saver' }])

    vi.runAllTimers()

    expect(win.alwaysOnTop).toEqual([
      { flag: true, level: 'screen-saver' },
      { flag: false, level: undefined }
    ])
    vi.useRealTimers()
  })

  it('最小化窗口会先恢复再显示', () => {
    const win = new FakeWindow()
    win.minimized = true

    showWindowForeground(win)

    expect(win.restored).toBe(1)
    expect(win.shown).toBe(1)
    expect(win.focused).toBe(1)
  })
})
