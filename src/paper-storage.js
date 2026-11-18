import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { lstat, mkdir, open, readdir, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { validateContentBlocks } from './paper-content.js'
import { validateCaseStudy } from './paper-case.js'
import { MAX_PDF_BYTES } from './paper-source.js'

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/
export const validPaperId = id => typeof id === 'string' && uuid.test(id)
const string = (value, maximum) => typeof value === 'string' && !!value.trim() && value.length <= maximum

function explanationRecord(value, paper) {
  if (value === null) return null
  if (!value || !string(value.title, 300) || !string(value.summary, 6000)
    || !string(value.model, 500) || !['string', 'number'].includes(typeof value.createdAt) || !Number.isFinite(Date.parse(value.createdAt))
    || !Number.isSafeInteger(value.durationMs) || value.durationMs < 0
    || (value.version !== undefined && ![2, 3, 4].includes(value.version))
    || !Array.isArray(value.chapters) || !value.chapters.length || value.chapters.length > 12
    || new Set(value.chapters.map(chapter => chapter?.id)).size !== value.chapters.length) return
  const chapters = []
  let hasBlocks = false
  for (const chapter of value.chapters) {
    if (!string(chapter?.id, 80) || !/^[a-z][a-z0-9-]*$/.test(chapter.id)
      || !string(chapter.title, 150) || !string(chapter.markdown, 80_000)) return
    let blocks
    if (chapter.blocks !== undefined) {
      try { blocks = validateContentBlocks(paper, chapter.blocks, chapter.id) }
      catch { return }
      hasBlocks = true
    }
    chapters.push({ id: chapter.id, title: chapter.title, markdown: chapter.markdown,
      ...(blocks && { blocks }) })
  }
  if ([2, 3, 4].includes(value.version) && !hasBlocks) return
  let caseStudy
  if (value.version === 4) {
    try { caseStudy = validateCaseStudy(paper, value.caseStudy) } catch { return }
  }
  return { ...([2, 3, 4].includes(value.version) && { version: value.version }), ...(value.version >= 3 && { skill: 'paper-explainer' }), ...(caseStudy && { caseStudy }), title: value.title, summary: value.summary,
    model: value.model, createdAt: value.createdAt, durationMs: value.durationMs, chapters }
}

function record(value, id) {
  if (!validPaperId(id) || value?.id !== id || !Number.isFinite(Date.parse(value.createdAt))
    || !string(value.title, 300) || !string(value.fileName, 240)
    || !/^[a-f0-9]{64}$/.test(value.sha256) || !Number.isInteger(value.pageCount) || value.pageCount < 1 || value.pageCount > 150
    || !Array.isArray(value.pages) || value.pages.length !== value.pageCount
    || !value.pages.every((page, index) => page?.number === index + 1 && typeof page.text === 'string')
    || value.pages.reduce((sum, page) => sum + page.text.length, 0) > 600_000
    || !Array.isArray(value.warnings) || value.warnings.length > 20
    || !value.warnings.every(warning => string(warning, 3000))) return
  const explanation = explanationRecord(value.explanation, value)
  if (explanation === undefined) return
  return { id, createdAt: value.createdAt, title: value.title, fileName: value.fileName,
    sha256: value.sha256, pageCount: value.pageCount,
    pages: value.pages.map(({ number, text }) => ({ number, text })),
    warnings: value.warnings, explanation }
}

async function readRegular(path, maximum) {
  let handle
  try {
    handle = await open(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0))
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > maximum) return
    return await handle.readFile()
  } finally { await handle?.close() }
}

async function writePrivate(path, value) {
  const handle = await open(path, 'wx', 0o600)
  try { await handle.writeFile(value); await handle.sync() }
  finally { await handle.close() }
}

function absent(error) { return ['ENOENT', 'ELOOP', 'ENOTDIR'].includes(error?.code) }

export function createPaperStorage(directory) {
  const pending = new Map()
  const directoryOf = id => join(directory, id)
  async function archive(id) {
    if (!validPaperId(id)) return
    const path = directoryOf(id)
    try { if (!(await lstat(path)).isDirectory()) return }
    catch (error) { if (absent(error)) return; throw error }
    return path
  }
  async function get(id) {
    try {
      const path = await archive(id)
      if (!path) return
      const bytes = await readRegular(join(path, 'paper.json'), 5_000_000)
      return bytes ? record(JSON.parse(bytes.toString('utf8')), id) : undefined
    } catch (error) { if (absent(error) || error instanceof SyntaxError) return; throw error }
  }
  // Serialize updates and deletion for each paper so a completed update cannot resurrect a deleted archive.
  async function exclusive(id, operation) {
    const previous = pending.get(id) ?? Promise.resolve()
    const task = previous.catch(() => {}).then(operation)
    pending.set(id, task)
    try { return await task }
    finally { if (pending.get(id) === task) pending.delete(id) }
  }
  return {
    async save(value, pdfBytes) {
      const paper = record(value, value?.id)
      if (!paper || !(pdfBytes instanceof Uint8Array) || !pdfBytes.byteLength || pdfBytes.byteLength > MAX_PDF_BYTES
        || createHash('sha256').update(pdfBytes).digest('hex') !== paper.sha256) throw new TypeError('Invalid paper archive')
      return exclusive(paper.id, async () => {
        await mkdir(directory, { recursive: true, mode: 0o700 })
        const temporary = join(directory, '.' + randomUUID() + '.tmp')
        await mkdir(temporary, { mode: 0o700 })
        try {
          await writePrivate(join(temporary, 'paper.json'), JSON.stringify(paper) + '\n')
          await writePrivate(join(temporary, 'original.pdf'), pdfBytes)
          // A destination directory already contains two files, so rename cannot replace it.
          await rename(temporary, directoryOf(paper.id))
        } finally { await rm(temporary, { recursive: true, force: true }) }
        return paper
      })
    },
    get,
    async setExplanation(id, explanation) {
      if (!validPaperId(id) || !explanation) throw new TypeError('Invalid paper explanation')
      return exclusive(id, async () => {
        const paper = await get(id)
        if (!paper) return
        const normalized = explanationRecord(explanation, paper)
        if (!normalized) throw new TypeError('Invalid paper explanation')
        const updated = { ...paper, explanation: normalized }
        const temporary = join(directoryOf(id), '.' + randomUUID() + '.tmp')
        try {
          await writePrivate(temporary, JSON.stringify(updated) + '\n')
          await rename(temporary, join(directoryOf(id), 'paper.json'))
        } finally { await rm(temporary, { force: true }) }
        return updated
      })
    },
    async getPdf(id) {
      try {
        const path = await archive(id)
        return path ? await readRegular(join(path, 'original.pdf'), MAX_PDF_BYTES) : undefined
      } catch (error) { if (absent(error)) return; throw error }
    },
    async remove(id) {
      if (!validPaperId(id)) return false
      return exclusive(id, async () => {
        await rm(directoryOf(id), { recursive: true, force: true })
        return true
      })
    },
    async list() {
      let entries
      try { entries = await readdir(directory, { withFileTypes: true }) }
      catch (error) { if (error.code === 'ENOENT') return []; throw error }
      const results = await Promise.all(entries.filter(entry => entry.isDirectory() && validPaperId(entry.name)).map(entry => get(entry.name)))
      return results.filter(Boolean).map(({ id, createdAt, title, fileName, pageCount, sha256, explanation }) => ({
        id, createdAt, title, fileName, pageCount, sha256, explained: !!explanation,
      })).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id))
    },
  }
}
