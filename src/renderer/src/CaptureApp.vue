<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// 截图框选窗（F-CAP-1）：屏幕图像做背景 → 拖拽框选 → 发送/复制/取消。
// Esc 取消，Enter=发送。坐标按 scaleFactor 还原到物理像素裁剪。

const dataUrl = ref('')
const scale = ref(1)
const dragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const rect = ref<{ x: number; y: number; w: number; h: number } | null>(null)

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = window.pantry.onCaptureInit((url, factor) => {
    dataUrl.value = url
    scale.value = factor
  })
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  unsubscribe?.()
  window.removeEventListener('keydown', onKey)
})

function onKey(event: KeyboardEvent): void {
  if (event.key === 'Escape') void window.pantry.captureDone(new ArrayBuffer(0), false)
  if (event.key === 'Enter' && rect.value) void confirm(true)
}

function onMouseDown(event: MouseEvent): void {
  dragging.value = true
  startX.value = event.clientX
  startY.value = event.clientY
  rect.value = { x: event.clientX, y: event.clientY, w: 0, h: 0 }
}

function onMouseMove(event: MouseEvent): void {
  if (!dragging.value) return
  rect.value = {
    x: Math.min(startX.value, event.clientX),
    y: Math.min(startY.value, event.clientY),
    w: Math.abs(event.clientX - startX.value),
    h: Math.abs(event.clientY - startY.value)
  }
}

function onMouseUp(): void {
  dragging.value = false
  if (rect.value && (rect.value.w < 4 || rect.value.h < 4)) rect.value = null
}

function cancel(): void {
  void window.pantry.captureDone(new ArrayBuffer(0), false)
}

async function confirm(send: boolean): Promise<void> {
  const r = rect.value
  if (!r || !dataUrl.value) return
  const img = new Image()
  img.src = dataUrl.value
  await img.decode()
  const k = scale.value
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(r.w * k)
  canvas.height = Math.round(r.h * k)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.drawImage(
    img,
    Math.round(r.x * k),
    Math.round(r.y * k),
    canvas.width,
    canvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  )
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) return
  await window.pantry.captureDone(await blob.arrayBuffer(), send)
}
</script>

<template>
  <div
    class="stage"
    :style="{ backgroundImage: `url(${dataUrl})` }"
    @mousedown="onMouseDown"
    @mousemove="onMouseMove"
    @mouseup="onMouseUp"
  >
    <div class="dim"></div>
    <template v-if="rect">
      <div
        class="sel"
        :style="{
          left: `${rect.x}px`,
          top: `${rect.y}px`,
          width: `${rect.w}px`,
          height: `${rect.h}px`,
          backgroundImage: `url(${dataUrl})`,
          backgroundPosition: `-${rect.x}px -${rect.y}px`
        }"
      ></div>
      <div
        v-if="!dragging"
        class="bar"
        :style="{
          left: `${Math.min(rect.x + rect.w - 200, rect.x)}px`,
          top: `${rect.y + rect.h + 8}px`
        }"
        @mousedown.stop
      >
        <span class="size">{{ Math.round(rect.w) }} × {{ Math.round(rect.h) }}</span>
        <button class="btn primary" @click="confirm(true)">发送</button>
        <button class="btn" @click="confirm(false)">复制</button>
        <button class="btn" @click="cancel">取消</button>
      </div>
    </template>
    <div v-else class="hint">拖拽框选区域 · Esc 取消</div>
  </div>
</template>

<style scoped>
.stage {
  position: fixed;
  inset: 0;
  background-size: 100% 100%;
  cursor: crosshair;
  user-select: none;
  overflow: hidden;
}
.dim {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  pointer-events: none;
}
.sel {
  position: absolute;
  border: 2px solid #3d8b6b;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4);
  background-size: 100vw 100vh;
  background-repeat: no-repeat;
  pointer-events: none;
}
.bar {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(28, 28, 28, 0.92);
  border-radius: 6px;
  padding: 6px 10px;
}
.size {
  color: #bbb;
  font-size: 12px;
  margin-right: 4px;
}
.btn {
  border: none;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.14);
  color: #eee;
  font-size: 12px;
  padding: 5px 12px;
  cursor: pointer;
}
.btn.primary {
  background: #3d8b6b;
  color: #fff;
}
.hint {
  position: absolute;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.85);
  background: rgba(0, 0, 0, 0.5);
  font-size: 13px;
  padding: 6px 14px;
  border-radius: 14px;
  pointer-events: none;
}
</style>
