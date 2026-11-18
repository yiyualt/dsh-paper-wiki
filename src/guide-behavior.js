(function paperGuideBehavior() {
  'use strict'
  const dataNode = document.getElementById('paper-guide-data')
  if (!dataNode) return
  let data
  try { data = JSON.parse(dataNode.textContent) } catch { return }
  const all = selector => Array.from(document.querySelectorAll(selector))
  const find = selector => document.querySelector(selector)
  const list = value => Array.isArray(value) ? value : []
  const make = (tag, className = '', text = '') => {
    const node = document.createElement(tag)
    if (className) node.className = className
    node.textContent = String(text)
    return node
  }
  const evidence = new Map(list(data.evidence).map(block => [block.id, block]))
  const calculations = new Map(list(data.calculations).map(block => [block.id, block]))
  const diagrams = new Map(list(data.diagrams).map(block => [block.id, block]))
  const chosen = new Map(), calculationInputs = new Map()
  let stage = 0
  function appendSourceLine(parent, source, language) {
    if (language !== 'json') { parent.textContent = source || ' '; return }
    const pattern = /"(?:\\.|[^"\\])*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|\b(?:true|false|null)\b|[{}\[\],:]/g
    let end = 0
    for (const match of source.matchAll(pattern)) {
      if (match.index > end) parent.append(make('span', '', source.slice(end, match.index)))
      const token = match[0]
      const kind = token.startsWith('"') ? (/^\s*:/.test(source.slice(match.index + token.length)) ? 'key' : 'string')
        : /^-?\d/.test(token) ? 'number' : /^(true|false|null)$/.test(token) ? 'literal' : 'punctuation'
      parent.append(make('span', 'pg-token-' + kind, token)); end = match.index + token.length
    }
    if (end < source.length || !source.length) parent.append(make('span', '', source.slice(end) || ' '))
  }
  function renderCase() {
    const step = data.steps[stage], code = find('[data-case-code]'), explanation = find('[data-case-explanation]')
    if (!step || !code) return
    const scrollTop = code.scrollTop, scrollLeft = code.scrollLeft
    const lines = step.code.split('\n').map((source, index) => {
      const annotated = list(step.annotations).some(annotation => annotation.line === index + 1)
      const line = make(annotated ? 'button' : 'div', annotated ? 'pg-line pg-line-annotated' : 'pg-line')
      if (annotated) {
        line.setAttribute('type', 'button'); line.setAttribute('data-action', 'code-line'); line.setAttribute('data-line', String(index + 1)); line.setAttribute('aria-pressed', 'false')
      }
      line.append(make('span', 'pg-line-no', index + 1))
      const text = make('span', 'pg-source'); appendSourceLine(text, source, step.language); line.append(text)
      return line
    })
    code.replaceChildren(...lines)
    code.scrollTop = scrollTop; code.scrollLeft = scrollLeft
    if (explanation) explanation.textContent = step.explanation
    for (const button of all('[data-action="case-stage"]')) button.setAttribute('aria-pressed', String(Number(button.dataset.index) === stage))
  }
  function selectStage(index) {
    if (!Number.isInteger(index) || index < 0 || index >= data.steps.length) return
    stage = index; renderCase()
  }
  function selectChapter(chapterId) {
    for (const link of all('[data-action="nav-chapter"]')) {
      if (link.dataset.chapter === chapterId) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    }
  }
  function stat(label, value, description) {
    const node = make('div', 'pg-stat')
    node.append(make('span', '', label), make('strong', '', value), make('small', '', description))
    return node
  }
  function renderEvidence(id) {
    const block = evidence.get(id); if (!block) return
    const selected = chosen.get(id) || new Set(list(block.states[0]?.ids))
    chosen.set(id, selected)
    const selectedItems = block.items.filter(item => selected.has(item.id)), required = list(block.required)
    const covered = new Set(selectedItems.flatMap(item => list(item.supports)).filter(relation => required.includes(relation)))
    const missing = required.filter(relation => !covered.has(relation)), overBudget = selected.size > block.budget
    const group = document.getElementById(id), stats = find('[data-evidence-stats="' + id + '"]'), verdict = find('[data-evidence-verdict="' + id + '"]')
    if (group) for (const input of group.querySelectorAll('[data-evidence-input]')) input.checked = selected.has(input.value)
    if (stats) stats.replaceChildren(stat('所选条目', selected.size + ' / ' + block.budget, overBudget ? '已超过预算' : '固定预算'),
      stat('关系覆盖', covered.size + ' / ' + required.length, '按样例提供的关系计算'), stat('缺失关系', missing.length, missing.length ? missing.join('、') : '已覆盖全部所需关系'))
    if (verdict) {
      verdict.setAttribute('data-status', overBudget ? 'over-budget' : missing.length ? 'missing' : 'covered')
      verdict.textContent = overBudget ? '超出预算 ' + (selected.size - block.budget) + ' 项；这组选择不满足约束。'
        : missing.length ? '仍缺少：' + missing.join('、') + '。' : '在预算内覆盖了全部所需关系。'
    }
    for (const button of all('[data-action="evidence-preset"]')) {
      if (button.dataset.block !== id) continue
      const ids = list(block.states[Number(button.dataset.index)]?.ids)
      button.setAttribute('aria-pressed', String(ids.length === selected.size && ids.every(key => selected.has(key))))
    }
  }
  function renderCalculation(id) {
    const group = calculations.get(id); if (!group) return
    const overrides = calculationInputs.get(id) || {}, block = group.block
    calculationInputs.set(id, overrides)
    const output = find('[data-calc-result="' + id + '"]')
    let result, error
    try { result = evaluatePaperCalculation(block, overrides) }
    catch { error = '当前参数无法计算。' }
    if (output) { output.textContent = error || result.toFixed(block.precision); output.setAttribute('data-error', String(!!error)) }
    for (const input of block.inputs) {
      const value = Object.hasOwn(overrides, input.id) ? overrides[input.id] : input.value
      const shown = find('[data-input-value="' + id + ':' + input.id + '"]'); if (shown) shown.textContent = String(value)
      const range = all('[data-calc-input="' + id + '"]').find(node => node.dataset.input === input.id); if (range) range.value = String(value)
    }
  }
  function renderDiagram(id, index = 0, nodeId) {
    const block = diagrams.get(id), group = document.getElementById(id); if (!block || !group) return
    const step = block.steps[index] || block.steps[0], activeNodes = new Set(list(step?.activeNodes)), activeEdges = new Set(list(step?.activeEdges))
    for (const node of group.querySelectorAll('[data-action="diagram-node"]')) {
      node.setAttribute('data-active', String(activeNodes.has(node.dataset.node))); node.setAttribute('aria-pressed', String(node.dataset.node === nodeId))
    }
    for (const edge of group.querySelectorAll('[data-edge]')) edge.setAttribute('data-active', String(activeEdges.has(edge.dataset.edge.slice(id.length + 1))))
    for (const button of group.querySelectorAll('[data-action="diagram-step"]')) button.setAttribute('aria-pressed', String(Number(button.dataset.index) === index))
    const selected = block.nodes.find(node => node.id === nodeId), explanation = find('[data-diagram-explanation="' + id + '"]')
    if (explanation) explanation.textContent = selected ? selected.label + '：' + selected.detail : step?.explanation || ''
    group.setAttribute('data-step', String(index))
  }
  document.addEventListener('click', event => {
    const button = event.target?.closest?.('[data-action]'); if (!button) return
    const action = button.dataset.action, id = button.dataset.block
    if (action === 'case-stage') selectStage(Number(button.dataset.index))
    else if (action === 'code-line') {
      const line = Number(button.dataset.line), step = data.steps[stage]
      const code = find('[data-case-code]'), scrollTop = code?.scrollTop, scrollLeft = code?.scrollLeft
      for (const row of all('[data-action="code-line"]')) row.setAttribute('aria-pressed', String(row === button))
      const annotation = list(step.annotations).find(item => item.line === line), output = find('[data-case-explanation]')
      if (output) output.textContent = annotation?.explanation || step.explanation
      if (code) { code.scrollTop = scrollTop; code.scrollLeft = scrollLeft }
    } else if (action === 'nav-chapter') {
      event.preventDefault()
      selectChapter(button.dataset.chapter)
      document.getElementById('chapter-' + button.dataset.chapter)?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    }
    else if (action === 'case-chapter') find('.pg-left')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
    else if (action === 'evidence-preset') {
      const block = evidence.get(id), preset = block?.states[Number(button.dataset.index)]
      if (preset) { chosen.set(id, new Set(preset.ids)); renderEvidence(id) }
    } else if (action === 'calculation-reset') { calculationInputs.set(id, {}); renderCalculation(id) }
    else if (action === 'diagram-step') renderDiagram(id, Number(button.dataset.index))
    else if (action === 'diagram-node') renderDiagram(id, Number(document.getElementById(id)?.dataset.step || 0), button.dataset.node)
  })
  document.addEventListener('input', event => {
    const input = event.target
    if (input?.dataset?.evidenceInput) {
      const id = input.dataset.evidenceInput, block = evidence.get(id)
      if (!block || !block.items.some(item => item.id === input.value)) return
      const selected = chosen.get(id) || new Set()
      if (input.checked) selected.add(input.value); else selected.delete(input.value)
      chosen.set(id, selected); renderEvidence(id)
    } else if (input?.dataset?.calcInput) {
      const id = input.dataset.calcInput, group = calculations.get(id), variable = group?.block.inputs.find(item => item.id === input.dataset.input)
      if (!variable || group.block.mode !== 'illustrative' || !Object.hasOwn(variable, 'min')) return
      const numeric = input.value.trim() ? Number(input.value) : NaN
      calculationInputs.set(id, { ...(calculationInputs.get(id) || {}), [variable.id]: numeric }); renderCalculation(id)
    }
  })
  document.addEventListener('keydown', event => {
    const target = event.target?.closest?.('[data-action="diagram-node"]')
    if (target && ['Enter', ' '].includes(event.key)) {
      event.preventDefault(); renderDiagram(target.dataset.block, Number(document.getElementById(target.dataset.block)?.dataset.step || 0), target.dataset.node)
    }
  })
  renderCase()
  for (const id of evidence.keys()) renderEvidence(id)
  for (const id of calculations.keys()) renderCalculation(id)
  for (const id of diagrams.keys()) renderDiagram(id)
})()
