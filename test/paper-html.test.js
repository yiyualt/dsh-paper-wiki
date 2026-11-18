import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import vm from 'node:vm'
import { createPaperHtml } from '../src/paper-html.js'

const behavior = await readFile(new URL('../src/export-behavior.js', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/export-styles.css', import.meta.url), 'utf8')
const ref = page => ({ page, quote: 'PRIVATE_SOURCE_QUOTE_MUST_NOT_BE_EXPORTED' })
const calculation = (mode = 'illustrative') => ({ type: 'calculation', title: '两项成本相加', mode,
  formula: '总成本 = a + b', inputs: [
    { id: 'a', label: '第一项', meaning: '第一项构造成本。', value: 2, ...(mode === 'illustrative' && { min: 0, max: 10, step: 1 }) },
    { id: 'b', label: '第二项', meaning: '第二项固定成本。', value: 3 },
  ], expression: { op: 'add', args: [{ input: 'a' }, { input: 'b' }] }, precision: 2,
  resultLabel: '总成本', interpretation: '按明确给出的加法规则手算，不是论文实验观测。', references: [ref(2)] })
const graph = () => ({ type: 'diagram', title: '候选选择关系', mode: 'illustrative', description: '给出选择和回看关系。',
  columns: [{ id: 'input', label: '输入候选' }, { id: 'output', label: '选中结果' }],
  nodes: [{ id: 'n1', label: '候选一', detail: '候选一完整说明', column: 'input' },
    { id: 'n2', label: '候选二', detail: '候选二完整说明', column: 'input' },
    { id: 'n3', label: '结果', detail: '结果的完整说明', column: 'output' }],
  edges: [{ id: 'e1', from: 'n1', to: 'n3', label: '被选入' }, { id: 'e2', from: 'n3', to: 'n2', label: '回看候选' },
    { id: 'e3', from: 'n1', to: 'n2', label: '同列比较' }],
  steps: [{ label: '读取候选', explanation: '先读取同一组候选。', activeNodes: ['n1', 'n2'], activeEdges: ['e3'] },
    { label: '选出结果', explanation: '再确定选中的结果。', activeNodes: ['n3'], activeEdges: ['e1', 'e2'] }], references: [ref(3)] })
const evidence = () => ({ type: 'evidence', title: '固定预算的前后选择', mode: 'illustrative', question: '方法与限制分别是什么？', budget: 2,
  required: ['处理方式', '适用限制'], items: [
    { id: 'c1', label: '方法片段', detail: '处理方式的说明。', supports: ['处理方式'] },
    { id: 'c2', label: '重复片段', detail: '重复的处理方式。', supports: ['处理方式'] },
    { id: 'c3', label: '限制片段', detail: '适用限制的说明。', supports: ['适用限制'] },
  ], states: [{ label: '基线选择', ids: ['c1', 'c2'], explanation: '两个位置只覆盖一项关系。' },
    { label: '替换之后', ids: ['c1', 'c3'], explanation: '替换重复内容后覆盖两项关系。' }], references: [ref(4)] })
const explanation = chapters => ({ title: '自编论文教学案例', summary: 'SUMMARY_NOT_NEEDED_IN_EXPORT', model: 'local-fixture', createdAt: '2026-11-19T00:00:00Z', durationMs: 2, chapters })
const paper = chapters => ({ title: '原始标题', fileName: 'synthetic.pdf', explanation: explanation(chapters),
  pages: [{ number: 1, text: 'PRIVATE_PDF_PAGE_MUST_NOT_BE_EXPORTED' }], privateConfig: 'PRIVATE_CONFIG_MUST_NOT_BE_EXPORTED' })
const scripts = html => [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
const dataOf = html => JSON.parse(scripts(html).find(match => match[1].includes('application/json'))[2])

test('exports seven continuous chapters with every typed teaching item and all source pages reduced to labels', () => {
  const chapters = [
    { id: 'overview', title: '论文做了什么', markdown: '', blocks: [
      { type: 'paragraph', text: '这是一份自己编写的教学说明。', references: [ref(1)] },
      { type: 'terms', title: '核心术语', items: [{ term: '候选', meaning: '已找到但尚未选择的对象。', role: '提供选择范围。', example: 'c1 是一个候选。', contrast: '候选不是最终上下文。' }], references: [ref(1)] },
    ] },
    { id: 'task', title: '任务与输入输出', markdown: '', blocks: [{ type: 'example', title: '同一组输入输出', mode: 'illustrative', references: [ref(2)], steps: [
      { label: '输入', language: 'json', code: '{\n  "query": "q1"\n}', explanation: 'q1 是这一次输入。' },
      { label: '中间', language: 'text', code: 'INTERMEDIATE_CANDIDATES', explanation: '同一批候选。' },
      { label: '最终输出', language: 'json', code: '{"selected":["c1","c3"]}', explanation: 'FINAL_STEP_EXPLANATION' },
    ] }] },
    { id: 'baselines', title: '基线与现有问题', markdown: '', blocks: [{ type: 'table', title: '基线差异', columns: ['方法', '不足'], rows: [['基线', '重复占用预算']], references: [ref(2)] }] },
    { id: 'method', title: '作者的方法', markdown: '', blocks: [graph(), { type: 'flow', title: '实际操作流程', steps: [
      { title: '读取', input: 'q1', operation: '获得候选', output: 'c1、c2、c3' },
      { title: '选择', input: '同一批候选', operation: '选择关系互补的项', output: 'c1、c3' },
    ], references: [ref(3)] }] },
    { id: 'setup', title: '实验如何设计', markdown: '', blocks: [evidence()] },
    { id: 'results', title: '结果与证据', markdown: '', blocks: [{ type: 'chart', title: '自编原始观测样本', context: '同一构造条件', metric: '耗时', unit: 'ms', direction: 'lower',
      data: [{ label: '方法甲', value: 12, display: '12', reference: ref(5) }, { label: '方法乙', value: 6, display: '6', reference: ref(5) }], references: [ref(5)] }] },
    { id: 'analysis', title: '结果分析与局限', markdown: '', blocks: [calculation()] },
  ]
  const result = createPaperHtml(paper(chapters), { styles, behavior })
  assert.equal((result.match(/class="pe-chapter"/g) || []).length, 7)
  assert.equal((result.match(/href="#chapter-/g) || []).length, 7)
  for (let number = 1; number <= 7; number++) assert(result.includes('id="chapter-' + number + '"'))
  for (const value of ['FINAL_STEP_EXPLANATION', 'INTERMEDIATE_CANDIDATES', '候选不是最终上下文。', '候选二完整说明', '回看候选', '同列比较', '同一批候选', '替换之后', '适用限制的说明。']) assert(result.includes(value), value)
  assert(result.includes('构造示例（非论文原始样本）'))
  assert(result.includes('（第 5 页）'))
  assert(!result.includes('PRIVATE_'))
  assert(!result.includes('SUMMARY_NOT_NEEDED_IN_EXPORT'))
  assert(!/\b(?:href|src)="https?:/i.test(result))
  assert(!/<(?:iframe|img|object|link)\b/i.test(result))
  assert(result.includes("connect-src 'none'"))
  assert(!result.includes('NaN'))
  assert(!/<(?:section|li|div|pre|code)\b[^>]*\shidden(?:\s|=|>)/i.test(result))
})

test('escapes hostile text and attributes and excludes raw quotations and untrusted metadata from script data', () => {
  const attack = '</script><img src="https://bad.invalid" onerror="globalThis.compromised=1">'
  const calc = calculation(); calc.title = attack; calc.formula = attack; calc.inputs[0].label = attack
  calc.expression.extraSecret = 'PRIVATE_AST_EXTRA'
  const graphBlock = graph(); graphBlock.nodes[0].label = attack; graphBlock.nodes[0].detail = attack
  const record = paper([{ id: attack, title: attack, markdown: '', blocks: [
    { type: 'paragraph', text: attack, references: [ref(1)] },
    { type: 'table', title: attack, columns: [attack, '说明'], rows: [[attack, 'safe']], references: [ref(2)] },
    graphBlock, calc,
  ] }])
  record.explanation.title = attack
  const result = createPaperHtml(record, { styles, behavior })
  assert(!/<img\b/i.test(result))
  assert.equal(scripts(result).length, 2)
  assert(result.includes('&lt;/script&gt;&lt;img'))
  assert(!result.includes('PRIVATE_'))
  const data = dataOf(result)
  assert.equal(data.length, 1)
  assert.equal('extraSecret' in data[0].block.expression, false)
  assert.equal('references' in data[0].block, false)
  assert.equal('formula' in data[0].block, false)
  const runtime = runtimeDocument([])
  const context = runExport(result, runtime.document)
  assert.equal(context.compromised, undefined)
})

test('renders legacy fences and tables as inert complete text while stripping saved source URLs', () => {
  const markdown = '### 旧讲解\n\n正文 [第 2 页](https://dsh-paper-wiki.invalid/source?id=old&page=2)。\n\n'
    + '| 字段 | 含义 |\n| --- | --- |\n| a\\|b | <img onerror="run()"> |\n\n'
    + '````text\nfirst\n```\n</pre><script>globalThis.compromised=1</script>\nLAST_FENCED_LINE\n````\n\nFINAL_LEGACY_PARAGRAPH'
  const result = createPaperHtml(paper([{ id: 'old', title: '旧格式', markdown }]), { behavior })
  assert(result.includes('<table>'))
  assert(result.includes('a|b'))
  assert(result.includes('LAST_FENCED_LINE'))
  assert(result.includes('FINAL_LEGACY_PARAGRAPH'))
  assert(result.includes('&lt;/pre&gt;&lt;script&gt;'))
  assert(!result.includes('dsh-paper-wiki.invalid'))
  assert(!/<img\b/.test(result))
  assert.equal(scripts(result).length, 2)
  assert.equal(runExport(result, runtimeDocument([]).document).compromised, undefined)
})

test('preserves every evidence state and computes actual coverage, additions and removals', () => {
  const result = createPaperHtml(paper([{ id: 'setup', title: '对照', markdown: '', blocks: [evidence()] }]))
  assert.equal((result.match(/class="pe-evidence-state"/g) || []).length, 2)
  assert(result.includes('关系覆盖 <strong>1 / 2</strong>'))
  assert(result.includes('关系覆盖 <strong>2 / 2</strong>'))
  assert(result.includes('移除：重复片段'))
  assert(result.includes('data-added="true"><strong>限制片段</strong><small>新增</small>'))
  assert(result.includes('data-covered="false">缺失：适用限制'))
  assert(result.includes('<details open'))
})

test('chart lengths reflect reported values with a real zero line for positive, negative and all-zero data', () => {
  const make = values => ({ type: 'chart', title: '构造观测值', context: '相同条件', metric: '差值', unit: '分', direction: 'higher',
    data: values.map((value, index) => ({ label: String(index), value, display: String(value), reference: ref(2) })), references: [ref(2)] })
  const positive = createPaperHtml(paper([{ title: '数据', blocks: [make([12, 6])] }]))
  assert(positive.includes('style="left:0%;width:100%"'))
  assert(positive.includes('style="left:0%;width:50%"'))
  const mixed = createPaperHtml(paper([{ title: '数据', blocks: [make([-5, 15])] }]))
  assert(mixed.includes('style="left:0%;width:25%"'))
  assert(mixed.includes('style="left:25%;width:75%"'))
  assert(mixed.includes('pe-chart-zero" style="left:25%"'))
  assert(!createPaperHtml(paper([{ title: '数据', blocks: [make([0, 0])] }])).includes('NaN'))
})

test('offline sliders use the same trusted AST evaluator as initial results and reject invalid changes', () => {
  const result = createPaperHtml(paper([{ title: '手算', blocks: [calculation()] }]), { behavior })
  assert(result.includes('data-raw-value="5">5.00</output>'))
  assert.equal((result.match(/type="range"/g) || []).length, 1)
  const group = new Element('section', { id: 'pe-c0-b0', 'data-calculation': '' })
  const slider = group.append(new Element('input', { type: 'range', 'data-calc-input': 'a' })); slider.value = '7'
  const shown = group.append(new Element('output', { 'data-calc-input-value': 'a' }))
  const output = group.append(new Element('output', { 'data-calculation-result': '' }))
  const runtime = runtimeDocument([group]); runExport(result, runtime.document)
  runtime.events.input({ target: slider })
  assert.equal(output.textContent, '10.00')
  assert.equal(output.dataset.rawValue, '10')
  assert.equal(shown.textContent, '7')
  slider.value = '999'; runtime.events.input({ target: slider })
  assert.equal(output.dataset.state, 'error')
  assert.equal(output.textContent, '当前参数无法计算。')
  slider.value = '0'; runtime.events.input({ target: slider })
  assert.equal(output.textContent, '3.00')
  assert.equal(output.dataset.state, 'ready')
  const actual = createPaperHtml(paper([{ title: '论文固定值', blocks: [calculation('paper')] }]), { behavior })
  assert(!actual.includes('type="range"'))
  assert(actual.includes('data-raw-value="5">5.00</output>'))
})

test('off-grid initial values retain exact values through a continuous slider and initial recalculation', () => {
  const block = calculation(); block.inputs[0].value = 2.5
  const result = createPaperHtml(paper([{ title: '非格点初值', blocks: [block] }]), { behavior })
  assert(result.includes('step="any" value="2.5"'))
  assert(result.includes('data-raw-value="5.5">5.50</output>'))
  assert.equal(dataOf(result)[0].block.inputs[0].step, 1, 'declared mathematical input metadata is retained')
  const group = new Element('section', { id: 'pe-c0-b0', 'data-calculation': '' })
  const slider = group.append(new Element('input', { 'data-calc-input': 'a' })); slider.value = '2.5'
  const shown = group.append(new Element('output', { 'data-calc-input-value': 'a' }))
  const output = group.append(new Element('output', { 'data-calculation-result': '' }))
  const runtime = runtimeDocument([group]); runExport(result, runtime.document)
  runtime.events.input({ target: slider })
  assert.equal(shown.textContent, '2.5')
  assert.equal(output.textContent, '5.50')
  slider.value = '2.75'; runtime.events.input({ target: slider })
  assert.equal(output.textContent, '5.75')

  const noisy = calculation(); noisy.inputs[0] = { ...noisy.inputs[0], value: 0.30000000000000004, step: .1 }
  assert(!createPaperHtml(paper([{ title: '浮点格点', blocks: [noisy] }])).includes('step="any"'))
})

test('offline diagram controls highlight actual node/edge IDs and keyboard selection never hides complete explanations', () => {
  const result = createPaperHtml(paper([{ title: '关系', blocks: [graph()] }]), { behavior })
  const group = new Element('section', { 'data-diagram': '' })
  const nodes = ['n1', 'n2', 'n3'].map(id => group.append(new Element('g', { 'data-export-action': 'diagram-node', 'data-node-id': id })))
  const edges = ['e1', 'e2', 'e3'].map(id => group.append(new Element('g', { 'data-edge-id': id })))
  const edgeLabels = ['e1', 'e2', 'e3'].map(id => group.append(new Element('g', { 'data-edge-label-id': id })))
  const controls = group.append(new Element('div', { 'data-export-controls': '' }))
  const buttons = graph().steps.map((step, index) => controls.append(new Element('button', { 'data-export-action': 'diagram-step', 'data-step-index': String(index),
    'data-active-nodes': JSON.stringify(step.activeNodes), 'data-active-edges': JSON.stringify(step.activeEdges) })))
  const details = ['n1', 'n2', 'n3'].map(id => group.append(new Element('div', { 'data-node-detail': id })))
  const runtime = runtimeDocument([group]); runExport(result, runtime.document)
  runtime.events.click({ target: buttons[1] })
  assert.deepEqual(nodes.map(node => node.dataset.active), ['false', 'false', 'true'])
  assert.deepEqual(edges.map(edge => edge.dataset.active), ['true', 'true', 'false'])
  assert.deepEqual(edgeLabels.map(label => label.dataset.active), ['true', 'true', 'false'])
  let prevented = false
  runtime.events.keydown({ target: nodes[1], key: ' ', preventDefault() { prevented = true } })
  assert(prevented)
  assert.equal(nodes[1].attributes['aria-pressed'], 'true')
  assert.equal(details[1].dataset.selected, 'true')
  runtime.events.keydown({ target: buttons[1], key: 'Home', preventDefault() {} })
  assert.equal(buttons[0].focused, true)
  assert.deepEqual(nodes.map(node => node.dataset.active), ['true', 'true', 'false'])
  assert(!Object.keys(nodes[0].attributes).includes('hidden'))
  assert(result.includes('先读取同一组候选。'))
  assert(result.includes('再确定选中的结果。'))
})

test('compact relation labels stay outside node boxes and each other for long, reverse, same-column and dense edges', () => {
  const block = graph()
  block.columns = [0, 1, 2, 3].map(index => ({ id: 'col' + index, label: '分组' + index }))
  block.nodes = [
    { id: 'a', label: 'A', detail: '输入', column: 'col0' }, { id: 'b', label: 'B', detail: '同列候选', column: 'col0' },
    { id: 'c', label: 'C', detail: '中间对象', column: 'col1' }, { id: 'd', label: 'D', detail: '中间结果', column: 'col2' },
    { id: 'e', label: 'E', detail: '输出', column: 'col3' },
  ]
  const long = '这是一个需要完整保留在提示与列表中的很长中文关系说明'
  block.edges = [
    { id: 'forward', from: 'a', to: 'e', label: long },
    { id: 'reverse', from: 'e', to: 'a', label: 'A very long reverse relationship across intermediate columns' },
    { id: 'same-down', from: 'a', to: 'b', label: '同列向下关系的完整说明' },
    { id: 'same-up', from: 'b', to: 'a', label: '同列反向关系的完整说明' },
    ...Array.from({ length: 20 }, (_, index) => ({ id: 'dense-' + index, from: 'a', to: 'e', label: '不同关系的完整上下文说明' + index })),
  ]
  const result = createPaperHtml(paper([{ title: '长关系标签', blocks: [block] }]))
  const attributes = value => Object.fromEntries([...value.matchAll(/([A-Za-z-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]))
  const rectangle = (attrs, x = 0, y = 0) => ({ left: x + Number(attrs.x), right: x + Number(attrs.x) + Number(attrs.width), top: y + Number(attrs.y), bottom: y + Number(attrs.y) + Number(attrs.height) })
  const nodes = [...result.matchAll(/<rect class="pe-node-box"([^>]*)>/g)].map(match => rectangle(attributes(match[1])))
  const labels = [...result.matchAll(/<g class="pe-edge-label"([^>]*)>([\s\S]*?)<\/g>/g)].map(match => {
    const transform = /translate\(([-+\d.eE]+) ([-+\d.eE]+)\)/.exec(attributes(match[1]).transform)
    const rect = /<rect class="pe-edge-label-box"([^>]*)>/.exec(match[2])
    const lines = [...match[2].matchAll(/<tspan([^>]*)>([^<]*)<\/tspan>/g)]
    assert(lines.length >= 1 && lines.length <= 2)
    for (const line of lines) assert(Number(attributes(line[1]).textLength || attributes(line[1]).textlength) <= 50)
    return rectangle(attributes(rect[1]), Number(transform[1]), Number(transform[2]))
  })
  assert.equal(labels.length, block.edges.length)
  const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  for (let index = 0; index < labels.length; index++) {
    assert(nodes.every(node => !intersects(labels[index], node)), 'relation label must not occupy any node box')
    assert(labels.slice(index + 1).every(other => !intersects(labels[index], other)), 'relation labels must not overlap')
  }
  assert(result.includes('…</tspan>'))
  assert(result.includes('<title>' + long + '</title>'))
  const fullList = result.match(/<ul class="pe-edge-details">([\s\S]*?)<\/ul>/)[1]
  for (const edge of block.edges) assert(fullList.includes(edge.label), 'complete relation text must remain visible')
})

test('unsupported arithmetic is displayed as unavailable rather than evaluating model formula text', () => {
  const block = calculation(); block.expression = { op: 'execute', args: [] }; block.formula = 'globalThis.compromised=1'
  const result = createPaperHtml(paper([{ title: '坏计算', blocks: [block] }]), { behavior })
  assert(result.includes('当前参数无法计算。'))
  assert.deepEqual(dataOf(result), [])
  assert.equal(runExport(result, runtimeDocument([]).document).compromised, undefined)
  assert.throws(() => createPaperHtml({ title: '未讲解' }), TypeError)
})

class Element {
  constructor(tag, attributes = {}) {
    this.tag = tag; this.attributes = {}; this.dataset = {}; this.children = []; this.parentElement = null; this.textContent = ''; this.id = ''
    for (const [name, value] of Object.entries(attributes)) this.setAttribute(name, value)
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value)
    if (name === 'id') this.id = String(value)
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = String(value)
  }
  append(child) { child.parentElement = this; this.children.push(child); return child }
  matches(selector) {
    return selector.split(',').some(part => {
      const match = /^([a-z]+)?(?:\[([^=\]]+)(?:="([^"]*)")?\])?$/.exec(part.trim())
      return !!match && (!match[1] || this.tag === match[1]) && (!match[2] || Object.hasOwn(this.attributes, match[2]) && (match[3] === undefined || this.attributes[match[2]] === match[3]))
    })
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]) }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null }
  focus() { this.focused = true }
}

function runtimeDocument(groups) {
  const root = new Element('body'), data = root.append(new Element('script', { id: 'paper-export-calculations' })), events = {}
  for (const group of groups) root.append(group)
  return { data, events, document: { getElementById(id) { return [root, ...root.querySelectorAll('[id]')].find(node => node.id === id) || null },
    addEventListener(name, listener) { events[name] = listener }, querySelectorAll: selector => root.querySelectorAll(selector) } }
}

function runExport(html, document) {
  const parts = scripts(html), data = parts.find(match => match[1].includes('application/json'))
  document.getElementById('paper-export-calculations').textContent = data[2]
  const context = vm.createContext({ document, fetch() { throw new Error('Offline export attempted a network call') } })
  vm.runInContext(parts.find(match => !match[1].includes('application/json'))[2], context, { timeout: 1000 })
  return context
}
