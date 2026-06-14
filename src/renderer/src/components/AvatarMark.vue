<script setup lang="ts">
import { computed } from 'vue'
import { avatarEmojiIndex, avatarStyle, avatarText } from '../utils/avatar'
import AvatarGlyph from './AvatarGlyph.vue'

const props = defineProps<{
  avatar: number
  name: string
  offline?: boolean
  // 在线状态点：'online' 绿 / 'offline' 灰；不传则不显示任何点。
  // 不能用 boolean —— Vue 对未传的 Boolean prop 会强制转成 false（而非 undefined），
  // 会让"不想显示点"的调用方（如导航栏自己头像）也冒出一个灰点（决议 #85）。
  presence?: 'online' | 'offline'
}>()

const glyphIndex = computed(() => avatarEmojiIndex(props.avatar))
const markStyle = computed(() => {
  if (props.offline) return { backgroundColor: 'var(--offline)', color: '#fff' }
  return avatarStyle(props.avatar, props.name)
})
</script>

<template>
  <span class="avatar-mark">
    <span class="avatar-face" :style="markStyle">
      <AvatarGlyph v-if="glyphIndex >= 0" :index="glyphIndex" />
      <span v-else class="avatar-initial">{{ avatarText(avatar, name) }}</span>
    </span>
    <span
      v-if="presence"
      class="status-dot"
      :class="presence === 'online' ? 'is-online' : 'is-offline'"
    ></span>
  </span>
</template>

<style scoped>
/* 根只作定位容器：圆形裁切交给 .avatar-face，状态点要露在头像圆形外缘，故根不裁切。
   尺寸 / 背景 / 字号仍由调用方 class（如 .conv-avatar）落到根，.avatar-face 撑满继承。 */
.avatar-mark {
  position: relative;
  border-radius: 50%;
}
.avatar-face {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  font-weight: 600;
}
.avatar-initial {
  line-height: 1;
}
/* 在线状态点（决议 #81）：右下角绿/灰圆点 + 描窗口底色细边，浮在头像外缘。
   尺寸按头像比例自适配，clamp 兜住极小/极大头像。 */
.status-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 30%;
  height: 30%;
  min-width: 9px;
  min-height: 9px;
  max-width: 14px;
  max-height: 14px;
  border-radius: 50%;
  border: 2px solid var(--bg-window);
  box-sizing: border-box;
}
.status-dot.is-online {
  background: var(--online);
}
.status-dot.is-offline {
  background: var(--offline);
}
</style>
