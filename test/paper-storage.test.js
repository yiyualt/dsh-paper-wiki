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
