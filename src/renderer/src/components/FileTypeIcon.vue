<script setup lang="ts">
import { computed } from 'vue'

// 彩色文件类型图标（决议 #75）：按扩展名映射类型 + 标志色，一眼辨识。
// 属"内容标识"，是单色系统控件图标基线（ui-design §10）的明示例外。

const props = withDefaults(defineProps<{ name: string; dir?: boolean; size?: number }>(), {
  dir: false,
  size: 32
})

const EXT_TYPE: Record<string, string> = {
  doc: 'word', docx: 'word', rtf: 'word', odt: 'word', wps: 'word',
  xls: 'excel', xlsx: 'excel', csv: 'excel', ods: 'excel', et: 'excel',
  ppt: 'ppt', pptx: 'ppt', odp: 'ppt', dps: 'ppt',
  pdf: 'pdf',
  zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive', bz2: 'archive', xz: 'archive',
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', bmp: 'image', webp: 'image', svg: 'image', heic: 'image', tiff: 'image', ico: 'image',
  mp3: 'audio', wav: 'audio', flac: 'audio', aac: 'audio', ogg: 'audio', m4a: 'audio', wma: 'audio',
  mp4: 'video', mov: 'video', avi: 'video', mkv: 'video', webm: 'video', flv: 'video', wmv: 'video', m4v: 'video',
  txt: 'text', md: 'text', log: 'text', ini: 'text', conf: 'text',
  js: 'code', mjs: 'code', ts: 'code', jsx: 'code', tsx: 'code', vue: 'code', py: 'code', java: 'code', c: 'code', cpp: 'code', h: 'code', cs: 'code', go: 'code', rs: 'code', rb: 'code', php: 'code', html: 'code', css: 'code', json: 'code', xml: 'code', yml: 'code', yaml: 'code', sh: 'code', sql: 'code',
  exe: 'app', msi: 'app', dmg: 'app', deb: 'app', rpm: 'app', apk: 'app', pkg: 'app', appimage: 'app'
}

interface TypeStyle {
  color: string
  dark: string
  label?: string
  glyph?: 'image' | 'audio' | 'video' | 'archive' | 'text' | 'code' | 'app'
}

const TYPE_STYLE: Record<string, TypeStyle> = {
  word: { color: '#2B579A', dark: '#1B3A6B', label: 'W' },
  excel: { color: '#217346', dark: '#14502F', label: 'X' },
  ppt: { color: '#C43E1C', dark: '#8C2A12', label: 'P' },
  pdf: { color: '#D5392A', dark: '#9E2418', label: 'PDF' },
  archive: { color: '#E0902B', dark: '#A9661A', glyph: 'archive' },
  image: { color: '#2E9B8E', dark: '#1E6A60', glyph: 'image' },
  audio: { color: '#7C4DBE', dark: '#552F8C', glyph: 'audio' },
  video: { color: '#C2407A', dark: '#8C2856', glyph: 'video' },
  text: { color: '#5B7083', dark: '#3C4D5C', glyph: 'text' },
  code: { color: '#3B6EA5', dark: '#264C77', glyph: 'code' },
  app: { color: '#3D8B6B', dark: '#286B50', glyph: 'app' },
  generic: { color: '#8A94A6', dark: '#5E6878', glyph: 'text' }
}

const ext = computed(() => {
  const m = /\.([a-z0-9]+)$/i.exec(props.name.trim())
  return m ? m[1].toLowerCase() : ''
})
const style = computed<TypeStyle>(() => {
  if (props.dir) return TYPE_STYLE.generic
  return TYPE_STYLE[EXT_TYPE[ext.value] ?? 'generic'] ?? TYPE_STYLE.generic
})
const labelSize = computed(() => ((style.value.label?.length ?? 1) > 1 ? 8 : 13))
</script>

<template>
  <!-- 文件夹：琥珀实心 -->
  <svg
    v-if="dir"
    class="file-type-icon"
    :width="size"
    :height="size * 0.82"
    viewBox="0 0 40 33"
    aria-hidden="true"
  >
    <path
      d="M3 7a2 2 0 0 1 2-2h8.6l3 3.2H35a2 2 0 0 1 2 2V26a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
      fill="#E0902B"
    />
    <path d="M3 7a2 2 0 0 1 2-2h8.6l3 3.2H3V7z" fill="#C77C1E" />
  </svg>
  <!-- 文件：折角纸张 + 类型色 + 白色标识 -->
  <svg
    v-else
    class="file-type-icon"
    :width="size * 0.82"
    :height="size"
    viewBox="0 0 36 44"
    aria-hidden="true"
  >
    <path
      d="M5 1.5h17.5L33 12v30a2.5 2.5 0 0 1-2.5 2.5h-25A2.5 2.5 0 0 1 3 42V4a2.5 2.5 0 0 1 2-2.5z"
      :fill="style.color"
    />
    <path d="M22.5 1.5 33 12h-8a2.5 2.5 0 0 1-2.5-2.5V1.5z" :fill="style.dark" />
    <text
      v-if="style.label"
      x="18"
      y="34"
      text-anchor="middle"
      class="ft-label"
      :style="{ fontSize: `${labelSize}px` }"
    >
      {{ style.label }}
    </text>
    <g v-else class="ft-glyph">
      <template v-if="style.glyph === 'image'">
        <rect x="9.5" y="23" width="17" height="13" rx="2" fill="none" stroke="#fff" stroke-width="1.5" />
        <circle cx="14" cy="27.5" r="1.5" fill="#fff" />
        <path d="M11 35l4-4 3 2.5 3-3 4.5 4.5" fill="none" stroke="#fff" stroke-width="1.5" />
      </template>
      <template v-else-if="style.glyph === 'audio'">
        <path d="M15 24.8v8.2M21 23.5v7.8M15 24.8 21 23.5" fill="none" stroke="#fff" stroke-width="1.6" />
        <ellipse cx="13.2" cy="33" rx="2.2" ry="1.7" fill="#fff" />
        <ellipse cx="19.2" cy="31.3" rx="2.2" ry="1.7" fill="#fff" />
      </template>
      <template v-else-if="style.glyph === 'video'">
        <circle cx="18" cy="29.5" r="6.5" fill="none" stroke="#fff" stroke-width="1.6" />
        <path d="M16 26.3l5 3.2-5 3.2z" fill="#fff" />
      </template>
      <template v-else-if="style.glyph === 'archive'">
        <rect x="12.5" y="23.5" width="11" height="11.5" rx="1.5" fill="none" stroke="#fff" stroke-width="1.5" />
        <path d="M18 23.5v11.5" stroke="#fff" stroke-width="1.5" stroke-dasharray="1.7 1.7" />
      </template>
      <template v-else-if="style.glyph === 'code'">
        <path d="M15 24.5 10.5 29 15 33.5M21 24.5 25.5 29 21 33.5" fill="none" stroke="#fff" stroke-width="1.6" />
      </template>
      <template v-else-if="style.glyph === 'app'">
        <path d="M18 23v7m0 0 3.4-3.4M18 30l-3.4-3.4M12.5 34.5h11" fill="none" stroke="#fff" stroke-width="1.6" />
      </template>
      <template v-else>
        <path d="M11 25h14M11 29h14M11 33h9" fill="none" stroke="#fff" stroke-width="1.6" />
      </template>
    </g>
  </svg>
</template>

<style scoped>
.file-type-icon {
  display: block;
  flex-shrink: 0;
}
.ft-label {
  fill: #fff;
  font-weight: 700;
  font-family: -apple-system, 'Segoe UI', system-ui, 'Microsoft YaHei', sans-serif;
  letter-spacing: -0.5px;
}
.ft-glyph path,
.ft-glyph rect,
.ft-glyph circle,
.ft-glyph ellipse {
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
