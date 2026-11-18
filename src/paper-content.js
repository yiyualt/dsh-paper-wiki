import { evaluatePaperCalculation } from './paper-calculation.js'

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
  const identifier = value => {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(value)) invalid('内容编号格式无效。', chapterId)
    return value
  }
  const mode = value => {
    if (!['paper', 'illustrative'].includes(value)) invalid('内容必须说明是论文实例还是构造示例。', chapterId)
    return value
  }
  function unique(values, label) {
    if (new Set(values).size !== values.length) invalid(label + '不能重复。', chapterId)
    return values
  }
  function linkedIds(value, known, maximum, label, minimum = 0) {
    array(value, minimum, maximum, label + '格式无效。', chapterId)
    const ids = unique(value.map(identifier), label)
    if (ids.some(id => !known.has(id))) invalid(label + '包含不存在的编号。', chapterId)
    return ids
  }
  return blocks.map(block => {
    if (!record(block)) invalid('内容块格式无效。', chapterId)
    const refs = references(block.references)
    if (block.type === 'paragraph') return { type: 'paragraph', text: field(block.text, 3000, '正文'), references: refs }
    if (block.type === 'terms') {
      array(block.items, 2, 10, '术语说明需要 2 至 10 项。', chapterId)
      const items = block.items.map(item => {
        if (!record(item)) invalid('术语说明格式无效。', chapterId)
        return { term: field(item.term, 100, '术语'), meaning: field(item.meaning, 600, '术语含义'),
          role: field(item.role, 600, '术语在方法中的作用'), example: field(item.example, 800, '术语的具体示例'),
          ...(item.contrast !== undefined && { contrast: field(item.contrast, 400, '易混概念区别') }) }
      })
      return { type: 'terms', title: title(block.title), items, references: refs }
    }
    if (block.type === 'diagram') {
      array(block.columns, 2, 4, '关系图需要 2 至 4 个节点分组。', chapterId)
      array(block.nodes, 2, 16, '关系图需要 2 至 16 个节点。', chapterId)
      array(block.edges, 1, 24, '关系图需要 1 至 24 条有向连线。', chapterId)
      array(block.steps, 2, 6, '关系图需要 2 至 6 个解释步骤。', chapterId)
      const columns = block.columns.map(column => {
        if (!record(column)) invalid('关系图分组格式无效。', chapterId)
        return { id: identifier(column.id), label: field(column.label, 100, '关系图分组名称') }
      })
      const columnIds = new Set(unique(columns.map(column => column.id), '关系图分组编号'))
      const nodes = block.nodes.map(node => {
        if (!record(node)) invalid('关系图节点格式无效。', chapterId)
        const column = identifier(node.column)
        if (!columnIds.has(column)) invalid('关系图节点所属分组不存在。', chapterId)
        return { id: identifier(node.id), label: field(node.label, 100, '关系图节点名称'),
          detail: field(node.detail, 700, '关系图节点说明'), column }
      })
      const nodeIds = new Set(unique(nodes.map(node => node.id), '关系图节点编号'))
      const edges = block.edges.map(edge => {
        if (!record(edge)) invalid('关系图连线格式无效。', chapterId)
        const from = identifier(edge.from), to = identifier(edge.to)
        if (!nodeIds.has(from) || !nodeIds.has(to) || from === to) invalid('关系图连线端点不存在或形成自环。', chapterId)
        return { id: identifier(edge.id), from, to, label: field(edge.label, 100, '关系图连线含义') }
      })
      const edgeIds = new Set(unique(edges.map(edge => edge.id), '关系图连线编号'))
      const steps = block.steps.map(step => {
        if (!record(step)) invalid('关系图解释步骤格式无效。', chapterId)
        return { label: field(step.label, 100, '关系图步骤名称'), explanation: field(step.explanation, 900, '关系图步骤解释'),
          activeNodes: linkedIds(step.activeNodes, nodeIds, 16, '当前节点'), activeEdges: linkedIds(step.activeEdges, edgeIds, 24, '当前连线') }
      })
      return { type: 'diagram', title: title(block.title), mode: mode(block.mode),
        description: field(block.description, 600, '关系图说明'), columns, nodes, edges, steps, references: refs }
    }
    if (block.type === 'evidence') {
      if (!Number.isInteger(block.budget) || block.budget < 1 || block.budget > 8) invalid('证据列表预算必须是 1 至 8 个段落。', chapterId)
      array(block.required, 1, 6, '证据列表需要 1 至 6 项待覆盖关系。', chapterId)
      array(block.items, 2, 20, '证据列表需要 2 至 20 个可选段落。', chapterId)
      array(block.states, 2, 4, '证据列表需要 2 至 4 个已知状态。', chapterId)
      const required = unique(block.required.map(item => field(item, 180, '待覆盖关系')), '待覆盖关系')
      const requiredSet = new Set(required)
      const items = block.items.map(item => {
        if (!record(item)) invalid('证据段落格式无效。', chapterId)
        array(item.supports, 0, 6, '段落支持关系格式无效。', chapterId)
        const supports = unique(item.supports.map(value => field(value, 180, '段落支持关系')), '段落支持关系')
        if (supports.some(value => !requiredSet.has(value))) invalid('段落包含未声明的支持关系。', chapterId)
        return { id: identifier(item.id), label: field(item.label, 100, '证据段落名称'),
          detail: field(item.detail, 700, '证据段落说明'), supports }
      })
      const itemIds = new Set(unique(items.map(item => item.id), '证据段落编号'))
      const states = block.states.map(state => {
        if (!record(state)) invalid('证据列表状态格式无效。', chapterId)
        return { label: field(state.label, 100, '证据状态名称'),
          ids: linkedIds(state.ids, itemIds, block.budget, '当前证据列表', block.budget),
          explanation: field(state.explanation, 900, '证据状态说明') }
      })
      return { type: 'evidence', title: title(block.title), mode: mode(block.mode),
        question: field(block.question, 500, '证据列表问题'), budget: block.budget, required, items, states, references: refs }
    }
    if (block.type === 'calculation') {
      array(block.inputs, 2, 10, '计算示例需要 2 至 10 个参数。', chapterId)
      const inputs = block.inputs.map(input => {
        if (!record(input)) invalid('计算参数格式无效。', chapterId)
        return { id: identifier(input.id), label: field(input.label, 100, '计算参数名称'),
          meaning: field(input.meaning, 600, '计算参数含义'), value: input.value,
          ...Object.fromEntries(['min', 'max', 'step'].filter(key => Object.hasOwn(input, key)).map(key => [key, input[key]])) }
      })
      const calculation = { type: 'calculation', title: title(block.title), mode: mode(block.mode),
        formula: field(block.formula, 1000, '计算公式'), inputs, expression: block.expression, precision: block.precision,
        resultLabel: field(block.resultLabel, 180, '计算结果名称'), interpretation: field(block.interpretation, 1500, '计算结果解释'), references: refs }
      try { evaluatePaperCalculation(calculation) }
      catch (error) { invalid('计算示例无效：' + error.message, chapterId) }
      const expression = node => Object.hasOwn(node, 'input') ? { input: node.input }
        : Object.hasOwn(node, 'number') ? { number: node.number } : { op: node.op, args: node.args.map(expression) }
      calculation.expression = expression(block.expression)
      return calculation
    }
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
const provenance = mode => mode === 'illustrative' ? '构造示例（非论文原始样本）' : '论文实例'
function calculationExpression(node) {
  if (Object.hasOwn(node, 'input')) return node.input
  if (Object.hasOwn(node, 'number')) return String(node.number)
  const operator = { add: ' + ', subtract: ' - ', multiply: ' × ', divide: ' / ' }[node.op]
  return '(' + node.args.map(calculationExpression).join(operator) + ')'
}

/** Plain Markdown export remains usable without the interactive client renderer. */
export function renderContentMarkdown(blocks) {
  // Persisted blocks also pass structural validation before entering the Markdown renderer.
  return canonicalBlocks(null, blocks).map(block => {
    const refs = block.type === 'chart' ? [...block.references, ...block.data.map(point => point.reference)] : block.references
    const sources = citation(refs)
    if (block.type === 'paragraph') return escaped(block.text) + '\n\n' + sources
    const heading = '### ' + inline(block.title)
    if (block.type === 'terms') return [heading, ...block.items.map(item => [
      '#### ' + inline(item.term), '含义：' + escaped(item.meaning), '在本方法中的作用：' + escaped(item.role),
      '具体示例：' + escaped(item.example), ...(item.contrast ? ['易混概念区别：' + escaped(item.contrast)] : []),
    ].join('\n\n')), sources].join('\n\n')
    if (block.type === 'diagram') {
      const columns = new Map(block.columns.map(column => [column.id, column.label]))
      return [heading, provenance(block.mode), escaped(block.description),
        '#### 节点分组', markdownTable(['编号', '分组'], block.columns.map(column => [column.id, column.label])),
        '#### 节点', markdownTable(['编号', '节点', '分组', '说明'], block.nodes.map(node => [node.id, node.label, columns.get(node.column), node.detail])),
        '#### 有向关系', markdownTable(['编号', '起点 → 终点', '关系含义'], block.edges.map(edge => [edge.id, edge.from + ' → ' + edge.to, edge.label])),
        ...block.steps.map((step, index) => `#### ${index + 1}. ${inline(step.label)}\n\n${escaped(step.explanation)}\n\n当前节点：${step.activeNodes.map(inline).join('、') || '无'}\n\n当前连线：${step.activeEdges.map(inline).join('、') || '无'}`),
        sources].join('\n\n')
    }
    if (block.type === 'evidence') {
      const items = new Map(block.items.map(item => [item.id, item]))
      return [heading, provenance(block.mode), '问题：' + escaped(block.question), '固定段落预算：' + block.budget,
        '待覆盖关系：' + block.required.map(inline).join('；'),
        markdownTable(['编号', '段落', '内容', '支持关系'], block.items.map(item => [item.id, item.label, item.detail, item.supports.join('；') || '无'])),
        ...block.states.map((state, index) => {
          const covered = new Set(state.ids.flatMap(id => items.get(id).supports))
          return [`#### ${index + 1}. ${inline(state.label)}`, escaped(state.explanation),
            ...state.ids.map((id, position) => `- 位置 ${position + 1}：${inline(id)} · ${inline(items.get(id).label)}`),
            '已覆盖关系：' + (block.required.filter(value => covered.has(value)).map(inline).join('；') || '无'),
            '未覆盖关系：' + (block.required.filter(value => !covered.has(value)).map(inline).join('；') || '无')].join('\n\n')
        }), sources].join('\n\n')
    }
    if (block.type === 'calculation') return [heading, provenance(block.mode), '公式：', fence(block.formula, 'text'),
      markdownTable(['参数编号', '名称', '含义', '初始值', '可调范围', '步长'], block.inputs.map(input => [input.id, input.label, input.meaning,
        String(input.value), Object.hasOwn(input, 'min') ? input.min + ' 至 ' + input.max : '固定', Object.hasOwn(input, 'step') ? String(input.step) : '无'])),
      '实际计算式：', fence(calculationExpression(block.expression), 'text'),
      `${inline(block.resultLabel)}：${evaluatePaperCalculation(block).toFixed(block.precision)}（显示 ${block.precision} 位小数）`,
      escaped(block.interpretation), sources].join('\n\n')
    if (block.type === 'example') {
      return [heading, provenance(block.mode), ...block.steps.map((step, index) =>
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
