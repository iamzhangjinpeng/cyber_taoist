import { describe, expect, it } from 'vitest'
import {
  hourToShichen,
  lunarFromDate,
  lunarMonthToNumber,
  supportsChineseCalendar,
  toDateTimeLocalValue
} from './lunar'

/** 用本地时间构造 Date，避免测试机时区差异 */
const localDate = (y, m, d, h = 10, min = 0) => new Date(y, m - 1, d, h, min)

describe('lunarMonthToNumber', () => {
  it('识别十二个月份的常见写法', () => {
    expect(lunarMonthToNumber('正月')).toBe(1)
    expect(lunarMonthToNumber('一月')).toBe(1)
    expect(lunarMonthToNumber('二月')).toBe(2)
    expect(lunarMonthToNumber('十月')).toBe(10)
    expect(lunarMonthToNumber('十一月')).toBe(11)
    expect(lunarMonthToNumber('冬月')).toBe(11)
    expect(lunarMonthToNumber('腊月')).toBe(12)
    expect(lunarMonthToNumber('十二月')).toBe(12)
  })

  it('闰月按本月计算', () => {
    expect(lunarMonthToNumber('闰二月')).toBe(2)
    expect(lunarMonthToNumber('闰六月')).toBe(6)
  })

  it('无法识别时返回 null', () => {
    expect(lunarMonthToNumber('十三月')).toBeNull()
    expect(lunarMonthToNumber('')).toBeNull()
    expect(lunarMonthToNumber(undefined)).toBeNull()
  })
})

describe('hourToShichen', () => {
  it('23 点到 1 点为子时', () => {
    expect(hourToShichen(23)).toBe(1)
    expect(hourToShichen(0)).toBe(1)
  })

  it('其余时辰按两小时一档递增', () => {
    expect(hourToShichen(1)).toBe(2)
    expect(hourToShichen(2)).toBe(2)
    expect(hourToShichen(3)).toBe(3)
    expect(hourToShichen(11)).toBe(7)
    expect(hourToShichen(22)).toBe(12)
  })
})

describe('lunarFromDate', () => {
  it.runIf(supportsChineseCalendar())('换算 2024 年春节（正月初一）', () => {
    expect(lunarFromDate(localDate(2024, 2, 10, 10))).toMatchObject({
      month: 1,
      day: 1,
      leap: false
    })
  })

  it.runIf(supportsChineseCalendar())('换算闰二月初一（旧实现会解析失败）', () => {
    expect(lunarFromDate(localDate(2023, 3, 22, 10))).toMatchObject({
      month: 2,
      day: 1,
      leap: true
    })
  })

  it.runIf(supportsChineseCalendar())('换算九月十五', () => {
    expect(lunarFromDate(localDate(2024, 10, 17, 11, 50))).toMatchObject({
      month: 9,
      day: 15,
      shichen: 7
    })
  })

  it.runIf(supportsChineseCalendar())('换算腊月廿九的深夜（子时）', () => {
    expect(lunarFromDate(localDate(2025, 1, 28, 23, 30))).toMatchObject({
      month: 12,
      day: 29,
      shichen: 1
    })
  })

  it('非法时间抛错', () => {
    expect(() => lunarFromDate(new Date('invalid'))).toThrow(TypeError)
    expect(() => lunarFromDate('2024-01-01')).toThrow(TypeError)
  })
})

describe('toDateTimeLocalValue', () => {
  it('输出 datetime-local 需要的格式', () => {
    expect(toDateTimeLocalValue(new Date(2024, 0, 5, 9, 7))).toBe('2024-01-05T09:07')
  })
})
