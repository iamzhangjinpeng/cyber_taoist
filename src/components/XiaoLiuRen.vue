<template>
  <main class="app">
    <header class="header">
      <h1 class="title">小六壬</h1>
      <p class="subtitle">掌上起卦 · 落子无悔</p>
    </header>

    <section class="palm" :class="{ 'is-running': running }" aria-label="掌诀图">
      <div v-for="cell in cells" :key="cell.id" class="cell" :class="{ shaded: cell.shaded }">
        <div
          v-if="cell.hexagram"
          class="hex"
          :class="[cell.hexagram.tone, { 'is-current': cell.hexagram.key === currentKey }]"
        >
          {{ cell.hexagram.key }}
        </div>
      </div>
    </section>

    <p class="status" aria-hidden="true">{{ stepText }}</p>
    <p class="sr-only" role="status" aria-live="polite">{{ liveText }}</p>

    <form class="form" novalidate @submit.prevent="onSubmit">
      <div class="field">
        <label for="when">时间</label>
        <div class="inline">
          <input id="when" v-model="when" class="input" type="datetime-local" :disabled="running" />
          <button type="button" class="btn btn--info" :disabled="running" @click="fillFromLunar">
            转化为阴历数字
          </button>
        </div>
      </div>

      <div class="numbers">
        <div v-for="field in NUMBER_FIELDS" :key="field.key" class="field">
          <label :for="field.key">{{ field.label }}</label>
          <input
            :id="field.key"
            v-model="numbers[field.key]"
            class="input"
            type="number"
            inputmode="numeric"
            min="1"
            :max="MAX_INPUT"
            placeholder="1 ~ 1000"
            :disabled="running"
            @input="clearResults"
          />
        </div>
      </div>

      <ol v-if="results.length" class="results" aria-label="起卦结果">
        <li v-for="(item, index) in results" :key="index" class="hex result" :class="item.tone">
          {{ item.key }}
        </li>
      </ol>

      <div class="actions">
        <button type="submit" class="btn btn--good" :disabled="running">
          {{ running ? '道爷掐指一算…' : '起卦！落子无悔！' }}
        </button>
        <button type="button" class="btn btn--ghost" :disabled="running" @click="reset">
          大侠重新来过
        </button>
      </div>
    </form>

    <p v-if="message" class="toast" role="status" aria-live="polite">{{ message }}</p>
  </main>
</template>

<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import { HEXAGRAMS, MAX_INPUT, buildCells, divine, isValidInput } from '../core/liuRen'
import { SHICHEN_NAMES, lunarFromDate, toDateTimeLocalValue } from '../core/lunar'

/** 每一步的基础间隔（毫秒） */
const STEP_MS = 130
/** 倒数第二步放慢，制造「落定」的手感 */
const PENULTIMATE_STEP_MS = 260
/** 最后一步放慢 */
const LAST_STEP_MS = 420
/** 点击后先停顿一下再开始 */
const INITIAL_MS = 200
/** 三个数字都不移动时的停顿，避免看起来没反应 */
const HOLD_MS = 500
/** 提示信息停留时间（毫秒） */
const MESSAGE_MS = 4000

const NUMBER_FIELDS = [
  { key: 'num1', label: '数字 1' },
  { key: 'num2', label: '数字 2' },
  { key: 'num3', label: '数字 3' }
]

const cells = buildCells()

const when = ref(toDateTimeLocalValue())
const numbers = reactive({ num1: '', num2: '', num3: '' })
const results = ref([])
const currentKey = ref(null)
const running = ref(false)
const stepText = ref('')
const liveText = ref('')
const message = ref('')

/** 用于打断正在进行的起卦动画 */
let runToken = 0
let messageTimer = 0

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** 剩余步数越少越慢，最后一步「落定」 */
function delayFor(remaining) {
  if (remaining <= 1) return LAST_STEP_MS
  if (remaining === 2) return PENULTIMATE_STEP_MS
  return STEP_MS
}

/** 移动端震动反馈，不支持的环境静默跳过 */
function buzz(pattern) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
}

function notify(text) {
  message.value = text
  clearTimeout(messageTimer)
  messageTimer = setTimeout(() => {
    message.value = ''
  }, MESSAGE_MS)
}

function clearResults() {
  if (running.value) return
  results.value = []
  currentKey.value = null
}

function fillFromLunar() {
  if (running.value) return

  const date = when.value ? new Date(when.value) : null
  if (!date || Number.isNaN(date.getTime())) {
    notify('先选一个时间，道爷好掐指')
    return
  }

  try {
    const { month, day, shichen, leap } = lunarFromDate(date)
    numbers.num1 = String(month)
    numbers.num2 = String(day)
    numbers.num3 = String(shichen)
    results.value = []
    currentKey.value = null
    notify(
      `农历${leap ? '闰' : ''}${month}月${day}日 ${SHICHEN_NAMES[shichen - 1]}时` +
        `（${month} / ${day} / ${shichen}）`
    )
  } catch (error) {
    notify(error instanceof Error ? error.message : '农历转换失败')
  }
}

async function start(values) {
  const token = (runToken += 1)
  running.value = true
  results.value = []
  currentKey.value = null
  stepText.value = ''

  // 月上起日、日上起时：先算出三个落宫，再按顺序一格一格走过去
  const positions = divine(values)
  const totalSteps = positions.reduce((sum, target, index) => {
    const previous = index === 0 ? 0 : positions[index - 1]
    return sum + ((target - previous + HEXAGRAMS.length) % HEXAGRAMS.length)
  }, 0)

  let position = 0
  let done = 0

  try {
    await sleep(INITIAL_MS)
    if (totalSteps === 0) {
      // 三个数字都停在原地，给一点停顿，避免看起来像没反应
      await sleep(HOLD_MS)
    }

    for (const target of positions) {
      const steps = (target - position + HEXAGRAMS.length) % HEXAGRAMS.length
      for (let step = 0; step < steps; step += 1) {
        if (token !== runToken) return
        await sleep(delayFor(totalSteps - done))
        done += 1
        position = (position + 1) % HEXAGRAMS.length
        currentKey.value = HEXAGRAMS[position].key
        stepText.value = `第 ${done} / ${totalSteps} 步 · ${HEXAGRAMS[position].key}`
      }
      if (token !== runToken) return
      currentKey.value = HEXAGRAMS[position].key
      results.value = [...results.value, HEXAGRAMS[position]]
      if (steps > 0) buzz(12)
    }

    stepText.value = ''
    liveText.value = `起卦结果：${results.value.map((item) => item.key).join('、')}`
    buzz([0, 30, 60, 45])
  } finally {
    if (token === runToken) running.value = false
  }
}

function onSubmit() {
  if (running.value) return

  const values = [numbers.num1, numbers.num2, numbers.num3].map((raw) =>
    raw === '' ? Number.NaN : Number(raw)
  )
  if (!values.every(isValidInput)) {
    notify('三个数字都要填 1~1000 的整数，道爷才算得动')
    return
  }

  void start(values)
}

function reset() {
  runToken += 1
  running.value = false
  results.value = []
  currentKey.value = null
  stepText.value = ''
  liveText.value = ''
  numbers.num1 = ''
  numbers.num2 = ''
  numbers.num3 = ''
  message.value = ''
}

onBeforeUnmount(() => {
  runToken += 1
  clearTimeout(messageTimer)
})
</script>

<style scoped>
.app {
  box-sizing: border-box;
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  margin-bottom: 20px;
  text-align: center;
}

.title {
  margin: 0;
  font-size: 26px;
  letter-spacing: 4px;
}

.subtitle {
  margin: 6px 0 0;
  color: #8c8c8c;
  font-size: 13px;
  letter-spacing: 2px;
}

.palm {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border-top: 1px solid #333;
  border-left: 1px solid #333;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: clamp(46px, 13vw, 64px);
  border-right: 1px solid #333;
  border-bottom: 1px solid #333;
}

.cell.shaded {
  background: antiquewhite;
}

.hex {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 74%;
  padding: 4px 0;
  border: 2px solid transparent;
  border-radius: 3px;
  color: #fff;
  font-size: clamp(13px, 3.4vw, 15px);
  transition:
    transform 0.12s ease,
    opacity 0.2s ease,
    box-shadow 0.12s ease;
}

.hex.good {
  background: #18a058;
}

.hex.bad {
  background: #d03050;
}

.hex.is-current {
  position: relative;
  z-index: 2;
  border-color: #333;
  box-shadow:
    0 0 0 3px rgba(255, 255, 255, 0.9),
    0 0 0 5px rgba(43, 43, 43, 0.35),
    0 8px 16px rgba(0, 0, 0, 0.22);
  transform: scale(1.12);
}

/* 推算过程中：当前六神跳动，其余淡出，视线跟着走 */
.palm.is-running .hex.is-current {
  animation: pulse 0.62s ease-in-out infinite;
}

.palm.is-running .hex:not(.is-current) {
  opacity: 0.45;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1.12);
  }

  50% {
    transform: scale(1.22);
  }
}

.status {
  min-height: 22px;
  margin: 10px 0 0;
  color: #8c8c8c;
  font-size: 13px;
  letter-spacing: 1px;
  text-align: center;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  white-space: nowrap;
  clip-path: inset(50%);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.field label {
  color: #555;
  font-size: 14px;
}

.inline {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.inline .input {
  flex: 1 1 200px;
  min-width: 0;
}

.input {
  box-sizing: border-box;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fff;
  color: inherit;
  font-size: 15px;
}

.input:focus-visible {
  outline: 2px solid #18a058;
  outline-offset: 1px;
}

.numbers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.results {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.result {
  flex: 1;
  width: auto;
  height: 38px;
  animation: pop 0.22s ease-out;
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.82);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.btn {
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: #fff;
  color: #333;
  font-size: 15px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--good {
  background: #18a058;
  color: #fff;
}

.btn--info {
  border-color: #bfe3d0;
  background: #e8f3ee;
  color: #0f7a45;
}

.btn--ghost {
  border-color: #d9d9d9;
}

.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  z-index: 10;
  max-width: min(90vw, 480px);
  margin: 0;
  padding: 10px 16px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.82);
  color: #fff;
  font-size: 14px;
  transform: translateX(-50%);
}

@media (prefers-reduced-motion: reduce) {
  .hex,
  .result {
    transition: none;
    animation: none;
  }

  .hex.is-current {
    transform: none;
  }
}
</style>
