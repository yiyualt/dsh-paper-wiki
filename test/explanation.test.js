import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { evidencePaper, teachingDraft, teachingPlanFixture } from '../test-support/explanation-fixture.js'
import { createEvidenceCatalog } from '../src/paper-evidence.js'
import { generateExplanation, renderExplanation, validateExplanation } from '../src/paper-explanation.js'

const paper = { ...evidencePaper, id: randomUUID() }
const draft = teachingDraft
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
  const valid = validateExplanation(paper, draft())
  assert.equal(valid.chapters.length, 7)
  const quoted = draft(); quoted.chapters[0].blocks[0].references[0].quote = 'A fabricated experimental result'
  assert.throws(() => validateExplanation(paper, quoted), /引用与对应页的原文不符/)
  const outOfBounds = draft(); outOfBounds.chapters[0].blocks[0].references[0].page = 99
  assert.throws(() => validateExplanation(paper, outOfBounds), /引用页码不存在/)
  const incomplete = draft(); incomplete.chapters.pop()
  assert.throws(() => validateExplanation(paper, incomplete), /七个章节/)
  const rendered = renderExplanation(paper, valid)
  assert.match(rendered[0].markdown, /（第 1 页）/)
  assert.doesNotMatch(rendered[0].markdown, /https?:|source\?/)
  const malicious = draft(); malicious.chapters[0].blocks[0].text = '<img src=x> [fake](https://evil.invalid)'
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
    const value = draft()
    const chapter = value.chapters.find(item => item.id === id)
    chapter.blocks = chapter.blocks.filter(block => block.type !== type)
    assert.throws(() => validateExplanation(paper, value), error => error.code === 'explanation-invalid')
  }
  const unavailable = draft()
  unavailable.chapters.find(chapter => chapter.id === 'results').blocks = []
  assert.throws(() => validateExplanation(paper, unavailable), /内容块/)
  unavailable.chapters.find(chapter => chapter.id === 'results').unavailable = true
  assert.match(renderExplanation(paper, validateExplanation(paper, unavailable)).find(chapter => chapter.id === 'results').markdown, /未提供足够依据/)
})

test('rich explanation persists typed blocks and exports all steps without losing provenance', async () => {
  const result = await generateExplanation(model([draft(), { approved: true, issues: [] }]), { model: 'test' }, paper)
  assert.equal(result.version, 3)
  const task = result.chapters.find(chapter => chapter.id === 'task')
  assert.equal(task.blocks[2].steps.length, 3)
  assert.match(task.markdown, /PHONE/)
  assert.match(task.markdown, /product_id/)
  assert.match(task.markdown, /论文实例/)
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
  assert.equal(result.version, 3)
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
  assert.match(calls[2].messages[0].content[0].text, /核心术语/)
  assert.match(calls[2].messages[0].content[0].text, /diagram/)
  assert.equal(result.chapters[1].blocks.find(block => block.type === 'terms').items.length, 5)
})

test('complete evidence comparisons can explain baseline execution without an obligatory table', async () => {
  const value = draft()
  const baseline = value.chapters.find(chapter => chapter.id === 'baselines')
  baseline.blocks = [baseline.blocks[0], { ...value.chapters[1].blocks.find(block => block.type === 'example'), title: '基线的具体执行',
    steps: [{ label: '输入', language: 'json', code: '{"query":"PHONE","title":"phone"}', explanation: '原始文字只有大小写差异。' },
      { label: '基线输出', language: 'json', code: '{"output":null}', explanation: '大小写敏感比较不相等，基线没有返回商品。' }] }]
  const result = await generateExplanation(model([value, { approved: true, issues: [] }]), { model: 'test' }, paper)
  assert.equal(result.chapters[2].blocks[1].type, 'example')
})

test('repairs missing final JSON container delimiters but never invents an unfinished string or value', async () => {
  const raw = JSON.stringify(draft()).slice(0, -2)
  const result = await generateExplanation(model([{ raw }, { approved: true, issues: [] }]), { model: 'test' }, paper)
  assert.equal(result.chapters.length, 7)
  const incomplete = { raw: '{"chapters":[{"id":"overview","blocks":[{"type":"paragraph","text":"unfinished' }
  await assert.rejects(generateExplanation(model([incomplete, incomplete]), { model: 'test' }, paper), error => error.code === 'explanation-invalid')
})
