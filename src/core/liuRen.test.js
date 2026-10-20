import { describe, expect, it } from 'vitest'
import {
  HEXAGRAMS,
  HEXAGRAM_AT,
  MAX_INPUT,
  buildCells,
  divine,
  hexagramFor,
  isShaded,
  isValidInput,
  stepsFor
} from './liuRen'

describe('stepsFor', () => {
  it('数到 1 停在原地', () => {
    expect(stepsFor(1)).toBe(0)
    expect(stepsFor(2)).toBe(1)
    expect(stepsFor(6)).toBe(5)
  })

  it('超过 6 时按六循环', () => {
    expect(stepsFor(7)).toBe(0)
    expect(stepsFor(12)).toBe(5)
    expect(stepsFor(13)).toBe(0)
    expect(stepsFor(1000)).toBe(3)
  })

  it('0 与负数都非法', () => {
    expect(() => stepsFor(0)).toThrow(RangeError)
    expect(() => stepsFor(-1)).toThrow(RangeError)
    expect(() => stepsFor(1.5)).toThrow(RangeError)
    expect(() => stepsFor(NaN)).toThrow(RangeError)
  })
})

describe('hexagramFor', () => {
  it('单个数字从大安起数', () => {
    expect(hexagramFor(1).key).toBe('大安')
    expect(hexagramFor(2).key).toBe('留连')
    expect(hexagramFor(3).key).toBe('速喜')
    expect(hexagramFor(4).key).toBe('赤口')
    expect(hexagramFor(5).key).toBe('小吉')
    expect(hexagramFor(6).key).toBe('空亡')
    expect(hexagramFor(7).key).toBe('大安')
  })
})

describe('divine（月上起日，日上起时）', () => {
  const keys = (positions) => positions.map((index) => HEXAGRAMS[index].key)

  it('每个数字都从上一个落宫接着数', () => {
    // 月 3 → 速喜(2)；日 5 从速喜数 5 → 大安(0)；时 8 从大安数 8 → 留连(1)
    expect(keys(divine([3, 5, 8]))).toEqual(['速喜', '大安', '留连'])
  })

  it('2 / 3 / 5：落宫为 留连 → 赤口 → 留连', () => {
    expect(keys(divine([2, 3, 5]))).toEqual(['留连', '赤口', '留连'])
  })

  it('全是 1 时三步都不动，停在大安', () => {
    expect(keys(divine([1, 1, 1]))).toEqual(['大安', '大安', '大安'])
  })

  it('7 / 15 / 6：大安 → 速喜 → 留连', () => {
    expect(keys(divine([7, 15, 6]))).toEqual(['大安', '速喜', '留连'])
  })

  it('落宫等于各数字步数前缀和的模 6', () => {
    expect(divine([12, 30, 12])).toEqual([5, 4, 3])
    const values = [7, 15, 6]
    const expected = values
      .reduce(
        (acc, value) => {
          const next = (acc.at(-1) + (value - 1)) % 6
          return [...acc, next]
        },
        [0]
      )
      .slice(1)
    expect(divine(values)).toEqual(expected)
  })

  it('非法数字抛错', () => {
    expect(() => divine([1, 0, 1])).toThrow(RangeError)
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
  it('接受 1 ~ 1000 的整数', () => {
    expect(isValidInput(1)).toBe(true)
    expect(isValidInput(MAX_INPUT)).toBe(true)
  })

  it('拒绝 0、越界与非整数', () => {
    expect(isValidInput(0)).toBe(false)
    expect(isValidInput(MAX_INPUT + 1)).toBe(false)
    expect(isValidInput(-1)).toBe(false)
    expect(isValidInput(NaN)).toBe(false)
    expect(isValidInput(1.2)).toBe(false)
  })
})
