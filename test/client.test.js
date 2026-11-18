import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { richDraft, teachingDraft, compactTeachingDraft } from '../test-support/explanation-fixture.js'
import { createPaperHtml } from '../src/paper-html.js'
import { createPaperContentRenderer } from '../src/paper-blocks.js'
import { createPaperGenerationProgress } from '../src/generation-progress.js'

const firstId = '11111111-1111-4111-8111-111111111111'
const secondId = '22222222-2222-4222-8222-222222222222'
const jobId = '33333333-3333-4333-8333-333333333333'
const firstPaper = { id: firstId, title: 'First paper', fileName: '论文.pdf', pageCount: 2,
  createdAt: '2026-11-18T01:00:00.000Z', sha256: 'a'.repeat(64), warnings: [], explanation: null }
const secondPaper = { ...firstPaper, id: secondId, title: 'Second paper' }
const explainedPaper = { ...firstPaper, explanation: { title: 'First paper', summary: 'Summary', model: 'fixture', createdAt: '2026-11-18T01:01:00.000Z',
  chapters: [{ id: 'overview', title: '研究问题', markdown: 'A claim [第 2 页](https://dsh-paper-wiki.invalid/source?id=' + firstId + '&page=2).' },
    { id: 'method', title: '方法', markdown: 'Method [evidence](http://localhost/dsh/api/dsh-paper-wiki/pdf?id=' + firstId + '#page=1).' }] } }

async function fixture(respond) {
  let definition, store, Page
  const calls = [], registrations = [], timers = new Map(), downloads = [], downloadBlobs = new Map()
  let timerId = 0, dispose
  const React = { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }),
    Fragment: Symbol('fragment'), useEffect() {}, useId: () => 'fixture-id', useRef: () => ({ current: null }),
    useState: value => [typeof value === 'function' ? value() : value, () => {}], useSyncExternalStore: (_subscribe, getSnapshot) => getSnapshot() }
  class RuntimeURL extends URL {
    static createObjectURL(blob) { const value = 'blob:fixture-' + downloadBlobs.size; downloadBlobs.set(value, blob); return value }
    static revokeObjectURL(value) { downloadBlobs.delete(value) }
  }
  runInNewContext(await readFile(new URL('../src/client.js', import.meta.url), 'utf8'), {
    window: { __ModuleLoader__: { load(value) { definition = value } } },
    document: { baseURI: 'http://localhost/dsh/', createElement() { const link = { click() { downloads.push({ ...link }) } }; return link } },
    URL: RuntimeURL, Intl, AbortController, AbortSignal, Blob, Date,
    paperWikiStyles: '', createPaperGenerationProgress, createPaperContentRenderer, createPaperHtml, paperExportStyles: '', paperExportBehavior: '',
    paperGuideStyles: '/* trusted guide styles */', paperGuideBehavior: '',
    setTimeout(fn) { const id = ++timerId; timers.set(id, fn); return id }, clearTimeout(id) { timers.delete(id) },
    setInterval() { return 0 }, clearInterval() {},
    fetch: async (url, options = {}) => { const request = { url: new URL(url), ...options }; calls.push(request); return respond(request) },
  })
  assert.equal(definition.id, 'dsh-paper-wiki')
  const primitives = { MarkdownText: 'markdown', Button: 'button', Modal: 'modal' }
  const plugin = definition.factory(name => name === 'react' ? React : primitives)
  assert.deepEqual([...plugin.inject], ['slots'])
  plugin.apply({ effect(install) { dispose = install() }, slots: {
    inject(_name, install) { install() }, register(options, Component) { registrations.push(options); if (options.key === 'dsh-paper-wiki') { store = options.inject().store; Page = Component } },
  } })
  return { store, Page, calls, registrations, dispose, timers, downloads, downloadBlobs,
    async tick() { const [id, fn] = [...timers.entries()][0] || []; assert(fn, 'A background poll is scheduled'); timers.delete(id); await fn() } }
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return null
  if (predicate(node)) return node
  for (const child of node.children || []) { const value = find(child, predicate); if (value) return value }
  return null
}
const flush = () => new Promise(resolve => setImmediate(resolve))
function renderReader(app) {
  const element = find(app.Page({ store: app.store }), node => node.type?.name === 'PaperReader')
  return element.type(element.props)
}
function assertExplanationOnly(reader) {
  assert.equal(find(reader, node => ['iframe', 'pre', 'embed', 'object'].includes(node.type)), null)
  assert.equal(find(reader, node => ['论文原文', '提取文本', '上一页', '下一页'].some(text => node.children.includes(text))), null)
  assert.equal(find(reader, node => node.type === 'a' && /dsh-paper-wiki\/(?:pdf|source)/.test(node.props.href || '')), null)
}

test('empty library keeps a single explicit new Wiki action and a concise empty state', async () => {
  const app = await fixture(request => Response.json(request.url.pathname.endsWith('/papers') ? { papers: [] } : { job: null }))
  app.store.initialize()
  await flush()
  const page = app.Page({ store: app.store })
  const libraryElement = find(page, node => node.type?.name === 'PaperLibrary')
  const library = libraryElement.type(libraryElement.props)
  const empty = find(library, node => node.props.className === 'dsh-paper-wiki-library-empty')
  assert.equal(empty.children.filter(Boolean).length, 2, 'empty state contains an icon and one line')
  assert.equal(find(library, node => node.type === 'button'), null, 'no duplicate import or refresh action')
  assert.equal(find(page, node => node.type?.name === 'ImportForm'), null, 'new Wiki form starts collapsed')
  const create = find(page, node => node.type === 'button' && node.children.includes('新建 Wiki'))
  assert(create)
  create.props.onClick()
  const opened = app.Page({ store: app.store })
  const cancel = find(opened, node => node.type === 'button' && node.children.includes('取消新建'))
  const formElement = find(opened, node => node.type?.name === 'ImportForm')
  const form = formElement.type(formElement.props)
  assert.equal(cancel.props['aria-controls'], form.props.id)
  assert.equal(cancel.props['aria-expanded'], true)
  cancel.props.onClick()
  assert.equal(app.store.getSnapshot().formOpen, false)
  assert(app.calls.every(call => call.method !== 'POST'), 'opening and closing the form performs no import or generation')
  app.dispose()
})

test('library load failure exposes a local retry and clears after a successful retry', async () => {
  let failed = true
  const app = await fixture(request => request.url.pathname.endsWith('/papers')
    ? failed ? Response.json({ error: 'unavailable' }, { status: 503 }) : Response.json({ papers: [] })
    : Response.json({ job: null }))
  app.store.initialize()
  await flush()
  assert.equal(app.store.getSnapshot().error, '', 'library failure does not also create a duplicate page alert')
  const element = find(app.Page({ store: app.store }), node => node.type?.name === 'PaperLibrary')
  const library = element.type(element.props)
  const retry = find(find(library, node => node.props.role === 'alert'), node => node.type === 'button' && node.children.includes('重试'))
  assert(retry)
  failed = false
  retry.props.onClick()
  await flush()
  assert.equal(app.store.getSnapshot().historyStatus, 'ready')
  app.dispose()
})

test('file selection performs no request; one explicit submit reads the paper and starts its explanation', async () => {
  const app = await fixture(request => {
    if (request.url.pathname.endsWith('/generation')) {
      assert.equal(request.method, 'POST')
      assert.deepEqual(JSON.parse(request.body), { id: firstId })
      return Response.json({ job: { id: jobId, paperId: firstId, phase: 'writing', elapsedMs: 0 } }, { status: 202 })
    }
    assert.equal(request.url.pathname, '/dsh/api/dsh-paper-wiki/papers')
    assert.equal(request.method, 'POST')
    assert.equal(request.headers['content-type'], 'application/pdf')
    assert.equal(decodeURIComponent(request.headers['x-paper-filename']), '论文.pdf')
    assert.equal(request.body.name, '论文.pdf')
    return Response.json(firstPaper, { status: 201 })
  })
  assert.equal(app.registrations.find(item => item.name === 'sidebar.panellist').label, '论文百科')
  app.store.setFormOpen(true)
  app.store.setFile(new File(['%PDF-1.7'], '论文.pdf', { type: 'application/pdf' }))
  assert.equal(app.calls.length, 0)
  await app.store.createWiki()
  assert.equal(app.store.getSnapshot().result.id, firstId)
  assert.equal(app.calls.filter(call => call.url.pathname.endsWith('/papers') && call.method === 'POST').length, 1)
  assert.equal(app.calls.filter(call => call.url.pathname.endsWith('/generation') && call.method === 'POST').length, 1)
  assert(!('pages' in app.store.getSnapshot().result))
  assert.equal(app.store.getSnapshot().generation.phase, 'writing')
  assert.equal(find(app.Page({ store: app.store }), node => node.type?.name === 'PaperReader'), null, 'progress replaces the intermediate reader')
  app.dispose()
})

test('paper import failures keep the selected file and allow another attempt', async () => {
  let attempts = 0
  const app = await fixture(request => request.url.pathname.endsWith('/generation')
    ? Response.json({ job: { id: jobId, paperId: firstId, phase: 'writing', elapsedMs: 0 } }, { status: 202 })
    : ++attempts === 1 ? Response.json({ error: '扫描件未发现文字' }, { status: 422 }) : Response.json(firstPaper, { status: 201 }))
  const file = new File(['%PDF-1.7'], '论文.pdf', { type: 'application/pdf' })
  app.store.setFile(file)
  await app.store.createWiki()
  assert.equal(app.store.getSnapshot().error, '扫描件未发现文字')
  assert.equal(app.store.getSnapshot().file, file)
  assert.equal(app.store.getSnapshot().importing, false)
  await app.store.createWiki()
  assert.equal(app.store.getSnapshot().result.id, firstId)
  assert.equal(attempts, 2)
  app.dispose()
})

test('background generation completion updates a paper without changing another open paper', async () => {
  let completed = false
  const app = await fixture(request => {
    if (request.url.pathname.endsWith('/papers')) {
      const id = request.url.searchParams.get('id')
      return Response.json(id === secondId ? secondPaper : completed ? explainedPaper : firstPaper)
    }
    if (request.method === 'POST') return Response.json({ job: { id: jobId, paperId: firstId, phase: 'writing', elapsedMs: 0 } }, { status: 202 })
    completed = true
    return Response.json({ job: { id: jobId, paperId: firstId, phase: 'completed', elapsedMs: 5000 } })
  })
  await app.store.openPaper(firstId)
  await app.store.generate()
  await app.store.openPaper(secondId)
  await app.tick()
  assert.equal(app.store.getSnapshot().result.id, secondId)
  assert.equal(app.store.getSnapshot().papers.find(paper => paper.id === firstId).explained, true)
  assert.equal(app.timers.size, 0)
  await app.store.openPaper(firstId)
  const reader = renderReader(app)
  const markdown = find(reader, node => node.type === 'markdown' && node.props.text.includes('A claim'))
  assert(markdown.props.text.includes('（第 2 页）'))
  assert(!markdown.props.text.includes('.invalid'))
  assert(!markdown.props.text.includes('/pdf'))
  assert.equal(markdown.props.omitHtml, true)
  assertExplanationOnly(reader)
  app.store.selectChapter(1)
  const method = find(renderReader(app), node => node.type === 'markdown')
  assert.equal(method.props.text, 'Method （第 1 页）.')
  app.dispose()
})

test('completed generation updates the explanation and library without a duplicate success card', async () => {
  for (const returnBeforeCompletion of [false, true]) {
    let completed = false
    const app = await fixture(request => {
      if (request.url.pathname.endsWith('/papers')) return Response.json(completed ? explainedPaper : firstPaper)
      if (request.method === 'POST') return Response.json({ job: { id: jobId, paperId: firstId, phase: 'writing', elapsedMs: 0 } }, { status: 202 })
      completed = true
      return Response.json({ job: { id: jobId, paperId: firstId, phase: 'completed', elapsedMs: 1000 } })
    })
    await app.store.openPaper(firstId)
    await app.store.generate()
    if (returnBeforeCompletion) {
      app.store.returnToLibrary()
      assert.equal(app.store.getSnapshot().generation.phase, 'writing', 'returning to the library keeps active progress')
    }
    await app.tick()
    assert.equal(find(app.Page({ store: app.store }), node => node.type?.name === 'GenerationProgress'), null)
    assert.equal(app.store.getSnapshot().papers.find(paper => paper.id === firstId).explained, true)
    if (!returnBeforeCompletion) {
      assert.equal(app.store.getSnapshot().result.explanation.chapters[0].id, 'overview')
      app.store.returnToLibrary()
      assert.equal(app.store.getSnapshot().generation, null)
    }
    assert.equal(app.store.getSnapshot().result, null)
    const page = app.Page({ store: app.store })
    assert.equal(find(page, node => node.type?.name === 'GenerationProgress'), null)
    assert(find(page, node => node.type?.name === 'PaperLibrary'))
    app.dispose()
  }
})

test('refresh recovers an active generation and disposal stops polling', async () => {
  const app = await fixture(request => request.url.pathname.endsWith('/papers') ? Response.json({ papers: [firstPaper] })
    : Response.json({ job: { id: jobId, paperId: firstId, phase: 'reviewing', elapsedMs: 2000 } }))
  app.store.initialize()
  app.store.initialize()
  await flush()
  assert.equal(app.calls.length, 2, 'mounting twice performs a single recovery')
  assert.equal(app.store.getSnapshot().generation.phase, 'reviewing')
  assert.equal(app.store.getSnapshot().result, null, 'recovery does not navigate to another paper')
  assert.equal(app.timers.size, 1)
  app.dispose()
  assert.equal(app.timers.size, 0)
})

test('a fresh library does not restore a cancelled task as an extra action above the new form', async () => {
  const app = await fixture(request => request.url.pathname.endsWith('/papers') ? Response.json({ papers: [explainedPaper] })
    : Response.json({ job: { id: jobId, paperId: firstId, phase: 'cancelled', elapsedMs: 1000 } }))
  app.store.initialize()
  await flush()
  app.store.setFormOpen(true)
  assert.equal(app.store.getSnapshot().generation, null)
  assert.equal(find(app.Page({ store: app.store }), node => node.type?.name === 'GenerationProgress'), null)
  assert.equal(app.store.getSnapshot().formOpen, true)
  assert(app.calls.every(call => call.method !== 'POST'))
  app.dispose()
})

test('new Wiki form has a custom file selector and one submit without extra instructions or path inputs', async () => {
  const app = await fixture(() => assert.fail('selecting a file must not issue requests'))
  app.store.setFormOpen(true)
  const selected = new File(['%PDF-1.7'], '论文.pdf', { type: 'application/pdf' })
  app.store.setFile(selected)
  const element = find(app.Page({ store: app.store }), node => node.type?.name === 'ImportForm')
  const form = element.type(element.props)
  const input = find(form, node => node.type === 'input')
  assert.equal(input.props.type, 'file')
  assert.equal(input.props.hidden, true, 'native no-file text is not displayed')
  assert.equal(find(form, node => node.type === 'button' && node.children.includes('选择论文')).props.type, 'button')
  assert.equal(find(form, node => ['p', 'details'].includes(node.type)), null)
  assert.equal(find(form, node => node.type === 'input' && node.props.type === 'text'), null)
  assert.equal(find(form, node => node.type === 'button' && node.props.type === 'submit').children[0], '生成讲解')
  input.props.onChange({ target: { files: [], value: '' } })
  assert.equal(app.store.getSnapshot().file, selected, 'cancelling the picker keeps the existing selection')
  assert.equal(app.calls.length, 0)
  app.dispose()
})

test('one submission remains locked from PDF upload through generation acceptance', async () => {
  let release
  const uploaded = new Promise(resolve => { release = resolve })
  const app = await fixture(request => request.url.pathname.endsWith('/papers') ? uploaded
    : Response.json({ job: { id: jobId, paperId: firstId, phase: 'writing', elapsedMs: 0 } }, { status: 202 }))
  app.store.setFile(new File(['%PDF-1.7'], '论文.pdf', { type: 'application/pdf' }))
  const pending = app.store.createWiki()
  assert.equal(app.store.getSnapshot().preparing.phase, 'reading')
  await app.store.createWiki()
  assert.equal(app.calls.length, 1, 'a second click does not create another archive')
  release(Response.json(firstPaper, { status: 201 }))
  await pending
  assert.equal(app.calls.length, 2)
  assert.equal(app.store.getSnapshot().importing, false)
  assert.equal(app.store.getSnapshot().preparing, null)
  assert.equal(app.store.getSnapshot().generation.phase, 'writing')
  app.dispose()
})

test('changing the open paper during upload cannot change which paper is explained', async () => {
  let release
  const uploaded = new Promise(resolve => { release = resolve })
  const app = await fixture(request => {
    if (request.url.pathname.endsWith('/papers')) {
      if (request.method === 'POST') return uploaded
      return Response.json(request.url.searchParams.get('id') === secondId ? secondPaper : explainedPaper)
    }
    if (request.method === 'POST') {
      assert.deepEqual(JSON.parse(request.body), { id: firstId })
      return Response.json({ job: { id: jobId, paperId: firstId, phase: 'writing', elapsedMs: 0 } }, { status: 202 })
    }
    return Response.json({ job: { id: jobId, paperId: firstId, phase: 'completed', elapsedMs: 1000 } })
  })
  app.store.setFile(new File(['%PDF-1.7'], '论文.pdf', { type: 'application/pdf' }))
  const pending = app.store.createWiki()
  await app.store.openPaper(secondId)
  release(Response.json(firstPaper, { status: 201 }))
  await pending
  assert.equal(app.store.getSnapshot().result.id, secondId)
  await app.tick()
  assert.equal(app.store.getSnapshot().result.id, secondId, 'background completion does not replace the current reader')
  assert.equal(app.store.getSnapshot().papers.find(paper => paper.id === firstId).explained, true)
  app.dispose()
})

test('a different running task is reported without treating it as the selected paper generation', async () => {
  const app = await fixture(request => request.url.pathname.endsWith('/papers') ? Response.json(firstPaper, { status: 201 })
    : Response.json({ error: '已有论文正在生成。', job: { id: jobId, paperId: secondId, phase: 'writing', elapsedMs: 0 } }, { status: 409 }))
  app.store.setFile(new File(['%PDF-1.7'], '论文.pdf', { type: 'application/pdf' }))
  await app.store.createWiki()
  assert.match(app.store.getSnapshot().error, /已有论文正在生成/)
  assert.equal(app.store.getSnapshot().result.id, firstId)
  assert.equal(app.store.getSnapshot().generation.paperId, secondId)
  app.store.setFile(new File(['%PDF-1.7'], '下一篇.pdf', { type: 'application/pdf' }))
  await app.store.createWiki()
  assert.equal(app.calls.filter(call => call.url.pathname.endsWith('/papers') && call.method === 'POST').length, 1)
  app.dispose()
})

test('cancelling PDF reading returns to the selected file without starting a model request', async () => {
  const app = await fixture(request => new Promise((_resolve, reject) => {
    request.signal.addEventListener('abort', () => reject(new DOMException('cancelled', 'AbortError')), { once: true })
  }))
  const selected = new File(['%PDF-1.7'], '论文.pdf', { type: 'application/pdf' })
  app.store.setFile(selected)
  const pending = app.store.createWiki()
  await app.store.cancelGeneration()
  await pending
  assert.equal(app.store.getSnapshot().preparing, null)
  assert.equal(app.store.getSnapshot().formOpen, true)
  assert.equal(app.store.getSnapshot().file, selected)
  assert.equal(app.calls.length, 1)
  app.dispose()
})

test('cancelling while generation starts also cancels the accepted background task', async () => {
  let release
  const started = new Promise(resolve => { release = resolve })
  const app = await fixture(request => {
    if (request.url.pathname.endsWith('/papers')) return Response.json(firstPaper, { status: 201 })
    if (request.url.pathname.endsWith('/cancel')) return Response.json({ job: { id: jobId, paperId: firstId, phase: 'cancelled', elapsedMs: 0 } })
    return started
  })
  app.store.setFile(new File(['%PDF-1.7'], '论文.pdf', { type: 'application/pdf' }))
  const pending = app.store.createWiki()
  await flush()
  assert.equal(app.store.getSnapshot().generating, true)
  await app.store.cancelGeneration()
  release(Response.json({ job: { id: jobId, paperId: firstId, phase: 'writing', elapsedMs: 0 } }, { status: 202 }))
  await pending
  assert.equal(app.store.getSnapshot().generation.phase, 'cancelled')
  assert.equal(app.store.getSnapshot().papers.length, 1)
  assert.equal(app.calls.filter(call => call.url.pathname.endsWith('/cancel')).length, 1)
  assert.equal(app.timers.size, 0)
  app.dispose()
})

test('exported explanations replace saved source links with plain page citations', async () => {
  const app = await fixture(() => Response.json(explainedPaper))
  await app.store.openPaper(firstId)
  const readerElement = find(app.Page({ store: app.store }), node => node.type?.name === 'PaperReader')
  const reader = readerElement.type(readerElement.props)
  const exportButton = find(reader, node => node.type === 'button' && node.children.includes('导出讲解'))
  exportButton.props.onClick()
  assert.equal(app.downloads[0].download, '论文-讲解.md')
  const markdown = await app.downloadBlobs.get(app.downloads[0].href).text()
  assert(markdown.includes('（第 2 页）'))
  assert(markdown.includes('（第 1 页）'))
  assert(!markdown.includes('/pdf'))
  assert(!markdown.includes('.invalid'))
  assert(!markdown.includes('Summary'))
  assert.equal(find(reader, node => node.props.className === 'dsh-paper-wiki-summary'), null)
  app.dispose()
})

test('failed manual generation retains the imported paper and allows retry without reimporting', async () => {
  let generations = 0
  const app = await fixture(request => {
    if (request.url.pathname.endsWith('/papers')) return Response.json(firstPaper, { status: 201 })
    generations++
    return Response.json({ job: { id: jobId, paperId: firstId, phase: generations === 1 ? 'failed' : 'writing', elapsedMs: 0,
      ...(generations === 1 ? { error: '模型暂时不可用，请重试。' } : {}) } }, { status: 202 })
  })
  app.store.setFile(new File(['%PDF-1.7'], '论文.pdf', { type: 'application/pdf' }))
  await app.store.createWiki()
  assert.equal(generations, 1)
  assert.equal(app.store.getSnapshot().generation.phase, 'failed')
  assert.equal(app.store.getSnapshot().result.id, firstId)
  assert.equal(app.store.getSnapshot().result.explanation, null)
  assert.equal(app.store.getSnapshot().papers.length, 1)
  assert.equal(find(app.Page({ store: app.store }), node => node.type?.name === 'PaperReader'), null, 'failure has one retry action in the progress card')
  await app.store.generate()
  assert.equal(generations, 2)
  assert.equal(app.calls.filter(call => call.url.pathname.endsWith('/papers') && call.method === 'POST').length, 1)
  app.dispose()
})

test('a missing background job after DSH restarts stops polling and enables a fresh generation', async () => {
  let attempts = 0
  const app = await fixture(request => {
    if (request.url.pathname.endsWith('/papers')) return Response.json(firstPaper)
    if (request.method === 'POST') { attempts++; return Response.json({ job: { id: jobId, paperId: firstId, phase: 'writing', elapsedMs: 0 } }, { status: 202 }) }
    return Response.json({ job: null })
  })
  await app.store.openPaper(firstId)
  await app.store.generate()
  await app.tick()
  assert.equal(app.store.getSnapshot().generation.phase, 'failed')
  assert.match(app.store.getSnapshot().generation.error, /重新尝试/)
  assert.equal(app.store.getSnapshot().offline, false)
  assert.equal(app.timers.size, 0)
  await app.store.generate()
  assert.equal(attempts, 2)
  assert.equal(app.store.getSnapshot().generation.phase, 'writing')
  app.dispose()
})

test('new teaching chapters use the content renderer and reset step state across papers and regenerated explanations', async () => {
  const chapter = { ...richDraft().chapters[1], title: '任务与输入输出', markdown: 'Complete fallback export' }
  const explanation = { ...explainedPaper.explanation, version: 2, chapters: [chapter] }
  let current = { ...firstPaper, explanation }
  const app = await fixture(request => Response.json(request.url.searchParams.has('id') ? current : { papers: [] }))
  await app.store.openPaper(firstId)
  let content = find(renderReader(app), node => node.type?.name === 'PaperContent')
  assert(content, 'typed chapters use the interactive content renderer')
  assert.equal(JSON.parse(content.props.chapter.blocks[1].steps[2].code).product_id, 'p1')
  const originalKey = content.props.key
  current = { ...secondPaper, explanation }
  await app.store.openPaper(secondId)
  content = find(renderReader(app), node => node.type?.name === 'PaperContent')
  assert.notEqual(content.props.key, originalKey, 'same chapter of another paper gets fresh interaction state')
  const secondKey = content.props.key
  current = { ...secondPaper, explanation: { ...explanation, createdAt: '2026-11-19T01:01:00Z' } }
  await app.store.openPaper(secondId)
  content = find(renderReader(app), node => node.type?.name === 'PaperContent')
  assert.notEqual(content.props.key, secondKey, 'regeneration also resets the selected step')
  app.dispose()
})

test('skill lessons show every chapter continuously and export all teaching content as HTML', async () => {
  const chapters = teachingDraft().chapters.map(chapter => ({ ...chapter, title: chapter.id, markdown: 'fallback' }))
  const current = { ...firstPaper, explanation: { ...explainedPaper.explanation, version: 3, skill: 'paper-explainer', chapters } }
  const app = await fixture(() => Response.json(current))
  await app.store.openPaper(firstId)
  const all = (node, predicate) => !node || typeof node !== 'object' ? [] : [...(predicate(node) ? [node] : []), ...(node.children || []).flatMap(child => all(child, predicate))]
  let reader = renderReader(app)
  assert.equal(all(reader, node => node.type?.name === 'PaperContent').length, 7)
  app.store.selectChapter(6)
  reader = renderReader(app)
  assert.equal(all(reader, node => node.type?.name === 'PaperContent').length, 7, 'directory navigation must not hide examples in other chapters')
  const exportButton = find(reader, node => node.type === 'button' && node.children.includes('导出 HTML'))
  exportButton.props.onClick()
  assert.equal(app.downloads[0].download, '论文-讲解.html')
  const html = await app.downloadBlobs.get(app.downloads[0].href).text()
  assert.match(html, /<!doctype html>/i)
  assert.match(html, /PHONE/)
  assert.match(html, /product_id/)
  assert.match(html, /小写归一化/)
  assert.match(html, /准确率/)
  assert.doesNotMatch(html, /We study exact product-title retrieval/)
  app.dispose()
})

test('version 4 reads the same isolated guide document that HTML export downloads', async () => {
  const draft = compactTeachingDraft()
  const paper = { ...firstPaper, explanation: { ...explainedPaper.explanation, version: 4, skill: 'paper-explainer',
    title: draft.title, summary: draft.summary, caseStudy: draft.caseStudy,
    chapters: draft.chapters.map(chapter => ({ ...chapter, title: chapter.id, markdown: 'Explanation fallback' })) } }
  const app = await fixture(() => Response.json(paper))
  await app.store.openPaper(firstId)
  const reader = renderReader(app), frame = find(reader, node => node.type === 'iframe')
  assert(frame, 'guide appears within the paper app')
  assert.equal(frame.props.sandbox, 'allow-scripts')
  assert.equal(frame.props.referrerPolicy, 'no-referrer')
  assert.equal(frame.props.srcDoc, createPaperHtml(paper, { guideStyles: '/* trusted guide styles */', guideBehavior: '' }))
  const page = app.Page({ store: app.store })
  const download = find(page, node => node.type === 'button' && node.children.includes('导出 HTML'))
  download.props.onClick()
  assert.equal(app.downloads.length, 1)
  assert.equal(app.downloads[0].download, '论文-讲解.html')
  const exported = await app.downloadBlobs.get(app.downloads[0].href).text()
  assert.equal(exported, frame.props.srcDoc)
  assert.equal(app.calls.length, 1, 'reading and exporting never generate content')
  assert.equal(find(reader, node => node.type?.name === 'ChapterDirectory'), null)
  app.dispose()
})
