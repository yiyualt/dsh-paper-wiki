import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateContentBlocks, renderContentMarkdown } from '../src/paper-content.js'

const paper = { pages: [
  { number: 1, text: 'The method accepts a query and returns ranked documents. The baseline recomputes every request; caching reuses prior outputs.' },
  { number: 2, text: 'For the fixed workload, baseline latency was 1,200 ms and cached latency was 600 ms. Accuracy was 98.5% under the same evaluation setup.' },
  { number: 3, text: 'The reference scientific value was 1.2e-3 for the first configuration and 2.4e-3 for the second configuration.' },
] }
const ref = { page: 1, quote: 'The method accepts a query and returns ranked documents.' }
const refs = [ref]
const example = () => ({ type: 'example', title: '输入输出示例', mode: 'illustrative', steps: [
  { label: '输入', language: 'json', code: '{"query":"sample"}', explanation: '查询作为输入。' },
  { label: '输出', language: 'json', code: '{"documents":["one","two"]}', explanation: '输出按顺序列出文档。' },
], references: refs })
const flow = () => ({ type: 'flow', title: '处理过程', steps: [
  { title: '读取输入', input: '查询', operation: '编码输入', output: '查询表示' },
  { title: '排序', input: '查询表示和文档', operation: '比较得分', output: '有序文档' },
], references: refs })
const table = () => ({ type: 'table', title: '方法对比', columns: ['方法', '操作'], rows: [['基线', '重新计算'], ['缓存', '复用结果']], references: refs })
const chart = () => ({ type: 'chart', title: '固定负载耗时', context: '相同请求序列', metric: '延迟', unit: 'ms', direction: 'lower', data: [
  { label: '基线', value: 1200, display: '1,200', reference: { page: 2, quote: 'baseline latency was 1,200 ms' } },
  { label: '缓存', value: 600, display: '600', reference: { page: 2, quote: 'cached latency was 600 ms' } },
], references: [{ page: 2, quote: 'For the fixed workload, baseline latency was 1,200 ms and cached latency was 600 ms.' }] })
const terms = () => ({ type: 'terms', title: '读懂方法需要的概念', items: [
  { term: '来源', meaning: '记录事实出现在哪个原始段落。', role: '使选中的事实可以返回原段落。', example: '事实甲来自段落d1。', contrast: '相同事实可在不同段落分别出现。' },
  { term: '覆盖关系', meaning: '回答问题需要的已知关系。', role: '检查当前证据还缺哪项。', example: '需要关系甲与关系乙，d1只提供关系甲。' },
], references: refs })
const diagram = () => ({ type: 'diagram', title: '事实、实体与来源', mode: 'illustrative', description: '仅用于解释三类对象的关系。',
  columns: [{ id: 'entities', label: '实体' }, { id: 'facts', label: '命题出现' }, { id: 'sources', label: '来源段落' }],
  nodes: [{ id: 'entity1', label: '实验室A', detail: '一个被提到的实体。', column: 'entities' },
    { id: 'fact1', label: '关系甲', detail: '主体、关系与客体的出现。', column: 'facts' },
    { id: 'source1', label: 'd1', detail: '保存原始正文的来源段落。', column: 'sources' }],
  edges: [{ id: 'mention', from: 'fact1', to: 'entity1', label: '包含该实体' }, { id: 'origin', from: 'fact1', to: 'source1', label: '出现在该来源' }],
  steps: [{ label: '找到共同实体', explanation: '先确认命题涉及哪个实体。', activeNodes: ['fact1', 'entity1'], activeEdges: ['mention'] },
    { label: '返回原始来源', explanation: '再根据来源映射找到原段落。', activeNodes: ['fact1', 'source1'], activeEdges: ['origin'] }], references: refs })
const evidence = () => ({ type: 'evidence', title: '固定两段的证据状态', mode: 'illustrative', question: '需要哪两项关系才能回答？', budget: 2,
  required: ['关系甲', '关系乙'], items: [
    { id: 'd1', label: '已有证据', detail: '提供关系甲。', supports: ['关系甲'] },
    { id: 'd2', label: '无关段落', detail: '没有提供这两项关系。', supports: [] },
    { id: 'd3', label: '补充证据', detail: '提供关系乙。', supports: ['关系乙'] }],
  states: [{ label: '修复前', ids: ['d1', 'd2'], explanation: '两段中只覆盖关系甲。' },
    { label: '修复后', ids: ['d1', 'd3'], explanation: '仍是两段，覆盖关系甲与关系乙。' }], references: refs })
const calculation = () => ({ type: 'calculation', title: '一步候选评分', mode: 'illustrative', formula: 's = 0.55 × neighbor + 0.25 × seed + 0.20',
  inputs: [{ id: 'neighbor', label: '邻居相关度', meaning: '教学给定的邻居相似度。', value: .6, min: 0, max: 1, step: .05 },
    { id: 'seed', label: '种子相关度', meaning: '教学给定的种子相似度。', value: .8 }],
  expression: { op: 'add', args: [{ op: 'multiply', args: [{ number: .55 }, { input: 'neighbor' }] },
    { op: 'multiply', args: [{ number: .25 }, { input: 'seed' }] }, { number: .2 }] },
  precision: 4, resultLabel: '候选得分', interpretation: '这里只演示已给定数值的算术，不能视为实测效果。', references: refs })
const invalid = error => error.code === 'explanation-invalid' && error.status === 502

test('accepts the five typed blocks and discards untrusted extra metadata', () => {
  const blocks = [{ type: 'paragraph', text: '方法接收查询并返回排序结果。', references: refs, html: '<script>run()</script>' }, example(), flow(), table(), chart()]
  blocks[1].steps[0].onClick = 'run()'
  const result = validateContentBlocks(paper, blocks, 'task')
  assert.deepEqual(result.map(block => block.type), ['paragraph', 'example', 'flow', 'table', 'chart'])
  assert.equal('html' in result[0], false)
  assert.equal('onClick' in result[1].steps[0], false)
  assert.deepEqual(result[4].data[0].reference, chart().data[0].reference)
})

test('requires actual quoted evidence on the stated page and normalizes formatting differences', () => {
  const block = { type: 'paragraph', text: '说明。', references: [{ page: 1, quote: 'Ｔｈｅ method\n accepts a query and returns ranked documents.' }] }
  assert.equal(validateContentBlocks(paper, [block]).length, 1)
  for (const reference of [{ page: 99, quote: ref.quote }, { page: 2, quote: ref.quote }, { page: 1, quote: 'invented source sentence' }, { page: 1, quote: 'method' }]) {
    assert.throws(() => validateContentBlocks(paper, [{ ...block, references: [reference] }]), invalid)
  }
  assert.throws(() => validateContentBlocks(paper, [{ ...block, references: [] }]), invalid)
})

test('rejects malformed JSON code, missing provenance, unsupported languages and arbitrary block types', () => {
  const broken = example(); broken.steps[0].code = '{"query":'
  assert.throws(() => validateContentBlocks(paper, [broken]), invalid)
  const unknown = example(); unknown.steps[0].language = 'javascript'
  assert.throws(() => validateContentBlocks(paper, [unknown]), invalid)
  const provenance = example(); delete provenance.mode
  assert.throws(() => validateContentBlocks(paper, [provenance]), invalid)
  assert.throws(() => validateContentBlocks(paper, [{ type: 'script', code: 'run()', references: refs }]), invalid)
  assert.throws(() => validateContentBlocks(paper, [{ ...flow(), steps: [flow().steps[0]] }]), invalid)
})

test('rejects broken table dimensions and bounded content violations', () => {
  assert.throws(() => validateContentBlocks(paper, [{ ...table(), rows: [['one cell']] }]), invalid)
  assert.throws(() => validateContentBlocks(paper, [{ ...table(), columns: ['one'] }]), invalid)
  assert.throws(() => validateContentBlocks(paper, [{ ...table(), rows: Array(17).fill(['a', 'b']) }]), invalid)
  assert.throws(() => validateContentBlocks(paper, []), invalid)
  assert.throws(() => validateContentBlocks(paper, Array(11).fill(table())), invalid)
  const huge = example(); huge.steps = Array(6).fill({ ...huge.steps[0], language: 'text', code: 'x'.repeat(8000), explanation: 'y'.repeat(1500) })
  assert.throws(() => validateContentBlocks(paper, [huge, huge]), invalid)
})

test('requires every chart value to equal its display and occur in its own grounded quote', () => {
  for (const point of [
    { value: 999, display: '999' },
    { value: 1200, display: '1200' },
    { value: 1200, display: '1,200 ms' },
    { value: 200, display: '200' },
    { value: 600, display: '1,200' },
    { value: Infinity, display: 'Infinity' },
    { value: 1e13, display: '1e13' },
  ]) {
    const block = chart(); Object.assign(block.data[0], point)
    assert.throws(() => validateContentBlocks(paper, [block]), invalid)
  }
  const percentage = chart()
  percentage.data[0] = { label: '准确率', value: 98.5, display: '98.5%', reference: { page: 2, quote: 'Accuracy was 98.5% under the same evaluation setup.' } }
  assert.equal(validateContentBlocks(paper, [percentage])[0].data[0].value, 98.5)
  const scientific = chart()
  scientific.data = [1.2e-3, 2.4e-3].map((value, index) => ({ label: String(index), value, display: index ? '2.4e-3' : '1.2e-3',
    reference: { page: 3, quote: paper.pages[2].text } }))
  assert.deepEqual(validateContentBlocks(paper, [scientific])[0].data.map(point => point.value), [0.0012, 0.0024])
})

test('Markdown export labels provenance, preserves complete safe code fences and deduplicates page references', () => {
  const block = example()
  block.steps[0] = { ...block.steps[0], language: 'text', code: 'first\n```\n<script>alert(1)</script>\nlast' }
  block.references = [ref, ref]
  const markdown = renderContentMarkdown(validateContentBlocks(paper, [block]))
  assert.match(markdown, /构造示例（非论文原始样本）/)
  assert.ok(markdown.includes('````text\nfirst\n```\n<script>alert(1)</script>\nlast\n````'))
  assert.match(markdown, /#### 2\. 输出/)
  assert.equal((markdown.match(/第 1 页/g) ?? []).length, 1)
  assert.match(renderContentMarkdown([{ ...block, mode: 'paper' }]), /论文实例/)
})

test('Markdown export includes all flow fields, escaped table cells and chart conditions with row citations', () => {
  const compare = table(); compare.rows[0] = ['a|b', 'line1\nline2<script>']
  const markdown = renderContentMarkdown(validateContentBlocks(paper, [flow(), compare, chart()]))
  assert.match(markdown, /输入：查询表示和文档/)
  assert.match(markdown, /操作：比较得分/)
  assert.match(markdown, /输出：有序文档/)
  assert.ok(markdown.includes('a\\|b'))
  assert.ok(markdown.includes('line1 / line2&lt;script&gt;'))
  assert.ok(markdown.includes('实验条件：相同请求序列'))
  assert.ok(markdown.includes('指标：延迟；单位：ms；数值越低越好'))
  assert.ok(markdown.includes('| 基线 | 1,200 | 第 2 页 |'))
  assert.ok(!markdown.includes('<script>'))
})

test('rejects malformed nested persisted values with the same validation error', () => {
  const cases = [null, [], { type: 'paragraph', text: '说明。', references: [null] },
    { type: 'paragraph', text: { html: 'bad' }, references: refs },
    { ...example(), steps: [null, example().steps[1]] },
    { ...example(), steps: [[], example().steps[1]] },
    { ...flow(), steps: [null, flow().steps[1]] },
    { ...table(), rows: [null] },
    { ...table(), rows: [[{}, 'value']] },
    { ...chart(), data: [null, chart().data[1]] },
    { ...chart(), data: [{ ...chart().data[0], reference: [] }, chart().data[1]] },
  ]
  for (const block of cases) {
    assert.throws(() => validateContentBlocks(paper, [block]), invalid)
    assert.throws(() => renderContentMarkdown([block]), invalid)
  }
  for (const pages of [null, {}, [null], [{ number: 1, text: null }], [{ number: 1, text: 'a' }, { number: 1, text: 'b' }],
    [{ number: 1, text: 'x'.repeat(600_001) }]]) {
    assert.throws(() => validateContentBlocks({ pages }, [example()]), invalid)
  }
  const sparse = Array(1)
  assert.throws(() => validateContentBlocks(paper, sparse), invalid)
  assert.throws(() => validateContentBlocks(paper, [{ ...example(), references: sparse }]), invalid)
  assert.throws(() => validateContentBlocks(paper, [{ ...table(), rows: [Array(2)] }]), invalid)
  const circular = example(); circular.extra = circular
  assert.throws(() => validateContentBlocks(paper, [circular]), invalid)
})

test('rejects a chart quote cut from the middle of a larger source number', () => {
  const source = { pages: [{ number: 2, text: 'Baseline latency was 1,200 ms and the workload remained fixed. Cached latency was 600 ms in the same workload.' }] }
  const block = chart()
  block.references = [{ page: 2, quote: source.pages[0].text }]
  block.data[1].reference.quote = 'Cached latency was 600 ms in the same workload.'
  block.data[0] = { label: '伪造的较小值', value: 200, display: '200',
    reference: { page: 2, quote: '200 ms and the workload remained fixed.' } }
  assert.throws(() => validateContentBlocks(source, [block]), invalid)
  block.data[0] = { label: '基线', value: 1200, display: '1,200',
    reference: { page: 2, quote: 'Baseline latency was 1,200 ms and the workload remained fixed.' } }
  assert.equal(validateContentBlocks(source, [block])[0].data[0].value, 1200)
})

test('does not lose negative signs or confuse malformed numeric fragments with measurements', () => {
  for (const [reported, fabricated] of [['−600', '600'], ['-600', '600'], ['1,23', '23'], ['1.2.3', '2.3']]) {
    const source = { pages: [{ number: 2, text: `Baseline latency was ${reported} ms under the fixed workload. Cached latency was 600 ms.` }] }
    const block = chart()
    block.references = [{ page: 2, quote: source.pages[0].text }]
    block.data[0] = { label: '基线', value: Number(fabricated), display: fabricated,
      reference: { page: 2, quote: source.pages[0].text } }
    // Use a separate second observation so 600 cannot be justified by the other sentence.
    if (fabricated === '600') block.data[0].reference.quote = `Baseline latency was ${reported} ms under the fixed workload.`
    assert.throws(() => validateContentBlocks(source, [block]), invalid)
  }
  const source = { pages: [{ number: 2, text: 'Baseline latency was 1, 200 ms and accuracy was ９８．５％. Cached latency was 600.' }] }
  const block = chart()
  block.references = [{ page: 2, quote: source.pages[0].text }]
  block.data[0].reference.quote = 'Baseline latency was 1, 200 ms'
  block.data[1].reference.quote = 'Cached latency was 600.'
  assert.deepEqual(validateContentBlocks(source, [block])[0].data.map(point => point.value), [1200, 600])
  block.data[0] = { label: '准确率', value: 98.5, display: '98.5%', reference: { page: 2, quote: 'accuracy was ９８．５％.' } }
  assert.equal(validateContentBlocks(source, [block])[0].data[0].value, 98.5)
})

test('plain Markdown fields cannot introduce fences, lists, links or HTML outside code samples', () => {
  const paragraph = { type: 'paragraph', text: '说明\n~~~html\n<script>bad()</script>\n~~~\n- list\n1. item\n[link](javascript:bad())', references: refs }
  const markdown = renderContentMarkdown([paragraph])
  assert.ok(markdown.includes('\\~\\~\\~html'))
  assert.ok(markdown.includes('\\- list'))
  assert.ok(markdown.includes('1\\. item'))
  assert.ok(markdown.includes('\\[link\\]\\(javascript:bad\\(\\)\\)'))
  assert.ok(!markdown.includes('<script>'))
  const block = example(); block.steps[0].language = 'text\n```\n<script>bad()</script>'
  assert.throws(() => renderContentMarkdown([block]), invalid)
})

test('validates the four richer teaching blocks while retaining only declarative content', () => {
  const graph = diagram(); graph.svg = '<svg onload="bad()">'; graph.nodes[0].x = 999
  const values = validateContentBlocks(paper, [terms(), graph, evidence(), calculation()], 'method')
  assert.deepEqual(values.map(block => block.type), ['terms', 'diagram', 'evidence', 'calculation'])
  assert.equal(values[0].items[0].contrast, terms().items[0].contrast)
  assert.equal('svg' in values[1], false)
  assert.equal('x' in values[1].nodes[0], false)
  assert.deepEqual(values[1].edges.map(edge => [edge.from, edge.to]), [['fact1', 'entity1'], ['fact1', 'source1']])
  assert.equal('min' in values[3].inputs[1], false)
  for (const original of [terms(), diagram(), evidence(), calculation()]) {
    original.references = [{ page: 1, quote: 'invented supporting reference' }]
    assert.throws(() => validateContentBlocks(paper, [original]), invalid)
  }
})

test('terms require a definition, method role and concrete example for every item', () => {
  for (const mutate of [block => { block.items = [] }, block => { block.items[0] = null },
    block => { block.items[0].meaning = '' }, block => { block.items[0].role = {} },
    block => { block.items[0].example = 'x'.repeat(801) }, block => { block.items[0].contrast = [] }]) {
    const block = terms(); mutate(block)
    assert.throws(() => validateContentBlocks(paper, [block]), invalid)
  }
})

test('one locally introduced term is valid without forcing an unrelated second definition', () => {
  const block = terms(); block.items = [block.items[0]]
  const result = validateContentBlocks(paper, [block], 'setup')[0]
  assert.equal(result.items.length, 1)
  assert.deepEqual(result.items[0], block.items[0])
  assert(renderContentMarkdown([result]).includes(result.items[0].term))
})

test('diagrams reject unknown endpoints, invalid activation, self loops and duplicate IDs', () => {
  for (const mutate of [block => { block.nodes[0].column = 'missing' }, block => { block.edges[0].to = 'missing' },
    block => { block.edges[0].to = block.edges[0].from }, block => { block.edges[1].id = block.edges[0].id },
    block => { block.nodes[1].id = block.nodes[0].id }, block => { block.columns[1].id = block.columns[0].id },
    block => { block.steps[0].activeEdges = ['missing'] }, block => { block.steps[0].activeNodes = ['fact1', 'fact1'] },
    block => { block.nodes[0].id = '<svg>' }, block => { block.steps[0] = null }, block => { block.mode = 'estimated' }]) {
    const block = diagram(); mutate(block)
    assert.throws(() => validateContentBlocks(paper, [block]), invalid)
  }
})

test('evidence states preserve the exact budget and declared relationship coverage', () => {
  for (const mutate of [block => { block.budget = 0 }, block => { block.budget = 9 },
    block => { block.states[0].ids = ['d1'] }, block => { block.states[0].ids = ['d1', 'd1'] },
    block => { block.states[0].ids = ['d1', 'missing'] }, block => { block.items[0].supports = ['未声明关系'] },
    block => { block.required = ['关系甲', '关系甲'] }, block => { block.items[1].id = block.items[0].id },
    block => { block.items[1].supports = null }, block => { block.states[0] = null }]) {
    const block = evidence(); mutate(block)
    assert.throws(() => validateContentBlocks(paper, [block]), invalid)
  }
})

test('calculation content rejects unsafe or invalid arithmetic before persistence', () => {
  for (const mutate of [block => { block.mode = 'paper' }, block => { block.inputs[0].max = .5 },
    block => { block.inputs[0].step = 0 }, block => { block.inputs[0].meaning = '' },
    block => { block.expression = 'eval("bad()")' }, block => { block.expression = { input: 'missing' } },
    block => { block.expression = { op: 'divide', args: [{ number: 1 }, { number: 0 }] } },
    block => { block.precision = 7 }]) {
    const block = calculation(); mutate(block)
    assert.throws(() => validateContentBlocks(paper, [block]), invalid)
  }
  const block = calculation(); block.mode = 'paper'; block.inputs = block.inputs.map(({ min, max, step, ...input }) => input)
  assert.equal(validateContentBlocks(paper, [block])[0].mode, 'paper')
})

test('Markdown exports every richer definition, graph step, evidence state and calculated initial value', () => {
  const markdown = renderContentMarkdown(validateContentBlocks(paper, [terms(), diagram(), evidence(), calculation()]))
  for (const text of ['在本方法中的作用：', '易混概念区别：', '#### 节点分组', '#### 节点', '#### 有向关系',
    'fact1 → entity1', '当前连线：origin', '固定段落预算：2', '#### 1. 修复前', '#### 2. 修复后',
    '位置 2：d2', '位置 2：d3', '未覆盖关系：关系乙', '未覆盖关系：无', '候选得分：0.7300', '实际计算式：', '显示 4 位小数']) assert.ok(markdown.includes(text), text)
  assert.equal((markdown.match(/构造示例（非论文原始样本）/g) ?? []).length, 3)
  assert.equal((markdown.match(/第 1 页/g) ?? []).length, 4)
  assert.ok(!markdown.includes(ref.quote), 'the exact original quote is never exposed by the teaching export')
})

const pdfControls = [...Array(32).keys()].filter(code => ![9, 10, 13].includes(code)).concat(127).map(code => String.fromCharCode(code))

test('exact PDF control glyphs remain valid in source quotations while invented controls cannot be grounded', () => {
  for (const control of pdfControls) {
    const quote = 'The source identifies the first operand ' + control + ' and the second operand.'
    const source = { pages: [{ number: 1, text: quote }] }
    const block = { type: 'paragraph', text: '逐页可核对的关系。', references: [{ page: 1, quote }] }
    assert.equal(validateContentBlocks(source, [block])[0].references[0].quote, quote)
    const unchanged = { pages: [{ number: 1, text: quote.replace(control, '') }] }
    assert.throws(() => validateContentBlocks(unchanged, [block]), /引用与对应页的原文不符/)
    const omitted = structuredClone(block); omitted.references[0].quote = quote.replace(control, '')
    assert.throws(() => validateContentBlocks(source, [omitted]), /引用与对应页的原文不符/)
    const visible = structuredClone(block); visible.text += control
    assert.throws(() => validateContentBlocks(source, [visible]), /正文格式无效/)
  }
})

test('quote length and readable-content limits remain strict despite real PDF control glyphs', () => {
  for (const quote of [null, {}, '', ' '.repeat(10), '\u0001'.repeat(20), 'abcdefg' + '\u0001'.repeat(20), 'a'.repeat(451)]) {
    const source = { pages: [{ number: 1, text: typeof quote === 'string' ? quote : 'Enough original source text remains present.' }] }
    const block = { type: 'paragraph', text: '内容。', references: [{ page: 1, quote }] }
    assert.throws(() => validateContentBlocks(source, [block]), error => error.code === 'explanation-invalid')
  }
})

test('control glyphs between numbers never manufacture a larger chart observation', () => {
  for (const control of pdfControls) {
    const quote = 'The recorded sequence contains 12' + control + '34 and the separate value is 6.'
    const source = { pages: [{ number: 1, text: quote }] }, reference = { page: 1, quote }
    const block = { type: 'chart', title: '原文数值', context: '同一记录中的独立数字', metric: '数值', unit: '原始单位', direction: 'higher',
      references: [reference], data: [{ label: '第一数值', value: 12, display: '12', reference }, { label: '独立数值', value: 6, display: '6', reference }] }
    assert.equal(validateContentBlocks(source, [block])[0].data[0].value, 12)
    block.data[0] = { ...block.data[0], value: 1234, display: '1234' }
    assert.throws(() => validateContentBlocks(source, [block]), /完整数值/)
  }
})
