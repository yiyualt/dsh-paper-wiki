import assert from 'node:assert/strict'
import vm from 'node:vm'
import { test } from 'node:test'
import { evaluatePaperCalculation } from '../src/paper-calculation.js'

const calculation = () => ({ type: 'calculation', mode: 'illustrative', precision: 4,
  inputs: [{ id: 'neighbor', value: .6, min: 0, max: 1, step: .05 }, { id: 'seed', value: .8, min: 0, max: 1, step: .05 }],
  expression: { op: 'add', args: [
    { op: 'multiply', args: [{ number: .55 }, { input: 'neighbor' }] },
    { op: 'multiply', args: [{ number: .25 }, { input: 'seed' }] },
    { number: .2 },
  ] } })

test('calculates the declared AST and recomputes only explicitly editable teaching parameters', () => {
  assert(Math.abs(evaluatePaperCalculation(calculation()) - .73) < 1e-12)
  assert(Math.abs(evaluatePaperCalculation(calculation(), { neighbor: .4 }) - .62) < 1e-12)
  assert.throws(() => evaluatePaperCalculation(calculation(), { neighbor: 2 }), /超出/)
  assert.throws(() => evaluatePaperCalculation(calculation(), { unknown: .5 }), /未知/)
  assert.throws(() => evaluatePaperCalculation(calculation(), { neighbor: NaN }), /有限/)
})

test('paper values and teaching inputs without a declared range remain fixed', () => {
  const block = calculation(); block.mode = 'paper'
  assert.throws(() => evaluatePaperCalculation(block), /仅构造示例/)
  block.inputs = block.inputs.map(({ id, value }) => ({ id, value }))
  assert(Math.abs(evaluatePaperCalculation(block) - .73) < 1e-12)
  assert.throws(() => evaluatePaperCalculation(block, { seed: .3 }), /固定值/)
  block.mode = 'illustrative'
  assert.throws(() => evaluatePaperCalculation(block, { seed: .3 }), /固定值/)
})

test('rejects partial ranges, duplicate identifiers, invalid steps and oversized inputs', () => {
  for (const change of [input => { delete input.step }, input => { input.min = input.max }, input => { input.step = 0 },
    input => { input.step = 2 }, input => { input.value = -1 }, input => { input.value = 1e6 + 1 },
    input => { input.value = Infinity }, input => { input.id = 'unsafe id' }]) {
    const block = calculation(); change(block.inputs[0])
    assert.throws(() => evaluatePaperCalculation(block))
  }
  const duplicate = calculation(); duplicate.inputs[1].id = duplicate.inputs[0].id
  assert.throws(() => evaluatePaperCalculation(duplicate), /重复/)
  const incomplete = calculation(); incomplete.inputs[0] = null
  assert.throws(() => evaluatePaperCalculation(incomplete), /编号/)
})

test('rejects ambiguous nodes, executable expressions and missing inputs', () => {
  for (const expression of [null, [], 'neighbor + seed', { input: 'absent' }, { number: 1, input: 'seed' },
    { op: 'eval', args: [{ number: 1 }, { number: 2 }] },
    { op: 'subtract', args: [{ number: 1 }, { number: 2 }, { number: 3 }] },
    { op: 'add', args: [{ number: 1 }] }]) {
    assert.throws(() => evaluatePaperCalculation({ ...calculation(), expression }))
  }
})

test('rejects zero denominators, nonfinite intermediate results and oversized expression trees', () => {
  assert.throws(() => evaluatePaperCalculation({ ...calculation(), expression: { op: 'divide', args: [{ input: 'seed' }, { number: 0 }] } }), /分母/)
  assert.throws(() => evaluatePaperCalculation({ ...calculation(), expression: { op: 'multiply', args: [{ number: Number.MAX_VALUE }, { number: 2 }] } }), /有限/)
  let deep = { input: 'seed' }
  for (let i = 0; i < 6; i++) deep = { op: 'add', args: [deep, { number: 0 }] }
  assert.throws(() => evaluatePaperCalculation({ ...calculation(), expression: deep }), /6 层/)
  const wide = { op: 'add', args: Array.from({ length: 8 }, () => ({ op: 'add', args: Array.from({ length: 8 }, () => ({ number: 1 })) })) }
  assert.throws(() => evaluatePaperCalculation({ ...calculation(), expression: wide }), /64 个节点/)
  const dynamicZero = { ...calculation(), expression: { op: 'divide', args: [{ input: 'seed' }, { input: 'neighbor' }] } }
  assert.throws(() => evaluatePaperCalculation(dynamicZero, { neighbor: 0 }), /分母/)
})

test('function source is self-contained and works offline in a fresh browser-like realm', () => {
  const evaluate = vm.runInNewContext('(' + evaluatePaperCalculation.toString() + ')')
  assert(Math.abs(evaluate(JSON.parse(JSON.stringify(calculation())), { seed: .4 }) - .63) < 1e-12)
  assert.equal(evaluate({ ...calculation(), inputs: [{ id: '__proto__', value: 2 }, { id: 'constructor', value: 3 }],
    expression: { op: 'add', args: [{ input: '__proto__' }, { input: 'constructor' }] } }), 5)
})
