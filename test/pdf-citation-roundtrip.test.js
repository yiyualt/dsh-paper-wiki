import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { readPaper } from '../src/paper-source.js'
import { createEvidenceCatalog } from '../src/paper-evidence.js'
import { validateCaseStudy } from '../src/paper-case.js'
import { validateContentBlocks } from '../src/paper-content.js'
import { createPdf } from './fixtures/pdf.mjs'

test('a PDF font mapping with control glyphs survives extraction, catalog, case and strict numeric citation validation', async () => {
  const bytes = createPdf(['A local formula contains the values 5X10 and 20Y30, compared under fixed conditions.'], 'Self-authored font mapping',
    { unicodeMap: { '58': '0001', '59': '007F' } })
  const expectedHash = createHash('sha256').update(bytes).digest('hex')
  const paper = await readPaper(bytes, { fileName: 'control-glyph-fixture.pdf' })
  assert(paper.pages[0].text.includes('5\u000110'))
  assert(paper.pages[0].text.includes('20\u007f30'))
  const originalPages = structuredClone(paper.pages)
  const catalog = createEvidenceCatalog(paper)
  assert(catalog.text.includes('5 10'))
  assert(catalog.text.includes('20 30'))
  assert(!catalog.text.includes('510'))
  assert(!catalog.text.includes('2030'))
  const ref = catalog.resolveReference({ sourceId: 'p1-s1' })
  assert.equal(ref.quote, paper.pages[0].text)
  const study = validateCaseStudy(paper, { title: 'Read an extracted field', mode: 'illustrative', references: [{ sourceId: 'p1-s1' }], steps: [
    { label: '输入', file: '01_input.json', chapterId: 'task', language: 'json', code: '{"value":5}', explanation: 'A small given input.', annotations: [{ line: 1, explanation: 'The field holds five.' }] },
    { label: '输出', file: '02_output.json', chapterId: 'method', language: 'json', code: '{"value":5}', explanation: 'The unchanged demonstration value.', annotations: [{ line: 1, explanation: 'This demonstration preserves the input.' }] },
  ] }, catalog)
  assert.deepEqual(study.references, [ref])
  const chart = { type: 'chart', title: 'Tokens in the self-authored source', context: 'The same source sentence.', metric: 'number token', unit: '无量纲', direction: 'higher', references: [ref],
    data: [{ label: 'first token', value: 5, display: '5', reference: ref }, { label: 'second token', value: 10, display: '10', reference: ref }] }
  assert.equal(validateContentBlocks(paper, [chart], 'results')[0].data[1].value, 10)
  chart.data[1] = { label: 'fabricated merged token', value: 510, display: '510', reference: ref }
  assert.throws(() => validateContentBlocks(paper, [chart], 'results'), error => error.code === 'explanation-invalid')
  assert.deepEqual(paper.pages, originalPages)
  assert.equal(paper.sha256, expectedHash)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), expectedHash)
})
