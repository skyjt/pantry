export type PkGame = 'dice' | 'rps'
export type PkRpsResult = 'rock' | 'paper' | 'scissors'
export type PkResult = number | PkRpsResult

export interface PkRefView {
  game: PkGame
  result: PkResult
}

const RPS_TEXT: Record<PkRpsResult, string> = {
  rock: '石头',
  paper: '布',
  scissors: '剪刀'
}

export function isPkGame(value: unknown): value is PkGame {
  return value === 'dice' || value === 'rps'
}

export function isPkRef(value: unknown): value is PkRefView {
  if (!value || typeof value !== 'object') return false
  const ref = value as { game?: unknown; result?: unknown }
  if (ref.game === 'dice') {
    return typeof ref.result === 'number' && Number.isInteger(ref.result) && ref.result >= 1 && ref.result <= 6
  }
  return (
    ref.game === 'rps' &&
    (ref.result === 'rock' || ref.result === 'paper' || ref.result === 'scissors')
  )
}

export function parsePkRef(raw: string | null | undefined): PkRefView | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return isPkRef(parsed) ? parsed : null
  } catch {
    return null
  }
}

export function pkLabel(game: PkGame): string {
  return game === 'dice' ? '骰子' : '猜拳'
}

export function pkPreview(game: PkGame): string {
  return `[PK] ${pkLabel(game)}`
}

export function pkTitle(game: PkGame): string {
  return `PK · ${pkLabel(game)}`
}

export function pkResultText(ref: PkRefView): string {
  if (ref.game === 'dice') return `掷出 ${ref.result} 点`
  return `出了${RPS_TEXT[ref.result as PkRpsResult]}`
}
