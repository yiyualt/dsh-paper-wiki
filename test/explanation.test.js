import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { evidencePaper, richDraft } from '../test-support/explanation-fixture.js'
import { generateExplanation, renderExplanation, validateExplanation } from '../src/paper-explanation.js'

const paper = { ...evidencePaper, id: randomUUID() }
const draft = richDraft
function model(responses, observe = () => {}) {
  return { async *stream(options) {
    observe(options)
    const value = responses.shift()
    if (value instanceof Error) throw value
    yield { type: 'text-delta', text: JSON.stringify(value) }
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
})

test('review failure gets one revision and never publishes twice-rejected drafts', async () => {
  const rejected = { approved: false, issues: ['results：所引页面不支持实验结论'] }
  const calls = []
  await assert.rejects(generateExplanation(model([draft(), rejected, draft(), rejected], option => calls.push(option)),
    { model: 'test' }, paper), error => error.code === 'explanation-review-failed')
  assert.equal(calls.length, 4)
  assert.match(calls[2].messages[0].content[0].text, /所引页面不支持/)
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
  assert.equal(result.version, 2)
  const task = result.chapters.find(chapter => chapter.id === 'task')
  assert.equal(task.blocks[1].steps.length, 3)
  assert.match(task.markdown, /PHONE/)
  assert.match(task.markdown, /product_id/)
  assert.match(task.markdown, /论文实例/)
  const results = result.chapters.find(chapter => chapter.id === 'results')
  assert.equal(results.blocks[1].data[1].value, 80)
  assert.match(results.markdown, /60%/)
  assert.match(results.markdown, /准确率/)
})
