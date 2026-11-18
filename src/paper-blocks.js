export function createPaperContentRenderer(React, primitives) {
  const { createElement: h, useId, useState } = React
  const { MarkdownText } = primitives

  function References({ references, className = '' }) {
    const pages = [...new Set((references || []).map(ref => ref?.page).filter(page => Number.isInteger(page) && page > 0))]
    return pages.length ? h('span', { className: 'dsh-paper-wiki-content-references ' + className },
      '（第 ' + pages.join('、') + ' 页）') : null
  }

  function moveTab(event, index, count, select) {
    const next = { ArrowRight: (index + 1) % count, ArrowDown: (index + 1) % count,
      ArrowLeft: (index + count - 1) % count, ArrowUp: (index + count - 1) % count,
      Home: 0, End: count - 1 }[event.key]
    if (next === undefined) return
    event.preventDefault()
    select(next)
    event.currentTarget.parentElement?.querySelectorAll('[role="tab"]')[next]?.focus()
  }

  function fencedCode(code, language) {
    const runs = String(code).match(/`+/g) || []
    const fence = '`'.repeat(Math.max(3, ...runs.map(run => run.length + 1)))
    const tag = ['json', 'python', 'text'].includes(language) ? language : 'text'
    return fence + tag + '\n' + code + '\n' + fence
  }

  function ExampleBlock({ block, labels }) {
    const [selected, select] = useState(0)
    const prefix = useId()
    const index = Math.min(selected, block.steps.length - 1)
    const step = block.steps[index]
    const panelId = prefix + '-panel'
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-example', 'aria-labelledby': prefix + '-title' },
      h('div', { className: 'dsh-paper-wiki-content-heading' },
        h('h3', { id: prefix + '-title' }, block.title),
        h('span', { className: 'dsh-paper-wiki-example-mode' }, block.mode === 'illustrative' ? '构造示例' : '论文实例')),
      h('div', { className: 'dsh-paper-wiki-content-tabs', role: 'tablist', 'aria-label': block.title + '：示例步骤' },
        block.steps.map((item, i) => h('button', { type: 'button', role: 'tab', key: i,
          id: prefix + '-tab-' + i, 'aria-selected': i === index, 'aria-controls': panelId,
          tabIndex: i === index ? 0 : -1, onClick: () => select(i), onKeyDown: event => moveTab(event, i, block.steps.length, select) }, item.label))),
      h('div', { className: 'dsh-paper-wiki-example-panel', id: panelId, role: 'tabpanel',
        'aria-labelledby': prefix + '-tab-' + index },
        h('div', { className: 'dsh-paper-wiki-example-code', role: 'region', tabIndex: 0, 'aria-label': step.label + '：代码' },
          h(MarkdownText, { text: fencedCode(step.code, step.language), labels, omitHtml: true })),
        h('p', { className: 'dsh-paper-wiki-example-explanation' }, step.explanation)),
      h(References, { references: block.references }))
  }

  function FlowBlock({ block }) {
    const [selected, select] = useState(0)
    const prefix = useId()
    const index = Math.min(selected, block.steps.length - 1)
    const step = block.steps[index]
    const panelId = prefix + '-panel'
    return h('section', { className: 'dsh-paper-wiki-content-block dsh-paper-wiki-method-flow', 'aria-labelledby': prefix + '-title' },
      h('h3', { id: prefix + '-title', className: 'dsh-paper-wiki-content-title' }, block.title),
      h('div', { className: 'dsh-paper-wiki-flow-steps', role: 'tablist', 'aria-label': block.title + '：方法步骤' },
        block.steps.flatMap((item, i) => [
          i > 0 && h('span', { key: 'arrow-' + i, className: 'dsh-paper-wiki-flow-arrow', 'aria-hidden': true }, '→'),
          h('button', { type: 'button', role: 'tab', key: 'step-' + i,
            id: prefix + '-tab-' + i, 'aria-label': '第 ' + (i + 1) + ' 步：' + item.title,
            'aria-selected': i === index, 'aria-controls': panelId, tabIndex: i === index ? 0 : -1,
            onClick: () => select(i), onKeyDown: event => moveTab(event, i, block.steps.length, select) },
          h('span', { className: 'dsh-paper-wiki-flow-number', 'aria-hidden': true }, String(i + 1)),
          h('span', null, item.title)),
        ])),
      h('div', { className: 'dsh-paper-wiki-flow-panel', id: panelId, role: 'tabpanel',
        'aria-labelledby': prefix + '-tab-' + index, tabIndex: 0 },
        h('dl', null, [['输入', step.input], ['处理', step.operation], ['输出', step.output]].flatMap(([label, text]) => [
          h('dt', { key: label + '-label' }, label), h('dd', { key: label + '-text' }, text),
        ]))),
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
      return null
    }))
  }
}
