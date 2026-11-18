import { evaluatePaperCalculation } from './paper-calculation.js'

export function createPaperContentRenderer(React, primitives) {
  const { createElement: h, useId, useState } = React
  const { MarkdownText } = primitives

  function References({ references, className = '' }) {
    const pages = [...new Set((references || []).map(ref => ref?.page).filter(page => Number.isInteger(page) && page > 0))]
    return pages.length ? h('span', { className: 'dsh-paper-wiki-content-references ' + className },
      '（第 ' + pages.join('、') + ' 页）') : null
  }

  function compactJsonWhitespace(value) {
    let result = '', quoted = false, escaped = false
    for (const character of value) {
      if (quoted) {
        result += character
        if (escaped) escaped = false
        else if (character === '\\') escaped = true
        else if (character === '"') quoted = false
      } else if (character === '"') {
        quoted = true
        result += character
      } else if (![' ', '\t', '\r', '\n'].includes(character)) result += character
    }
    return result
  }

  function fencedCode(code, language) {
    if (language === 'json') {
      try {
        const parsed = JSON.parse(code)
        if (compactJsonWhitespace(code) === compactJsonWhitespace(JSON.stringify(parsed))) code = JSON.stringify(parsed, null, 2)
      } catch { /* Preserve readable legacy examples. */ }
    }
    const runs = String(code).match(/`+/g) || []
    const fence = '`'.repeat(Math.max(3, ...runs.map(run => run.length + 1)))
    const tag = ['json', 'python', 'text'].includes(language) ? language : 'text'
    return fence + tag + '\n' + code + '\n' + fence
  }

  function ModeLabel({ mode, calculation = false }) {
    return h('span', { className: 'dsh-paper-wiki-example-mode' }, calculation
      ? mode === 'illustrative' ? '构造计算（非实测）' : '基于论文数值'
      : mode === 'illustrative' ? '构造示例' : '论文实例')
  }

  function ExampleBlock({ block, labels }) {
    const prefix = useId()
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-example', 'aria-labelledby': prefix + '-title' },
      h('div', { className: 'dsh-paper-wiki-content-heading' }, h('h3', { id: prefix + '-title' }, block.title), h(ModeLabel, { mode: block.mode })),
      h('ol', { className: 'dsh-paper-wiki-example-sequence', 'aria-label': block.title + '：完整示例' }, block.steps.map((step, index) =>
        h('li', { key: index, className: 'dsh-paper-wiki-example-step' }, h('h4', null,
          h('span', { className: 'dsh-paper-wiki-sequence-number' }, String(index + 1)), step.label),
          h('div', { className: 'dsh-paper-wiki-example-code', role: 'region', tabIndex: 0, 'aria-label': step.label + '：代码' },
            h(MarkdownText, { text: fencedCode(step.code, step.language), labels, omitHtml: true })),
          h('p', { className: 'dsh-paper-wiki-example-explanation' }, step.explanation)))),
      h(References, { references: block.references }))
  }

  function FlowBlock({ block }) {
    const prefix = useId()
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-method-flow', 'aria-labelledby': prefix + '-title' },
      h('h3', { id: prefix + '-title', className: 'dsh-paper-wiki-content-title' }, block.title),
      h('ol', { className: 'dsh-paper-wiki-flow-sequence', 'aria-label': block.title + '：全部方法步骤' }, block.steps.map((step, index) =>
        h('li', { key: index, className: 'dsh-paper-wiki-flow-step' }, h('h4', null,
          h('span', { className: 'dsh-paper-wiki-sequence-number' }, String(index + 1)), step.title),
          h('dl', null, [['输入', step.input], ['处理', step.operation], ['输出', step.output]].flatMap(([label, text]) => [
            h('dt', { key: label + '-label' }, label), h('dd', { key: label + '-text' }, text),
          ]))))),
      h(References, { references: block.references }))
  }

  function TermsBlock({ block }) {
    const prefix = useId()
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-terms', 'aria-labelledby': prefix + '-title' },
      h('h3', { className: 'dsh-paper-wiki-content-title', id: prefix + '-title' }, block.title),
      h('dl', { className: 'dsh-paper-wiki-term-list' }, block.items.map((item, index) => h('div', { key: index, className: 'dsh-paper-wiki-term' },
        h('dt', null, item.term), h('dd', { className: 'dsh-paper-wiki-term-meaning' }, item.meaning),
        h('dd', { className: 'dsh-paper-wiki-term-example' }, h('span', null, '具体例子'), item.example),
        h('dd', { className: 'dsh-paper-wiki-term-role' }, h('span', null, '在这里的作用'), item.role),
        item.contrast && h('dd', { className: 'dsh-paper-wiki-term-contrast' }, item.contrast)))),
      h(References, { references: block.references }))
  }

  function DiagramBlock({ block }) {
    const [selectedStep, selectStep] = useState(0), [selectedNode, selectNode] = useState(null)
    const prefix = useId().replace(/[^a-zA-Z0-9_-]/g, '-')
    const stepIndex = Math.min(selectedStep, block.steps.length - 1), step = block.steps[stepIndex]
    const activeNodes = new Set(step.activeNodes), activeEdges = new Set(step.activeEdges)
    const nodeWidth = 190, nodeHeight = 74, stride = 280
    const positions = new Map(), rowCounts = []
    block.columns.forEach((column, columnIndex) => {
      const nodes = block.nodes.filter(node => node.column === column.id)
      rowCounts.push(nodes.length)
      nodes.forEach((node, row) => positions.set(node.id, { ...node, x: 24 + columnIndex * stride, y: 62 + row * 122, columnIndex }))
    })
    const width = Math.max(400, block.columns.length * stride + 36), height = Math.max(212, Math.max(...rowCounts) * 122 + 74)
    const detail = positions.get(selectedNode)
    const markerId = prefix + '-arrow', activeMarkerId = prefix + '-arrow-active'
    const labelBoxes = []
    function shortLabel(value, boxWidth) {
      const characters = Array.from(value.replace(/\s+/g, ' ').trim())
      const maximum = Math.max(4, Math.min(12, Math.floor((boxWidth - 10) / 6.6)))
      const units = character => /^[\x20-\x7e]$/.test(character) ? 1 : 2
      const lines = []
      let position = 0
      for (let line = 0; line < 2 && position < characters.length; line++) {
        while (characters[position] === ' ') position++
        const text = []
        let size = 0
        while (position < characters.length && size + units(characters[position]) <= maximum) {
          size += units(characters[position]); text.push(characters[position++])
        }
        if (line === 1 && position < characters.length) {
          while (text.length && size + 2 > maximum) size -= units(text.pop())
          text.push('…')
        }
        lines.push(text.join('').trim())
      }
      return lines.length ? lines : ['']
    }
    function labelFor(edge, index) {
      const from = positions.get(edge.from), to = positions.get(edge.to)
      const sameColumn = from.columnIndex === to.columnIndex
      const direction = from.columnIndex < to.columnIndex ? 1 : -1
      const gap = stride - nodeWidth
      const gapLeft = sameColumn || direction > 0 ? from.x + nodeWidth : from.x - gap
      const boxWidth = Math.min(76, gap - 12), lines = shortLabel(edge.label, boxWidth)
      const boxHeight = lines.length * 14 + 8
      const middleY = (from.y + to.y + nodeHeight) / 2
      const preferred = middleY - (sameColumn ? 0 : direction * (boxHeight / 2 + 12 + index % 2 * 4))
      const x = gapLeft + (gap - boxWidth) / 2
      const candidates = [0, 1, -1, 2, -2, 3, -3].map(offset =>
        Math.max(8, Math.min(height - boxHeight - 8, preferred - boxHeight / 2 + offset * (boxHeight + 7))))
      const overlaps = (y, box) => x < box.x + box.width + 4 && x + boxWidth + 4 > box.x
        && y < box.y + box.height + 4 && y + boxHeight + 4 > box.y
      const y = candidates.find(candidate => labelBoxes.every(box => !overlaps(candidate, box))) ?? candidates[0]
      const box = { x, y, width: boxWidth, height: boxHeight, lines }
      labelBoxes.push(box)
      return box
    }
    function pathFor(edge, index) {
      const from = positions.get(edge.from), to = positions.get(edge.to)
      const sy = from.y + nodeHeight / 2, ey = to.y + nodeHeight / 2
      if (from.columnIndex === to.columnIndex) {
        const sx = from.x + nodeWidth, ex = to.x + nodeWidth, outside = sx + 34 + index % 3 * 13
        return { d: `M${sx},${sy} C${outside},${sy} ${outside},${ey} ${ex},${ey}`, x: outside - 2, y: (sy + ey) / 2 - 5, anchor: 'end' }
      }
      const direction = from.x < to.x ? 1 : -1
      const sx = from.x + (direction > 0 ? nodeWidth : 0), ex = to.x + (direction > 0 ? 0 : nodeWidth)
      const bend = direction * (18 + index % 3 * 12)
      const middle = (sx + ex) / 2
      return { d: `M${sx},${sy} C${middle},${sy - bend} ${middle},${ey - bend} ${ex},${ey}`,
        x: middle, y: (sy + ey) / 2 - bend * .75 - 7, anchor: 'middle' }
    }
    const edgeViews = block.edges.map((edge, index) => ({ edge, path: pathFor(edge, index),
      label: labelFor(edge, index), active: activeEdges.has(edge.id) }))
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-diagram', 'aria-labelledby': prefix + '-title' },
      h('div', { className: 'dsh-paper-wiki-content-heading' }, h('h3', { id: prefix + '-title' }, block.title), h(ModeLabel, { mode: block.mode })),
      h('p', { className: 'dsh-paper-wiki-diagram-description' }, block.description),
      h('div', { className: 'dsh-paper-wiki-diagram-stages', role: 'group', 'aria-label': block.title + '：图解步骤' },
        block.steps.map((item, index) => h('button', { type: 'button', key: index, 'aria-pressed': index === stepIndex,
          onClick: () => { selectStep(index); selectNode(null) } }, item.label))),
      h('div', { className: 'dsh-paper-wiki-diagram-scroll', role: 'region', tabIndex: 0, 'aria-label': block.title + '：关系图' },
        h('div', { className: 'dsh-paper-wiki-diagram-canvas', style: { width, height } },
          h('svg', { width, height, viewBox: `0 0 ${width} ${height}`, className: 'dsh-paper-wiki-diagram-wires', 'aria-hidden': true },
            h('defs', null, [[markerId, 'var(--wiki-muted)'], [activeMarkerId, 'var(--wiki-accent-ink)']].map(([id, color]) =>
              h('marker', { key: id, id, markerWidth: 7, markerHeight: 7, refX: 6, refY: 3.5, orient: 'auto', viewBox: '0 0 7 7' },
                h('path', { d: 'M0 0L7 3.5L0 7Z', fill: color })))),
            edgeViews.map(({ edge, path, active }) => h('g', { key: edge.id, className: 'dsh-paper-wiki-diagram-edge', 'data-active': active || undefined },
                h('title', null, edge.label),
                h('path', { d: path.d, fill: 'none', stroke: 'currentColor', strokeWidth: active ? 2.5 : 1.5,
                  markerEnd: `url(#${active ? activeMarkerId : markerId})` }))),
            edgeViews.map(({ edge, label, active }) => h('g', { key: edge.id + '-label',
                className: 'dsh-paper-wiki-diagram-edge dsh-paper-wiki-diagram-label-group', 'data-active': active || undefined },
                h('title', null, edge.label),
                h('rect', { className: 'dsh-paper-wiki-diagram-edge-label-bg', x: label.x, y: label.y,
                  width: label.width, height: label.height, rx: 4 }),
                h('text', { className: 'dsh-paper-wiki-diagram-edge-label', textAnchor: 'middle' }, label.lines.map((line, lineIndex) =>
                  h('tspan', { key: lineIndex, x: label.x + label.width / 2, y: label.y + 14 + lineIndex * 14 }, line)))))),
          block.columns.map((column, index) => h('div', { key: column.id, className: 'dsh-paper-wiki-diagram-column', style: { left: 24 + index * stride, width: nodeWidth } }, column.label)),
          [...positions.values()].map(node => h('button', { type: 'button', key: node.id, className: 'dsh-paper-wiki-diagram-node',
            style: { left: node.x, top: node.y, width: nodeWidth, height: nodeHeight },
            'data-active': activeNodes.has(node.id) || undefined, 'aria-pressed': selectedNode === node.id,
            'aria-controls': prefix + '-detail', onClick: () => selectNode(node.id), title: node.label }, node.label)))),
      h('div', { className: 'dsh-paper-wiki-diagram-detail', id: prefix + '-detail', 'aria-live': 'polite' },
        detail && h('h4', null, detail.label), h('p', null, detail ? detail.detail : step.explanation)),
      h('ul', { className: 'dsh-paper-wiki-diagram-relations', 'aria-label': '图中关系' }, block.edges.map(edge =>
        h('li', { key: edge.id, 'data-active': activeEdges.has(edge.id) || undefined },
          positions.get(edge.from).label, ' → ', positions.get(edge.to).label, '：', edge.label))),
      h(References, { references: block.references }))
  }

  function EvidenceBlock({ block }) {
    const [selection, select] = useState(null)
    const prefix = useId(), items = new Map(block.items.map(item => [item.id, item]))
    const selected = selection && items.get(selection.id)
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-evidence', 'aria-labelledby': prefix + '-title' },
      h('div', { className: 'dsh-paper-wiki-content-heading' }, h('h3', { id: prefix + '-title' }, block.title), h(ModeLabel, { mode: block.mode })),
      h('p', { className: 'dsh-paper-wiki-evidence-question' }, block.question),
      h('p', { className: 'dsh-paper-wiki-evidence-budget' }, '阅读预算：' + block.budget + ' 段'),
      h('div', { className: 'dsh-paper-wiki-evidence-states' }, block.states.map((state, index) => {
        const previous = index > 0 ? block.states[index - 1].ids : [], current = new Set(state.ids)
        const added = new Set(index > 0 ? state.ids.filter(id => !previous.includes(id)) : [])
        const removed = previous.filter(id => !current.has(id))
        const covered = new Set(state.ids.flatMap(id => items.get(id).supports))
        return h('section', { className: 'dsh-paper-wiki-evidence-state', key: index, 'aria-labelledby': prefix + '-state-' + index },
          h('h4', { id: prefix + '-state-' + index }, state.label),
          h('ol', { className: 'dsh-paper-wiki-evidence-slots', 'aria-label': state.label + '：阅读段落' },
            Array.from({ length: block.budget }, (_, slot) => {
              const id = state.ids[slot], item = items.get(id), active = selection?.state === index && selection.id === id
              return h('li', { key: slot, 'data-added': added.has(id) || undefined }, h('span', { className: 'dsh-paper-wiki-evidence-position' }, String(slot + 1)),
                item ? h('button', { type: 'button', 'aria-expanded': active, 'aria-controls': prefix + '-item-detail',
                  onClick: () => select(active ? null : { state: index, id }) }, h('span', null, item.label),
                  added.has(id) && h('span', { className: 'dsh-paper-wiki-evidence-added' }, '新增'))
                  : h('span', { className: 'dsh-paper-wiki-evidence-empty' }, '空位'))
            })),
          removed.length > 0 && h('p', { className: 'dsh-paper-wiki-evidence-removed' }, '移除：' + removed.map(id => items.get(id).label).join('、')),
          h('p', { className: 'dsh-paper-wiki-evidence-coverage' }, '已提供关系：' + block.required.filter(need => covered.has(need)).length + ' / ' + block.required.length),
          h('ul', { className: 'dsh-paper-wiki-evidence-requirements' }, block.required.map(need =>
            h('li', { key: need, 'data-covered': covered.has(need) || undefined }, covered.has(need) ? '已具备：' : '尚缺：', need))),
          h('p', { className: 'dsh-paper-wiki-evidence-explanation' }, state.explanation))
      })),
      h('div', { className: 'dsh-paper-wiki-evidence-detail', id: prefix + '-item-detail', 'aria-live': 'polite', hidden: !selected },
        selected && h('h4', null, selected.label), selected && h('p', null, selected.detail)),
      h(References, { references: block.references }))
  }

  function CalculationBlock({ block }) {
    const [overrides, change] = useState({})
    const prefix = useId(), illustrative = block.mode === 'illustrative'
    let result, error = '', changed = false
    const numbers = Object.create(null)
    for (const input of block.inputs) if (Object.hasOwn(overrides, input.id)) {
      const raw = overrides[input.id], value = typeof raw === 'string' && !raw.trim() ? NaN : Number(raw)
      changed ||= value !== input.value
      if (!Number.isFinite(value)) error = '请输入有效数字。'
      else if (value < input.min || value > input.max) error = '输入数值超出允许范围。'
      else numbers[input.id] = value
    }
    if (!error) {
      try { result = evaluatePaperCalculation(block, numbers); if (!Number.isFinite(result)) error = '当前输入无法得到有限结果。' }
      catch { error = '当前输入无法完成计算，请调整数值。' }
    }
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-calculation', 'aria-labelledby': prefix + '-title' },
      h('div', { className: 'dsh-paper-wiki-content-heading' }, h('h3', { id: prefix + '-title' }, block.title), h(ModeLabel, { mode: block.mode, calculation: true })),
      h('p', { className: 'dsh-paper-wiki-calculation-formula' }, block.formula),
      h('div', { className: 'dsh-paper-wiki-calculation-inputs' }, block.inputs.map(input => {
        const editable = illustrative && Number.isFinite(input.min) && Number.isFinite(input.max) && input.min < input.max
        const raw = Object.hasOwn(overrides, input.id) ? overrides[input.id] : input.value
        const numeric = Number(raw)
        const quotient = (numeric - input.min) / input.step
        const domStep = Number.isFinite(quotient)
          && Math.abs(quotient - Math.round(quotient)) > 1e-8 * Math.max(1, Math.abs(quotient))
          ? 'any' : input.step || 'any'
        return h('div', { className: 'dsh-paper-wiki-calculation-input', key: input.id },
          h('div', { className: 'dsh-paper-wiki-calculation-input-heading' }, h('label', { htmlFor: editable ? prefix + '-' + input.id : undefined }, input.label),
            h('code', null, input.id), !editable && h('output', null, String(input.value))),
          h('p', null, input.meaning),
          editable && h('div', { className: 'dsh-paper-wiki-calculation-controls' },
            h('input', { type: 'range', min: input.min, max: input.max, step: domStep,
              value: Number.isFinite(numeric) ? Math.max(input.min, Math.min(input.max, numeric)) : input.value,
              'aria-label': input.label + '：调节数值', onChange: event => change(previous => ({ ...previous, [input.id]: event.target.value })) }),
            h('input', { id: prefix + '-' + input.id, type: 'number', min: input.min, max: input.max, step: domStep, value: raw,
              onChange: event => change(previous => ({ ...previous, [input.id]: event.target.value })) })))
      })),
      h('div', { className: 'dsh-paper-wiki-calculation-result', 'aria-live': 'polite' }, h('span', null, block.resultLabel),
        error ? h('p', { role: 'status' }, error) : h('output', null, result.toFixed(block.precision))),
      h('p', { className: 'dsh-paper-wiki-calculation-interpretation' }, illustrative ? '初始值说明：' : '', block.interpretation),
      illustrative && changed && h('button', { type: 'button', className: 'dsh-paper-wiki-calculation-reset', onClick: () => change({}) }, '恢复初始值'),
      h(References, { references: block.references }))
  }

  function TableBlock({ block }) {
    const captionId = useId()
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-content-table' },
      h('div', { className: 'dsh-paper-wiki-table-scroll', role: 'region', 'aria-labelledby': captionId, tabIndex: 0 },
        h('table', null,
          h('caption', { id: captionId }, block.title),
          h('thead', null, h('tr', null, block.columns.map((column, i) => h('th', { key: i, scope: 'col' }, column)))),
          h('tbody', null, block.rows.map((row, i) => h('tr', { key: i }, row.map((cell, j) => h('td', { key: j }, cell))))))),
      h(References, { references: block.references }))
  }

  function ChartBlock({ block }) {
    const prefix = useId()
    const magnitude = Math.max(...block.data.map(datum => Math.abs(datum.value))) || 1
    const minimum = Math.min(0, ...block.data.map(datum => datum.value))
    const maximum = Math.max(0, ...block.data.map(datum => datum.value))
    const low = minimum / magnitude, high = maximum / magnitude
    const range = high - low || 1
    const zero = Math.max(0, -low / range * 100)
    const zeroScale = minimum === 0 && maximum === 0
    return h('figure', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-content-chart',
      'aria-labelledby': prefix + '-title', 'aria-describedby': prefix + '-context' },
      h('figcaption', { id: prefix + '-title', className: 'dsh-paper-wiki-content-title' }, block.title),
      h('p', { id: prefix + '-context', className: 'dsh-paper-wiki-chart-context' }, block.context),
      h('p', { className: 'dsh-paper-wiki-chart-metric' }, block.metric + (block.unit ? '（' + block.unit + '）' : ''),
        ' · ' + (block.direction === 'lower' ? '越低越好' : '越高越好')),
      h('ol', { className: 'dsh-paper-wiki-chart-data', 'aria-label': block.metric + '比较' }, block.data.map((datum, i) => {
        const value = datum.value / magnitude
        const left = Math.max(0, (Math.min(value, 0) - low) / range * 100)
        const width = Math.max(0, Math.abs(value) / range * 100)
        return h('li', { key: i },
          h('div', { className: 'dsh-paper-wiki-chart-row-heading' }, h('span', null, datum.label),
            h('span', { className: 'dsh-paper-wiki-chart-value' }, datum.display, h(References, { references: [datum.reference] }))),
          h('div', { className: 'dsh-paper-wiki-chart-track', 'aria-hidden': true },
            h('span', { className: 'dsh-paper-wiki-chart-fill', 'data-negative': datum.value < 0 || undefined,
              style: { left: left + '%', width: width + '%' } }),
            h('span', { className: 'dsh-paper-wiki-chart-zero', style: { left: zero + '%' } })))
      })),
      h('div', { className: 'dsh-paper-wiki-chart-axis', 'aria-hidden': true }, h('span', null, String(minimum)),
        !zeroScale && h('span', null, String(maximum))),
      h(References, { references: block.references }))
  }

  return function PaperContent({ chapter, labels }) {
    if (!Array.isArray(chapter?.blocks)) return null
    return h(React.Fragment, null, chapter.blocks.map((block, index) => {
      const key = (chapter.id || 'chapter') + '-' + index
      if (block.type === 'paragraph') return h('p', { className: 'dsh-paper-wiki-content-paragraph', key },
        block.text, h(References, { references: block.references }))
      if (block.type === 'example') return h(ExampleBlock, { key, block, labels })
      if (block.type === 'flow') return h(FlowBlock, { key, block })
      if (block.type === 'table') return h(TableBlock, { key, block })
      if (block.type === 'chart') return h(ChartBlock, { key, block })
      if (block.type === 'terms') return h(TermsBlock, { key, block })
      if (block.type === 'diagram') return h(DiagramBlock, { key, block })
      if (block.type === 'evidence') return h(EvidenceBlock, { key, block })
      if (block.type === 'calculation') return h(CalculationBlock, { key, block })
      return null
    }))
  }
}
