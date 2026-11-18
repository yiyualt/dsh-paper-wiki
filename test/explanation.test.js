import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { evidencePaper, teachingDraft, teachingPlanFixture, compactTeachingDraft } from '../test-support/explanation-fixture.js'
import { createEvidenceCatalog } from '../src/paper-evidence.js'
import { validateCaseStudy } from '../src/paper-case.js'
import { generateExplanation, renderExplanation, validateExplanation } from '../src/paper-explanation.js'

const paper = { ...evidencePaper, id: randomUUID() }
const draft = compactTeachingDraft
const legacyDraft = teachingDraft
function model(responses, observe = () => {}) {
  responses = [teachingPlanFixture(), ...responses]
  return { async *stream(options) {
    observe(options)
    const value = responses.shift()
    if (value instanceof Error) throw value
    yield { type: 'text-delta', text: typeof value?.raw === 'string' ? value.raw : JSON.stringify(value) }
    yield { type: 'finish', reason: { kind: 'stop' } }
  } }
}

test('citation validation rejects fabricated quotes, pages and missing sections before rendering', () => {
  const valid = validateExplanation(paper, legacyDraft())
  assert.equal(valid.chapters.length, 7)
  const quoted = legacyDraft(); quoted.chapters[0].blocks[0].references[0].quote = 'A fabricated experimental result'
  assert.throws(() => validateExplanation(paper, quoted), /引用与对应页的原文不符/)
  const outOfBounds = legacyDraft(); outOfBounds.chapters[0].blocks[0].references[0].page = 99
  assert.throws(() => validateExplanation(paper, outOfBounds), /引用页码不存在/)
  const incomplete = legacyDraft(); incomplete.chapters.pop()
  assert.throws(() => validateExplanation(paper, incomplete), /七个章节/)
  const rendered = renderExplanation(paper, valid)
  assert.match(rendered[0].markdown, /（第 1 页）/)
  assert.doesNotMatch(rendered[0].markdown, /https?:|source\?/)
  const malicious = legacyDraft(); malicious.chapters[0].blocks[0].text = '<img src=x> [fake](https://evil.invalid)'
  assert.match(renderExplanation(paper, validateExplanation(paper, malicious))[0].markdown, /&lt;img/)
})

test('generates only after factual review and uses current provider selection for each call', async () => {
  const calls = [], phases = []
  const explanation = await generateExplanation(model([draft(), { approved: true, issues: [] }], options => calls.push(options)),
    { provider: 'configured', model: 'selected-model', reasoning: 'high' }, paper, undefined, phase => phases.push(phase))
  assert.equal(explanation.model, 'selected-model')
  assert.equal(explanation.chapters.length, 7)
  assert.deepEqual(phases, ['writing', 'reviewing'])
  assert.ok(calls.every(call => call.provider === 'configured' && call.reasoning === 'high'))
  assert.match(calls[0].messages[0].content[0].text, /PDF 第 2 页/)
  assert.match(calls[0].system, /不使用比喻或类比/)
  assert.match(calls[0].system, /当前阶段：教学设计/)
  assert.match(calls[1].system, /当前阶段：完整讲解/)
  assert.match(calls[2].system, /事实与教学验收/)
})

test('review failure gets one revision and never publishes twice-rejected drafts', async () => {
  const rejected = { approved: false, issues: ['results：所引页面不支持实验结论'] }
  const calls = []
  await assert.rejects(generateExplanation(model([draft(), rejected, { chapters: [draft().chapters.find(chapter => chapter.id === 'results')] }, rejected], option => calls.push(option)),
    { model: 'test' }, paper), error => error.code === 'explanation-review-failed')
  assert.equal(calls.length, 5)
  assert.match(calls[3].messages[0].content[0].text, /所引页面不支持/)
})

test('material beyond the MVP context limit is rejected before any model request', async () => {
  await assert.rejects(generateExplanation(model([], () => assert.fail('must not call model')), { model: 'test' },
    { ...paper, pages: [{ number: 1, text: 'a'.repeat(120_001) }] }), error => error.code === 'paper-too-long')
})

test('teaching coverage requires concrete examples, operations and comparable results', () => {
  for (const [id, type] of [['task', 'example'], ['baselines', 'table'], ['method', 'flow'], ['setup', 'table'], ['results', 'chart']]) {
    const value = legacyDraft()
    const chapter = value.chapters.find(item => item.id === id)
    chapter.blocks = chapter.blocks.filter(block => block.type !== type)
    assert.throws(() => validateExplanation(paper, value), error => error.code === 'explanation-invalid')
  }
  const unavailable = legacyDraft()
  unavailable.chapters.find(chapter => chapter.id === 'results').blocks = []
  assert.throws(() => validateExplanation(paper, unavailable), /内容块/)
  unavailable.chapters.find(chapter => chapter.id === 'results').unavailable = true
  assert.match(renderExplanation(paper, validateExplanation(paper, unavailable)).find(chapter => chapter.id === 'results').markdown, /未提供足够依据/)
})

test('compact explanation persists one shared case and exports grounded visual chapters', async () => {
  const result = await generateExplanation(model([draft(), { approved: true, issues: [] }]), { model: 'test' }, paper)
  assert.equal(result.version, 4)
  assert.equal(result.title, draft().title)
  assert.equal(result.summary, draft().summary)
  assert.equal(result.caseStudy.steps.length, 3)
  assert.match(result.caseStudy.steps[0].code, /PHONE/)
  assert.match(result.caseStudy.steps[2].code, /product_id/)
  assert(!result.chapters.find(chapter => chapter.id === 'task').blocks.some(block => block.type === 'example'))
  const results = result.chapters.find(chapter => chapter.id === 'results')
  assert.equal(results.blocks[1].data[1].value, 80)
  assert.match(results.markdown, /60%/)
  assert.match(results.markdown, /准确率/)
})

function sourceDraft() {
  const value = draft()
  for (const chapter of value.chapters) for (const block of chapter.blocks) {
    block.references = block.references.map(ref => ({ sourceId: `p${ref.page}-s1` }))
    if (block.type === 'chart') for (const point of block.data) point.reference = { sourceId: `p${point.reference.page}-s1` }
  }
  value.caseStudy.references = value.caseStudy.references.map(ref => ({ sourceId: `p${ref.page}-s1` }))
  return value
}

test('models select source IDs while the server supplies exact page text including PDF word breaks', async () => {
  const brokenPaper = structuredClone(paper)
  brokenPaper.pages[1].text = brokenPaper.pages[1].text.replace('lowercases', 'lower-\ncases')
  const calls = []
  const result = await generateExplanation(model([sourceDraft(), { approved: true, issues: [] }], options => calls.push(options)), { model: 'test' }, brokenPaper)
  const refs = result.chapters.find(chapter => chapter.id === 'method').blocks[0].references
  assert.equal(refs[0].page, 2)
  assert.match(refs[0].quote, /lower-\ncases/)
  assert.equal('sourceId' in refs[0], false, 'persisted canonical references remain backward compatible')
  assert.match(calls[0].system, /sourceId/)
  assert.match(calls[0].messages[0].content[0].text, /p2-s1/)
  assert.match(calls[2].messages[0].content[0].text, /lower-\\ncases/, 'factual review receives the original server-resolved quotation')
})

test('one repair request targets all invalid chapters and preserves every valid chapter', async () => {
  const first = sourceDraft(), fixed = sourceDraft(), calls = []
  first.chapters[0].blocks[0].text = '首稿已经讲清商品标题精确匹配的任务。'
  for (const id of ['baselines', 'setup']) first.chapters.find(chapter => chapter.id === id).blocks[0].references[0].sourceId = 'p99-s99'
  const patch = { chapters: fixed.chapters.filter(chapter => ['baselines', 'setup'].includes(chapter.id)) }
  const result = await generateExplanation(model([first, patch, { approved: true, issues: [] }], options => calls.push(options)), { model: 'test' }, paper)
  assert.equal(calls.length, 4)
  const prompt = calls[2].messages[0].content[0].text
  assert.match(prompt, /定向章节修复/)
  assert.match(prompt, /"id":"baselines"/)
  assert.match(prompt, /"id":"setup"/)
  assert.doesNotMatch(prompt, /"id":"overview"/)
  assert.equal(calls[2].maxTokens, 16000)
  assert.equal(result.chapters[0].blocks[0].text, first.chapters[0].blocks[0].text)
})

test('chapter repair cannot change another chapter or publish a still-invalid source ID', async () => {
  const first = sourceDraft()
  first.chapters[2].blocks[0].references[0].sourceId = 'p99-s99'
  await assert.rejects(generateExplanation(model([first, { chapters: [sourceDraft().chapters[0]] }]), { model: 'test' }, paper), /不得增删或修改其他章节/)
  await assert.rejects(generateExplanation(model([first, { chapters: [first.chapters[2]] }]), { model: 'test' }, paper), error => error.code === 'explanation-invalid')
})

test('structured factual review issues repair only the specified chapter and still require review', async () => {
  const first = sourceDraft(), repaired = sourceDraft(), calls = []
  const issue = { approved: false, issues: [{ chapterId: 'analysis', message: '请删除没有原文依据的泛化结论' }] }
  repaired.chapters[6].blocks[0].text = '评测仅使用固定的英语查询，无法证明真实流量表现。'
  const result = await generateExplanation(model([first, issue, { chapters: [repaired.chapters[6]] }, { approved: true, issues: [] }], options => calls.push(options)), { model: 'test' }, paper)
  assert.equal(calls.length, 5)
  assert.equal(calls[3].maxTokens, 8000)
  assert.match(calls[3].messages[0].content[0].text, /"id":"analysis"/)
  assert.doesNotMatch(calls[3].messages[0].content[0].text, /"id":"method"/)
  assert.equal(result.chapters[6].blocks[0].text, repaired.chapters[6].blocks[0].text)
})

test('a malformed review is retried once without discarding or rewriting the completed lesson', async () => {
  const calls = []
  const result = await generateExplanation(model([draft(), { raw: '{' }, { approved: true, issues: [] }], options => calls.push(options)), { model: 'test' }, paper)
  assert.equal(result.version, 4)
  assert.equal(calls.length, 4)
  assert.match(calls[2].system, /事实与教学验收/)
  assert.match(calls[3].system, /事实与教学验收/)
  assert.equal(calls[2].messages[0].content[0].text, calls[3].messages[0].content[0].text)
})

test('the teaching plan must be implemented as explanations and complementary visualizations', async () => {
  const first = draft()
  first.chapters[1].blocks = first.chapters[1].blocks.filter(block => block.type !== 'terms')
  first.chapters[3].blocks = first.chapters[3].blocks.filter(block => block.type !== 'diagram')
  const patch = { chapters: draft().chapters.filter(chapter => ['task', 'method'].includes(chapter.id)) }
  const calls = []
  const result = await generateExplanation(model([first, patch, { approved: true, issues: [] }], options => calls.push(options)), { model: 'test' }, paper)
  assert.equal(calls.length, 4)
  assert.match(calls[2].messages[0].content[0].text, /重点术语/)
  assert.match(calls[2].messages[0].content[0].text, /diagram/)
  assert.equal(result.chapters[1].blocks.find(block => block.type === 'terms').items.length, 5)
})

test('legacy evidence comparisons can explain baseline execution without an obligatory table', () => {
  const value = legacyDraft()
  const baseline = value.chapters.find(chapter => chapter.id === 'baselines')
  baseline.blocks = [baseline.blocks[0], { ...value.chapters[1].blocks.find(block => block.type === 'example'), title: '基线的具体执行',
    steps: [{ label: '输入', language: 'json', code: '{"query":"PHONE","title":"phone"}', explanation: '原始文字只有大小写差异。' },
      { label: '基线输出', language: 'json', code: '{"output":null}', explanation: '大小写敏感比较不相等，基线没有返回商品。' }] }]
  const result = validateExplanation(paper, value)
  assert.equal(result.chapters[2].blocks[1].type, 'example')
})

test('repairs missing final JSON container delimiters but never invents an unfinished string or value', async () => {
  const raw = JSON.stringify(draft()).slice(0, -2)
  const result = await generateExplanation(model([{ raw }, { approved: true, issues: [] }]), { model: 'test' }, paper)
  assert.equal(result.chapters.length, 7)
  const incomplete = { raw: '{"chapters":[{"id":"overview","blocks":[{"type":"paragraph","text":"unfinished' }
  await assert.rejects(generateExplanation(model([incomplete, incomplete]), { model: 'test' }, paper), error => error.code === 'explanation-invalid')
})

test('compact visual chapters do not require repeated paragraphs, case blocks or a linear flow', () => {
  const value = draft()
  for (const id of ['task', 'method', 'setup', 'results', 'baselines']) {
    const chapter = value.chapters.find(chapter => chapter.id === id)
    chapter.blocks = chapter.blocks.filter(block => block.type !== 'paragraph')
  }
  const result = validateExplanation(paper, value, undefined, undefined, { version: 4 })
  assert.equal(result.chapters.flatMap(chapter => chapter.blocks).filter(block => block.type === 'paragraph').length, 2)
  assert.equal(result.chapters[1].blocks[0].type, 'terms')
  assert.equal(result.chapters[3].blocks[0].type, 'diagram')
  const old = legacyDraft(); old.chapters[3].blocks = old.chapters[3].blocks.filter(block => block.type !== 'paragraph')
  assert.throws(() => validateExplanation(paper, old), /正文解释/)
})

test('compact density limits bound initial prose without imposing more diagrams on every chapter', () => {
  const validate = value => validateExplanation(paper, value, undefined, undefined, { version: 4 })
  const long = draft(); long.chapters[0].blocks[0].text = '文'.repeat(241)
  assert.throws(() => validate(long), /240/)
  const crowded = draft(); crowded.chapters[0].blocks = Array.from({ length: 6 }, () => ({ ...crowded.chapters[0].blocks[0] }))
  assert.throws(() => validate(crowded), /最多 5/)
  const three = draft(); three.chapters[0].blocks = Array.from({ length: 3 }, () => ({ ...three.chapters[0].blocks[0] }))
  assert.throws(() => validate(three), /最多两段/)
  const global = draft()
  for (const chapter of global.chapters) {
    const paragraph = chapter.blocks.find(block => block.type === 'paragraph')
    paragraph.text = '文'.repeat(140)
    chapter.blocks.push({ ...paragraph })
  }
  assert.throws(() => validate(global), /1600/)
  for (const [field, maximum] of [['title', 100], ['summary', 180]]) {
    const value = draft(); value[field] = '文'.repeat(maximum + 1)
    assert.throws(() => validate(value), /一句话结论/)
  }
  const repeated = draft(); repeated.chapters[1].blocks.push(legacyDraft().chapters[1].blocks.find(block => block.type === 'example'))
  assert.throws(() => validate(repeated), /常驻案例栏/)
})

test('case provenance uses exact source mapping and annotations reference actual preserved code lines', () => {
  const catalog = createEvidenceCatalog(paper), value = sourceDraft().caseStudy
  const result = validateCaseStudy(paper, value, catalog)
  assert.equal(result.references[1].page, 2)
  assert.equal(result.references[1].quote, paper.pages[1].text)
  assert.deepEqual(validateCaseStudy(paper, result), result)
  for (const mutate of [
    value => { value.references[0].sourceId = 'p99-s99' },
    value => { value.steps[0].annotations[0].line = 99 },
    value => { value.steps[0].annotations.push({ ...value.steps[0].annotations[0] }) },
    value => { value.steps[0].chapterId = 'unknown' },
    value => { value.steps[0].code = '{' },
    value => { value.steps[0].file = '../private.json' },
  ]) {
    const copy = sourceDraft().caseStudy; mutate(copy)
    assert.throws(() => validateCaseStudy(paper, copy, catalog), error => error.code === 'explanation-invalid')
  }
  const fabricated = draft().caseStudy; fabricated.references[0].quote = 'This sentence was never in the supplied evidence.'
  assert.throws(() => validateCaseStudy(paper, fabricated), /引用与对应页的原文不符/)
  const newline = draft().caseStudy
  newline.steps[0].code = '\n' + newline.steps[0].code.replace(/\n/g, '\r\n')
  newline.steps[0].annotations = newline.steps[0].annotations.map(annotation => ({ ...annotation, line: annotation.line + 1 }))
  assert.equal(validateCaseStudy(paper, newline).steps[0].code.split('\n')[2], '  "query": "PHONE",')
  newline.steps[0].annotations[0].line = 1
  assert.throws(() => validateCaseStudy(paper, newline), /空行/)
})

test('scoped chapter repair keeps the shared case and header immutable and supplies them as fixed context', async () => {
  const first = sourceDraft(), repaired = sourceDraft(), calls = []
  const originalCase = structuredClone(first.caseStudy)
  first.chapters[3].blocks[0].references[0].sourceId = 'p99-s99'
  const patch = { title: '不应替换标题', summary: '不应替换结论', caseStudy: null, chapters: [repaired.chapters[3]] }
  const result = await generateExplanation(model([first, patch, { approved: true, issues: [] }], options => calls.push(options)), { model: 'test' }, paper)
  assert.equal(result.title, first.title)
  assert.equal(result.summary, first.summary)
  assert.deepEqual(result.caseStudy, validateCaseStudy(paper, originalCase, createEvidenceCatalog(paper)))
  assert.match(calls[2].messages[0].content[0].text, /固定标题、结论与常驻案例/)
  assert.match(calls[2].messages[0].content[0].text, /01_input.json/)
})

test('invalid case structure requests one complete repair instead of an empty chapter patch', async () => {
  const first = sourceDraft(), calls = []
  first.caseStudy.steps[0].annotations[0].line = 99
  const result = await generateExplanation(model([first, sourceDraft(), { approved: true, issues: [] }], options => calls.push(options)), { model: 'test' }, paper)
  assert.equal(result.version, 4)
  assert.match(calls[2].messages[0].content[0].text, /重新输出完整/)
  assert.doesNotMatch(calls[2].messages[0].content[0].text, /本次是定向章节修复/)
})
