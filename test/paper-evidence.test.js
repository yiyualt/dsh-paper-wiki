import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createEvidenceCatalog } from '../src/paper-evidence.js'
import { validateContentBlocks } from '../src/paper-content.js'

const normalize = value => value.normalize('NFKC').replace(/[\s\u00ad\u200b]/g, '')
const ids = catalog => [...catalog.text.matchAll(/^\[来源 (p\d+-s\d+)\]$/gm)].map(match => match[1])
const invalid = error => error.code === 'explanation-invalid' && error.status === 502

test('resolves source IDs to original hyphenated text without retyping or dehyphenating quotes', () => {
  const paper = { pages: [{ number: 1, text: 'This baseline supports itera-\ntive retrieval. The model is bge-large-en-v1.5.' }] }
  const catalog = createEvidenceCatalog(paper)
  assert.deepEqual(ids(catalog), ['p1-s1'])
  const reference = catalog.resolveReference({ sourceId: 'p1-s1', page: 99, quote: 'attacker replacement' })
  assert.deepEqual(reference, { page: 1, quote: paper.pages[0].text })
  assert.ok(reference.quote.includes('itera-\ntive'))
  assert.ok(reference.quote.includes('bge-large-en-v1.5'))
  assert.equal('sourceId' in reference, false)
  assert.equal(validateContentBlocks(paper, [{ type: 'paragraph', text: '说明检索方法。', references: [reference] }]).length, 1)
  reference.quote = 'mutated returned object'
  assert.equal(catalog.resolveReference({ sourceId: 'p1-s1' }).quote, paper.pages[0].text)
})

test('rejects unknown or malformed IDs without exposing the source quote and keeps physical pages separate', () => {
  const paper = { pages: [{ number: 3, text: 'The first physical page in this fixture has distinct evidence.' },
    { number: 8, text: 'A later physical page contains a completely separate observation.' }] }
  const catalog = createEvidenceCatalog(paper)
  assert.deepEqual(ids(catalog), ['p3-s1', 'p8-s1'])
  assert.equal(catalog.resolveReference({ sourceId: 'p8-s1' }).page, 8)
  for (const sourceId of ['p1-s1', 'p3-s2', '__proto__', '', null, {}, 'p3-s1\np8-s1']) {
    assert.throws(() => catalog.resolveReference({ sourceId }, 'baselines/blocks/1/references/0'), error =>
      invalid(error) && error.message.includes('baselines/blocks/1/references/0') && !error.message.includes(paper.pages[0].text))
  }
  assert.throws(() => catalog.resolveReference(null), invalid)
})

test('segments are deterministic, bounded, overlap, and cover the complete original page without gaps', () => {
  const original = Array.from({ length: 55 }, (_, index) => `Sentence ${String(index).padStart(2, '0')}: this paragraph has unique evidence about its own observation and processing step.\n`).join('')
  const paper = { pages: [{ number: 1, text: original }] }
  const catalog = createEvidenceCatalog(paper)
  assert.equal(createEvidenceCatalog(paper).text, catalog.text)
  const quotes = ids(catalog).map(sourceId => catalog.resolveReference({ sourceId }).quote)
  assert(quotes.length > 2)
  let covered = 0, previousStart = -1
  for (const quote of quotes) {
    assert(quote.length <= 420)
    assert(normalize(quote).length >= 8)
    const start = original.indexOf(quote, previousStart + 1)
    assert(start >= 0)
    assert(start <= covered, 'adjacent source segments have no uncovered gap')
    if (previousStart >= 0) assert(start < covered, 'adjacent source segments overlap')
    covered = Math.max(covered, start + quote.length)
    previousStart = start
  }
  assert.equal(covered, original.length)
})

test('keeps chart numbers intact at segment boundaries and passes the real chart citation checker', () => {
  const source = 'Context for the fixed workload. '.repeat(12)
    + 'Baseline latency was 1,200 ms. Cached latency was 600 ms. Accuracy was 98.5%. '
    + 'The scientific measurement was 1.2e-3, and a signed observation was −600. '
    + 'Further evaluation details. '.repeat(10)
  const paper = { pages: [{ number: 1, text: source }] }, catalog = createEvidenceCatalog(paper)
  const references = ids(catalog).map(sourceId => catalog.resolveReference({ sourceId }))
  for (const token of ['1,200', '600', '98.5%', '1.2e-3', '−600']) assert(references.some(ref => ref.quote.includes(token)))
  function containing(token) { return references.find(ref => ref.quote.includes(token)) }
  const block = { type: 'chart', title: '固定负载延迟', context: '相同工作负载', metric: '延迟', unit: 'ms', direction: 'lower',
    data: [{ label: '基线', value: 1200, display: '1,200', reference: containing('1,200') },
      { label: '缓存', value: 600, display: '600', reference: containing('Cached latency was 600') }],
    references: [containing('1,200')] }
  assert.equal(validateContentBlocks(paper, [block])[0].data.length, 2)
  for (const quote of references.map(ref => ref.quote)) {
    const start = source.indexOf(quote), end = start + quote.length
    for (const token of ['1,200', '98.5%', '1.2e-3', '−600']) {
      const at = source.indexOf(token)
      if (at < end && at + token.length > start) assert(at >= start && at + token.length <= end, `the ${token} token is not cut`)
    }
  }
})

test('legacy references are unchanged and feedback maps only exact canonical segment quotes back to IDs', () => {
  const paper = { pages: [{ number: 1, text: 'An exact original sentence supplies the evidence for this explanation.' }] }
  const catalog = createEvidenceCatalog(paper)
  const legacy = { page: 1, quote: 'An exact original sentence' }
  assert.deepEqual(catalog.resolveReference(legacy), legacy)
  const canonical = catalog.resolveReference({ sourceId: 'p1-s1' })
  const value = { chapters: [{ id: 'results', blocks: [{ type: 'chart', references: [canonical, legacy], data: [{ reference: canonical, value: 10 }] }] }] }
  const feedback = catalog.toModelDraft(value)
  assert.deepEqual(feedback.chapters[0].blocks[0].references, [{ sourceId: 'p1-s1' }, legacy])
  assert.deepEqual(feedback.chapters[0].blocks[0].data[0].reference, { sourceId: 'p1-s1' })
  assert.deepEqual(value.chapters[0].blocks[0].references[0], canonical, 'feedback conversion does not mutate the saved draft')
})

test('empty and unquotably short pages have no source IDs and cannot borrow evidence from another page', () => {
  const paper = { pages: [{ number: 1, text: '' }, { number: 2, text: '42' },
    { number: 3, text: 'This final page has enough text to provide its own source reference.' }] }
  const catalog = createEvidenceCatalog(paper)
  assert.deepEqual(ids(catalog), ['p3-s1'])
  assert.ok(catalog.text.includes('PDF 第 1 页'))
  assert.ok(catalog.text.includes('本页没有可提取文字'))
  assert.throws(() => catalog.resolveReference({ sourceId: 'p1-s1' }), invalid)
  assert.equal(catalog.resolveReference({ sourceId: 'p3-s1' }).page, 3)
})

test('catalog keeps immutable raw PDF quotes but presents no forbidden controls or joined numbers to the model', () => {
  const controls = [...Array(32).keys()].filter(code => ![9, 10, 13].includes(code)).concat(127).map(code => String.fromCharCode(code))
  const original = controls.map((control, index) => `Observation ${index}: the source supplies readable context; values are 12${control}34 and an independent quantity.\n`).join('').repeat(2)
  const paper = { pages: [{ number: 7, text: original }] }, before = structuredClone(paper)
  const catalog = createEvidenceCatalog(paper), sourceIds = ids(catalog)
  assert(sourceIds.length > 10, 'the preflight validates multiple batches')
  assert(!/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(catalog.text))
  assert(catalog.text.includes('12 34'), 'the model sees a separator rather than a fabricated 1234')
  assert(!catalog.text.includes('1234'))
  assert.equal(createEvidenceCatalog(paper).text, catalog.text)
  for (const sourceId of sourceIds) {
    const reference = catalog.resolveReference({ sourceId })
    assert(original.includes(reference.quote))
    assert.equal(validateContentBlocks(paper, [{ type: 'paragraph', text: '可核对的记录。', references: [reference] }])[0].references[0].quote, reference.quote)
    const originalQuote = reference.quote; reference.quote = 'mutated outside the catalog'
    assert.equal(catalog.resolveReference({ sourceId }).quote, originalQuote)
  }
  assert.deepEqual(paper, before)
})

test('catalog omits control-only pages and fails locally when no readable source can be offered', () => {
  for (const text of ['', '42', '\u0001'.repeat(100), 'abcdefg' + '\u007f'.repeat(100)]) {
    assert.throws(() => createEvidenceCatalog({ pages: [{ number: 1, text }] }), /没有可用于引用的可读文字/)
  }
  const catalog = createEvidenceCatalog({ pages: [{ number: 1, text: '\u0001'.repeat(100) },
    { number: 2, text: 'A readable physical page supplies a complete grounded observation.' }] })
  assert.deepEqual(ids(catalog), ['p2-s1'])
  assert(!catalog.text.includes('\u0001'))
})
