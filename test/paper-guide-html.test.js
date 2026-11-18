import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFile } from 'node:fs/promises'
import { createPaperGuideHtml } from '../src/paper-guide-html.js'

const behavior = await readFile(new URL('../src/guide-behavior.js', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/guide-styles.css', import.meta.url), 'utf8')
const reference = { page: 2, quote: 'PRIVATE_QUOTE_DO_NOT_EXPORT' }
function fixture() {
  return { title: '自编检索样例', pages: [{ text: 'PRIVATE_PAPER_TEXT' }], config: 'PRIVATE_CONFIG', explanation: {
    version: 4, title: '在有限位置内保留不同证据', summary: '用同一组候选检查选择结果。', caseStudy: {
      title: '自己编写的输入输出', mode: 'illustrative', references: [reference], steps: [
        { label: '初始选择', file: '01_input.json', chapterId: 'baselines', language: 'json', code: '{\n  "query": "处理方式与限制"\n}', explanation: '两个位置需要覆盖两种关系。', annotations: [{ line: 2, explanation: '查询同时要求处理方式和适用限制。' }] },
        { label: '补全证据', file: '02_output.json', chapterId: 'method', language: 'json', code: '{"selected":["a","c"]}', explanation: '给出关系不同的两个候选。', annotations: [{ line: 1, explanation: 'a 与 c 覆盖不同关系。' }] },
      ],
    }, chapters: [
      { id: 'overview', title: '任务', blocks: [{ type: 'paragraph', text: '检查这次选择。', references: [reference] }, { type: 'terms', title: '术语', items: [{ term: '预算', meaning: '允许选择的条目数量。', example: '这里最多选两项。', role: '限制输出大小。' }], references: [reference] }] },
      { id: 'baselines', title: '基线', blocks: [{ type: 'evidence', title: '选择候选', mode: 'illustrative', question: '两个位置是否足够？', budget: 2, required: ['处理方式', '适用限制'],
        items: [{ id: 'a', label: 'a', detail: '说明处理方式。', supports: ['处理方式'] }, { id: 'b', label: 'b', detail: '重复说明处理方式。', supports: ['处理方式'] }, { id: 'c', label: 'c', detail: '说明适用限制。', supports: ['适用限制'] }],
        states: [{ label: '重复选择', ids: ['a', 'b'], explanation: '一项关系缺失。' }, { label: '互补选择', ids: ['a', 'c'], explanation: '覆盖两项关系。' }], references: [reference] }] },
      { id: 'method', title: '方法', blocks: [{ type: 'calculation', title: '复算构造分数', mode: 'illustrative', formula: 'a + b', inputs: [{ id: 'a', label: '输入甲', meaning: '构造可调值。', value: 2.5, min: 0, max: 10, step: 1 }, { id: 'b', label: '输入乙', meaning: '固定值。', value: 3 }], expression: { op: 'add', args: [{ input: 'a' }, { input: 'b' }] }, precision: 2, resultLabel: '总分', interpretation: '只计算公式，不运行模型。', references: [reference] },
        { type: 'diagram', title: '依赖关系', mode: 'illustrative', description: '从候选到结果。', columns: [{ id: 'in', label: '输入' }, { id: 'out', label: '输出' }], nodes: [{ id: 'n1', column: 'in', label: '候选a', detail: '处理方式的候选。' }, { id: 'n2', column: 'out', label: '选择结果', detail: '保留a和c。' }], edges: [{ id: 'e1', from: 'n1', to: 'n2', label: '保留证据' }], steps: [{ label: '读取', explanation: '查看候选a。', activeNodes: ['n1'], activeEdges: [] }, { label: '输出', explanation: '将候选加入输出。', activeNodes: ['n1', 'n2'], activeEdges: ['e1'] }], references: [reference] }] },
      { id: 'results', title: '结果', blocks: [{ type: 'chart', title: '自行构造的观测表', context: '同一条件', metric: '得分', unit: '分', direction: 'higher', data: [{ label: '方式甲', value: -5, display: '-5' }, { label: '方式乙', value: 15, display: '15' }], references: [reference] }, { type: 'table', title: '数值明细', columns: ['方式', '得分'], rows: [['甲', '-5'], ['乙', '15']], references: [reference] }] },
    ],
  } }
}
const scripts = source => [...source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
const payloadOf = source => JSON.parse(scripts(source).find(part => part[1].includes('application/json'))[2])
const render = record => createPaperGuideHtml(record, { behavior, styles })

test('renders the reference reading structure with an actual case and folded explanatory detail', () => {
  const source = render(fixture())
  assert.equal((source.match(/class="pg-codewin"/g) || []).length, 1)
  assert.equal((source.match(/class="pg-section"/g) || []).length, 4)
  assert(source.includes('grid-template-columns:430px minmax(0,1fr)'))
  assert(source.includes('background:#172325'))
  assert(source.includes('step="any" value="2.5"'), 'off-grid initial values remain exact')
  assert(!source.includes('<details open'), 'expanded detail is not the default reading experience')
  assert(source.includes('left:0%;width:25%'))
  assert(source.includes('left:25%;width:75%'))
  assert(!source.includes('PRIVATE_'))
  assert(!/\b(?:href|src)="https?:/i.test(source))
  assert(source.includes("connect-src 'none'"))
  assert.throws(() => createPaperGuideHtml({ explanation: { version: 3 } }), TypeError)
})

function assertNoReadingScroll(document) {
  for (const id of ['chapter-overview', 'chapter-baselines', 'chapter-method', 'chapter-results']) assert.equal(document.getElementById(id)?.scrolled, undefined)
  assert.equal(document.querySelector('.pg-left').scrolled, undefined)
}

function caseSnapshot(document) {
  return {
    code: document.querySelector('[data-case-code]').textContent,
    text: document.querySelector('[data-case-explanation]').textContent,
    stage: document.querySelectorAll('[data-action="case-stage"]').map(button => button.getAttribute('aria-pressed')),
  }
}

test('annotated lines update in place while ordinary code remains selectable text', () => {
  const { document, events } = run(render(fixture()))
  const code = document.querySelector('[data-case-code]')
  code.scrollTop = 32; code.scrollLeft = 17
  assert.equal(document.querySelector('[data-case-explanation]').textContent, '两个位置需要覆盖两种关系。')
  const rows = document.querySelectorAll('.pg-line')
  assert.equal(rows[0].tagName, 'div')
  assert.equal(rows[0].getAttribute('data-action'), null)
  assert.equal(document.querySelectorAll('[data-action="code-line"]').length, 1)
  const annotated = document.querySelector('[data-action="code-line"]')
  assert.equal(annotated.getAttribute('data-line'), '2')
  assert(annotated.className.includes('pg-line-annotated'))
  events.click({ target: annotated })
  assert.equal(document.querySelector('[data-case-explanation]').textContent, '查询同时要求处理方式和适用限制。')
  assert.equal(annotated.getAttribute('aria-pressed'), 'true')
  assert.equal(code.scrollTop, 32)
  assert.equal(code.scrollLeft, 17)
  const before = caseSnapshot(document)
  events.click({ target: rows[0] })
  assert.deepEqual(caseSnapshot(document), before)
  assertNoReadingScroll(document)
})

test('stage buttons and file tabs switch the case without navigating the document', () => {
  const { document, events } = run(render(fixture()))
  const code = document.querySelector('[data-case-code]')
  code.scrollTop = 32; code.scrollLeft = 17
  const secondStage = document.querySelectorAll('[data-action="case-stage"]').find(node => node.dataset.index === '1')
  events.click({ target: secondStage })
  assert.equal(secondStage.getAttribute('aria-pressed'), 'true')
  assert(code.textContent.includes('"selected":["a","c"]'))
  assert.equal(code.scrollTop, 32)
  assert.equal(code.scrollLeft, 17)
  const firstFile = document.querySelector('.pg-tabs').querySelectorAll('[data-action="case-stage"]').find(node => node.dataset.index === '0')
  events.click({ target: firstFile })
  assert.equal(firstFile.getAttribute('aria-pressed'), 'true')
  assert(code.textContent.includes('处理方式与限制'))
  assertNoReadingScroll(document)
  assert.equal(document.querySelector('[data-live-panel]'), null)
})

test('checkbox selection and presets calculate budget and coverage locally without changing the case', () => {
  const { document, events } = run(render(fixture()))
  events.click({ target: document.querySelectorAll('[data-action="case-stage"]').find(node => node.dataset.index === '1') })
  const before = caseSnapshot(document)
  const checkbox = document.querySelectorAll('[data-evidence-input]').find(node => node.value === 'c')
  checkbox.checked = true; events.input({ target: checkbox })
  assert.equal(document.querySelector('[data-evidence-verdict]').getAttribute('data-status'), 'over-budget')
  assert(document.querySelector('[data-evidence-stats]').textContent.includes('3 / 2'))
  assert(document.querySelector('[data-evidence-stats]').textContent.includes('2 / 2'))
  const preset = document.querySelectorAll('[data-action="evidence-preset"]')[1]
  events.click({ target: preset })
  assert.equal(document.querySelector('[data-evidence-verdict]').getAttribute('data-status'), 'covered')
  assert.deepEqual(document.querySelectorAll('[data-evidence-input]').filter(node => node.checked).map(node => node.value), ['a', 'c'])
  assert(document.querySelector('[data-evidence-stats]').textContent.includes('已覆盖全部所需关系'))
  assert.deepEqual(caseSnapshot(document), before)
  assertNoReadingScroll(document)
})

test('formula inputs and reset only change their own numeric result and retain the selected case and evidence', () => {
  const { document, events } = run(render(fixture()))
  events.click({ target: document.querySelectorAll('[data-action="evidence-preset"]')[1] })
  const before = caseSnapshot(document)
  const slider = document.querySelector('[data-calc-input]'); slider.value = '7'; events.input({ target: slider })
  assert.equal(document.querySelector('[data-calc-result]').textContent, '10.00')
  assert.equal(document.querySelector('[data-input-value]').textContent, '7')
  assert.deepEqual(document.querySelectorAll('[data-evidence-input]').filter(node => node.checked).map(node => node.value), ['a', 'c'])
  slider.value = '999'; events.input({ target: slider })
  assert.equal(document.querySelector('[data-calc-result]').getAttribute('data-error'), 'true')
  events.click({ target: document.querySelector('[data-action="calculation-reset"]') })
  assert.equal(document.querySelector('[data-calc-result]').textContent, '5.50')
  assert.equal(slider.value, '2.5')
  assert.deepEqual(caseSnapshot(document), before)
  assertNoReadingScroll(document)
})

test('diagram steps and keyboard node selection update their own graph without moving or changing the case', () => {
  const { document, events } = run(render(fixture()))
  const before = caseSnapshot(document)
  events.click({ target: document.querySelectorAll('[data-action="diagram-step"]')[1] })
  assert.equal(document.querySelector('[data-edge]').getAttribute('data-active'), 'true')
  assert.equal(document.querySelector('[data-diagram-explanation]').textContent, '将候选加入输出。')
  let prevented = false
  events.keydown({ target: document.querySelectorAll('[data-action="diagram-node"]')[1], key: ' ', preventDefault() { prevented = true } })
  assert(prevented)
  assert.equal(document.querySelector('[data-diagram-explanation]').textContent, '选择结果：保留a和c。')
  assert.equal(document.querySelectorAll('[data-action="diagram-node"]')[1].getAttribute('aria-pressed'), 'true')
  assert.deepEqual(caseSnapshot(document), before)
  assertNoReadingScroll(document)
})

test('hostile model strings stay inert and private archive fields never enter script payloads', () => {
  const record = fixture(), attack = '</script><img src="https://bad.invalid" onerror="globalThis.compromised=1">'
  record.explanation.title = attack
  record.explanation.caseStudy.steps[0].code = attack
  record.explanation.caseStudy.steps[0].annotations[0].explanation = attack
  record.explanation.chapters[0].blocks[0].text = attack
  record.explanation.chapters[2].blocks[0].expression.privateSecret = 'PRIVATE_SECRET'
  const source = render(record), payload = payloadOf(source)
  assert.equal(scripts(source).length, 2)
  assert(!source.includes('<img'))
  assert(!source.includes('PRIVATE_'))
  assert.equal(payload.steps[0].code, attack)
  assert.equal(payload.calculations[0].block.expression.privateSecret, undefined)
  const runtime = run(source)
  assert.equal(runtime.context.compromised, undefined)
  assert(runtime.document.querySelector('[data-case-code]').textContent.includes(attack))
})

class Element {
  constructor(tag, attributes = {}) {
    this.tagName = tag; this.attributes = {}; this.dataset = {}; this.children = []; this.parentElement = null; this.value = ''; this.checked = false; this.hidden = false; this._text = ''; this.className = ''; this.scrollTop = 0; this.scrollLeft = 0
    for (const [name, value] of Object.entries(attributes)) this.setAttribute(name, value)
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value)
    if (name === 'id') this.id = String(value)
    if (name === 'class') this.className = String(value)
    if (name === 'value') this.value = String(value)
    if (name === 'checked') this.checked = true
    if (name === 'hidden') this.hidden = true
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = String(value)
  }
  getAttribute(name) { return this.attributes[name] ?? null }
  removeAttribute(name) { delete this.attributes[name] }
  append(...nodes) { for (const node of nodes) { node.parentElement = this; this.children.push(node) } }
  replaceChildren(...nodes) { this.children = []; this._text = ''; this.append(...nodes) }
  set textContent(value) { this._text = String(value); this.children = [] }
  get textContent() { return this._text + this.children.map(node => node.textContent).join('') }
  matches(selector) {
    if (selector.startsWith('.')) return this.className.split(' ').includes(selector.slice(1))
    const match = /^([a-z]+)?(?:\[([^=\]]+)(?:="([^"]*)")?\])?$/.exec(selector)
    return !!match && (!match[1] || this.tagName === match[1]) && (!match[2] || Object.hasOwn(this.attributes, match[2]) && (match[3] === undefined || this.attributes[match[2]] === match[3]))
  }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]) }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null }
  scrollIntoView() { this.scrolled = true }
}
const decode = value => value.replace(/&(?:amp|lt|gt|quot|#39);/g, entity => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" })[entity])
function run(source) {
  const root = new Element('html'), stack = [root], events = {}
  const markup = source.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
  for (const match of markup.matchAll(/<\/?[A-Za-z][^>]*>|[^<]+/g)) {
    const token = match[0]
    if (token.startsWith('</')) { if (stack.length > 1) stack.pop(); continue }
    if (token.startsWith('<')) {
      const tag = /^<([A-Za-z]+)/.exec(token)[1].toLowerCase(), attrs = {}
      for (const attribute of token.matchAll(/\s([A-Za-z0-9-]+)(?:="([^"]*)")?/g)) attrs[attribute[1]] = decode(attribute[2] || '')
      const node = new Element(tag, attrs); stack.at(-1).append(node)
      if (!['meta', 'input', 'br', 'hr', 'img', 'link'].includes(tag)) stack.push(node)
    } else stack.at(-1)._text += decode(token)
  }
  const parts = scripts(source), data = new Element('script', { id: 'paper-guide-data' })
  data.textContent = parts.find(part => part[1].includes('application/json'))[2]; root.append(data)
  const document = { createElement: tag => new Element(tag), querySelectorAll: selector => root.querySelectorAll(selector), querySelector: selector => root.querySelector(selector),
    getElementById: id => [root, ...root.querySelectorAll('[id]')].find(node => node.id === id) || null, addEventListener(name, handler) { events[name] = handler } }
  const context = vm.createContext({ document, fetch() { throw Error('Offline guide attempted network access') } })
  vm.runInContext(parts.find(part => !part[1].includes('application/json'))[2], context, { timeout: 1500 })
  return { document, events, context }
}

test('an unavailable chapter keeps its evidence limitation visible instead of rendering an empty section', () => {
  const paper = fixture()
  paper.explanation.chapters[3] = { id: 'results', title: '结果', markdown: '原文图像未提取，<不补造数据>。' }
  const { document } = run(render(paper))
  const section = document.getElementById('chapter-results')
  assert(section.textContent.includes('原文图像未提取，<不补造数据>。'))
  assert(!render(paper).includes('<不补造数据>'))
})

test('chapter navigation scrolls within the guide without changing the case and cancels iframe base-URL navigation', () => {
  const { document, events } = run(render(fixture()))
  const link = document.querySelectorAll('[data-action="nav-chapter"]').find(node => node.dataset.chapter === 'method')
  let prevented = false
  events.click({ target: link, preventDefault() { prevented = true } })
  assert.equal(prevented, true, 'srcdoc fragments must not resolve to the parent app URL')
  assert(document.getElementById('chapter-method').scrolled)
  assert.equal(link.getAttribute('aria-current'), 'location')
  assert(document.querySelector('[data-case-code]').textContent.includes('处理方式与限制'), 'explicit section navigation retains the selected case stage')
})
