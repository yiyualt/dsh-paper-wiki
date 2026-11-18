import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { basename, dirname, join, sep } from 'node:path'

export const MAX_PDF_BYTES = 30 * 1024 * 1024
const MAX_PAGES = 150
const MAX_TEXT = 600_000
const require = createRequire(import.meta.url)

function failure(code, message, status = 422) {
  return Object.assign(new Error(message), { code, status })
}

function nameOf(value) {
  if (typeof value !== 'string') return 'paper.pdf'
  return basename(value.replace(/\\/g, '/')).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 240) || 'paper.pdf'
}

function pageText(items) {
  let text = '', previous
  for (const item of items) {
    if (typeof item.str !== 'string') continue
    const current = item.str.replace(/\u0000/g, '')
    const transform = item.transform
    const movedLine = previous && Array.isArray(transform) && Array.isArray(previous.transform)
      && Math.abs(transform[5] - previous.transform[5]) > Math.max(2, Math.abs(transform[3]) * .4)
    if (movedLine && !text.endsWith('\n')) text += '\n'
    if (current && text && !/\s$/.test(text) && !/^\s/.test(current) && !movedLine && previous) {
      const gap = transform?.[4] - ((previous.transform?.[4] ?? 0) + (previous.width ?? 0))
      const threshold = Math.max(1.5, Math.abs(transform?.[0] ?? 10) * .15)
      if (gap > threshold && !(/[\u3400-\u9fff\u3040-\u30ff]$/.test(text) && /^[\u3400-\u9fff\u3040-\u30ff]/.test(current))) text += ' '
    }
    text += current
    if (item.hasEOL && !text.endsWith('\n')) text += '\n'
    previous = item
  }
  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim()
}

/** Extract all readable pages locally. No paper contents are sent to a model here. */
export async function readPaper(bytes, { fileName, signal } = {}) {
  signal?.throwIfAborted()
  if (!(bytes instanceof Uint8Array) || !bytes.byteLength) throw failure('invalid-pdf', '请选择有效的 PDF 论文。', 400)
  if (bytes.byteLength > MAX_PDF_BYTES) throw failure('paper-too-large', 'PDF 超过 30 MB，请选择较小的文件。', 413)
  if (Buffer.from(bytes.buffer, bytes.byteOffset, Math.min(bytes.byteLength, 1024)).indexOf('%PDF-') < 0) {
    throw failure('invalid-pdf', '文件不是有效的 PDF，请重新选择论文。', 400)
  }
  const safeName = nameOf(fileName)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs')
  signal?.throwIfAborted()
  const packageRoot = dirname(require.resolve('pdfjs-dist/package.json'))
  const task = getDocument({
    data: new Uint8Array(bytes),
    isEvalSupported: false,
    useSystemFonts: false,
    disableFontFace: true,
    useWorkerFetch: false,
    enableXfa: false,
    cMapUrl: join(packageRoot, 'cmaps') + sep,
    cMapPacked: true,
    standardFontDataUrl: join(packageRoot, 'standard_fonts') + sep,
    wasmUrl: join(packageRoot, 'wasm') + sep,
    verbosity: 0,
  })
  const abort = () => { void task.destroy().catch(() => {}) }
  signal?.addEventListener('abort', abort, { once: true })
  try {
    signal?.throwIfAborted()
    const pdf = await task.promise
    signal?.throwIfAborted()
    if (pdf.numPages > MAX_PAGES) throw failure('paper-too-long', '第一版支持最多 150 页的论文，请拆分后导入。', 413)
    const metadata = await pdf.getMetadata().catch(() => null)
    const pages = []
    let characters = 0
    for (let number = 1; number <= pdf.numPages; number++) {
      signal?.throwIfAborted()
      const page = await pdf.getPage(number)
      const content = await page.getTextContent()
      const text = pageText(content.items)
      characters += text.length
      if (characters > MAX_TEXT) throw failure('paper-too-much-text', '论文文字超过第一版的 60 万字符上限，请拆分后导入。', 413)
      pages.push({ number, text })
      page.cleanup()
    }
    if (characters < 20) throw failure('paper-no-text', '未能提取论文文字。扫描版或图片 PDF 请先进行 OCR，再导入。')
    const blank = pages.filter(page => !page.text.trim()).map(page => page.number)
    const warnings = blank.length
      ? [`第 ${blank.slice(0, 20).join('、')}${blank.length > 20 ? ' 等' : ''} 页没有可提取文字；图片、公式及扫描内容可能需要对照原文。`]
      : []
    const rawTitle = typeof metadata?.info?.Title === 'string' ? metadata.info.Title.replace(/[\u0000-\u001f\u007f]/g, '').trim() : ''
    const title = rawTitle && !/^(?:untitled|document|microsoft word(?:\s*-.*)?)$/i.test(rawTitle)
      ? rawTitle.slice(0, 300) : safeName.replace(/\.pdf$/i, '').trim() || '未命名论文'
    return { title, fileName: safeName, pageCount: pdf.numPages, sha256, pages, warnings }
  } catch (error) {
    signal?.throwIfAborted()
    if (error?.code && typeof error.status === 'number') throw error
    if (error?.name === 'PasswordException') throw failure('paper-encrypted', '此 PDF 需要密码，请先解除密码保护后导入。')
    throw failure('paper-read-failed', '无法读取此 PDF。文件可能已损坏或采用不支持的格式，请尝试重新导出 PDF。')
  } finally {
    signal?.removeEventListener('abort', abort)
    await task.destroy().catch(() => {})
  }
}
