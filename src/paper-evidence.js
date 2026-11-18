const MAX_SEGMENT = 420
const OVERLAP = 72
const normalize = value => value.normalize('NFKC').replace(/[\s\u00ad\u200b]/g, '')
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const numbers = /[+\-−＋－]?(?:(?:[0-9０-９]{1,3}(?:[,，]\s*[0-9０-９]{3})+|[0-9０-９]+)(?:[.．][0-9０-９]+)?|[.．][0-9０-９]+)(?:[eEｅＥ][+\-−＋－]?[0-9０-９]+)?\s*[%％]?/g

function invalid(message, location) {
  const suffix = typeof location === 'string' && location ? `（${location.slice(0, 180)}）` : ''
  throw Object.assign(new Error(message + suffix), { code: 'explanation-invalid', status: 502 })
}

function splitPage(text) {
  if (normalize(text).length < 8) return []
  const numericRanges = [...text.matchAll(numbers)].map(match => {
    const token = match[0].trimEnd()
    return { start: match.index, end: match.index + token.length }
  })
  function avoidNumber(position, start, maximum, direction) {
    let low = 0, high = numericRanges.length
    while (low < high) {
      const middle = Math.floor((low + high) / 2)
      if (numericRanges[middle].end <= position) low = middle + 1
      else high = middle
    }
    const range = numericRanges[low]
    if (!range || range.start >= position) return position
    if (direction === 'start') {
      if (range.start > start) return range.start
      if (range.end < maximum) return range.end
    } else {
      if (range.start > start) return range.start
      if (range.end <= maximum) return range.end
    }
    // A single numeric token longer than the segment budget cannot fit intact.
    return position
  }
  function endOf(start) {
    const maximum = Math.min(text.length, start + MAX_SEGMENT)
    if (maximum === text.length) return maximum
    const minimum = Math.min(maximum, start + 300)
    let sentence = -1, line = -1, word = -1
    for (let index = minimum; index <= maximum; index++) {
      if (text[index - 1] === '\n') line = index
      if (/\s/u.test(text[index - 1])) word = index
      if (/[.!?。！？;；]/u.test(text[index - 1]) && /\s/u.test(text[index] || ' ')) sentence = index
    }
    const preferred = sentence >= maximum - 70 ? sentence : line >= 0 ? line : word >= 0 ? word : maximum
    const adjusted = avoidNumber(preferred, start, maximum, 'end')
    return normalize(text.slice(start, adjusted)).length >= 8 ? adjusted : maximum
  }
  const result = []
  let start = 0
  while (start < text.length) {
    const end = endOf(start)
    let first = start
    // A short final tail may need more preceding context to make a valid quote.
    if (normalize(text.slice(first, end)).length < 8) first = Math.max(0, end - MAX_SEGMENT)
    const quote = text.slice(first, end)
    if (normalize(quote).length >= 8) result.push(quote)
    if (end >= text.length) break
    const desired = Math.max(start + 1, end - OVERLAP)
    let next = desired, distance = Infinity
    const lower = Math.max(start + 1, desired - 20), upper = Math.min(end - 1, desired + 20)
    for (let index = lower; index <= upper; index++) {
      if (/\s/u.test(text[index - 1]) && Math.abs(index - desired) < distance) {
        next = index
        distance = Math.abs(index - desired)
      }
    }
    next = avoidNumber(next, start, end, 'start')
    start = Math.max(start + 1, Math.min(next, end))
  }
  return result
}

/** Give the model immutable source IDs; the server supplies the exact quoted PDF text. */
export function createEvidenceCatalog(paper) {
  if (!Array.isArray(paper?.pages) || !paper.pages.length || paper.pages.length > 150) invalid('论文证据页格式无效。')
  const sources = new Map(), exactQuotes = new Map(), pageNumbers = new Set(), rendered = []
  let characters = 0
  for (const page of paper.pages) {
    if (!record(page) || !Number.isInteger(page.number) || page.number < 1 || page.number > 150
      || pageNumbers.has(page.number) || typeof page.text !== 'string') invalid('论文证据页格式无效。')
    pageNumbers.add(page.number)
    characters += page.text.length
    if (characters > 600_000) invalid('论文证据超过长度上限。')
    rendered.push(`--- PDF 第 ${page.number} 页 ---`)
    const segments = splitPage(page.text)
    if (!segments.length) {
      rendered.push(page.text ? '本页文字不足以形成可引用片段。\n' + page.text : '本页没有可提取文字。')
      continue
    }
    segments.forEach((quote, index) => {
      const sourceId = `p${page.number}-s${index + 1}`
      const reference = { page: page.number, quote }
      sources.set(sourceId, reference)
      const key = page.number + '\u0000' + quote.trim()
      if (!exactQuotes.has(key)) exactQuotes.set(key, sourceId)
      rendered.push(`[来源 ${sourceId}]\n${quote}`)
    })
  }
  function resolveReference(ref, location) {
    if (!record(ref)) invalid('引用格式无效。', location)
    if (Object.hasOwn(ref, 'sourceId')) {
      const source = typeof ref.sourceId === 'string' ? sources.get(ref.sourceId) : undefined
      if (!source) invalid('引用的来源编号不存在。', location)
      return { page: source.page, quote: source.quote }
    }
    // Existing archives and legacy model drafts still use the strict page+quote checker.
    return { page: ref.page, quote: ref.quote }
  }
  function toModelDraft(value) {
    let draft
    try { draft = JSON.parse(JSON.stringify(value)) }
    catch { invalid('讲解草稿无法读取。') }
    function reference(ref) {
      if (!record(ref)) return ref
      if (Object.hasOwn(ref, 'sourceId')) return { sourceId: ref.sourceId }
      const sourceId = typeof ref.quote === 'string' ? exactQuotes.get(ref.page + '\u0000' + ref.quote.trim()) : undefined
      return sourceId ? { sourceId } : { page: ref.page, quote: ref.quote }
    }
    if (Array.isArray(draft?.chapters)) for (const chapter of draft.chapters) {
      if (!Array.isArray(chapter?.blocks)) continue
      for (const block of chapter.blocks) {
        if (!record(block)) continue
        if (Array.isArray(block.references)) block.references = block.references.map(reference)
        if (block.type === 'chart' && Array.isArray(block.data)) for (const point of block.data) {
          if (record(point) && Object.hasOwn(point, 'reference')) point.reference = reference(point.reference)
        }
      }
    }
    return draft
  }
  return { text: rendered.join('\n\n'), resolveReference, toModelDraft }
}
