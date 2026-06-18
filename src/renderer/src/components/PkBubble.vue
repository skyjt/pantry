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
const rolling = ref<PkRefView | null>(finalRef.value)
const settled = ref(!(finalRef.value && Date.now() - props.msg.ts < 5000 && !reduceMotion))
// 定格后短暂置真，触发开奖窗一次性的回弹 + 高亮揭晓动画；历史消息与 reduced-motion 不触发
const justSettled = ref(false)
let tickTimer: ReturnType<typeof setInterval> | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null
let revealTimer: ReturnType<typeof setTimeout> | null = null

const currentRef = computed(() => (settled.value ? finalRef.value : rolling.value) ?? finalRef.value)
const game = computed(() => finalRef.value?.game ?? 'dice')
const label = computed(() => pkLabel(game.value))
const chipIcon = computed(() => (game.value === 'dice' ? 'pk-dice' : 'pk-rps'))
const actionText = computed(() => (game.value === 'dice' ? '掷一下' : '我也来'))
const resultText = computed(() => (currentRef.value ? pkResultText(currentRef.value) : props.msg.text))
const rpsSrc = computed(() => {
  const result = currentRef.value?.result
  if (game.value !== 'rps' || typeof result !== 'string') return ''
  const emoji: Record<PkRpsResult, string> = { rock: '✊', paper: '✋', scissors: '✌️' }
  return twemojiUrl(emojiToTwemojiCode(emoji[result as PkRpsResult]))
})
const diceValue = computed(() => {
  const result = currentRef.value?.result
  return typeof result === 'number' ? result : 1
})
const diceDots = computed(() => {
  const map: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  }
  return new Set(map[diceValue.value] ?? map[1])
})

onMounted(() => {
  const ref = finalRef.value
  if (!ref || settled.value) return
  tickTimer = setInterval(() => {
    rolling.value = randomRef(ref.game)
  }, 90)
  settleTimer = setTimeout(() => {
    settled.value = true
    justSettled.value = true
    if (tickTimer) clearInterval(tickTimer)
    tickTimer = null
    revealTimer = setTimeout(() => (justSettled.value = false), 620)
  }, 1500)
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
  if (settleTimer) clearTimeout(settleTimer)
  if (revealTimer) clearTimeout(revealTimer)
})

function randomRef(nextGame: PkGame): PkRefView {
  if (nextGame === 'dice') return { game: 'dice', result: 1 + Math.floor(Math.random() * 6) }
  return { game: 'rps', result: ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)] as PkRpsResult }
}
</script>

<template>
  <div class="pk-bubble" :class="{ mine }">
    <span class="pk-chip">
      <PantryIcon :name="chipIcon" :size="14" />
      <span>{{ label }}</span>
    </span>
    <div class="pk-stage" :class="{ rolling: !settled, reveal: justSettled }">
      <div v-if="game === 'dice'" class="dice-face" :aria-label="`${diceValue} 点`">
        <span v-for="index in 9" :key="index" class="dice-cell">
          <span v-if="diceDots.has(index - 1)" class="dice-dot"></span>
        </span>
      </div>
      <img v-else-if="rpsSrc" class="rps-hand" :src="rpsSrc" alt="" draggable="false" />
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
/* 统一开奖窗：骰面点阵与猜拳手势共用这一个中性凹陷窗，靠茶青描边统一 */
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
.dice-face {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 11px;
}
.dice-cell {
  display: grid;
  place-items: center;
}
.dice-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-1);
}
.rps-hand {
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
@keyframes pk-roll {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}
@keyframes pk-reveal {
  0% {
    transform: scale(1.12);
  }
  62% {
    transform: scale(0.97);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes pk-flash {
  0% {
    opacity: 0;
  }
  28% {
    opacity: 0.62;
  }
  100% {
    opacity: 0;
  }
}
@media (prefers-reduced-motion: no-preference) {
  .pk-stage.rolling {
    animation: pk-roll 360ms ease-in-out infinite;
  }
  .pk-stage.reveal {
    animation: pk-reveal 480ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .pk-stage.reveal::after {
    animation: pk-flash 480ms ease-out;
  }
}
</style>
