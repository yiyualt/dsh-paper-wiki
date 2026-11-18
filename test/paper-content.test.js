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
