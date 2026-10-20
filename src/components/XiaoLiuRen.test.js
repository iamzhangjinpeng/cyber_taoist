// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import XiaoLiuRen from './XiaoLiuRen.vue'

const flush = () => new Promise((resolve) => queueMicrotask(resolve))

async function fillNumbers(wrapper, values) {
  const inputs = wrapper.findAll('input[type="number"]')
  for (const [index, value] of values.entries()) {
    await inputs[index].setValue(String(value))
  }
}

describe('XiaoLiuRen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('渲染 30 个掌诀格子和 6 个六神', () => {
    const wrapper = mount(XiaoLiuRen)
    expect(wrapper.findAll('.cell')).toHaveLength(30)
    expect(wrapper.findAll('.hex')).toHaveLength(6)
    expect(wrapper.text()).toContain('大安')
  })

  it('正月初一可以换算（旧实现在这里失败）', async () => {
    const wrapper = mount(XiaoLiuRen)
    await wrapper.find('#when').setValue('2024-02-10T10:00')
    await wrapper.find('.btn--info').trigger('click')

    const inputs = wrapper.findAll('input[type="number"]')
    expect(inputs.map((input) => input.element.value)).toEqual(['1', '1', '6'])
    expect(wrapper.find('.toast').text()).toContain('农历1月1日')
  })

  it('闰二月可以换算（旧实现解析为 undefined）', async () => {
    const wrapper = mount(XiaoLiuRen)
    await wrapper.find('#when').setValue('2023-03-22T10:00')
    await wrapper.find('.btn--info').trigger('click')

    const inputs = wrapper.findAll('input[type="number"]')
    expect(inputs.map((input) => input.element.value)).toEqual(['2', '1', '6'])
    expect(wrapper.find('.toast').text()).toContain('闰2月1日')
  })

  it('清空时间后给出提示，而不是静默失败', async () => {
    const wrapper = mount(XiaoLiuRen)
    await wrapper.find('#when').setValue('')
    await wrapper.find('.btn--info').trigger('click')
    expect(wrapper.find('.toast').text()).toContain('先选一个时间')
  })

  it('起卦后依次显示三个结果（月上起日、日上起时）', async () => {
    const wrapper = mount(XiaoLiuRen)
    await fillNumbers(wrapper, [3, 5, 8])
    await wrapper.find('form').trigger('submit')

    await vi.advanceTimersByTimeAsync(5000)
    await flush()

    const results = wrapper.findAll('.result')
    expect(results.map((item) => item.text())).toEqual(['速喜', '大安', '留连'])
    expect(wrapper.findAll('.hex.is-current')).toHaveLength(1)
  })

  it('推算过程中显示步数，结束后清空并播报结果', async () => {
    const wrapper = mount(XiaoLiuRen)
    await fillNumbers(wrapper, [3, 5, 8])
    await wrapper.find('form').trigger('submit')

    await vi.advanceTimersByTimeAsync(700)
    await flush()
    expect(wrapper.find('.status').text()).toMatch(
      /第 \d+ \/ 7 步 · (大安|留连|速喜|赤口|小吉|空亡)/
    )
    expect(wrapper.find('.palm').classes()).toContain('is-running')

    await vi.advanceTimersByTimeAsync(5000)
    await flush()
    expect(wrapper.find('.status').text()).toBe('')
    expect(wrapper.find('.palm').classes()).not.toContain('is-running')
    expect(wrapper.find('[role="status"]').text()).toBe('起卦结果：速喜、大安、留连')
  })

  it('第二个数从第一个落宫接着数，而不是从大安重来', async () => {
    const wrapper = mount(XiaoLiuRen)
    await fillNumbers(wrapper, [2, 3, 5])
    await wrapper.find('form').trigger('submit')
    await vi.advanceTimersByTimeAsync(5000)
    await flush()

    const results = wrapper.findAll('.result')
    expect(results.map((item) => item.text())).toEqual(['留连', '赤口', '留连'])
  })

  it('动画期间禁用按钮，重复点击不会叠加起卦', async () => {
    const wrapper = mount(XiaoLiuRen)
    await fillNumbers(wrapper, [3, 5, 8])

    const form = wrapper.find('form')
    await form.trigger('submit')
    await form.trigger('submit')
    await form.trigger('submit')

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(wrapper.findAll('input[type="number"]')[0].attributes('disabled')).toBeDefined()

    await vi.advanceTimersByTimeAsync(5000)
    await flush()

    expect(wrapper.findAll('.result')).toHaveLength(3)
    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
  })

  it('数字越界时给出提示且不起卦', async () => {
    const wrapper = mount(XiaoLiuRen)
    await fillNumbers(wrapper, [1, 2, 1001])
    await wrapper.find('form').trigger('submit')

    expect(wrapper.find('.toast').text()).toContain('1~1000')
    expect(wrapper.findAll('.result')).toHaveLength(0)
  })

  it('重新来过会清空输入和结果', async () => {
    const wrapper = mount(XiaoLiuRen)
    await fillNumbers(wrapper, [1, 1, 1])
    await wrapper.find('form').trigger('submit')
    await vi.advanceTimersByTimeAsync(5000)
    await flush()

    await wrapper.findAll('.btn--ghost')[0].trigger('click')

    expect(wrapper.findAll('.result')).toHaveLength(0)
    expect(
      wrapper.findAll('input[type="number"]').every((input) => input.element.value === '')
    ).toBe(true)
  })
})
