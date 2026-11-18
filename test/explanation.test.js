import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { chapterDefinitions, generateExplanation, renderExplanation, validateExplanation } from '../src/paper-explanation.js'

const paper = { id: randomUUID(), title: 'Evidence study', fileName: 'study.pdf', pageCount: 2,
  pages: [{ number: 1, text: 'We compare two fixed models on the same inputs. The method uses a frozen evaluation set.' },
    { number: 2, text: 'The smaller model obtains 80 percent accuracy. The study is limited to English tasks.' }] }
function draft() {
  return { chapters: chapterDefinitions.map(({ id }, index) => ({ id, paragraphs: [{ text: '研究使用固定的评测集比较两个模型。',
    references: [{ page: index < 3 ? 1 : 2, quote: index < 3 ? 'We compare two fixed models' : 'The study is limited to English tasks.' }] }] })) }
}
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
  assert.equal(valid.chapters.length, 5)
  const quoted = draft(); quoted.chapters[0].paragraphs[0].references[0].quote = 'A fabricated experimental result'
  assert.throws(() => validateExplanation(paper, quoted), /引用与原文不符/)
  const outOfBounds = draft(); outOfBounds.chapters[0].paragraphs[0].references[0].page = 3
  assert.throws(() => validateExplanation(paper, outOfBounds), /引用与原文不符/)
  const incomplete = draft(); incomplete.chapters.pop()
  assert.throws(() => validateExplanation(paper, incomplete), /五个章节/)
  const rendered = renderExplanation(paper, valid)
  assert.match(rendered[0].markdown, /（第 1 页）/)
  assert.doesNotMatch(rendered[0].markdown, /https?:|source\?/)
  const malicious = draft(); malicious.chapters[0].paragraphs[0].text = '<img src=x> [fake](https://evil.invalid)'
  assert.match(renderExplanation(paper, validateExplanation(paper, malicious))[0].markdown, /\\<img/)
})

test('generates only after factual review and uses current provider selection for each call', async () => {
  const calls = [], phases = []
  const explanation = await generateExplanation(model([draft(), { approved: true, issues: [] }], options => calls.push(options)),
    { provider: 'configured', model: 'selected-model', reasoning: 'high' }, paper, undefined, phase => phases.push(phase))
  assert.equal(explanation.model, 'selected-model')
  assert.equal(explanation.chapters.length, 5)
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
