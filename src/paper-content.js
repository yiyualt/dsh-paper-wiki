const normalize = value => value.normalize('NFKC').replace(/[\s\u00ad\u200b]/g, '')
const languages = new Set(['json', 'python', 'text'])
const numericToken = /^[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?%?$/
const quotedNumbers = /(?<![\d.,])[+\-\u2212]?(?:(?:\d{1,3}(?:,\s*\d{3})+|\d+)(?:\.\d+)?|\.\d+)(?:[eE][+\-\u2212]?\d+)?\s*%?(?![\d,]|\.\d)/g
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value)

function invalid(message, chapterId) {
  const where = chapterId ? `（${chapterId}）` : ''
  throw Object.assign(new Error(message + where), { code: 'explanation-invalid', status: 502 })
}

function text(value, maximum, label, chapterId) {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum
    || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) invalid(label + '格式无效。', chapterId)
  return value.trim()
}

function array(value, minimum, maximum, message, chapterId) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) invalid(message, chapterId)
  for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) invalid(message, chapterId)
  return value
}

function numericSpans(source) {
  const expanded = source.normalize('NFKC'), spans = []
  let offset = 0, position = 0
  for (const match of expanded.matchAll(quotedNumbers)) {
    offset += normalize(expanded.slice(position, match.index)).length
    const token = normalize(match[0])
    spans.push({ start: offset, end: offset + token.length, token })
    offset += token.length
    position = match.index + match[0].length
  }
  return spans
}

function reportedNumber(source, quote, token) {
  const matches = source.numbers ??= numericSpans(source.text)
  const candidates = matches.filter(number => number.token === token
    || !token.endsWith('%') && number.token.replace(/%$/, '') === token)
  let candidate = 0, position = source.normalized.indexOf(quote)
  while (position >= 0 && candidate < candidates.length) {
    while (candidate < candidates.length && candidates[candidate].start < position) candidate++
    if (candidate < candidates.length && candidates[candidate].end <= position + quote.length) return true
    position = source.normalized.indexOf(quote, position + 1)
  }
  return false
}

/** Validate typed teaching content against the immutable, extracted PDF pages. */
export function validateContentBlocks(paper, blocks, chapterId) {
  const sourcePages = array(paper?.pages, 1, 150, '论文原文页格式无效。', chapterId)
  const pages = new Map()
  let characters = 0
  for (const page of sourcePages) {
    if (!record(page) || !Number.isInteger(page.number) || page.number < 1 || page.number > 150
      || pages.has(page.number) || typeof page.text !== 'string') invalid('论文原文页格式无效。', chapterId)
    characters += page.text.length
    if (characters > 600_000) invalid('论文原文超过长度上限。', chapterId)
    pages.set(page.number, { text: page.text, normalized: normalize(page.text) })
  }
  return canonicalBlocks(pages, blocks, chapterId)
}

function canonicalBlocks(pages, blocks, chapterId) {
  array(blocks, 1, 10, '每章需要 1 至 10 个内容块。', chapterId)
  try {
    if (JSON.stringify(blocks).length > 70_000) invalid('章节内容超过长度上限。', chapterId)
  } catch (error) {
    if (error?.code === 'explanation-invalid') throw error
    invalid('章节内容无法读取。', chapterId)
  }
  const field = (value, maximum, label) => text(value, maximum, label, chapterId)
  function reference(value) {
    if (!record(value) || !Number.isInteger(value.page) || value.page < 1 || value.page > 150
      || pages && !pages.has(value.page)) invalid('引用页码不存在。', chapterId)
    const quote = field(value.quote, 450, '原文引句')
    const normalized = normalize(quote)
    if (normalized.length < 8 || pages && !pages.get(value.page).normalized.includes(normalized)) invalid('引用与对应页的原文不符。', chapterId)
    return { page: value.page, quote }
  }
  function references(value) {
    array(value, 1, 6, '内容块需要 1 至 6 条原文引用。', chapterId)
    return value.map(reference)
  }
  const title = value => field(value, 180, '内容标题')
  return blocks.map(block => {
    if (!record(block)) invalid('内容块格式无效。', chapterId)
    const refs = references(block.references)
    if (block.type === 'paragraph') return { type: 'paragraph', text: field(block.text, 3000, '正文'), references: refs }
    if (block.type === 'example') {
      if (!['paper', 'illustrative'].includes(block.mode)) invalid('示例必须说明是论文实例还是构造示例。', chapterId)
      array(block.steps, 2, 6, '示例需要 2 至 6 个步骤。', chapterId)
      const steps = block.steps.map(step => {
        if (!record(step) || !languages.has(step.language)) invalid('示例代码语言无效。', chapterId)
        const code = field(step.code, 8000, '示例代码')
        if (step.language === 'json') {
          try { JSON.parse(code) } catch { invalid('示例 JSON 代码无法解析。', chapterId) }
        }
        return { label: field(step.label, 80, '示例步骤名称'), language: step.language, code,
          explanation: field(step.explanation, 1500, '示例步骤说明') }
      })
      return { type: 'example', title: title(block.title), mode: block.mode, steps, references: refs }
    }
    if (block.type === 'flow') {
      array(block.steps, 2, 7, '方法流程需要 2 至 7 个步骤。', chapterId)
      const steps = block.steps.map(step => {
        if (!record(step)) invalid('流程步骤格式无效。', chapterId)
        return { title: field(step.title, 90, '流程步骤标题'), input: field(step.input, 900, '流程输入'),
          operation: field(step.operation, 900, '流程操作'), output: field(step.output, 900, '流程输出') }
      })
      return { type: 'flow', title: title(block.title), steps, references: refs }
    }
    if (block.type === 'table') {
      array(block.columns, 2, 6, '表格需要 2 至 6 列。', chapterId)
      array(block.rows, 1, 16, '表格需要 1 至 16 行数据。', chapterId)
      const columns = block.columns.map(column => field(column, 180, '表格列名'))
      const rows = block.rows.map(row => {
        array(row, columns.length, columns.length, '表格每行的单元格数量必须与列名一致。', chapterId)
        return row.map(cell => field(cell, 1000, '表格单元格'))
      })
      return { type: 'table', title: title(block.title), columns, rows, references: refs }
    }
    if (block.type === 'chart') {
      if (!['higher', 'lower'].includes(block.direction)) invalid('结果图需要说明指标优劣方向。', chapterId)
      array(block.data, 2, 12, '结果图需要 2 至 12 个有原文依据的数据点。', chapterId)
      const data = block.data.map(point => {
        if (!record(point) || typeof point.value !== 'number' || !Number.isFinite(point.value) || Math.abs(point.value) > 1e12) invalid('图表数值无效。', chapterId)
        const display = field(point.display, 80, '图表数值显示')
        const token = normalize(display)
        if (!numericToken.test(token) || Number(token.replace(/,/g, '').replace(/%$/, '')) !== point.value) invalid('图表显示值与数值不一致。', chapterId)
        const ref = reference(point.reference)
        const source = pages?.get(ref.page) ?? { text: ref.quote, normalized: normalize(ref.quote) }
        if (!reportedNumber(source, normalize(ref.quote), token)) {
          invalid('图表显示数值没有作为完整数值出现在该数据点的原文引句中。', chapterId)
        }
        return { label: field(point.label, 180, '图表数据标签'), value: point.value, display, reference: ref }
      })
      return { type: 'chart', title: title(block.title), context: field(block.context, 500, '实验条件'),
        metric: field(block.metric, 100, '指标名称'), unit: field(block.unit, 40, '指标单位'),
        direction: block.direction, data, references: refs }
    }
    invalid('不支持这种内容块类型。', chapterId)
  })
}

function escaped(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/[\\`*_{}\[\]()#!|~+\-.]/g, '\\$&').replace(/\r\n?/g, '\n')
}
const inline = value => escaped(value).replace(/\n/g, ' ')
const cell = value => escaped(value).replace(/\n/g, ' / ')
function pageLabels(refs) {
  return [...new Set(refs.map(ref => ref.page))].map(page => `第 ${page} 页`).join('、')
}
function citation(refs) { return `（${pageLabels(refs)}）` }
function fence(code, language) {
  const longest = Math.max(0, ...[...code.matchAll(/`+/g)].map(match => match[0].length))
  const marker = '`'.repeat(Math.max(3, longest + 1))
  return marker + language + '\n' + code + '\n' + marker
}
function markdownTable(columns, rows) {
  return ['| ' + columns.map(cell).join(' | ') + ' |', '| ' + columns.map(() => '---').join(' | ') + ' |',
    ...rows.map(row => '| ' + row.map(cell).join(' | ') + ' |')].join('\n')
}

/** Plain Markdown export remains usable without the interactive client renderer. */
export function renderContentMarkdown(blocks) {
  // Persisted blocks also pass structural validation before entering the Markdown renderer.
  return canonicalBlocks(null, blocks).map(block => {
    const refs = block.type === 'chart' ? [...block.references, ...block.data.map(point => point.reference)] : block.references
    const sources = citation(refs)
    if (block.type === 'paragraph') return escaped(block.text) + '\n\n' + sources
    const heading = '### ' + inline(block.title)
    if (block.type === 'example') {
      const origin = block.mode === 'illustrative' ? '构造示例（非论文原始样本）' : '论文实例'
      return [heading, origin, ...block.steps.map((step, index) =>
        `#### ${index + 1}. ${inline(step.label)}\n\n${fence(step.code, step.language)}\n\n${escaped(step.explanation)}`), sources].join('\n\n')
    }
    if (block.type === 'flow') return [heading, ...block.steps.map((step, index) =>
      `${index + 1}. **${inline(step.title)}**\n\n   输入：${inline(step.input)}\n\n   操作：${inline(step.operation)}\n\n   输出：${inline(step.output)}`), sources].join('\n\n')
    if (block.type === 'table') return [heading, markdownTable(block.columns, block.rows), sources].join('\n\n')
    if (block.type === 'chart') return [heading, '实验条件：' + escaped(block.context),
      `指标：${inline(block.metric)}；单位：${inline(block.unit)}；${block.direction === 'higher' ? '数值越高越好' : '数值越低越好'}。`,
      markdownTable(['配置', '数值', '原文页码'], block.data.map(point => [point.label, point.display, pageLabels([point.reference])])), sources].join('\n\n')
    invalid('不支持这种内容块类型。')
  }).join('\n\n')
}
