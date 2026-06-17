<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { MessageView, PkRefView } from '../../../shared/ipc'
import { pkResultText, pkTitle, type PkGame, type PkRpsResult } from '../../../shared/pk'
import { emojiToTwemojiCode, twemojiUrl } from '../utils/twemoji-assets'

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
let tickTimer: ReturnType<typeof setInterval> | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null

const currentRef = computed(() => (settled.value ? finalRef.value : rolling.value) ?? finalRef.value)
const game = computed(() => finalRef.value?.game ?? 'dice')
const actionText = computed(() => (game.value === 'dice' ? '掷一下' : '我也来'))
const resultText = computed(() => (currentRef.value ? pkResultText(currentRef.value) : props.msg.text))
const title = computed(() => pkTitle(game.value))
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
    if (tickTimer) clearInterval(tickTimer)
    tickTimer = null
  }, 1500)
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
  if (settleTimer) clearTimeout(settleTimer)
})

function randomRef(nextGame: PkGame): PkRefView {
  if (nextGame === 'dice') return { game: 'dice', result: 1 + Math.floor(Math.random() * 6) }
  return { game: 'rps', result: ['rock', 'paper', 'scissors'][Math.floor(Math.random() * 3)] as PkRpsResult }
}
</script>

<template>
  <span class="pk-wrap">
    <div class="pk-bubble" :class="{ mine }">
      <div class="pk-title">{{ title }}</div>
      <div class="pk-stage" :class="{ rolling: !settled }">
        <div v-if="game === 'dice'" class="dice-face" :aria-label="`${diceValue} 点`">
          <span v-for="index in 9" :key="index" class="dice-cell">
            <span v-if="diceDots.has(index - 1)" class="dice-dot"></span>
          </span>
        </div>
        <img v-else-if="rpsSrc" class="rps-hand" :src="rpsSrc" alt="" draggable="false" />
      </div>
      <div class="pk-result">{{ resultText }}</div>
    </div>
    <button
      v-if="showAction"
      class="pk-action"
      type="button"
      :disabled="actionDisabled"
      :title="actionDisabled ? disabledReason : actionText"
      @click="emit('participate', game)"
    >
      {{ actionText }}
    </button>
  </span>
</template>

<style scoped>
.pk-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.pk-bubble {
  width: 196px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--bubble-peer);
  border-left: 3px solid var(--primary);
}
.pk-bubble.mine {
  background: var(--bubble-mine);
}
.pk-title {
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 8px;
}
.pk-stage {
  height: 70px;
  display: grid;
  place-items: center;
}
.pk-stage.rolling {
  animation: pk-pop 160ms ease-in-out infinite alternate;
}
.dice-face {
  width: 58px;
  height: 58px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  padding: 8px;
  border: 1.5px solid var(--text-2);
  border-radius: 8px;
  background: var(--bg-window);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.5);
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
  width: 58px;
  height: 58px;
  display: block;
}
.pk-result {
  color: var(--text-1);
  font-size: 14px;
  text-align: center;
}
.pk-action {
  flex: 0 0 auto;
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--bg-window);
  color: var(--primary);
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}
.pk-action:disabled {
  color: var(--text-3);
  cursor: default;
  opacity: 0.55;
}
@keyframes pk-pop {
  from {
    transform: translateY(0) scale(1);
  }
  to {
    transform: translateY(-1px) scale(1.03);
  }
}
@media (prefers-reduced-motion: reduce) {
  .pk-stage.rolling {
    animation: none;
  }
}
</style>
