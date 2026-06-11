import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import SettingsApp from './SettingsApp.vue'
import CaptureApp from './CaptureApp.vue'
import './styles/tokens.css'

// 同一渲染包多入口：主窗挂 App，#/settings 设置窗，#/capture 截图框选窗（tech-design §3）
const root = location.hash.startsWith('#/settings')
  ? SettingsApp
  : location.hash.startsWith('#/capture')
    ? CaptureApp
    : App
createApp(root).use(createPinia()).mount('#app')
