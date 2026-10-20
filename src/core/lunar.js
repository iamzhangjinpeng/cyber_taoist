/**
 * 农历转换：使用浏览器内置的 Intl 中国历法，不再手工切分
 * `toLocaleString()` 的字符串（旧实现遇到「正月」「闰二月」会解析失败）。
 */

/** 农历月份名 → 数字。兼容不同 ICU 的写法（冬月/十一月、腊月/十二月） */
const MONTH_NAMES = {
  正: 1,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
  冬: 11,
  腊: 12
}

/** 十二时辰名，索引 = 时辰序号 - 1 */
export const SHICHEN_NAMES = [
  '子',
  '丑',
  '寅',
  '卯',
  '辰',
  '巳',
  '午',
  '未',
  '申',
  '酉',
  '戌',
  '亥'
]

const formatter = new Intl.DateTimeFormat('zh-Hans-u-ca-chinese', {
  month: 'long',
  day: 'numeric'
})

/** 运行环境是否支持中国农历 */
export const supportsChineseCalendar = () => formatter.resolvedOptions().calendar === 'chinese'

/**
 * 把「正月」「闰二月」「九月」这类标签转成 1~12，无法识别时返回 null。
 */
export function lunarMonthToNumber(label) {
  if (typeof label !== 'string') return null
  const name = label.trim().replace(/月$/, '').replace(/^闰/, '')
  return Object.hasOwn(MONTH_NAMES, name) ? MONTH_NAMES[name] : null
}

/** 0~23 点 → 1~12 时辰（23 点起为子时） */
export const hourToShichen = (hour) => Math.floor(((hour + 1) / 2) % 12) + 1

/**
 * 阳历 Date → 农历数字，供小六壬起卦使用。
 * @param {Date} date
 * @returns {{ month: number, day: number, shichen: number, leap: boolean }}
 */
export function lunarFromDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new TypeError('时间无效')
  }
  if (!supportsChineseCalendar()) {
    throw new Error('当前浏览器不支持农历转换，请手动输入数字')
  }

  const parts = formatter.formatToParts(date)
  const monthLabel = parts.find((part) => part.type === 'month')?.value ?? ''
  const dayLabel = parts.find((part) => part.type === 'day')?.value ?? ''

  const month = lunarMonthToNumber(monthLabel)
  const day = Number(dayLabel)

  if (month === null) {
    throw new Error(`无法识别农历月份：${monthLabel || '空'}`)
  }
  if (!Number.isInteger(day) || day < 1 || day > 30) {
    throw new Error(`无法识别农历日期：${dayLabel || '空'}`)
  }

  return {
    month,
    day,
    shichen: hourToShichen(date.getHours()),
    leap: monthLabel.startsWith('闰')
  }
}

/**
 * Date → `<input type="datetime-local">` 需要的本地时间字符串。
 */
export function toDateTimeLocalValue(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}
