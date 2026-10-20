import { describe, expect, it } from 'vitest'
import {
  HEXAGRAMS,
  HEXAGRAM_AT,
  MAX_INPUT,
  buildCells,
  hexagramFor,
  isShaded,
  isValidInput,
  stepsFor
} from './liuRen'

describe('stepsFor', () => {
  it('从大安起数，1 不移动', () => {
    expect(stepsFor(1)).toBe(0)
    expect(stepsFor(2)).toBe(1)
    expect(stepsFor(6)).toBe(5)
  })

  it('超过 6 时循环，与旧实现结果一致', () => {
    expect(stepsFor(7)).toBe(0) // 旧实现：(7 % 6) + 6 = 7 步 → 回到大安
    expect(stepsFor(12)).toBe(5) // 空亡
    expect(stepsFor(13)).toBe(0)
    expect(stepsFor(1000)).toBe(3) // (1000 - 1) % 6
  })

  it('0 视作 6，落在空亡', () => {
    expect(stepsFor(0)).toBe(5)
  })

  it('非法数字抛错', () => {
    expect(() => stepsFor(-1)).toThrow(RangeError)
    expect(() => stepsFor(1.5)).toThrow(RangeError)
    expect(() => stepsFor(NaN)).toThrow(RangeError)
  })
})

describe('hexagramFor', () => {
  it('数字对应掌上的六神', () => {
    expect(hexagramFor(1).key).toBe('大安')
    expect(hexagramFor(2).key).toBe('留连')
    expect(hexagramFor(3).key).toBe('速喜')
    expect(hexagramFor(4).key).toBe('赤口')
    expect(hexagramFor(5).key).toBe('小吉')
    expect(hexagramFor(6).key).toBe('空亡')
    expect(hexagramFor(7).key).toBe('大安')
    expect(hexagramFor(0).key).toBe('空亡')
  })
})

describe('掌诀网格', () => {
  it('六个六神坐标不重复，且都在网格内', () => {
    const positions = HEXAGRAMS.map((item) => item.position.join('_'))
    expect(new Set(positions).size).toBe(HEXAGRAMS.length)
    expect(HEXAGRAM_AT.size).toBe(HEXAGRAMS.length)
  })

  it('底色格子与旧的 getColor 规则一致', () => {
    expect(isShaded(1, 1)).toBe(false)
    expect(isShaded(1, 2)).toBe(true) // 留连所在列
    expect(isShaded(6, 5)).toBe(true) // 手掌右下角
    expect(isShaded(6, 1)).toBe(false)
    expect(isShaded(2, 1)).toBe(false)
  })

  it('生成 6 × 5 个格子', () => {
    expect(buildCells()).toHaveLength(30)
  })
})

describe('isValidInput', () => {
  it('接受 0 ~ 1000 的整数', () => {
    expect(isValidInput(0)).toBe(true)
    expect(isValidInput(MAX_INPUT)).toBe(true)
  })

  it('拒绝越界与非整数', () => {
    expect(isValidInput(MAX_INPUT + 1)).toBe(false)
    expect(isValidInput(-1)).toBe(false)
    expect(isValidInput(NaN)).toBe(false)
    expect(isValidInput(1.2)).toBe(false)
  })
})
