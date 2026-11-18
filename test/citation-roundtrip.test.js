import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { test } from 'node:test'
import { apply } from '../index.js'
import { createEvidenceCatalog } from '../src/paper-evidence.js'
import { generateExplanation, validateExplanation } from '../src/paper-explanation.js'
import { validateCaseStudy } from '../src/paper-case.js'
import { createPaperStorage } from '../src/paper-storage.js'
import { compactTeachingDraft, evidencePaper, evidenceTexts, teachingPlanFixture } from '../test-support/explanation-fixture.js'
import { createPdf } from './fixtures/pdf.mjs'

const glyphs = '\u0001\u000b\u000c\u007f'
const controls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/
const bytes = Buffer.from('%PDF-1.7\nself-authored archived fixture\n')
const digest = value => createHash('sha256').update(value).digest('hex')

function archivedSource() {
  return { ...structuredClone(evidencePaper), id: randomUUID(), createdAt: new Date().toISOString(),
    sha256: digest(bytes), warnings: [], explanation: null,
    pages: evidencePaper.pages.map(page => ({ ...page, text: `Source \u0001 glyph \u000b field \u000c boundary \u007f marker. ${page.text}` })) }
}

function sourceDraft() {
  const draft = compactTeachingDraft()
  draft.caseStudy.references = draft.caseStudy.references.map(ref => ({ sourceId: `p${ref.page}-s1` }))
  for (const chapter of draft.chapters) for (const block of chapter.blocks) {
    block.references = block.references.map(ref => ({ sourceId: `p${ref.page}-s1` }))
    if (block.type === 'chart') for (const point of block.data) point.reference = { sourceId: `p${point.reference.page}-s1` }
  }
  return draft
}

function model(responses, calls = []) {
  return { async *stream(options) {
    calls.push(options)
    assert(responses.length, 'A model request must have a supplied response')
    yield { type: 'text-delta', text: JSON.stringify(responses.shift()) }
    yield { type: 'finish', reason: { kind: 'stop' } }
  } }
}

async function storageFixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'paper-citation-roundtrip-'))
  t.after(() => rm(directory, { recursive: true, force: true }))
  return { directory, storage: createPaperStorage(join(directory, 'papers')) }
}

test('catalog IDs with real PDF control glyphs survive case, generation, chart and fresh-storage round trips', async t => {
  const paper = archivedSource(), originalPages = structuredClone(paper.pages), calls = []
  const catalog = createEvidenceCatalog(paper)
  assert.equal(controls.test(catalog.text), false, 'The model sees a readable view, not raw control glyphs')
  const caseStudy = validateCaseStudy(paper, sourceDraft().caseStudy, catalog)
  assert.equal(caseStudy.references[1].quote, paper.pages[1].text)
  for (const glyph of glyphs) assert(caseStudy.references[1].quote.includes(glyph))
  assert.deepEqual(validateCaseStudy(paper, caseStudy), caseStudy)

  const explanation = await generateExplanation(model([teachingPlanFixture(), sourceDraft(), { approved: true, issues: [] }], calls),
    { model: 'self-authored-test-model' }, paper)
  assert.equal(calls.length, 3)
  assert(calls.every(call => !controls.test(call.messages[0].content[0].text)), 'Planning, authoring and review use readable text without changing decoded reference data')
  const reviewedDraft = JSON.parse(calls[2].messages[0].content[0].text.split('\n').at(-1))
  assert.equal(reviewedDraft.caseStudy.references[1].quote, paper.pages[1].text, 'Review receives the canonical source quotation as JSON data')
  assert.equal(explanation.caseStudy.references[1].quote, paper.pages[1].text)
  const chart = explanation.chapters.find(chapter => chapter.id === 'results').blocks.find(block => block.type === 'chart')
  assert.deepEqual(chart.data.map(point => point.value), [60, 80])
  assert(chart.data.every(point => point.reference.quote === paper.pages[3].text))

  const { directory, storage } = await storageFixture(t)
  await storage.save(paper, bytes)
  await storage.setExplanation(paper.id, explanation)
  const reopened = createPaperStorage(join(directory, 'papers'))
  const saved = await reopened.get(paper.id)
  const { teachingPlan, ...persistedExplanation } = explanation
  assert.deepEqual(saved.explanation, persistedExplanation)
  assert.deepEqual(saved.pages, originalPages, 'Creating model views never mutates immutable extracted pages')
  assert.deepEqual(await reopened.getPdf(paper.id), bytes)
  assert.equal(saved.sha256, digest(bytes))
  const disk = JSON.parse(await readFile(join(directory, 'papers', paper.id, 'paper.json'), 'utf8'))
  assert.equal(disk.explanation.caseStudy.references[1].quote, paper.pages[1].text)
  validateExplanation(saved, saved.explanation, undefined, undefined, { version: 4 })
})

test('a control glyph at another source position cannot legitimize an invented case or chapter quotation', async t => {
  const paper = archivedSource(), { storage } = await storageFixture(t)
  const explanation = await generateExplanation(model([teachingPlanFixture(), sourceDraft(), { approved: true, issues: [] }]),
    { model: 'self-authored-test-model' }, paper)
  await storage.save(paper, bytes)
  await storage.setExplanation(paper.id, explanation)
  const persistedExplanation = (await storage.get(paper.id)).explanation
  for (const glyph of glyphs) {
    for (const scope of ['case', 'chapter', 'chart']) {
      const bad = structuredClone(explanation)
      const ref = scope === 'case' ? bad.caseStudy.references[1]
        : scope === 'chapter' ? bad.chapters.find(chapter => chapter.id === 'baselines').blocks[0].references[0]
          : bad.chapters.find(chapter => chapter.id === 'results').blocks.find(block => block.type === 'chart').data[0].reference
      // Every glyph already exists in this page, but not inside this ordinary word.
      const needle = scope === 'chart' ? 'accuracy' : 'baseline'
      assert(ref.quote.includes(needle))
      ref.quote = ref.quote.replace(needle, needle.slice(0, 2) + glyph + needle.slice(2))
      assert.throws(() => validateExplanation(paper, bad, undefined, undefined, { version: 4 }),
        error => error.code === 'explanation-invalid')
      await assert.rejects(storage.setExplanation(paper.id, bad), TypeError)
      assert.deepEqual((await storage.get(paper.id)).explanation, persistedExplanation)
    }
  }
  const prose = structuredClone(explanation)
  prose.chapters[0].blocks[0].text += '\u0001'
  assert.throws(() => validateExplanation(paper, prose, undefined, undefined, { version: 4 }), /正文/)
  await assert.rejects(storage.setExplanation(paper.id, prose), TypeError)
  assert.deepEqual((await storage.get(paper.id)).explanation, persistedExplanation)
  assert.deepEqual(await storage.getPdf(paper.id), bytes)
})

test('a source with no readable citation fails local preflight before any model request', async () => {
  let calls = 0
  const llm = { stream() { calls++; throw new Error('No model call is permitted') } }
  for (const text of [glyphs.repeat(12), ' \n\t\r'.repeat(10), 'abc' + glyphs.repeat(12)]) {
    const paper = { ...evidencePaper, pageCount: 1, pages: [{ number: 1, text }] }
    await assert.rejects(generateExplanation(llm, { model: 'must-not-run' }, paper))
    assert.equal(calls, 0)
  }
})

test('allowing canonical control-bearing quotes never allows DEL in visible case or header fields', () => {
  const paper = archivedSource(), catalog = createEvidenceCatalog(paper)
  for (const mutate of [
    value => { value.title += '\u007f' },
    value => { value.summary += '\u007f' },
    value => { value.caseStudy.title += '\u007f' },
    value => { value.caseStudy.steps[0].code += '\u007f' },
    value => { value.caseStudy.steps[0].annotations[0].explanation += '\u007f' },
  ]) {
    const value = sourceDraft(); mutate(value)
    assert.throws(() => validateExplanation(paper, value, catalog, undefined, { version: 4 }),
      error => error.code === 'explanation-invalid')
  }
  const valid = validateExplanation(paper, sourceDraft(), catalog, undefined, { version: 4 })
  assert(valid.caseStudy.references[0].quote.includes('\u007f'))
})

// Map ordinary visible glyphs to unreadable Unicode values without embedding a
// real paper. This exercises the actual PDF parser and upload route.
function glyphPdf() {
  const unicodeMap = Object.fromEntries(Array.from({ length: 95 }, (_, index) => {
    const value = index + 32
    const mapped = ({ 64: 1, 94: 11, 126: 12, 124: 127 })[value] ?? value
    return [value.toString(16).padStart(2, '0'), mapped.toString(16).padStart(4, '0')]
  }))
  return createPdf(evidenceTexts.map(text => 'Source @ glyph ^ field ~ boundary | marker. ' + text),
    'Self-authored control glyph study', { unicodeMap, wrap: true })
}

async function terminal(request, id) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const { job } = await (await request('generation?id=' + id)).json()
    if (['completed', 'failed', 'cancelled'].includes(job?.phase)) return job
    await delay(10)
  }
  assert.fail('Background fixture generation did not finish')
}

test('real PDF upload completes generation with control-bearing citations, and a later bad retry preserves the saved result', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'paper-citation-api-'))
  const routes = new Map(), cleanup = [], calls = []
  const state = { reject: false, source: null }
  const llm = { async *stream(options) {
    calls.push(options)
    let response = options.system.includes('当前阶段：教学设计') ? teachingPlanFixture()
      : options.system.includes('事实审核员') ? { approved: true, issues: [] } : sourceDraft()
    if (state.reject && response.caseStudy) {
      const quote = state.source.pages[1].text.replace('baseline', 'base\u000bline')
      response.caseStudy.references = [{ page: 2, quote }]
    }
    yield { type: 'text-delta', text: JSON.stringify(response) }
    yield { type: 'finish', reason: { kind: 'stop' } }
  } }
  apply({ profileContext: { dir: directory }, llm,
    agentDefaultModel: { currentSelection: () => ({ model: 'self-authored-test-model' }) },
    connection: { fetch: { register: route => routes.set(route.path, route) } }, effect: setup => cleanup.push(setup()),
  })
  t.after(async () => { cleanup.forEach(dispose => dispose()); await rm(directory, { recursive: true, force: true }) })
  const request = (path, options) => {
    const url = new URL('http://localhost/api/dsh-paper-wiki/' + path), req = new Request(url, options)
    return routes.get(url.pathname).fetch(req)
  }
  const post = (path, body) => request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const pdf = glyphPdf()
  const uploaded = await request('papers', { method: 'POST', headers: { 'content-type': 'application/pdf',
    'x-paper-filename': 'control-glyph-fixture.pdf' }, body: pdf })
  assert.equal(uploaded.status, 201)
  const imported = await uploaded.json(), storage = createPaperStorage(join(directory, 'dsh-paper-wiki', 'papers'))
  state.source = await storage.get(imported.id)
  assert.equal(calls.length, 0, 'Import and local citation checks do not call a model')
  assert(state.source.pages.some(page => page.text.includes('\u0001')))
  assert(state.source.pages.some(page => page.text.includes('\u007f')))
  const initialPages = structuredClone(state.source.pages)
  const started = await post('generation', { id: imported.id })
  assert.equal(started.status, 202)
  const { job } = await started.json()
  assert.equal((await terminal(request, job.id)).phase, 'completed')
  assert.equal(calls.length, 3)
  assert(calls.slice(0, 2).every(call => !controls.test(call.messages[0].content[0].text)))
  const reopened = await (await request('papers?id=' + imported.id)).json()
  assert.equal(reopened.explanation.version, 4)
  assert.equal(reopened.explanation.caseStudy.references[1].quote, initialPages[1].text)
  assert.equal('pages' in reopened, false)
  assert.deepEqual(await storage.getPdf(imported.id), pdf)

  state.reject = true
  const retry = await (await post('generation', { id: imported.id })).json()
  const failed = await terminal(request, retry.job.id)
  assert.equal(failed.phase, 'failed')
  assert.equal(calls.length, 6, 'Invalid case grounding gets one bounded full repair, never a factual approval')
  const retained = await (await request('papers?id=' + imported.id)).json()
  assert.deepEqual(retained.explanation, reopened.explanation)
  assert.deepEqual((await createPaperStorage(join(directory, 'dsh-paper-wiki', 'papers')).get(imported.id)).pages, initialPages)
  assert.deepEqual(await storage.getPdf(imported.id), pdf)
})
