import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { test } from 'node:test'
import { apply } from '../index.js'
import { evidenceTexts, compactTeachingDraft, teachingPlanFixture } from '../test-support/explanation-fixture.js'
import { createPdf } from './fixtures/pdf.mjs'

async function fixture(t, llm) {
  const directory = await mkdtemp(join(tmpdir(), 'paper-api-'))
  const routes = new Map(), cleanup = []
  t.after(async () => { cleanup.forEach(dispose => dispose()); await rm(directory, { recursive: true, force: true }) })
  apply({ profileContext: { dir: directory }, llm,
    agentDefaultModel: { currentSelection: () => ({ provider: 'local', model: 'test-model' }) },
    connection: { fetch: { register: route => routes.set(route.path, route) } }, effect: setup => cleanup.push(setup()),
  })
  const request = (path, options) => {
    const url = new URL('http://localhost/api/dsh-paper-wiki/' + path)
    const req = new Request(url, options)
    const route = routes.get(url.pathname)
    assert.ok(route?.methods.includes(req.method))
    return route.fetch(req)
  }
  const post = (path, body) => request(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const upload = () => request('papers', { method: 'POST', headers: { 'content-type': 'application/pdf', 'x-paper-filename': encodeURIComponent('本地论文.pdf') },
    body: createPdf(evidenceTexts, 'Self-authored fixture', { wrap: true }) })
  return { directory, request, post, upload, routes, stop: () => cleanup.forEach(dispose => dispose()) }
}

function goodModel() {
  return { async *stream({ system }) {
    const output = system.includes('当前阶段：教学设计') ? teachingPlanFixture() : system.includes('事实审核员') ? { approved: true, issues: [] } : compactTeachingDraft()
    yield { type: 'text-delta', text: JSON.stringify(output) }
    yield { type: 'finish', reason: { kind: 'stop' } }
  } }
}

async function terminal(request, id) {
  for (let i = 0; i < 100; i++) {
    const { job } = await (await request('generation?id=' + id)).json()
    if (['completed', 'failed', 'cancelled'].includes(job?.phase)) return job
    await delay(10)
  }
  assert.fail('generation failed to finish')
}

test('import keeps source private, then manual generation persists reviewed explanations and plain page citations', async t => {
  const { request, post, upload, directory, routes } = await fixture(t, goodModel())
  const imported = await upload()
  assert.equal(imported.status, 201)
  const paper = await imported.json()
  assert.equal(paper.fileName, '本地论文.pdf')
  assert.equal(paper.explanation, null)
  assert.equal(paper.pageCount, evidenceTexts.length)
  assert.equal('pages' in paper, false, 'public import response omits extracted source text')
  assert.equal(routes.has('/api/dsh-paper-wiki/pdf'), false, 'no original PDF display endpoint is registered')
  assert.equal((await (await request('generation')).json()).job, null, 'import does not start a generation')
  const list = await (await request('papers')).json()
  assert.equal(list.papers[0].explained, false)
  const started = await post('generation', { id: paper.id })
  assert.equal(started.status, 202)
  const { job } = await started.json()
  assert.equal((await terminal(request, job.id)).phase, 'completed')
  const reopened = await (await request('papers?id=' + paper.id)).json()
  assert.equal(reopened.explanation.chapters.length, 7)
  assert.equal(reopened.explanation.model, 'test-model')
  assert.equal(reopened.explanation.version, 4)
  assert.equal(reopened.explanation.caseStudy.steps[0].chapterId, 'task')
  assert(reopened.explanation.caseStudy.steps[0].annotations.length > 0)
  assert.equal(reopened.explanation.chapters[5].blocks[1].data[1].value, 80)
  assert.match(reopened.explanation.chapters[0].markdown, /（第 1 页）/)
  assert.doesNotMatch(reopened.explanation.chapters[0].markdown, /https?:|source\?/)
  assert.equal('pages' in reopened, false)
  const disk = JSON.parse(await readFile(join(directory, 'dsh-paper-wiki', 'papers', paper.id, 'paper.json'), 'utf8'))
  assert.equal(disk.explanation.model, 'test-model')
  assert.match(disk.pages[0].text, /compare two fixed models/, 'source is retained internally for citation verification')
  assert.equal((await readFile(join(directory, 'dsh-paper-wiki', 'papers', paper.id, 'original.pdf'))).subarray(0, 5).toString(), '%PDF-')
  assert.equal((await post('papers/delete', { id: paper.id })).status, 204)
  assert.equal((await request('papers?id=' + paper.id)).status, 404)
  assert.deepEqual((await (await request('papers')).json()).papers, [])
})

test('absolute local PDF path import works without model calls, malformed requests are rejected', async t => {
  const { request, post, directory } = await fixture(t, { stream() { assert.fail('import must stay local') } })
  const path = join(directory, 'local.pdf')
  await writeFile(path, createPdf(['A locally imported research paper with readable evidence.']))
  assert.equal((await post('papers', { paperPath: path })).status, 201)
  assert.equal((await post('papers', { paperPath: '../local.pdf' })).status, 400)
  assert.equal((await post('papers', { paperPath: directory })).status, 400)
  assert.equal((await request('papers', { method: 'POST', body: 'wrong' })).status, 415)
  assert.equal((await post('generation', { id: '../paper.json' })).status, 400)
  assert.equal((await post('papers/delete', { id: randomUUID() })).status, 204)
  assert.equal((await request('papers?id=../secret')).status, 400)
})

test('background task recovers from status, prevents conflicting generation and deletion, then cancels', async t => {
  const llm = { async *stream({ signal }) {
    await delay(5000, undefined, { signal })
    assert.fail('cancelled request must not finish')
  } }
  const { request, post, upload } = await fixture(t, llm)
  const paper = await (await upload()).json()
  const { job } = await (await post('generation', { id: paper.id })).json()
  assert.equal((await (await request('generation')).json()).job.id, job.id)
  assert.equal((await post('generation', { id: paper.id })).status, 409)
  assert.equal((await post('papers/delete', { id: paper.id })).status, 409)
  assert.equal((await post('generation/cancel', { id: job.id })).status, 200)
  assert.equal((await terminal(request, job.id)).phase, 'cancelled')
  assert.equal((await (await request('papers?id=' + paper.id)).json()).explanation, null)
  assert.equal((await post('papers/delete', { id: paper.id })).status, 204)
})

test('model failure preserves the imported paper and permits a new manual generation attempt', async t => {
  const llm = { async *stream() { throw Object.assign(new Error('private credentials must not leak'), { code: 'AUTH' }) } }
  const { request, post, upload } = await fixture(t, llm)
  const paper = await (await upload()).json()
  const { job } = await (await post('generation', { id: paper.id })).json()
  const failed = await terminal(request, job.id)
  assert.equal(failed.phase, 'failed')
  assert.match(failed.error, /模型配置不可用/)
  assert.doesNotMatch(failed.error, /private credentials/)
  assert.equal((await request('papers?id=' + paper.id)).status, 200)
  llm.stream = goodModel().stream
  const retried = await (await post('generation', { id: paper.id })).json()
  assert.equal((await terminal(request, retried.job.id)).phase, 'completed')
})

test('plugin shutdown interrupts a stalled upload stream and releases the import slot', async t => {
  const { request, upload, stop } = await fixture(t)
  let cancelled = false
  const body = new ReadableStream({ cancel() { cancelled = true } })
  const pending = request('papers', { method: 'POST', duplex: 'half', body,
    headers: { 'content-type': 'application/pdf' } })
  await delay(1)
  stop()
  assert.equal((await pending).status, 503)
  assert.equal(cancelled, true)
  assert.equal((await upload()).status, 503)
})
