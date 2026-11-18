import { evaluatePaperCalculation } from './paper-calculation.js'

const guideList = value => Array.isArray(value) ? value : []
const guideText = value => typeof value === 'string' ? value : ''
const guideEscape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const guideJson = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, c => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
const guidePageNote = refs => {
  const pages = [...new Set(guideList(refs).map(ref => ref?.page).filter(page => Number.isInteger(page) && page > 0 && page <= 150))]
  return pages.length ? '<span class="pg-ref">第 ' + pages.join('、') + ' 页</span>' : ''
}
const guideMode = mode => mode === 'illustrative' ? '构造示例' : '论文实例'
const guideButton = (label, action, attrs = '') => '<button type="button" data-action="' + action + '" ' + attrs + '>' + guideEscape(label) + '</button>'
const guideShort = (value, length = 21) => [...guideText(value)].slice(0, length).join('') + ([...guideText(value)].length > length ? '…' : '')

function guideLabelLines(value, width = 146, fontSize = 12, maximum = 3) {
  const glyphWidth = character => /\s/u.test(character) ? fontSize * .34
    : /[ilI1|.,:;'!]/u.test(character) ? fontSize * .32
      : /[MW@#%&]/u.test(character) || character.codePointAt(0) > 0x2ff ? fontSize : fontSize * .62
  let remaining = [...guideText(value).replace(/\s+/gu, ' ').trim()]
  const lines = []
  while (remaining.length && lines.length < maximum) {
    if (remaining.reduce((sum, character) => sum + glyphWidth(character), 0) <= width) {
      lines.push(remaining.join('')); remaining = []; break
    }
    let end = 0, used = 0
    const budget = lines.length === maximum - 1 ? width - glyphWidth('…') : width
    while (end < remaining.length && used + glyphWidth(remaining[end]) <= budget) used += glyphWidth(remaining[end++])
    if (!end) end = 1
    if (end < remaining.length && lines.length < maximum - 1) {
      let boundary = end
      while (boundary > 0 && remaining[boundary] !== ' ') boundary--
      if (boundary > 0) end = boundary
    }
    lines.push(remaining.slice(0, end).join('').trimEnd())
    remaining = remaining.slice(end)
    while (remaining[0] === ' ') remaining.shift()
  }
  if (remaining.length) lines[lines.length - 1] += '…'
  return lines.length ? lines : ['']
}

/** One visible description for the current graph state, shared by HTML and offline interaction. */
export function describePaperGuideDiagram(diagram, index = 0, nodeId) {
  const list = value => Array.isArray(value) ? value : []
  const nodes = list(diagram.nodes), step = list(diagram.steps)[index] || list(diagram.steps)[0] || {}
  const selected = nodes.find(node => node.id === nodeId), names = new Map(nodes.map(node => [node.id, node.label]))
  const active = new Set(list(step.activeEdges))
  const relations = list(diagram.edges).filter(edge => active.has(edge.id)
    && (!selected || edge.from === selected.id || edge.to === selected.id))
    .map(edge => (names.get(edge.from) || edge.from) + ' → ' + edge.label + ' → ' + (names.get(edge.to) || edge.to))
  const detail = selected ? selected.label + '：' + selected.detail : step.explanation || ''
  return [detail, ...new Set(relations)].filter(Boolean).join('\n')
}

const guideMetricColumn = value => /\b(?:F[_\s]?1|precision|recall|accuracy|MRR|NDCG|MAP|RI(?:[_\s-]?[LH])?|AR(?:@\d+)?)\b|准确率|精确率|召回率|命中率|插入精度|[Δδ]/iu.test(guideText(value))

function guideTableGroups(columns, rows) {
  if (rows.length <= 6) return null
  const collectionWords = new Set(['集合', '数据集', 'dataset', 'collection', 'benchmark'])
  const header = guideText(columns[0]).trim().toLowerCase().split(/[\/／]/).map(part => part.trim())
  if (!collectionWords.has(header[0]) || header.length > 2 || header.length === 2 && !header[1]) return null
  const combined = header.length === 2, labels = [], rowGroups = [], counts = []
  for (const row of rows) {
    const cell = guideText(row[0]).trim(), separator = cell.search(/[\/／]/)
    if (!cell || combined && (separator < 1 || !cell.slice(separator + 1).trim())) return null
    const label = combined ? cell.slice(0, separator).trim() : cell
    if (!label) return null
    let index = labels.indexOf(label)
    if (index < 0) { index = labels.length; labels.push(label); counts.push(0) }
    if (labels.length > 4) return null
    rowGroups.push(index); counts[index]++
  }
  return labels.length >= 2 && counts.every(count => count >= 2) ? { labels, rowGroups } : null
}

function guideExpression(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 6) return null
  if (typeof node.input === 'string') return { input: node.input }
  if (typeof node.number === 'number') return { number: node.number }
  return { op: node.op, args: guideList(node.args).map(child => guideExpression(child, depth + 1)) }
}
function guideCalculation(block) {
  const value = { type: 'calculation', mode: block.mode, precision: block.precision,
    inputs: guideList(block.inputs).map(input => ({ id: input.id, label: input.label, meaning: input.meaning, value: input.value,
      ...(Object.hasOwn(input, 'min') ? { min: input.min, max: input.max, step: input.step } : {}) })),
    expression: guideExpression(block.expression), resultLabel: guideText(block.resultLabel) }
  try { evaluatePaperCalculation(value); return value } catch { return null }
}
function guideBlock(block, id, chapterId, payload) {
  const e = guideEscape, refs = guidePageNote(block.references), title = '<h3>' + e(block.title) + '</h3>'
  if (block.type === 'paragraph') return '<p class="pg-paragraph">' + e(block.text) + refs + '</p>'
  if (block.type === 'terms') return '<div class="pg-terms">' + guideList(block.items).map(item => '<div class="pg-term"><p class="pg-term-definition"><strong>' + e(item.term) + '</strong><span>' + e(item.meaning) + '</span></p><p class="pg-term-example">' + e(item.example) + '</p>' + (item.role || item.contrast ? '<details class="pg-term-detail"><summary>' + (item.contrast ? '作用与区别' : '作用') + '</summary>' + (item.role ? '<p>' + e(item.role) + '</p>' : '') + (item.contrast ? '<p>' + e(item.contrast) + '</p>' : '') + '</details>' : '') + '</div>').join('') + refs + '</div>'
  if (block.type === 'example') return '<div class="pg-case-link">' + guideButton(block.title || '查看案例', 'case-chapter', 'data-chapter="' + e(chapterId) + '"') + '<span>在案例窗口查看输入与输出</span></div>'
  if (block.type === 'flow') return '<div class="pg-block">' + title + '<div class="pg-flow">' + guideList(block.steps).map((step, index) => '<details class="pg-flow-step"><summary><span>' + (index + 1) + '</span>' + e(step.title) + '<strong class="pg-flow-value" title="' + e(step.output) + '">' + e(guideShort(step.output, 70)) + '</strong></summary><dl><dt>输入</dt><dd>' + e(step.input) + '</dd><dt>操作</dt><dd>' + e(step.operation) + '</dd><dt>输出</dt><dd>' + e(step.output) + '</dd></dl></details>').join('<span class="pg-flow-arrow" aria-hidden="true">→</span>') + '</div>' + refs + '</div>'
  if (block.type === 'table') {
    const rows = guideList(block.rows), columns = guideList(block.columns)
    const grouping = guideTableGroups(columns, rows)
    const cells = rows.map(row => row.map(cell => {
      const token = String(cell).trim(), value = Number(token.replace('%', ''))
      return /^[-+]?\d+(?:\.\d+)?%?$/.test(token) && Number.isFinite(value) ? { value, unit: token.endsWith('%') ? '%' : '' } : null
    }))
    const numbers = cells.map(row => row.map(cell => cell?.value ?? null))
    const scales = columns.map((column, index) => index > 0 && rows.length > 1 && guideMetricColumn(column)
      && cells.every(row => row[index] && row[index].value >= 0)
      && new Set(cells.map(row => row[index].unit)).size === 1
      ? Math.max(0, ...numbers.map(row => row[index])) : 0)
    return '<div class="pg-block"' + (grouping ? ' id="' + e(id) + '" data-table-group-count="' + grouping.labels.length + '"' : '') + '>' + title
      + (grouping ? '<div class="pg-toggle" aria-label="数据集">' + grouping.labels.map((label, index) => guideButton(label, 'table-group', 'data-block="' + e(id) + '" data-index="' + index + '" aria-pressed="' + (index === 0) + '"')).join('') + '</div>' : '')
      + '<div class="pg-table-scroll" tabindex="0"><table><thead><tr>' + columns.map(column => '<th scope="col">' + e(column) + '</th>').join('') + '</tr></thead><tbody>' + rows.map((row, rowIndex) => '<tr' + (grouping ? ' data-table-group="' + grouping.rowGroups[rowIndex] + '"' + (grouping.rowGroups[rowIndex] ? ' hidden' : '') : '') + '>' + row.map((cell, column) => {
      const value = numbers[rowIndex][column], numeric = value !== null && column > 0, percentage = numeric && scales[column] ? value / scales[column] * 100 : 0
      return '<td' + (numeric ? ' class="pg-numeric"' : '') + '>' + e(cell) + (numeric && scales[column] > 0 ? '<div class="pg-minibar" aria-hidden="true"><i style="width:' + percentage + '%"></i></div>' : '') + '</td>'
    }).join('') + '</tr>').join('') + '</tbody></table></div>' + refs + '</div>'
  }
  if (block.type === 'chart') {
    const data = guideList(block.data), minimum = Math.min(0, ...data.map(d => d.value)), maximum = Math.max(0, ...data.map(d => d.value)), range = maximum - minimum || 1
    return '<figure class="pg-block pg-chart">' + title + '<p class="pg-note">' + e(block.context) + ' · ' + e(block.metric) + (block.unit ? '（' + e(block.unit) + '）' : '') + ' · ' + (block.direction === 'lower' ? '越低越好' : '越高越好') + '</p><div class="pg-bars">' + data.map(d => '<div class="pg-brow"><span>' + e(d.label) + '</span><div class="pg-btrack"><i style="left:' + ((Math.min(d.value, 0) - minimum) / range * 100) + '%;width:' + (Math.abs(d.value) / range * 100) + '%"' + (d.value < 0 ? ' data-negative="true"' : '') + '></i><b class="pg-zero" style="left:' + (-minimum / range * 100) + '%"></b></div><strong>' + e(d.display) + '</strong></div>').join('') + '</div>' + refs + '</figure>'
  }
  if (block.type === 'evidence') {
    const value = { id, title: guideText(block.title), budget: block.budget, required: guideList(block.required).map(guideText),
      items: guideList(block.items).map(item => ({ id: item.id, label: item.label, detail: item.detail, supports: guideList(item.supports).map(guideText) })),
      states: guideList(block.states).map(state => ({ label: state.label, ids: guideList(state.ids).map(guideText), explanation: state.explanation })) }
    payload.evidence.push(value)
    const selected = new Set(value.states[0]?.ids || [])
    return '<div class="pg-block pg-evidence" data-evidence="' + e(id) + '" id="' + e(id) + '">' + title + '<p class="pg-note">' + e(block.question) + ' · ' + guideMode(block.mode) + '</p><div class="pg-toggle">' + value.states.map((state, index) => guideButton(state.label, 'evidence-preset', 'data-block="' + e(id) + '" data-index="' + index + '" aria-pressed="' + (index === 0) + '"')).join('') + '</div><div class="pg-segments">' + value.items.map(item => '<label class="pg-segment"><input type="checkbox" data-evidence-input="' + e(id) + '" value="' + e(item.id) + '"' + (selected.has(item.id) ? ' checked' : '') + '><strong>' + e(item.label) + '</strong><span>' + e(item.detail) + '</span><small>' + (item.supports.length ? e(item.supports.join(' · ')) : '未覆盖所需关系') + '</small></label>').join('') + '</div><div class="pg-stats" data-evidence-stats="' + e(id) + '" aria-live="polite"></div><p class="pg-verdict" data-evidence-verdict="' + e(id) + '" aria-live="polite"></p><p class="pg-note">选择只用于检查教学样例，不运行论文模型。</p>' + refs + '</div>'
  }
  if (block.type === 'calculation') {
    const value = guideCalculation(block)
    if (!value) return '<div class="pg-block">' + title + '<p class="pg-note">当前参数无法计算。</p>' + refs + '</div>'
    payload.calculations.push({ id, title: guideText(block.title), block: value })
    const initial = evaluatePaperCalculation(value)
    return '<div class="pg-block pg-calculation" data-calculation="' + e(id) + '" id="' + e(id) + '"><div class="pg-block-head">' + title + '<span class="pg-tag">' + (value.mode === 'illustrative' ? '构造计算' : '论文数值') + '</span></div><p class="pg-formula">' + e(block.formula) + '</p><div class="pg-calc-inputs">' + value.inputs.map(input => {
      const editable = value.mode === 'illustrative' && Object.hasOwn(input, 'min'), quotient = editable ? (input.value - input.min) / input.step : 0
      const domStep = Math.abs(quotient - Math.round(quotient)) <= 1e-8 ? input.step : 'any'
      return '<label class="pg-calc-input"><span>' + e(input.label) + '<output data-input-value="' + e(id + ':' + input.id) + '">' + e(input.value) + '</output></span>' + (editable ? '<input type="range" aria-label="' + e(input.label) + '" data-calc-input="' + e(id) + '" data-input="' + e(input.id) + '" min="' + input.min + '" max="' + input.max + '" step="' + domStep + '" value="' + input.value + '">' : '<strong>' + e(input.value) + '</strong>') + '<small>' + e(input.meaning) + '</small></label>'
    }).join('') + '</div><div class="pg-calc-result"><span>' + e(block.resultLabel) + '</span><output data-calc-result="' + e(id) + '" aria-live="polite">' + initial.toFixed(value.precision) + '</output></div><details class="pg-detail"><summary>计算过程</summary><p>' + e(block.interpretation) + '</p></details>' + (value.mode === 'illustrative' ? guideButton('恢复初始值', 'calculation-reset', 'data-block="' + e(id) + '" class="pg-reset"') : '') + refs + '</div>'
  }
  if (block.type === 'diagram') {
    const columns = guideList(block.columns), nodes = guideList(block.nodes), edges = guideList(block.edges), positions = new Map(), rowCount = []
    columns.forEach((column, index) => { const members = nodes.filter(node => node.column === column.id); rowCount.push(members.length); members.forEach((node, row) => positions.set(node.id, { x: 12 + index * 218, y: 40 + row * 80 })) })
    const edgePaths = edges.flatMap((edge, index) => {
      const from = positions.get(edge.from), to = positions.get(edge.to); if (!from || !to) return []
      const forward = to.x > from.x, same = to.x === from.x, x1 = from.x + (forward || same ? 170 : 0), x2 = to.x + (forward ? 0 : 170), y1 = from.y + 27, y2 = to.y + 27, bend = same ? x1 + 18 + index % 2 * 8 : (x1 + x2) / 2
      return [{ edge, x1, x2, y1, y2, bend }]
    })
    // A cubic stays inside its control-point bounds. Leave room beyond those
    // bounds for the 6-unit arrow marker at the active 2px stroke width.
    const width = Math.max(400, (columns.length - 1) * 218 + 194, ...edgePaths.map(path => Math.max(path.x1, path.x2, path.bend) + 14)), height = Math.max(146, Math.max(1, ...rowCount) * 80 + 52)
    const value = { id, title: block.title, nodes: nodes.map(node => ({ id: node.id, label: node.label, detail: node.detail })),
      edges: edges.map(edge => ({ id: edge.id, from: edge.from, to: edge.to, label: edge.label })), steps: guideList(block.steps).map(step => ({ label: step.label, explanation: step.explanation, activeNodes: guideList(step.activeNodes), activeEdges: guideList(step.activeEdges) })) }
    payload.diagrams.push(value)
    return '<div class="pg-block pg-diagram" data-diagram="' + e(id) + '" id="' + e(id) + '"><div class="pg-block-head">' + title + '<span class="pg-tag">' + guideMode(block.mode) + '</span></div><p class="pg-note">' + e(block.description) + '</p><div class="pg-toggle">' + value.steps.map((step, index) => guideButton(step.label, 'diagram-step', 'data-block="' + e(id) + '" data-index="' + index + '" aria-pressed="' + (index === 0) + '"')).join('') + '</div><div class="pg-diagram-scroll" tabindex="0" role="region" aria-label="' + e(block.title) + '：关系图"><svg viewBox="0 0 ' + width + ' ' + height + '" width="' + width + '" height="' + height + '" style="width:' + width + 'px;min-width:' + width + 'px;height:' + height + 'px" role="group" aria-label="' + e(block.title) + '"><defs><marker id="' + e(id) + '-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10Z"></path></marker></defs>' + columns.map((column, index) => {
      const x = 97 + index * 218, lines = guideLabelLines(column.label, 194, 11, 2)
      return '<text class="pg-column-label" x="' + x + '" y="' + (lines.length > 1 ? 13 : 20) + '" aria-label="' + e(column.label) + '"><title>' + e(column.label) + '</title>' + lines.map((line, row) => '<tspan x="' + x + '" dy="' + (row ? 14 : 0) + '">' + e(line) + '</tspan>').join('') + '</text>'
    }).join('') + edgePaths.map(({ edge, x1, x2, y1, y2, bend }) => {
      return '<path class="pg-edge" data-edge="' + e(id + ':' + edge.id) + '" d="M' + x1 + ',' + y1 + ' C' + bend + ',' + y1 + ' ' + bend + ',' + y2 + ' ' + x2 + ',' + y2 + '" marker-end="url(#' + e(id) + '-arrow)"><title>' + e(edge.label) + '</title></path>'
    }).join('') + nodes.map(node => {
      const p = positions.get(node.id); if (!p) return ''
      const lines = guideLabelLines(node.label)
      return '<g class="pg-node" role="button" tabindex="0" aria-label="' + e(node.label) + '" data-action="diagram-node" data-block="' + e(id) + '" data-node="' + e(node.id) + '"><title>' + e(node.label) + '</title><rect x="' + p.x + '" y="' + p.y + '" width="170" height="54" rx="8"></rect><text x="' + (p.x + 85) + '" y="' + (p.y + 31 - (lines.length - 1) * 8.5) + '">' + lines.map((line, index) => '<tspan x="' + (p.x + 85) + '" dy="' + (index ? 17 : 0) + '">' + e(line) + '</tspan>').join('') + '</text></g>'
    }).join('') + '</svg></div><p class="pg-diagram-explanation" data-diagram-explanation="' + e(id) + '" aria-live="polite">' + e(describePaperGuideDiagram(value)) + '</p>' + refs + '</div>'
  }
  return ''
}

/** Trusted renderer: model data is text/typed state only; no model HTML or JavaScript is executed. */
export function createPaperGuideHtml(paper, { styles = '', behavior = '' } = {}) {
  const explanation = paper?.explanation, study = explanation?.caseStudy
  if (explanation?.version !== 4 || !study || !Array.isArray(study.steps) || study.steps.length < 2) throw new TypeError('A version 4 paper guide with a case study is required')
  const e = guideEscape, payload = { steps: study.steps.map(step => ({ label: guideText(step.label), file: guideText(step.file),
    language: ['json', 'python', 'text'].includes(step.language) ? step.language : 'text', code: guideText(step.code), explanation: guideText(step.explanation),
    annotations: guideList(step.annotations).map(annotation => ({ line: annotation.line, explanation: guideText(annotation.explanation) })) })), evidence: [], calculations: [], diagrams: [] }
  const chapters = guideList(explanation.chapters)
  const sections = chapters.map((chapter, chapterIndex) => '<section class="pg-section" id="chapter-' + e(chapter.id) + '" aria-labelledby="heading-' + e(chapter.id) + '"><h2 id="heading-' + e(chapter.id) + '"><span>' + (chapterIndex + 1) + '</span>' + e(chapter.title) + '</h2>' + (guideList(chapter.blocks).length ? chapter.blocks.map((block, blockIndex) => guideBlock(block, 'guide-' + chapterIndex + '-' + blockIndex, chapter.id, payload)).join('') : '<p class="pg-note">' + e(chapter.markdown || '当前可提取的论文文字未提供足够依据，暂不作结论。') + '</p>') + '</section>').join('')
  const first = payload.steps[0], lines = first.code.split('\n')
  const code = lines.map((line, index) => {
    const annotated = first.annotations.some(annotation => annotation.line === index + 1)
    const tag = annotated ? 'button' : 'div'
    return '<' + tag + (annotated ? ' type="button" class="pg-line pg-line-annotated" data-action="code-line" data-line="' + (index + 1) + '" aria-pressed="false"' : ' class="pg-line"') + '><span class="pg-line-no">' + (index + 1) + '</span><span class="pg-source">' + e(line || ' ') + '</span></' + tag + '>'
  }).join('')
  const trustedStyles = String(styles).replace(/<\/style/gi, '<\\/style'), trustedBehavior = String(behavior).replace(/<\/script/gi, '<\\/script')
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; connect-src \'none\'; img-src \'none\'; font-src \'none\'; base-uri \'none\'; form-action \'none\'"><title>' + e(explanation.title || paper.title) + '</title><style>' + trustedStyles + '</style></head><body><div class="pg-guide"><header class="pg-hero"><div class="pg-hero-inner"><span class="pg-kicker">论文图解</span><h1>' + e(explanation.title || paper.title) + '</h1><p class="pg-paper-title">' + e(paper.title) + '</p><p class="pg-tldr"><b>一句话</b>' + e(explanation.summary) + '</p><nav class="pg-nav" aria-label="讲解章节">' + chapters.map((chapter, index) => '<a href="#chapter-' + e(chapter.id) + '" data-action="nav-chapter" data-chapter="' + e(chapter.id) + '">' + (index + 1) + ' ' + e(chapter.title) + '</a>').join('') + '</nav></div></header><div class="pg-wrap"><div class="pg-grid"><aside class="pg-left" aria-label="贯穿案例"><div class="pg-codewin"><div class="pg-winbar"><i></i><i></i><i></i><span>' + e(study.title) + '</span></div><div class="pg-steps" aria-label="案例阶段">' + payload.steps.map((step, index) => guideButton((index + 1) + ' ' + step.label, 'case-stage', 'data-index="' + index + '" aria-pressed="' + (index === 0) + '"')).join('') + '</div><div class="pg-tabs" aria-label="案例文件">' + payload.steps.map((step, index) => guideButton(step.file, 'case-stage', 'data-index="' + index + '" aria-pressed="' + (index === 0) + '"')).join('') + '</div><div class="pg-code" data-case-code role="region" tabindex="0" aria-label="当前案例代码">' + code + '</div><div class="pg-expbox"><p data-case-explanation aria-live="polite">' + e(first.explanation) + '</p></div><p class="pg-code-hint">' + guideMode(study.mode) + guidePageNote(study.references) + '</p></div></aside><main class="pg-right">' + sections + '</main></div></div></div><script type="application/json" id="paper-guide-data">' + guideJson(payload) + '</script><script>const evaluatePaperCalculation=' + evaluatePaperCalculation.toString() + ';\nconst describePaperGuideDiagram=' + describePaperGuideDiagram.toString() + ';\n' + trustedBehavior + '</script></body></html>'
}
