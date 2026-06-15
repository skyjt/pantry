import { describe, expect, it } from 'vitest'
import {
  findNearestOcrTokenIndex,
  getOcrSelectionBounds,
  getOcrTokenRangeIds,
  getSelectedOcrText,
  isAutoOcrCandidate,
  type OcrToken
} from './ocr'

function token(
  id: string,
  text: string,
  lineIndex: number,
  wordIndex: number,
  tokenIndex: number
): OcrToken {
  return {
    id,
    text,
    lineIndex,
    wordIndex,
    tokenIndex,
    confidence: 90,
    bbox: { x0: tokenIndex * 10, y0: lineIndex * 10, x1: tokenIndex * 10 + 8, y1: lineIndex * 10 + 8 }
  }
}

describe('ocr utils', () => {
  it('按行与 token 顺序复制，英文补空格，中文不补空格', () => {
    const tokens = [
      token('b', 'OCR', 0, 1, 1),
      token('d', '话', 1, 1, 3),
      token('a', 'PANTRY', 0, 0, 0),
      token('c', '茶', 1, 0, 2)
    ]

    expect(getSelectedOcrText(tokens, new Set(['a', 'b', 'c', 'd']))).toBe('PANTRY OCR\n茶话')
  })

  it('逐字 token 复制时英文词内不插空格，跨词补空格', () => {
    const tokens = [
      token('p', 'P', 0, 0, 0),
      token('a', 'A', 0, 0, 1),
      token('n', 'N', 0, 0, 2),
      token('o', 'O', 0, 1, 3),
      token('c', 'C', 0, 1, 4),
      token('r', 'R', 0, 1, 5)
    ]

    expect(getSelectedOcrText(tokens, new Set(['p', 'a', 'n', 'o', 'c', 'r']))).toBe('PAN OCR')
    expect(getSelectedOcrText(tokens, new Set(['a', 'n']))).toBe('AN')
  })

  it('拖选 OCR 文字时按起止 token 连续范围选择', () => {
    const tokens = [
      token('p', 'P', 0, 0, 0),
      token('a', 'A', 0, 0, 1),
      token('n', 'N', 0, 0, 2),
      token('t', 'T', 0, 0, 3)
    ]

    expect(getOcrTokenRangeIds(tokens, 1, 3)).toEqual(['a', 'n', 't'])
    expect(getOcrTokenRangeIds(tokens, 3, 1)).toEqual(['a', 'n', 't'])
  })

  it('拖动坐标映射到最近 OCR token，并用 token bbox 计算复制按钮位置', () => {
    const tokens: OcrToken[] = [
      { ...token('a', 'A', 0, 0, 0), bbox: { x0: 10, y0: 10, x1: 18, y1: 22 } },
      { ...token('b', 'B', 0, 0, 1), bbox: { x0: 24, y0: 10, x1: 32, y1: 22 } },
      { ...token('c', 'C', 1, 0, 2), bbox: { x0: 10, y0: 40, x1: 18, y1: 52 } }
    ]

    expect(findNearestOcrTokenIndex(tokens, { x: 28, y: 14 })).toBe(1)
    expect(findNearestOcrTokenIndex(tokens, { x: 14, y: 48 })).toBe(2)
    expect(getOcrSelectionBounds(tokens, new Set(['a', 'b']))).toEqual({
      x0: 10,
      y0: 10,
      x1: 32,
      y1: 22
    })
  })

  it('小图片自动 OCR，大图片或大字节走手动', () => {
    expect(isAutoOcrCandidate(1200, 900, 2 * 1024 * 1024)).toBe(true)
    expect(isAutoOcrCandidate(2000, 1600, 2 * 1024 * 1024)).toBe(false)
    expect(isAutoOcrCandidate(1200, 900, 5 * 1024 * 1024)).toBe(false)
  })
})
