<script setup lang="ts">
// 茶话间品牌 logo（决议 #64）：饱满扁平茶杯气泡——茶青实心杯身兼作对话气泡
// （左下伸出气泡尾），暖茶汤面 + 杯把 + 双蒸汽。与 build/icons/*.svg 同一造型。
withDefaults(
  defineProps<{
    variant?: 'icon' | 'color' | 'mono'
    size?: number
  }>(),
  {
    variant: 'color',
    size: 64
  }
)
</script>

<template>
  <svg
    class="pantry-brand-logo"
    :class="`is-${variant}`"
    :width="size"
    :height="size"
    viewBox="0 0 64 64"
    role="img"
    aria-label="茶话间 logo"
  >
    <rect v-if="variant === 'icon'" class="logo-bg" x="4" y="4" width="56" height="56" rx="14" />
    <g :transform="variant === 'icon' ? 'translate(32 32.5) scale(0.82) translate(-32 -30.5)' : ''">
      <path class="logo-steam" d="M24 16.5c-2.6-2.7-2.6-5.4 0-8.1" />
      <path class="logo-steam" d="M32.5 16.5c-2.6-2.7-2.6-5.4 0-8.1" />
      <path class="logo-handle" d="M42 30h4.6a6.7 6.7 0 0 1 0 13.4H43.5" />
      <path class="logo-tail" d="M22 43.5 L17 53 L31 46 Z" />
      <rect class="logo-body" x="13" y="20" width="30" height="26" rx="10" />
      <ellipse class="logo-tea" cx="28" cy="28" rx="12" ry="3.2" />
    </g>
  </svg>
</template>

<style scoped>
.pantry-brand-logo {
  display: block;
  flex-shrink: 0;
}
.logo-bg {
  fill: #ebf4ef;
}
.logo-body,
.logo-tail {
  fill: var(--primary);
}
.logo-tea {
  fill: #f2c56b;
}
.logo-handle {
  fill: none;
  stroke: var(--primary);
  stroke-width: 3.8;
  stroke-linecap: round;
}
.logo-steam {
  fill: none;
  stroke: #8fc1ab;
  stroke-width: 3;
  stroke-linecap: round;
}
/* 单色剪影（mac 菜单栏 template 等场景；当前运行时仅 icon 变体在用） */
.is-mono .logo-body,
.is-mono .logo-tail {
  fill: currentColor;
}
.is-mono .logo-handle,
.is-mono .logo-steam {
  stroke: currentColor;
}
.is-mono .logo-tea {
  display: none;
}
</style>
