(() => {
  const documentRoot = document
  let calculationRows = []
  try { calculationRows = JSON.parse(documentRoot.getElementById('paper-export-calculations')?.textContent || '[]') }
  catch { calculationRows = [] }
  const calculations = new Map(Array.isArray(calculationRows) ? calculationRows.map(row => [row.id, row.block]) : [])
  const all = (root, selector) => Array.from(root.querySelectorAll(selector))
  const strings = value => {
    try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [] }
    catch { return [] }
  }
  function selectCard(button) {
    const group = button.closest('[data-export-selection]')
    if (!group) return
    for (const card of all(group, '[data-selectable]')) card.dataset.active = String(card.id === button.dataset.targetId)
    for (const control of all(group, 'button[data-export-action]')) control.setAttribute('aria-pressed', String(control === button))
  }
  function selectDiagramStep(button) {
    const group = button.closest('[data-diagram]')
    if (!group) return
    const nodes = new Set(strings(button.dataset.activeNodes)), edges = new Set(strings(button.dataset.activeEdges))
    for (const node of all(group, '[data-node-id]')) node.dataset.active = String(nodes.has(node.dataset.nodeId))
    for (const edge of all(group, '[data-edge-id]')) edge.dataset.active = String(edges.has(edge.dataset.edgeId))
    for (const label of all(group, '[data-edge-label-id]')) label.dataset.active = String(edges.has(label.dataset.edgeLabelId))
    for (const control of all(group, 'button[data-export-action]')) control.setAttribute('aria-pressed', String(control === button))
    for (const item of all(group, '[data-diagram-explanation]')) item.dataset.active = String(item.dataset.diagramExplanation === button.dataset.stepIndex)
  }
  function selectDiagramNode(node) {
    const group = node.closest('[data-diagram]')
    if (!group) return
    for (const other of all(group, '[data-node-id]')) {
      other.dataset.selected = String(other === node)
      other.setAttribute('aria-pressed', String(other === node))
    }
    for (const detail of all(group, '[data-node-detail]')) detail.dataset.selected = String(detail.dataset.nodeDetail === node.dataset.nodeId)
  }
  function activate(target) {
    if (target.dataset.exportAction === 'select-card') selectCard(target)
    else if (target.dataset.exportAction === 'diagram-step') selectDiagramStep(target)
    else if (target.dataset.exportAction === 'diagram-node') selectDiagramNode(target)
  }
  documentRoot.addEventListener('click', event => {
    const target = event.target?.closest?.('[data-export-action]')
    if (target) activate(target)
  })
  documentRoot.addEventListener('keydown', event => {
    const target = event.target?.closest?.('[data-export-action]')
    if (!target) return
    if (target.dataset.exportAction === 'diagram-node' && ['Enter', ' '].includes(event.key)) {
      event.preventDefault(); selectDiagramNode(target); return
    }
    const group = target.closest('[data-export-controls]')
    if (!group) return
    const controls = all(group, 'button[data-export-action]'), index = controls.indexOf(target)
    if (index < 0) return
    const next = { ArrowRight: (index + 1) % controls.length, ArrowDown: (index + 1) % controls.length,
      ArrowLeft: (index + controls.length - 1) % controls.length, ArrowUp: (index + controls.length - 1) % controls.length,
      Home: 0, End: controls.length - 1 }[event.key]
    if (next === undefined) return
    event.preventDefault(); activate(controls[next]); controls[next].focus()
  })
  documentRoot.addEventListener('input', event => {
    const input = event.target
    if (!input?.matches?.('input[data-calc-input]')) return
    const group = input.closest('[data-calculation]'), block = calculations.get(group?.id)
    if (!group || !block || block.mode !== 'illustrative') return
    const result = group.querySelector('[data-calculation-result]'), overrides = Object.create(null)
    for (const slider of all(group, 'input[data-calc-input]')) {
      const value = Number(slider.value)
      overrides[slider.dataset.calcInput] = value
      for (const output of all(group, '[data-calc-input-value]')) if (output.dataset.calcInputValue === slider.dataset.calcInput) output.textContent = String(value)
    }
    try {
      const value = evaluatePaperCalculation(block, overrides)
      result.textContent = value.toFixed(block.precision); result.dataset.rawValue = String(value); result.dataset.state = 'ready'
    } catch {
      result.textContent = '当前参数无法计算。'; result.dataset.rawValue = ''; result.dataset.state = 'error'
    }
  })
})()
