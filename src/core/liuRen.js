/**
 * 小六壬核心算法。
 *
 * 保留旧版本的起数规则：1 从「大安」起，0 与 6 都落在「空亡」。
 * 结果只依赖传入的数字，便于单元测试。
 */

/** 六神，顺序即掌诀顺序 */
export const HEXAGRAMS = [
  { key: '大安', tone: 'good', position: [3, 2] },
  { key: '留连', tone: 'bad', position: [1, 2] },
  { key: '速喜', tone: 'good', position: [1, 3] },
  { key: '赤口', tone: 'bad', position: [1, 4] },
  { key: '小吉', tone: 'good', position: [3, 4] },
  { key: '空亡', tone: 'bad', position: [3, 3] }
]

export const GRID_ROWS = 6
export const GRID_COLS = 5

/** 数字输入上限 */
export const MAX_INPUT = 1000

/** 手掌区域 [x1, y1, x2, y2]，用于给格子加底色 */
const PALM_RANGES = [
  [4, 2, 6, 5],
  [3, 1, 5, 1],
  [1, 2, 3, 2],
  [1, 3, 3, 3],
  [1, 4, 3, 4],
  [1, 5, 3, 5]
]

const cellId = (x, y) => `${x}_${y}`

function buildShadedCells() {
  const shaded = new Set()
  for (const [x1, y1, x2, y2] of PALM_RANGES) {
    for (let x = x1; x <= x2; x += 1) {
      for (let y = y1; y <= y2; y += 1) {
        shaded.add(cellId(x, y))
      }
    }
  }
  return shaded
}

/** 需要显示底色的格子，模块加载时算一次 */
export const SHADED_CELLS = buildShadedCells()

export const isShaded = (x, y) => SHADED_CELLS.has(cellId(x, y))

/** 格子坐标 → 六神 */
export const HEXAGRAM_AT = new Map(HEXAGRAMS.map((item) => [cellId(...item.position), item]))

/** 数字是否为合法输入 */
export const isValidInput = (value) => Number.isInteger(value) && value >= 0 && value <= MAX_INPUT

/**
 * 从「大安」起数时需要前进的步数。
 * 0 视作 6（落在空亡），与旧版本一致。
 */
export function stepsFor(value) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`起卦数字必须是非负整数，收到：${value}`)
  }
  if (value === 0) return HEXAGRAMS.length - 1
  return (value - 1) % HEXAGRAMS.length
}

/** 数字直接对应的六神 */
export const hexagramFor = (value) => HEXAGRAMS[stepsFor(value)]

/** 网格的扁平单元格列表，供渲染使用 */
export function buildCells() {
  const cells = []
  for (let x = 1; x <= GRID_ROWS; x += 1) {
    for (let y = 1; y <= GRID_COLS; y += 1) {
      cells.push({
        id: cellId(x, y),
        shaded: isShaded(x, y),
        hexagram: HEXAGRAM_AT.get(cellId(x, y)) ?? null
      })
    }
  }
  return cells
}
