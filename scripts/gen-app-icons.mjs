// 生成全套应用图标（决议 #64）：从 build/icons/pantry-logo-icon.svg 渲染高清主位图，
// 再出 Windows .ico（BMP 格式，兼容 Win7）、macOS .icns，并链式重生成 Linux 多尺寸
// hicolor 图标与窗口图标。改 logo：先改 SVG，再运行 `node scripts/gen-app-icons.mjs`。
// 依赖：系统 rsvg-convert（homebrew librsvg）+ 开发依赖 png2icons（纯 JS，零 native）。
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import png2icons from 'png2icons'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dir = join(root, 'build/icons')
const svg = join(dir, 'pantry-logo-icon.svg')
const png = join(dir, 'pantry-logo-icon.png')

// 主位图：1024 高清，作为 ico / icns / Linux 各尺寸的统一来源
execFileSync('rsvg-convert', ['-w', '1024', '-h', '1024', svg, '-o', png], { stdio: 'pipe' })
const input = readFileSync(png)

// Win7 对 PNG 压缩的 ico 大图支持不稳，用 BMP（usePNG=false）
writeFileSync(join(dir, 'pantry-logo-icon.ico'), png2icons.createICO(input, png2icons.BICUBIC, 0, false))
writeFileSync(join(dir, 'pantry-logo-icon.icns'), png2icons.createICNS(input, png2icons.BICUBIC, 0))
console.log('已生成 pantry-logo-icon.png(1024) / .ico / .icns')

// Linux 多尺寸 hicolor + 窗口图标（复用既有脚本，源就是上面这张 png）
execFileSync('node', [join(root, 'scripts/gen-linux-icons.mjs')], { stdio: 'inherit' })
