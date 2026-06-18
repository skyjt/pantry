<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { MessageView, PkRefView } from '../../../shared/ipc'
import { pkLabel, pkResultText, type PkGame, type PkRpsResult } from '../../../shared/pk'
import { emojiToTwemojiCode, twemojiUrl } from '../utils/twemoji-assets'
import PantryIcon from './PantryIcon.vue'

const props = defineProps<{
  msg: MessageView
  mine: boolean
  showAction: boolean
  actionDisabled: boolean
  disabledReason: string
}>()

const emit = defineEmits<{ participate: [game: PkGame] }>()

const finalRef = computed(() => props.msg.pkRef ?? null)
const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const game = computed(() => finalRef.value?.game ?? 'dice')
const label = computed(() => pkLabel(game.value))
const chipIcon = computed(() => (game.value === 'dice' ? 'pk-dice' : 'pk-rps'))
const actionText = computed(() => (game.value === 'dice' ? '掷一下' : '我也来'))

// 仅刚收发的 PK（5s 内）且未要求减弱动画时才播放揭晓动画；历史消息直接定格
const animatable = finalRef.value != null && Date.now() - props.msg.ts < 5000 && !reduceMotion
const settled = ref(!animatable)
const justSettled = ref(false)
// 3D 定格 transition 开关：骰子立方体与猜拳翻牌共用，落定时启用弹性过渡
const spinSettling = ref(false)

// 猜拳：本地轮播三枚手势；3D 翻牌正反双面同显当前手势，定格停在结果正面
const rolling = ref<PkRefView | null>(finalRef.value)
const rpsResult = computed(() => {
  const cur = settled.value ? finalRef.value : rolling.value
  return typeof cur?.result === 'string' ? (cur.result as PkRpsResult) : null
})
const rpsSrc = computed(() => {
  if (game.value !== 'rps' || !rpsResult.value) return ''
  const emoji: Record<PkRpsResult, string> = { rock: '✊', paper: '✋', scissors: '✌️' }
  return twemojiUrl(emojiToTwemojiCode(emoji[rpsResult.value]))
})
const rpsRotY = ref(0)
const cardStyle = computed(() => ({
  transform: `rotateY(${rpsRotY.value}deg)`,
  transition: spinSettling.value ? 'transform 0.66s cubic-bezier(0.2, 0.85, 0.3, 1.1)' : 'none'
}))

// 骰子：CSS 3D 立方体，6 面真实点数；投掷时翻滚，定格时转到结果面朝前
const diceValue = computed(() => (typeof finalRef.value?.result === 'number' ? finalRef.value.result : 1))
// 每个点数面朝前（且点阵正立）时立方体应处的 [rotateX, rotateY]
const FACE_ANGLE: Record<number, [number, number]> = {
  1: [0, 0],
  2: [-90, 0],
  3: [0, -90],
  4: [0, 90],
  5: [90, 0],
  6: [0, 180]
}
// 6 个面各自的点阵（九宫格落点，与 2D 骰面一致）
const FACE_DOTS: Record<number, Set<number>> = {
  1: new Set([4]),
  2: new Set([0, 8]),
  3: new Set([0, 4, 8]),
  4: new Set([0, 2, 6, 8]),
  5: new Set([0, 2, 4, 6, 8]),
  6: new Set([0, 2, 3, 5, 6, 8])
}
const initAngle = !animatable && game.value === 'dice' ? FACE_ANGLE[diceValue.value] : [0, 0]
const rotX = ref(initAngle[0])
const rotY = ref(initAngle[1])
const cubeStyle = computed(() => ({
  transform: `rotateX(${rotX.value}deg) rotateY(${rotY.value}deg)`,
  transition: spinSettling.value ? 'transform 0.74s cubic-bezier(0.2, 0.85, 0.3, 1.12)' : 'none'
}))

const resultText = computed(() => {
  if (!finalRef.value) return props.msg.text
  if (settled.value) return pkResultText(finalRef.value)
  if (game.value === 'dice') return '投掷中…'
  return pkResultText(rolling.value ?? finalRef.value)
})

let tickTimer: ReturnType<typeof setInterval> | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null
let revealTimer: ReturnType<typeof setTimeout> | null = null
let rafId: number | null = null

onMounted(() => {
  if (!animatable) return
  if (game.value === 'dice') {
    const step = (): void => {
      rotX.value += 9
      rotY.value += 13
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    settleTimer = setTimeout(() => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = null
      const [bx, by] = FACE_ANGLE[diceValue.value]
      // 在当前累计角度基础上再多转两圈后落到结果面，保证始终正向减速到位
      spinSettling.value = true
      rotX.value = bx + 360 * (Math.round(rotX.value / 360) + 2)
      rotY.value = by + 360 * (Math.round(rotY.value / 360) + 2)
      settled.value = true
      justSettled.value = true
      revealTimer = setTimeout(() => (justSettled.value = false), 760)
    }, 1500)
  } else {
    const step = (): void => {
      rpsRotY.value += 13
      rafId = requestAnimationFrame(step)
    }
    rafId = requestAnimationFrame(step)
    tickTimer = setInterval(() => {
      rolling.value = {
        game: 'rps',
        result: ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)] as PkRpsResult
      }
    }, 90)
    settleTimer = setTimeout(() => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      rafId = null
      if (tickTimer) clearInterval(tickTimer)
      tickTimer = null
      // 落到最近一整圈，让结果手势停在正面朝前
      spinSettling.value = true
      rpsRotY.value = 360 * (Math.round(rpsRotY.value / 360) + 1)
      settled.value = true
      justSettled.value = true
      revealTimer = setTimeout(() => (justSettled.value = false), 700)
    }, 1500)
  }
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
  if (settleTimer) clearTimeout(settleTimer)
  if (revealTimer) clearTimeout(revealTimer)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <div class="pk-bubble" :class="{ mine }">
    <span class="pk-chip">
      <PantryIcon :name="chipIcon" :size="14" />
      <span>{{ label }}</span>
    </span>
    <div class="pk-stage" :class="{ reveal: justSettled }">
      <div v-if="game === 'dice'" class="dice-cube" :style="cubeStyle" :aria-label="`${diceValue} 点`">
        <div v-for="face in 6" :key="face" class="dice-side" :class="'s' + face">
          <span v-for="cell in 9" :key="cell" class="dice-cell">
            <span v-if="FACE_DOTS[face].has(cell - 1)" class="dice-dot"></span>
          </span>
        </div>
      </div>
      <div v-else-if="rpsSrc" class="rps-card" :style="cardStyle">
        <span class="rps-face rps-front"><img :src="rpsSrc" alt="" draggable="false" /></span>
        <span class="rps-face rps-back"><img :src="rpsSrc" alt="" draggable="false" /></span>
      </div>
    </div>
    <div class="pk-result">{{ resultText }}</div>
    <button
      v-if="showAction"
      class="pk-join"
      type="button"
      :disabled="actionDisabled"
      :title="actionDisabled ? disabledReason : actionText"
      @click="emit('participate', game)"
    >
      {{ actionText }}
    </button>
  </div>
</template>

<style scoped>
/* 茶青描边的明暗两套取值用局部变量承载——Chrome 108 不支持 color-mix，只能预置 rgba */
.pk-bubble {
  --pk-edge: rgba(61, 139, 107, 0.22);
  box-sizing: border-box;
  width: 156px;
  padding: 9px 10px;
  border-radius: 8px;
  background: var(--bubble-peer);
  border: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 7px;
  overflow: hidden;
}
html[data-theme='dark'] .pk-bubble {
  --pk-edge: rgba(91, 191, 145, 0.32);
}
.pk-bubble.mine {
  background: var(--bubble-mine);
}
.pk-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px 2px 7px;
  border-radius: 999px;
  background: var(--primary-weak);
  border: 1px solid var(--pk-edge);
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}
.pk-chip .pantry-icon {
  color: var(--primary);
}
/* 统一开奖窗：骰子 3D 立方体与猜拳 3D 翻牌共用这一个中性凹陷窗，靠茶青描边统一 */
.pk-stage {
  position: relative;
  width: 62px;
  height: 62px;
  border-radius: 8px;
  background: var(--bg-chat);
  border: 1px solid var(--pk-edge);
  display: grid;
  place-items: center;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.06);
  perspective: 300px;
}
/* 定格瞬间一闪的茶青高亮层，opacity 驱动，不触发布局 */
.pk-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: inset 0 0 0 1.5px var(--primary), 0 0 7px rgba(61, 139, 107, 0.45);
  opacity: 0;
  pointer-events: none;
}
/* 3D 骰子立方体：6 面各 translateZ(20px) 撑成 40px 见方的盒子 */
.dice-cube {
  position: relative;
  width: 40px;
  height: 40px;
  transform-style: preserve-3d;
}
.dice-side {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 6px;
  background: var(--bg-window);
  border: 1px solid var(--pk-edge);
  border-radius: 7px;
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.07);
  backface-visibility: hidden;
}
.s1 {
  transform: rotateY(0deg) translateZ(20px);
}
.s2 {
  transform: rotateX(90deg) translateZ(20px);
}
.s3 {
  transform: rotateY(90deg) translateZ(20px);
}
.s4 {
  transform: rotateY(-90deg) translateZ(20px);
}
.s5 {
  transform: rotateX(-90deg) translateZ(20px);
}
.s6 {
  transform: rotateY(180deg) translateZ(20px);
}
.dice-cell {
  display: grid;
  place-items: center;
}
.dice-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-1);
}
/* 3D 猜拳翻牌：正反双面同显当前手势，绕 Y 轴翻转，定格停在结果手势正面 */
.rps-card {
  position: relative;
  width: 40px;
  height: 40px;
  transform-style: preserve-3d;
}
.rps-face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  backface-visibility: hidden;
}
.rps-back {
  transform: rotateY(180deg);
}
.rps-face img {
  width: 38px;
  height: 38px;
  display: block;
}
.pk-result {
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
  text-align: center;
}
/* 参与按钮融入气泡底部一体行：负 margin 撑满气泡内宽，底角由气泡 overflow 裁圆 */
.pk-join {
  width: calc(100% + 20px);
  margin: 1px -10px -9px;
  padding: 8px 10px;
  border: none;
  border-top: 1px solid var(--line);
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 140ms ease;
}
.pk-join:hover:not(:disabled) {
  background: var(--primary-weak);
}
.pk-join:active:not(:disabled) {
  background: rgba(61, 139, 107, 0.16);
}
.pk-join:focus-visible {
  outline: 2px solid rgba(61, 139, 107, 0.35);
  outline-offset: -2px;
}
.pk-join:disabled {
  color: var(--text-3);
  cursor: default;
}
@keyframes pk-flash {
  0% {
    opacity: 0;
  }
  28% {
    opacity: 0.55;
  }
  100% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .pk-stage.reveal::after {
    animation: pk-flash 440ms ease-out;
  }
}
</style>
