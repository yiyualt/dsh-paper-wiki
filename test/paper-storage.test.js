import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { createPaperStorage, validPaperId } from '../src/paper-storage.js'

const bytes = Buffer.from('%PDF-1.7\nlocal fixture\n')
const paper = () => ({ id: randomUUID(), createdAt: new Date().toISOString(), title: 'Research paper',
  fileName: 'paper.pdf', sha256: createHash('sha256').update(bytes).digest('hex'),
  pageCount: 1, pages: [{ number: 1, text: 'The original paper text.' }], warnings: [], explanation: null })
const explanation = () => ({ title: 'Research paper', summary: 'The paper investigates a stated research question.',
  chapters: [{ id: 'overview', title: '研究问题', markdown: 'The author reports a result. [第 1 页](https://example.invalid)' }],
  model: 'fixture-model', createdAt: new Date().toISOString(), durationMs: 20 })
const references = () => [{ page: 1, quote: 'The original paper text.' }]
const richExplanation = () => ({ ...explanation(), version: 2, chapters: [
  { id: 'overview', title: '论文做了什么', markdown: '论文说明。（第 1 页）', blocks: [
    { type: 'paragraph', text: '论文说明。', references: references() },
  ] },
  { id: 'task', title: '任务与输入输出', markdown: '构造示例（非论文原始样本）', blocks: [
    { type: 'example', title: '教学示例', mode: 'illustrative', references: references(), steps: [
      { label: '输入', language: 'json', code: '{"query":"sample"}', explanation: '构造的输入。' },
      { label: '输出', language: 'json', code: '{"items":["one"]}', explanation: '构造的输出。' },
    ] },
  ] },
  { id: 'analysis', title: '结果分析与局限', markdown: '当前可提取的论文文字未提供足够依据，暂不作结论。' },
] })

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'dsh-paper-storage-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  return { root, storage: createPaperStorage(join(root, 'papers')) }
}

test('archives the exact PDF and text, then persists a separately generated explanation', async t => {
  const { root, storage } = await fixture(t)
  const record = paper()
  assert.deepEqual(await storage.list(), [])
  await storage.save(record, bytes)
  assert.deepEqual(await storage.get(record.id), record)
  assert.deepEqual(await storage.getPdf(record.id), bytes)
  assert.deepEqual(await storage.list(), [{ id: record.id, title: record.title, fileName: record.fileName,
    pageCount: 1, createdAt: record.createdAt, sha256: record.sha256, explained: false }])
  const result = await storage.setExplanation(record.id, explanation())
  assert.deepEqual(await storage.get(record.id), result)
  assert.equal((await storage.list())[0].explained, true)
  assert.deepEqual(await readFile(join(root, 'papers', record.id, 'original.pdf')), bytes)
  assert.deepEqual(JSON.parse(await readFile(join(root, 'papers', record.id, 'paper.json'), 'utf8')), result)
  await assert.rejects(storage.save({ ...record, title: 'Overwrite' }, bytes))
  assert.equal((await storage.get(record.id)).title, record.title)
})

test('does not expose traversal paths, malformed metadata or symlinked archives and files', async t => {
  const { root, storage } = await fixture(t)
  const record = paper()
  await storage.save(record, bytes)
  assert.equal(validPaperId('../outside'), false)
  assert.equal(await storage.get('../outside'), undefined)
  assert.equal(await storage.getPdf('../outside'), undefined)
  assert.equal(await storage.remove('../outside'), false)
  await assert.rejects(storage.save({ ...record, id: '../outside' }, bytes), TypeError)
  await assert.rejects(storage.save({ ...record, id: randomUUID(), sha256: 'a'.repeat(64) }, bytes), TypeError)
  await assert.rejects(storage.setExplanation(record.id, { chapters: [] }), TypeError)
  const metadata = join(root, 'papers', record.id, 'paper.json')
  await writeFile(metadata, '{broken')
  assert.equal(await storage.get(record.id), undefined)
  assert.deepEqual(await storage.list(), [])
  await rm(metadata)
  const outside = join(root, 'outside.json')
  await writeFile(outside, JSON.stringify(record))
  await symlink(outside, metadata)
  assert.equal(await storage.get(record.id), undefined)
  const other = paper()
  await mkdir(join(root, 'outside-dir'))
  await writeFile(join(root, 'outside-dir', 'paper.json'), JSON.stringify(other))
  await symlink(join(root, 'outside-dir'), join(root, 'papers', other.id))
  assert.equal(await storage.get(other.id), undefined)
  await storage.remove(other.id)
  assert.deepEqual(JSON.parse(await readFile(join(root, 'outside-dir', 'paper.json'), 'utf8')), other)
})

test('serializes explanation update and removal without recreating deleted papers', async t => {
  const { storage } = await fixture(t)
  const record = paper()
  await storage.save(record, bytes)
  await Promise.all([storage.setExplanation(record.id, explanation()), storage.remove(record.id)])
  assert.equal(await storage.get(record.id), undefined)
  assert.equal(await storage.getPdf(record.id), undefined)
  assert.equal(await storage.setExplanation(record.id, explanation()), undefined)
  assert.equal(await storage.remove(record.id), true)
  assert.deepEqual(await storage.list(), [])
})

test('persists version 2 teaching blocks and fallback Markdown across fresh storage instances', async t => {
  const { root, storage } = await fixture(t)
  const record = paper(), rich = richExplanation()
  await storage.save(record, bytes)
  const updated = await storage.setExplanation(record.id, rich)
  assert.deepEqual(updated.explanation, rich)
  const reopened = createPaperStorage(join(root, 'papers'))
  assert.deepEqual((await reopened.get(record.id)).explanation, rich)
  assert.deepEqual(JSON.parse(await readFile(join(root, 'papers', record.id, 'paper.json'), 'utf8')).explanation, rich)
  assert.equal((await reopened.list())[0].explained, true)
  assert.deepEqual(await reopened.getPdf(record.id), bytes)

  const second = { ...paper(), explanation: rich }
  await reopened.save(second, bytes)
  assert.deepEqual((await storage.get(second.id)).explanation, rich)
})

test('keeps unversioned Markdown explanations readable and updatable without teaching blocks', async t => {
  const { root, storage } = await fixture(t)
  const legacy = explanation(), record = { ...paper(), explanation: legacy }
  await storage.save(record, bytes)
  const reopened = createPaperStorage(join(root, 'papers'))
  assert.deepEqual((await reopened.get(record.id)).explanation, legacy)
  assert.equal('version' in (await reopened.get(record.id)).explanation, false)
  const revised = { ...legacy, summary: 'A revised legacy explanation.' }
  await reopened.setExplanation(record.id, revised)
  assert.deepEqual((await storage.get(record.id)).explanation, revised)
})

test('rejects bad teaching content before replacing a saved explanation or writing a new archive', async t => {
  const { storage } = await fixture(t)
  const record = { ...paper(), explanation: explanation() }
  await storage.save(record, bytes)
  const invalid = []
  const missingPage = richExplanation(); missingPage.chapters[0].blocks[0].references[0].page = 2; invalid.push(missingPage)
  const inventedQuote = richExplanation(); inventedQuote.chapters[0].blocks[0].references[0].quote = 'An invented sentence from another paper.'; invalid.push(inventedQuote)
  const empty = richExplanation(); empty.chapters[1].blocks = []; invalid.push(empty)
  const malformed = richExplanation(); malformed.chapters[1].blocks[0].steps = null; invalid.push(malformed)
  const noBlocks = { ...explanation(), version: 2 }; invalid.push(noBlocks)
  const unversionedBadBlocks = richExplanation(); delete unversionedBadBlocks.version; unversionedBadBlocks.chapters[0].blocks = [null]; invalid.push(unversionedBadBlocks)
  for (const value of invalid) {
    await assert.rejects(storage.setExplanation(record.id, value), TypeError)
    assert.deepEqual((await storage.get(record.id)).explanation, record.explanation)
    const fresh = { ...paper(), explanation: value }
    await assert.rejects(storage.save(fresh, bytes), TypeError)
    assert.equal(await storage.get(fresh.id), undefined)
  }
})

test('ignores malformed new block archives on read without exposing invalid citations or breaking the library', async t => {
  const { root, storage } = await fixture(t)
  const keep = paper()
  await storage.save(keep, bytes)
  for (const damage of [
    value => { value.chapters[0].blocks[0].references[0].page = 99 },
    value => { value.chapters[0].blocks = [null] },
    value => { value.chapters[1].blocks[0].steps[0].code = '{broken' },
  ]) {
    const record = { ...paper(), explanation: richExplanation() }
    await storage.save(record, bytes)
    damage(record.explanation)
    await writeFile(join(root, 'papers', record.id, 'paper.json'), JSON.stringify(record))
    assert.equal(await storage.get(record.id), undefined)
  }
  assert.deepEqual((await storage.list()).map(item => item.id), [keep.id])
})
