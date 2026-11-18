import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPaperGenerationProgress } from '../src/generation-progress.js'

const paperId = '11111111-1111-4111-8111-111111111111'
function fixture(hooks = {}) {
  const calls = []
  const React = {
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }),
    useId: () => 'progress-title', useEffect() {}, useState: initial => [initial(), () => {}], ...hooks,
  }
  const store = { getSnapshot: () => ({}), cancelGeneration: () => calls.push(['cancel']),
    openPaper: id => calls.push(['open', id]), generate: id => calls.push(['generate', id]) }
  return { render: createPaperGenerationProgress(React, { Button: 'button', IconCheckOutlineRegular: 'check' }), store, calls }
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node
  for (const child of node.children || []) { const result = find(child, predicate); if (result) return result }
  return null
}

test('the progress card uses code-wiki stage states and one accessible current step', () => {
  const app = fixture()
  const card = app.render({ generation: { paperId, phase: 'reviewing', title: 'Research paper', elapsedMs: 1000, receivedAt: Date.now() }, store: app.store })
  assert.equal(card.props.className, 'dsh-paper-wiki-generation')
  const heading = find(card, node => node.type === 'h2')
  assert.equal(heading.children[0], '正在核对内容')
  assert.equal(card.props['aria-labelledby'], heading.props.id)
  assert.equal(find(card, node => node.props.role === 'progressbar').props['aria-labelledby'], heading.props.id)
  const stages = find(card, node => node.type === 'ol')
  assert.equal(stages.props['aria-label'], '生成阶段')
  assert.deepEqual(stages.children.map(node => node.props['data-state']), ['done', 'done', 'active', 'waiting'])
  assert.deepEqual(stages.children.map(node => node.props['aria-current']), [undefined, undefined, 'step', undefined])
  assert.deepEqual(stages.children.map(node => node.children[1]), ['读取论文', '撰写讲解', '核对内容', '保存讲解'])
  assert.equal(stages.children[0].children[0].props['aria-hidden'], true)
  assert(find(stages.children[0], node => node.type === 'check'))
  find(card, node => node.type === 'button').props.onClick()
  assert.deepEqual(app.calls, [['cancel']])
})

test('the timer advances from received elapsed time and cleans up its interval', t => {
  let now = 100_000, state, mounted = false, tick, cleanup, cleared
  t.mock.method(Date, 'now', () => now)
  t.mock.method(globalThis, 'setInterval', (callback, delay) => { tick = callback; assert.equal(delay, 250); return 42 })
  t.mock.method(globalThis, 'clearInterval', value => { cleared = value })
  const app = fixture({ useState(initial) { if (state === undefined) state = initial(); return [state, value => { state = value }] },
    useEffect(install) { if (!mounted) { mounted = true; cleanup = install() } } })
  const card = app.render({ generation: { phase: 'writing', elapsedMs: 60_500, receivedAt: 99_500 }, store: app.store })
  const clock = find(card, node => node.type?.name === 'GenerationClock')
  let timer = find(clock.type(clock.props), node => node.props.role === 'timer')
  assert.equal(timer.children[0], '01:01')
  assert.equal(timer.props.dateTime, 'PT61S')
  assert.equal(timer.props['aria-label'], '生成耗时')
  now = 101_750; tick()
  timer = find(clock.type(clock.props), node => node.props.role === 'timer')
  assert.equal(timer.children[0], '01:02')
  assert.equal(timer.props.dateTime, 'PT62S')
  cleanup()
  assert.equal(cleared, 42)
})

test('offline and reading stages retain the same card while upload cancellation needs no paper id', () => {
  const app = fixture()
  const card = app.render({ generation: { id: 'preparing', phase: 'reading', fileName: 'paper.pdf', elapsedMs: 0, receivedAt: Date.now() }, offline: true, store: app.store })
  assert.equal(find(card, node => node.type === 'h2').children[0], '正在读取论文')
  assert.equal(find(card, node => node.props.className === 'dsh-paper-wiki-generation-repo').children[0], 'paper.pdf')
  assert.equal(find(card, node => node.props.className === 'dsh-paper-wiki-generation-detail').children[0], '正在重新连接，稍后会同步进度。')
  const stages = find(card, node => node.type === 'ol')
  assert.deepEqual(stages.children.map(node => node.props['data-state']), ['active', 'waiting', 'waiting', 'waiting'])
  find(card, node => node.type === 'button').props.onClick()
  assert.deepEqual(app.calls, [['cancel']])
})

test('terminal results have no active timer or progressbar and retry the intended paper only on click', () => {
  const app = fixture()
  const failed = app.render({ generation: { paperId, phase: 'failed', title: 'Research paper', elapsedMs: 61_000, error: '模型连接中断。' }, store: app.store })
  assert.equal(app.calls.length, 0)
  assert.equal(find(failed, node => node.type === 'p').props.role, 'alert')
  assert.equal(find(failed, node => node.type === 'p').children[1], '模型连接中断。')
  assert.equal(find(failed, node => node.props.role === 'progressbar'), null)
  assert.equal(find(failed, node => node.type?.name === 'GenerationClock'), null)
  find(failed, node => node.type === 'button').props.onClick()
  assert.deepEqual(app.calls, [['generate', paperId]])
  const completed = app.render({ generation: { paperId, phase: 'completed', title: 'Research paper', elapsedMs: 61_000 }, store: app.store })
  assert.equal(find(completed, node => node.type === 'p').props.role, 'status')
  assert(find(completed, node => node.type === 'check'))
  assert.equal(find(completed, node => node.type === 'span').children[0], 'Research paper · 用时 1 分 1 秒')
  find(completed, node => node.type === 'button').props.onClick()
  assert.deepEqual(app.calls[1], ['open', paperId])
  const cancelled = app.render({ generation: { paperId, phase: 'cancelled', elapsedMs: 0 }, store: app.store })
  assert.equal(find(cancelled, node => node.type === 'p').props.role, 'status')
  assert.equal(find(cancelled, node => node.props.role === 'progressbar'), null)
})
