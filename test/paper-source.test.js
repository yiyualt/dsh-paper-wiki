import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { MAX_PDF_BYTES, readPaper } from '../src/paper-source.js'
import { createPdf } from './fixtures/pdf.mjs'

test('extracts every page, uses PDF title and preserves the input bytes', async () => {
  const bytes = createPdf(['A local study of reproducible model evaluation.', 'Experiments compare two fixed systems on the same inputs.'])
  const source = await readPaper(bytes, { fileName: 'study.pdf' })
  assert.equal(source.title, 'A local paper')
  assert.equal(source.fileName, 'study.pdf')
  assert.equal(source.pageCount, 2)
  assert.deepEqual(source.pages.map(page => page.number), [1, 2])
  assert.match(source.pages[0].text, /reproducible model evaluation/)
  assert.match(source.pages[1].text, /same inputs/)
  assert.equal(source.sha256, createHash('sha256').update(bytes).digest('hex'))
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-')
  assert.deepEqual(source.warnings, [])
})

test('falls back to a safe filename and reports pages with no extractable text', async () => {
  const paper = await readPaper(createPdf(['A paper with one readable page and one figure-only page.', ''], 'Untitled'),
    { fileName: '../folder/study.pdf' })
  assert.equal(paper.title, 'study')
  assert.equal(paper.fileName, 'study.pdf')
  assert.equal(paper.pages[1].text, '')
  assert.match(paper.warnings[0], /第 2 页/)
})

test('rejects invalid, damaged, oversized and text-free PDF inputs with actionable errors', async () => {
  await assert.rejects(readPaper(Buffer.from('not a PDF')), error => error.code === 'invalid-pdf' && error.status === 400)
  await assert.rejects(readPaper(Buffer.from('%PDF-1.7\nbroken')), error => error.code === 'paper-read-failed' && error.status === 422)
  await assert.rejects(readPaper(Buffer.alloc(MAX_PDF_BYTES + 1)), error => error.code === 'paper-too-large' && error.status === 413)
  await assert.rejects(readPaper(createPdf([''])), error => error.code === 'paper-no-text' && /OCR/.test(error.message))
})

test('rejects excessive page counts and respects cancellation', async () => {
  await assert.rejects(readPaper(createPdf(Array(151).fill('A full page of research evidence.'))), error => error.code === 'paper-too-long')
  const controller = new AbortController()
  controller.abort(new Error('user cancelled'))
  await assert.rejects(readPaper(createPdf(['A full page of research evidence.']), { signal: controller.signal }), /user cancelled/)
})

test('extracts mapped CJK characters and rejects password-protected documents', async () => {
  const paper = await readPaper(createPdf(['ABCDABCDABCDABCDABCDABCD'], 'Chinese paper', { unicode: true }))
  assert.equal(paper.pages[0].text, '中文论文'.repeat(6))
  await assert.rejects(readPaper(createPdf(['A protected research paper.'], 'Protected paper', { encrypted: true })),
    error => error.code === 'paper-encrypted' && /密码/.test(error.message))
})
