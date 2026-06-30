import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import type { MessageView } from '../../../shared/ipc'
import { useChatStore } from './chat'

function msg(id: string, convId = 'single:node-bob'): MessageView {
  return {
    id,
    convId,
    senderId: 'node-self',
    isMine: true,
    kind: 'image',
    text: '[图片]',
    ts: Date.now(),
    seq: 1,
    status: 'sending'
  }
}

describe('chat store 自己发送后的滚动意图', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('当前会话追加自己发送的媒体消息后请求定位到最新', () => {
    const store = useChatStore()
    store.activeConvId = 'single:node-bob'
    store.viewingHistory = true
    store.messages['single:node-bob'] = []

    expect(store.pushOwn(msg('img-1'))).toBe(true)

    expect(store.messages['single:node-bob'].map((item) => item.id)).toEqual(['img-1'])
    expect(store.viewingHistory).toBe(false)
    expect(store.openScrollMode).toBe('latest')
    expect(store.openScrollRun).toBe(1)
  })

  it('非当前会话的自己消息不抢当前滚动位置', () => {
    const store = useChatStore()
    store.activeConvId = 'single:node-alice'
    store.messages['single:node-bob'] = []

    expect(store.pushOwn(msg('img-2'))).toBe(true)

    expect(store.openScrollRun).toBe(0)
  })
})
