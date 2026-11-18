/** Shared trusted arithmetic for the reader and standalone HTML exports. No string evaluation. */
export function evaluatePaperCalculation(block, overrides = {}) {
  const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key)
  const fail = message => { throw new Error(message) }
  const finite = (value, label, bounded = false) => {
    if (typeof value !== 'number' || !Number.isFinite(value) || bounded && Math.abs(value) > 1e6) fail(label + '必须是有效范围内的有限数值。')
    return value
  }
  if (!record(block) || block.type !== 'calculation' || !['paper', 'illustrative'].includes(block.mode)) fail('计算示例格式或来源类型无效。')
  if (!Number.isInteger(block.precision) || block.precision < 0 || block.precision > 6) fail('计算结果精度必须为 0 至 6。')
  if (!Array.isArray(block.inputs) || block.inputs.length < 2 || block.inputs.length > 10) fail('计算示例需要 2 至 10 个参数。')
  if (!record(overrides)) fail('计算参数修改格式无效。')
  const inputs = new Map()
  for (const input of block.inputs) {
    if (!record(input) || typeof input.id !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(input.id) || inputs.has(input.id)) fail('计算参数编号无效或重复。')
    finite(input.value, '参数初始值', true)
    const rangeKeys = ['min', 'max', 'step'].filter(key => own(input, key))
    if (rangeKeys.length && (block.mode !== 'illustrative' || rangeKeys.length !== 3)) fail('仅构造示例可设置完整的 min、max、step 参数范围。')
    if (rangeKeys.length) {
      finite(input.min, '参数最小值', true)
      finite(input.max, '参数最大值', true)
      finite(input.step, '参数步长', true)
      if (input.min >= input.max || input.step <= 0 || input.step > input.max - input.min
        || input.value < input.min || input.value > input.max) fail('参数范围、步长或初始值无效。')
    }
    inputs.set(input.id, input)
  }
  for (const id of Object.keys(overrides)) {
    const input = inputs.get(id)
    if (!input) fail('修改包含未知计算参数。')
    if (block.mode !== 'illustrative' || !own(input, 'min')) fail('此参数为固定值，不能修改。')
    finite(overrides[id], '修改后的参数值', true)
    if (overrides[id] < input.min || overrides[id] > input.max) fail('修改后的参数值超出允许范围。')
  }
  let nodes = 0
  function calculate(node, depth) {
    if (++nodes > 64) fail('计算表达式超过 64 个节点。')
    if (depth > 6) fail('计算表达式超过 6 层。')
    if (!record(node)) fail('计算表达式节点格式无效。')
    const keys = Object.keys(node)
    if (own(node, 'input')) {
      if (keys.length !== 1 || typeof node.input !== 'string' || !inputs.has(node.input)) fail('表达式包含未知或不明确的参数引用。')
      return own(overrides, node.input) ? overrides[node.input] : inputs.get(node.input).value
    }
    if (own(node, 'number')) {
      if (keys.length !== 1) fail('计算常量节点格式无效。')
      return finite(node.number, '计算常量')
    }
    if (keys.length !== 2 || !own(node, 'op') || !own(node, 'args') || !['add', 'subtract', 'multiply', 'divide'].includes(node.op)) fail('计算只支持加、减、乘、除运算。')
    const binary = node.op === 'subtract' || node.op === 'divide'
    if (!Array.isArray(node.args) || node.args.length < 2 || node.args.length > (binary ? 2 : 8)) fail('计算运算的参数数量无效。')
    const values = []
    for (const argument of node.args) values.push(calculate(argument, depth + 1))
    let result
    if (node.op === 'add') result = values.reduce((sum, value) => sum + value, 0)
    else if (node.op === 'subtract') result = values[0] - values[1]
    else if (node.op === 'multiply') result = values.reduce((product, value) => product * value, 1)
    else {
      if (values[1] === 0) fail('分母不能为零。')
      result = values[0] / values[1]
    }
    return finite(result, '计算结果')
  }
  return calculate(block.expression, 1)
}
