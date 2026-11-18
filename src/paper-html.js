import { evaluatePaperCalculation } from './paper-calculation.js'

const list = value => Array.isArray(value) ? value : []
const text = value => typeof value === 'string' ? value : ''
const html = value => text(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
const finite = value => typeof value === 'number' && Number.isFinite(value)
const jsonData = value => JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => '\\u' + character.charCodeAt(0).toString(16).padStart(4, '0'))
const mode = value => value === 'illustrative' ? '构造示例（非论文原始样本）' : '论文实例'

function citations(references) {
  const pages = [...new Set(list(references).map(ref => ref?.page).filter(page => Number.isInteger(page) && page > 0 && page <= 150))]
  return pages.length ? '<p class="pe-references">（第 ' + pages.join('、') + ' 页）</p>' : ''
}

function inline(markdown) {
  const plain = text(markdown).replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\\([\\`*_{}\[\]()<>#!|~+.\-])/g, '$1')
  return html(plain).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

function tableCells(line) {
  let source = line.trim()
  if (source.startsWith('|')) source = source.slice(1)
  if (source.endsWith('|') && !source.endsWith('\\|')) source = source.slice(0, -1)
  const cells = [], current = []
  let escaped = false
  for (const character of source) {
    if (character === '|' && !escaped) { cells.push(current.join('').trim()); current.length = 0 }
    else current.push(character)
    escaped = character === '\\' && !escaped
  }
  cells.push(current.join('').trim())
  return cells
}

function legacyMarkdown(markdown) {
  const lines = text(markdown).replace(/\r\n?/g, '\n').split('\n'), blocks = []
  const fence = line => /^ {0,3}(`{3,}|~{3,})([^\s]*)\s*$/.exec(line)
  const divider = line => tableCells(line).length >= 2 && tableCells(line).every(cell => /^:?-{3,}:?$/.test(cell))
  for (let index = 0; index < lines.length;) {
    const line = lines[index]
    if (!line.trim()) { index++; continue }
    const marker = fence(line)
    if (marker) {
      const code = [], language = ['json', 'python', 'text'].includes(marker[2]) ? marker[2] : 'text'
      index++
      while (index < lines.length) {
        const close = fence(lines[index])
        if (close && close[1][0] === marker[1][0] && close[1].length >= marker[1].length && !close[2]) { index++; break }
        code.push(lines[index++])
      }
      blocks.push('<pre><code class="language-' + language + '">' + html(code.join('\n')) + '</code></pre>')
      continue
    }
    const heading = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (heading) {
      const level = Math.min(6, heading[1].length + 2)
      blocks.push('<h' + level + '>' + inline(heading[2]) + '</h' + level + '>'); index++; continue
    }
    if (index + 1 < lines.length && line.includes('|') && divider(lines[index + 1])) {
      const columns = tableCells(line), rows = []
      index += 2
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) rows.push(tableCells(lines[index++]))
      blocks.push('<div class="pe-table-scroll" tabindex="0"><table><thead><tr>' + columns.map(column => '<th scope="col">' + inline(column) + '</th>').join('')
        + '</tr></thead><tbody>' + rows.map(row => '<tr>' + columns.map((_, cell) => '<td>' + inline(row[cell] || '') + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>')
      continue
    }
    const bullet = /^\s*(?:[-*+] |\d+[.)] )/.exec(line)
    if (bullet) {
      const ordered = /^\s*\d/.test(line), items = []
      const pattern = ordered ? /^\s*\d+[.)]\s+(.+)$/ : /^\s*[-*+]\s+(.+)$/
      while (index < lines.length) {
        const item = pattern.exec(lines[index]); if (!item) break
        items.push('<li>' + inline(item[1]) + '</li>'); index++
      }
      blocks.push('<' + (ordered ? 'ol' : 'ul') + '>' + items.join('') + '</' + (ordered ? 'ol' : 'ul') + '>'); continue
    }
    const paragraph = [line]; index++
    while (index < lines.length && lines[index].trim() && !fence(lines[index]) && !/^ {0,3}#{1,6}\s/.test(lines[index])
      && !/^\s*(?:[-*+] |\d+[.)] )/.test(lines[index]) && !(index + 1 < lines.length && lines[index].includes('|') && divider(lines[index + 1]))) paragraph.push(lines[index++])
    blocks.push('<p>' + inline(paragraph.join('\n')).replace(/\n/g, '<br>') + '</p>')
  }
  return blocks.join('\n')
}

function stepButton(label, target, action = 'select-card') {
  return '<button type="button" data-export-action="' + action + '" data-target-id="' + target + '" aria-pressed="false">' + html(label) + '</button>'
}

function compactRelationLabel(value) {
  const characters = [...text(value).replace(/\s+/g, ' ').trim()], lines = []
  const units = character => character.codePointAt(0) <= 255 ? 1 : 2
  let position = 0
  while (position < characters.length && lines.length < 2) {
    const line = []
    let width = 0
    while (position < characters.length && width + units(characters[position]) <= 10) {
      width += units(characters[position]); line.push(characters[position++])
    }
    lines.push(line.join('').trim())
  }
  if (position < characters.length) {
    const last = [...lines[lines.length - 1]]
    while (last.reduce((sum, character) => sum + units(character), 0) > 8) last.pop()
    lines[lines.length - 1] = last.join('').trimEnd() + '…'
  }
  if (!lines.length) lines.push('关系')
  return lines.map(line => ({ text: line, width: Math.max(1, [...line].reduce((sum, character) => sum + units(character), 0) * 5) }))
}

function diagram(block, id) {
  const columns = list(block.columns), nodes = list(block.nodes), edges = list(block.edges), steps = list(block.steps)
  const positions = new Map(), rows = new Map()
  for (const node of nodes) {
    const column = Math.max(0, columns.findIndex(item => item.id === node.column)), row = rows.get(column) || 0
    rows.set(column, row + 1); positions.set(node.id, { x: 40 + column * 260, y: 76 + row * 104, column, node })
  }
  const width = Math.max(590, columns.length * 260 + 70), labels = [], occupied = new Map()
  let height = Math.max(220, 104 * Math.max(1, ...rows.values()) + 90)
  const edgeSvg = edges.map((edge, index) => {
    const from = positions.get(edge.from), to = positions.get(edge.to)
    if (!from || !to) return ''
    const forward = from.x < to.x, same = from.x === to.x
    const x1 = from.x + (forward || same ? 200 : 0), x2 = to.x + (forward ? 0 : 200)
    const y1 = from.y + 34, y2 = to.y + 34, bend = same ? x1 + 30 + (index % 3) * 12 : Math.max(36, Math.abs(x2 - x1) * .48)
    const control1 = same ? bend : x1 + (forward ? bend : -bend), control2 = same ? bend : x2 + (forward ? -bend : bend)
    const d = `M ${x1} ${y1} C ${control1} ${y1}, ${control2} ${y2}, ${x2} ${y2}`
    const gap = same || forward ? from.column : from.column - 1, labelX = 270 + gap * 260
    const pieces = compactRelationLabel(edge.label), labelWidth = Math.max(...pieces.map(piece => piece.width)) + 6, labelHeight = pieces.length * 12 + 8
    let anchorX = labelX, anchorY = (y1 + y2) / 2
    if (same) anchorX = x1 + .75 * (bend - x1)
    else {
      let low = 0, high = 1
      for (let turn = 0; turn < 32; turn++) {
        const t = (low + high) / 2, inverse = 1 - t
        const x = inverse ** 3 * x1 + 3 * inverse ** 2 * t * control1 + 3 * inverse * t ** 2 * control2 + t ** 3 * x2
        if ((x < labelX) === forward) low = t; else high = t
      }
      const t = (low + high) / 2
      anchorY = y1 + (y2 - y1) * (3 * t ** 2 - 2 * t ** 3)
    }
    const taken = occupied.get(gap) || [], preferred = Math.max(56 + labelHeight / 2, anchorY)
    let labelY
    for (let attempt = 0; attempt <= edges.length * 2; attempt++) {
      const direction = attempt % 2 ? 1 : -1
      const candidate = preferred + direction * Math.ceil(attempt / 2) * (labelHeight + 8)
      if (candidate - labelHeight / 2 < 56 || candidate + labelHeight / 2 > height - 14) continue
      if (taken.every(other => Math.abs(candidate - other.y) >= (labelHeight + other.height) / 2 + 6)) { labelY = candidate; break }
    }
    if (labelY === undefined) {
      labelY = Math.max(height - 14 + labelHeight / 2 + 8, ...taken.map(other => other.y + other.height / 2 + labelHeight / 2 + 8))
      height = labelY + labelHeight / 2 + 20
    }
    taken.push({ y: labelY, height: labelHeight }); occupied.set(gap, taken)
    const leader = Math.abs(anchorY - labelY) > 2 || Math.abs(anchorX - labelX) > 2
      ? '<path class="pe-edge-label-leader" d="M ' + anchorX + ' ' + anchorY + ' L ' + labelX + ' ' + labelY + '"></path>' : ''
    labels.push('<g class="pe-edge-label" data-edge-label-id="' + html(edge.id) + '" transform="translate(' + labelX + ' ' + labelY + ')"><title>' + html(edge.label) + '</title>'
      + '<rect class="pe-edge-label-box" x="' + (-labelWidth / 2) + '" y="' + (-labelHeight / 2) + '" width="' + labelWidth + '" height="' + labelHeight + '" rx="4"></rect><text x="0" y="' + (pieces.length > 1 ? -3 : 3) + '">'
      + pieces.map((piece, line) => '<tspan x="0" dy="' + (line ? 12 : 0) + '" textLength="' + piece.width + '" lengthAdjust="spacingAndGlyphs">' + html(piece.text) + '</tspan>').join('') + '</text></g>')
    return '<g class="pe-edge" data-edge-id="' + html(edge.id) + '"><title>' + html(edge.label) + '</title><path d="' + d
      + '" marker-end="url(#' + id + '-arrow)"></path></g>' + leader
  }).join('')
  const nodeSvg = [...positions.values()].map(({ x, y, node }) => {
    const label = [...text(node.label)], pieces = []
    for (let offset = 0; offset < Math.min(label.length, 28); offset += 14) pieces.push(label.slice(offset, offset + 14).join(''))
    if (label.length > 28) pieces[1] += '…'
    return '<g class="pe-node" role="button" tabindex="0" aria-pressed="false" aria-label="' + html(node.label) + '" data-export-action="diagram-node" data-node-id="' + html(node.id) + '">'
      + '<title>' + html(node.label) + '：' + html(node.detail) + '</title><rect class="pe-node-box" x="' + x + '" y="' + y + '" width="200" height="68" rx="10"></rect>'
      + '<text x="' + (x + 100) + '" y="' + (y + (pieces.length > 1 ? 28 : 39)) + '">' + pieces.map((piece, index) => '<tspan x="' + (x + 100) + '" dy="' + (index ? 20 : 0) + '">' + html(piece) + '</tspan>').join('') + '</text></g>'
  }).join('')
  return '<section class="pe-block pe-diagram" data-diagram id="' + id + '"><h3>' + html(block.title) + '</h3><p class="pe-mode">' + mode(block.mode) + '</p><p>' + html(block.description) + '</p>'
    + '<div class="pe-diagram-scroll" tabindex="0" role="region" aria-label="' + html(block.title) + '：关系图"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height + '" role="group" aria-label="' + html(block.title) + '">'
    + '<defs><marker id="' + id + '-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 Z"></path></marker></defs>'
    + columns.map((column, index) => '<text class="pe-column-label" x="' + (140 + index * 260) + '" y="34">' + html(column.label) + '</text>').join('') + edgeSvg + labels.join('') + nodeSvg + '</svg></div>'
    + '<div class="pe-diagram-controls" data-export-controls aria-label="关系图步骤">' + steps.map((step, index) => '<button type="button" data-export-action="diagram-step" data-step-index="' + index + '" data-active-nodes="' + html(jsonData(list(step.activeNodes))) + '" data-active-edges="' + html(jsonData(list(step.activeEdges))) + '" aria-pressed="false">' + (index + 1) + '. ' + html(step.label) + '</button>').join('') + '</div>'
    + '<ol class="pe-diagram-explanations">' + steps.map((step, index) => '<li data-diagram-explanation="' + index + '"><strong>' + html(step.label) + '</strong><p>' + html(step.explanation) + '</p></li>').join('') + '</ol>'
    + '<dl class="pe-node-details">' + nodes.map(node => '<div data-node-detail="' + html(node.id) + '"><dt>' + html(node.label) + '</dt><dd>' + html(node.detail) + '</dd></div>').join('') + '</dl>'
    + '<ul class="pe-edge-details">' + edges.map(edge => '<li>' + html(positions.get(edge.from)?.node.label || edge.from) + ' → ' + html(positions.get(edge.to)?.node.label || edge.to) + '：' + html(edge.label) + '</li>').join('') + '</ul>' + citations(block.references) + '</section>'
}

function evidence(block, id) {
  const items = new Map(list(block.items).map(item => [item.id, item])), required = list(block.required)
  const budget = Number.isInteger(block.budget) ? Math.max(1, Math.min(8, block.budget)) : 1
  let previous = []
  const states = list(block.states).map((state, index) => {
    const ids = list(state.ids), selected = ids.map(key => items.get(key)).filter(Boolean)
    const covered = new Set(selected.flatMap(item => list(item.supports)).filter(value => required.includes(value)))
    const added = index ? ids.filter(key => !previous.includes(key)) : [], removed = index ? previous.filter(key => !ids.includes(key)) : []
    previous = ids
    const slots = Array.from({ length: budget }, (_, slot) => {
      const item = selected[slot]
      return item ? '<li class="pe-evidence-slot" data-added="' + added.includes(item.id) + '"><strong>' + html(item.label) + '</strong>' + (added.includes(item.id) ? '<small>新增</small>' : '') + '<p>' + html(item.detail) + '</p><small>支持：' + list(item.supports).map(html).join('；') + '</small></li>' : '<li class="pe-evidence-slot pe-slot-empty">空位</li>'
    }).join('')
    return '<section class="pe-evidence-state" data-selectable id="' + id + '-state-' + index + '"><h4>' + stepButton(state.label, id + '-state-' + index) + '</h4>'
      + '<p>' + html(state.explanation) + '</p><p class="pe-evidence-count">已用 ' + selected.length + ' / ' + budget + ' 个位置 · 关系覆盖 <strong>' + covered.size + ' / ' + required.length + '</strong></p>'
      + '<ol class="pe-evidence-slots">' + slots + '</ol>' + (removed.length ? '<p class="pe-removed">移除：' + removed.map(key => html(items.get(key)?.label || key)).join('、') + '</p>' : '')
      + '<ul class="pe-coverage">' + required.map(relation => '<li data-covered="' + covered.has(relation) + '">' + (covered.has(relation) ? '已覆盖：' : '缺失：') + html(relation) + '</li>').join('') + '</ul></section>'
  }).join('')
  return '<section class="pe-block pe-evidence" data-export-selection id="' + id + '"><h3>' + html(block.title) + '</h3><p class="pe-mode">' + mode(block.mode) + '</p><p>问题：' + html(block.question) + '</p><p>固定段落预算：' + budget + ' 个位置</p>'
    + '<div class="pe-evidence-states" data-export-controls>' + states + '</div><details open class="pe-candidate-details"><summary>全部候选段落</summary><dl>' + [...items.values()].map(item => '<div><dt>' + html(item.label) + '</dt><dd>' + html(item.detail) + '；支持：' + list(item.supports).map(html).join('；') + '</dd></div>').join('') + '</dl></details>' + citations(block.references) + '</section>'
}

function calculationPayload(block) {
  let nodes = 0
  const expression = (node, depth = 1) => {
    if (++nodes > 64 || depth > 6 || !node || typeof node !== 'object') return null
    if (typeof node.input === 'string') return { input: node.input }
    if (finite(node.number)) return { number: node.number }
    if (['add', 'subtract', 'multiply', 'divide'].includes(node.op) && Array.isArray(node.args) && node.args.length <= 8) return { op: node.op, args: node.args.map(argument => expression(argument, depth + 1)) }
    return null
  }
  return { type: 'calculation', mode: block.mode, precision: block.precision, inputs: list(block.inputs).map(input => ({ id: text(input.id), value: input.value,
    ...Object.fromEntries(['min', 'max', 'step'].filter(key => Object.hasOwn(input, key)).map(key => [key, input[key]])) })), expression: expression(block.expression) }
}

function calculation(block, id, calculations) {
  const payload = calculationPayload(block)
  let result, valid = true
  try { result = evaluatePaperCalculation(payload) } catch { valid = false }
  if (valid) calculations.push({ id, block: payload })
  const inputs = list(block.inputs).map((input, index) => {
    const inputId = id + '-input-' + index, ranged = valid && block.mode === 'illustrative' && ['min', 'max', 'step'].every(key => finite(input[key]))
    const quotient = ranged ? (input.value - input.min) / input.step : 0
    const continuous = ranged && (!Number.isFinite(quotient) || Math.abs(quotient - Math.round(quotient)) > 1e-8 * Math.max(1, Math.abs(quotient)))
    const step = continuous ? 'any' : input.step
    return '<div class="pe-calculation-input"><label for="' + inputId + '">' + html(input.label) + '</label><output data-calc-input-value="' + html(input.id) + '" ' + (ranged ? 'for="' : 'id="') + inputId + '">' + (finite(input.value) ? String(input.value) : '—') + '</output><p>' + html(input.meaning) + '</p>'
      + (ranged ? '<input type="range" id="' + inputId + '" data-calc-input="' + html(input.id) + '" min="' + input.min + '" max="' + input.max + '" step="' + step + '" value="' + input.value + '">' : '<span class="pe-fixed-value">固定参数</span>') + '</div>'
  }).join('')
  const formatted = valid ? result.toFixed(payload.precision) : '当前参数无法计算。'
  return '<section class="pe-block pe-calculation" data-calculation id="' + id + '"><h3>' + html(block.title) + '</h3><p class="pe-mode">' + mode(block.mode) + '</p><p class="pe-formula"><code>' + html(block.formula) + '</code></p><div class="pe-calculation-inputs">' + inputs + '</div>'
    + '<p class="pe-calculation-result"><span>' + html(block.resultLabel) + '</span><output data-calculation-result aria-live="polite" data-raw-value="' + (valid ? result : '') + '">' + formatted + '</output></p><p>' + html(block.interpretation) + '</p>' + citations(block.references) + '</section>'
}

function renderBlock(block, id, calculations) {
  if (!block || typeof block !== 'object') return ''
  if (block.type === 'paragraph') return '<div class="pe-paragraph"><p>' + html(block.text) + '</p>' + citations(block.references) + '</div>'
  if (block.type === 'diagram') return diagram(block, id)
  if (block.type === 'evidence') return evidence(block, id)
  if (block.type === 'calculation') return calculation(block, id, calculations)
  const heading = '<h3>' + html(block.title) + '</h3>', refs = citations(block.references)
  if (block.type === 'terms') return '<section class="pe-block pe-terms">' + heading + '<dl>' + list(block.items).map(item => '<div><dt>' + html(item.term) + '</dt><dd><p><strong>含义：</strong>' + html(item.meaning) + '</p><p><strong>作用：</strong>' + html(item.role) + '</p><p><strong>本例：</strong>' + html(item.example) + '</p>' + (item.contrast ? '<p><strong>易混区别：</strong>' + html(item.contrast) + '</p>' : '') + '</dd></div>').join('') + '</dl>' + refs + '</section>'
  if (block.type === 'example') return '<section class="pe-block pe-example" data-export-selection>' + heading + '<p class="pe-mode">' + mode(block.mode) + '</p><ol class="pe-steps" data-export-controls>' + list(block.steps).map((step, index) => '<li data-selectable id="' + id + '-step-' + index + '"><h4>' + stepButton((index + 1) + '. ' + text(step.label), id + '-step-' + index) + '</h4><pre><code>' + html(step.code) + '</code></pre><p>' + html(step.explanation) + '</p></li>').join('') + '</ol>' + refs + '</section>'
  if (block.type === 'flow') return '<section class="pe-block pe-flow" data-export-selection>' + heading + '<ol class="pe-steps" data-export-controls>' + list(block.steps).map((step, index) => '<li data-selectable id="' + id + '-step-' + index + '"><h4>' + stepButton((index + 1) + '. ' + text(step.title), id + '-step-' + index) + '</h4><dl>' + [['输入', step.input], ['操作', step.operation], ['输出', step.output]].map(([label, value]) => '<dt>' + label + '</dt><dd>' + html(value) + '</dd>').join('') + '</dl></li>').join('') + '</ol>' + refs + '</section>'
  if (block.type === 'table') return '<section class="pe-block pe-table"><div class="pe-table-scroll" role="region" tabindex="0" aria-label="' + html(block.title) + '"><table><caption>' + html(block.title) + '</caption><thead><tr>' + list(block.columns).map(column => '<th scope="col">' + html(column) + '</th>').join('') + '</tr></thead><tbody>' + list(block.rows).map(row => '<tr>' + list(row).map(cell => '<td>' + html(cell) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' + refs + '</section>'
  if (block.type === 'chart') {
    const data = list(block.data).filter(point => finite(point?.value)), magnitude = Math.max(1, ...data.map(point => Math.abs(point.value)))
    const minimum = Math.min(0, ...data.map(point => point.value)), maximum = Math.max(0, ...data.map(point => point.value))
    const low = minimum / magnitude, span = maximum / magnitude - low || 1, zero = -low / span * 100
    return '<figure class="pe-block pe-chart">' + '<figcaption>' + html(block.title) + '</figcaption><p>' + html(block.context) + '</p><p>' + html(block.metric) + '（' + html(block.unit) + '）· ' + (block.direction === 'lower' ? '越低越好' : '越高越好') + '</p><ol>' + data.map(point => {
      const value = point.value / magnitude, left = (Math.min(value, 0) - low) / span * 100, width = Math.abs(value) / span * 100
      return '<li><div class="pe-chart-label"><span>' + html(point.label) + '</span><strong>' + html(point.display) + '</strong></div><div class="pe-chart-track" aria-hidden="true"><span class="pe-chart-bar" data-negative="' + (point.value < 0) + '" style="left:' + left + '%;width:' + width + '%"></span><span class="pe-chart-zero" style="left:' + zero + '%"></span></div>' + citations([point.reference]) + '</li>'
    }).join('') + '</ol><div class="pe-chart-axis"><span>' + minimum + '</span><span>' + maximum + '</span></div>' + refs + '</figure>'
  }
  return '<p class="pe-note">此内容块暂不支持 HTML 展示。</p>'
}

/** Export explanation fields only; PDF pages and source quotations never enter the document or script data. */
export function createPaperHtml(paper, { styles = '', behavior = '' } = {}) {
  const explanation = paper?.explanation
  if (!explanation || !Array.isArray(explanation.chapters) || !explanation.chapters.length) throw new TypeError('Paper explanation is required')
  const title = text(explanation.title) || text(paper.title) || '论文讲解', calculations = []
  const chapters = explanation.chapters.map((chapter, index) => {
    const body = Array.isArray(chapter.blocks) && chapter.blocks.length ? chapter.blocks.map((block, blockIndex) => renderBlock(block, 'pe-c' + index + '-b' + blockIndex, calculations)).join('\n') : legacyMarkdown(chapter.markdown)
    return '<section class="pe-chapter" id="chapter-' + (index + 1) + '"><h2><span>' + (index + 1) + '</span>' + html(chapter.title) + '</h2>' + body + '</section>'
  }).join('\n')
  const script = ';(() => {\n"use strict";\nconst evaluatePaperCalculation = (' + evaluatePaperCalculation.toString() + ');\n' + text(behavior) + '\n})();'
  return '<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'unsafe-inline\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; connect-src \'none\'; base-uri \'none\'; form-action \'none\'"><title>' + html(title) + '</title><style>' + text(styles).replace(/<\/style/gi, '<\\/style') + '</style></head><body><main class="paper-export"><header class="pe-header"><p class="pe-eyebrow">论文百科 · 完整讲解</p><h1>' + html(title) + '</h1>' + (paper.fileName ? '<p class="pe-file-name">' + html(paper.fileName) + '</p>' : '') + '</header><nav class="pe-directory" aria-label="章节目录">' + explanation.chapters.map((chapter, index) => '<a href="#chapter-' + (index + 1) + '">' + (index + 1) + '. ' + html(chapter.title) + '</a>').join('') + '</nav><article>' + chapters + '</article></main><script type="application/json" id="paper-export-calculations">' + jsonData(calculations) + '</script><script>' + script.replace(/<\/script/gi, '<\\/script') + '</script></body></html>\n'
}
