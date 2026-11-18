import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createPaperContentRenderer } from '../src/paper-blocks.js'

const ref = (page = 2) => ({ page, quote: 'A continuous excerpt that supports the content.' })

function fixture(blocks) {
  let chapter = { id: 'method', blocks }
  let hookPath = '', hookIndex = 0
  const state = new Map()
  const React = {
    Fragment: Symbol('fragment'),
    createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }),
    useId() { return 'id-' + hookPath + '-' + hookIndex++ },
    useState(initial) {
      const key = hookPath + '-' + hookIndex++
      if (!state.has(key)) state.set(key, typeof initial === 'function' ? initial() : initial)
      return [state.get(key), value => state.set(key, typeof value === 'function' ? value(state.get(key)) : value)]
    },
  }
  const PaperContent = createPaperContentRenderer(React, { MarkdownText: 'markdown' })
  function expand(node, path = 'root') {
    if (!node || typeof node !== 'object') return node
    if (typeof node.type === 'function') {
      const previousPath = hookPath, previousIndex = hookIndex
      hookPath = path; hookIndex = 0
      const child = node.type({ ...node.props, children: node.children })
      hookPath = previousPath; hookIndex = previousIndex
      return expand(child, path + '/result')
    }
    return { ...node, children: node.children.map((child, i) => expand(child, path + '/' + (child?.props?.key || i))) }
  }
  return { render: () => expand(React.createElement(PaperContent, { chapter, labels: { code: { copyLabel: '复制' } } })),
    setChapter(id, nextBlocks) { chapter = { id, blocks: nextBlocks } } }
}
function all(node, predicate) {
  if (!node || typeof node !== 'object') return []
  return [...(predicate(node) ? [node] : []), ...node.children.flatMap(child => all(child, predicate))]
}
const find = (node, predicate) => all(node, predicate)[0]
const contentText = node => typeof node === 'string' ? node : node && typeof node === 'object' ? node.children.map(contentText).join(' ') : ''

test('all example inputs, intermediate data and outputs are visible with their matching explanation', () => {
  const tree = fixture([{ type: 'example', title: '一次方法调用', mode: 'illustrative', references: [ref()], steps: [
    { label: '输入', language: 'json', code: '{"query":"A"}', explanation: 'query 是要处理的问题。' },
    { label: '输出', language: 'json', code: '{"label":1}', explanation: 'label 是该输入对应的结果。' },
  ] }]).render()
  assert(contentText(tree).includes('构造示例'))
  assert(contentText(tree).includes('（第 2 页）'))
  assert(!contentText(tree).includes(ref().quote))
  assert.equal(all(tree, node => node.props.role === 'tab').length, 0)
  const regions = all(tree, node => node.props.className === 'dsh-paper-wiki-example-code')
  assert.equal(regions.length, 2)
  assert(regions.every(node => node.props.role === 'region' && node.props.tabIndex === 0))
  assert.deepEqual(regions.map(node => node.props['aria-label']), ['输入：代码', '输出：代码'])
  const markdown = all(tree, node => node.type === 'markdown')
  assert.equal(markdown.length, 2)
  assert(markdown[0].props.text.includes('"query": "A"'))
  assert(markdown[1].props.text.includes('"label": 1'))
  assert(contentText(tree).includes('query 是要处理的问题。'))
  assert(contentText(tree).includes('label 是该输入对应的结果。'))
})

test('paragraphs and tables remain text, while hostile code cannot end its fenced block', () => {
  const attack = '<img src=x onerror="alert(1)">'
  const code = '<script>alert(1)</script>\n```\n' + attack
  const tree = fixture([
    { type: 'paragraph', text: attack, references: [ref()] },
    { type: 'example', title: attack, mode: 'paper', references: [ref()], steps: [
      { label: '输入', language: 'text', code, explanation: attack },
      { label: '输出', language: 'text', code: 'safe', explanation: 'safe' },
    ] },
    { type: 'table', title: '对比', columns: ['方法', '结果'], rows: [[attack, '0.2']], references: [ref()] },
  ]).render()
  assert.equal(all(tree, node => node.type === 'script' || node.type === 'img').length, 0)
  assert.equal(all(tree, node => node.props.dangerouslySetInnerHTML).length, 0)
  assert(contentText(tree).includes('论文实例'))
  const markdown = find(tree, node => node.type === 'markdown')
  assert.equal(markdown.props.omitHtml, true)
  assert.equal(markdown.props.text, '````text\n' + code + '\n````')
  assert.equal(find(tree, node => node.type === 'p').children[0], attack)
  assert.equal(find(tree, node => node.type === 'td').children[0], attack)
})

test('all method operations and their input and output are visible in order', () => {
  const tree = fixture([{ type: 'flow', title: '判定过程', references: [ref(3)], steps: [
    { title: '抽取', input: '查询与片段', operation: '逐片段分类', output: '片段标签' },
    { title: '比较', input: '原输入与修改后输入', operation: '计算结果差异', output: '差异数值' },
  ] }]).render()
  assert.equal(all(tree, node => node.props.role === 'tab').length, 0)
  assert.deepEqual(all(tree, node => node.type === 'dd').map(node => node.children[0]),
    ['查询与片段', '逐片段分类', '片段标签', '原输入与修改后输入', '计算结果差异', '差异数值'])
  assert.deepEqual(all(tree, node => node.type === 'dt').map(node => node.children[0]), ['输入', '处理', '输出', '输入', '处理', '输出'])
  assert(contentText(tree).includes('（第 3 页）'))
})

test('data tables expose their caption, column headers and keyboard scrolling region', () => {
  const tree = fixture([{ type: 'table', title: '相同设置下的比较', columns: ['方法', '指标'],
    rows: [['基线', '0.2'], ['本文', '0.3']], references: [ref(4)] }]).render()
  const caption = find(tree, node => node.type === 'caption')
  const region = find(tree, node => node.props.role === 'region')
  assert.equal(caption.children[0], '相同设置下的比较')
  assert.equal(region.props['aria-labelledby'], caption.props.id)
  assert.equal(region.props.tabIndex, 0)
  assert.deepEqual(all(tree, node => node.type === 'th').map(node => node.props.scope), ['col', 'col'])
  assert.equal(all(tree, node => node.type === 'td').length, 4)
})

function chart(data) {
  return fixture([{ type: 'chart', title: '方法差异', context: '同一数据集和设置', metric: '差值', unit: '百分点',
    direction: 'higher', data: data.map((value, i) => ({ label: '方法 ' + i, value, display: String(value), reference: ref(i + 1) })), references: [ref(4)] }]).render()
}

test('signed chart bars share a zero axis and retain values, context, units and page citations', () => {
  const tree = chart([-4, 0, 2])
  const bars = all(tree, node => node.props.className === 'dsh-paper-wiki-chart-fill')
  const zeros = all(tree, node => node.props.className === 'dsh-paper-wiki-chart-zero')
  assert.equal(parseFloat(bars[0].props.style.left), 0)
  assert(Math.abs(parseFloat(bars[0].props.style.width) - 66.6666667) < .00001)
  assert.equal(parseFloat(bars[1].props.style.width), 0)
  assert(Math.abs(parseFloat(bars[2].props.style.left) - 66.6666667) < .00001)
  assert(Math.abs(parseFloat(bars[2].props.style.width) - 33.3333333) < .00001)
  assert(zeros.every(node => Math.abs(parseFloat(node.props.style.left) - 66.6666667) < .00001))
  assert(contentText(tree).includes('同一数据集和设置'))
  assert(contentText(tree).includes('差值（百分点）'))
  assert(contentText(tree).includes('越高越好'))
  assert(contentText(tree).includes('（第 1 页）'))
  assert(!contentText(tree).includes(ref().quote))
  assert.equal(find(tree, node => node.type === 'ol').props['aria-label'], '差值比较')
  assert(all(tree, node => node.props.className === 'dsh-paper-wiki-chart-track').every(node => node.props['aria-hidden'] === true))
})

test('all-zero and very large finite chart values produce finite positions without false bars', () => {
  const zeroTree = chart([0, 0])
  const fills = all(zeroTree, node => node.props.className === 'dsh-paper-wiki-chart-fill')
  assert(fills.every(node => node.props.style.left === '0%' && node.props.style.width === '0%'))
  assert.equal(contentText(find(zeroTree, node => node.props.className === 'dsh-paper-wiki-chart-axis')).trim(), '0')
  const tree = chart([-Number.MAX_VALUE, Number.MAX_VALUE])
  const large = all(tree, node => node.props.className === 'dsh-paper-wiki-chart-fill')
  assert.deepEqual(large.map(node => node.props.style.width), ['50%', '50%'])
  assert.deepEqual(large.map(node => node.props.style.left), ['0%', '50%'])
})

test('changing chapters replaces all displayed example content without retaining the previous one', () => {
  const example = label => ({ type: 'example', title: '输入输出', mode: 'illustrative', references: [ref()], steps: [
    { label: '输入', language: 'text', code: label + ' input', explanation: label + ' input explanation' },
    { label: '输出', language: 'text', code: label + ' output', explanation: label + ' output explanation' },
  ] })
  const app = fixture([example('A')])
  assert(all(app.render(), node => node.type === 'markdown')[1].props.text.includes('A output'))
  app.setChapter('results', [example('B')])
  const tree = app.render()
  assert(find(tree, node => node.type === 'markdown').props.text.includes('B input'))
  assert(contentText(tree).includes('B input explanation'))
  assert(!contentText(tree).includes('A output explanation'))
})

test('term cards expose a definition, concrete example, role and optional distinction together', () => {
  const attack = '<script>alert(1)</script>'
  const tree = fixture([{ type: 'terms', title: '先理解两个对象', references: [ref(4)], items: [
    { term: '命题', meaning: '一条主语、关系与宾语组成的记录。', role: '用实体寻找相邻的记录。', example: 'Chynna → is daughter of → Michelle' },
    { term: '来源段落', meaning: '抽取这条命题的具体段落。', role: '把原始段落提供给阅读模型。', example: attack, contrast: '命题记录与原段落是两个对象。' },
  ] }]).render()
  assert.deepEqual(all(tree, node => node.type === 'dt').map(node => node.children[0]), ['命题', '来源段落'])
  const text = contentText(tree)
  for (const expected of ['一条主语、关系与宾语', 'Chynna → is daughter of → Michelle', '用实体寻找', '命题记录与原段落']) assert(text.includes(expected))
  assert(text.includes(attack))
  assert.equal(all(tree, node => node.type === 'script' || node.props.dangerouslySetInnerHTML).length, 0)
  assert(!text.includes(ref().quote))
})

function diagram() {
  return { type: 'diagram', title: '已有关系与补充关系', mode: 'paper', description: '关系保留原方向。', references: [ref(7), ref(8)],
    columns: [{ id: 'album', label: '作品' }, { id: 'person', label: '共同实体' }, { id: 'child', label: '补充实体' }],
    nodes: [
      { id: 'a', label: 'Victim of Romance', detail: '已有专辑段落。', column: 'album' },
      { id: 'd', label: '另一条已有记录', detail: '同列节点。', column: 'album' },
      { id: 'm', label: 'Michelle Phillips', detail: '两个关系共有的实体。', column: 'person' },
      { id: 'c', label: 'Chynna Phillips', detail: 'Wilson Phillips 段落提供子女关系。', column: 'child' },
    ],
    edges: [
      { id: 'performer', from: 'a', to: 'm', label: '表演者' },
      { id: 'daughter', from: 'c', to: 'm', label: 'is daughter of' },
      { id: 'same-column', from: 'd', to: 'a', label: '同列关系' },
      { id: 'reverse', from: 'm', to: 'a', label: '另一条有向关系' },
    ],
    steps: [
      { label: '已有证据', explanation: '已有证据只确定表演者。', activeNodes: ['a', 'm'], activeEdges: ['performer'] },
      { label: '补充关系', explanation: '新增子女指向母亲的关系。', activeNodes: ['c', 'm'], activeEdges: ['daughter'] },
    ] }
}

test('diagrams preserve reverse and same-column arrows and synchronize highlights and node details', () => {
  const app = fixture([diagram()])
  let tree = app.render()
  assert.equal(find(tree, node => node.props.className === 'dsh-paper-wiki-diagram-scroll').props.tabIndex, 0)
  const path = find(find(tree, node => node.type === 'g' && node.props.key === 'daughter'), node => node.type === 'path')
  assert.match(path.props.d, /^M584,99 C/)
  assert.match(path.props.d, /494,99$/)
  assert(path.props.markerEnd.startsWith('url(#'))
  const sameColumn = find(find(tree, node => node.type === 'g' && node.props.key === 'same-column'), node => node.type === 'path')
  assert.match(sameColumn.props.d, /^M214,221 C/)
  assert(!sameColumn.props.d.includes('NaN'))
  const relations = find(tree, node => node.props.className === 'dsh-paper-wiki-diagram-relations')
  assert.match(contentText(relations), /Chynna Phillips\s+→\s+Michelle Phillips\s+：\s+is daughter of/)
  assert(contentText(tree).includes('已有证据只确定表演者。'))
  const stages = find(tree, node => node.props.className === 'dsh-paper-wiki-diagram-stages')
  assert(stages.children.every(node => node.type === 'button' && node.props.type === 'button'))
  stages.children[1].props.onClick()
  tree = app.render()
  assert.equal(find(tree, node => node.type === 'g' && node.props.key === 'daughter').props['data-active'], true)
  assert.equal(find(tree, node => node.type === 'g' && node.props.key === 'performer').props['data-active'], undefined)
  assert(contentText(tree).includes('新增子女指向母亲的关系。'))
  const child = find(tree, node => node.props.className === 'dsh-paper-wiki-diagram-node' && node.children[0] === 'Chynna Phillips')
  child.props.onClick()
  tree = app.render()
  assert(contentText(find(tree, node => node.props.className === 'dsh-paper-wiki-diagram-detail')).includes('Wilson Phillips 段落提供子女关系。'))
})

test('model diagram labels remain text and cannot introduce SVG markup or source coordinates', () => {
  const block = diagram()
  block.nodes[0].label = '<image href="javascript:alert(1)">'
  block.nodes[0].x = 99999
  block.edges[0].label = '<script>alert(1)</script>'
  const tree = fixture([block]).render()
  assert.equal(all(tree, node => ['image', 'script', 'foreignObject'].includes(node.type)).length, 0)
  assert.equal(all(tree, node => node.props.dangerouslySetInnerHTML).length, 0)
  assert.equal(find(tree, node => node.props.className === 'dsh-paper-wiki-diagram-node').props.style.left, 24)
  assert(contentText(tree).includes('<script>alert(1)</script>'))
})

test('evidence states are all visible with exact budgets, computed coverage and explicit additions and removals', () => {
  const app = fixture([{ type: 'evidence', title: '修复前后', mode: 'illustrative', question: '表演者的子女是谁？', budget: 2,
    required: ['专辑表演者', '表演者的子女'], references: [ref(7)],
    items: [
      { id: 'album', label: '专辑段落', detail: '说明表演者是 Michelle。', supports: ['专辑表演者'] },
      { id: 'other', label: '其他段落', detail: '没有提供本例所需关系。', supports: [] },
      { id: 'child', label: 'Wilson Phillips 段落', detail: '说明 Chynna 是 Michelle 的女儿。', supports: ['表演者的子女'] },
    ],
    states: [{ label: '修复前', ids: ['album', 'other'], explanation: '仍缺少子女身份。' },
      { label: '修复后', ids: ['album', 'child'], explanation: '两条关系已齐全。' }] }])
  let tree = app.render()
  const states = all(tree, node => node.props.className === 'dsh-paper-wiki-evidence-state')
  assert.equal(states.length, 2)
  assert(states.every(state => find(state, node => node.props.className === 'dsh-paper-wiki-evidence-slots').children.length === 2))
  assert.deepEqual(all(tree, node => node.props.className === 'dsh-paper-wiki-evidence-coverage').map(contentText),
    ['已提供关系：1 / 2', '已提供关系：2 / 2'])
  assert(contentText(states[1]).includes('移除：其他段落'))
  assert(contentText(states[1]).includes('新增'))
  assert(contentText(tree).includes('构造示例'))
  assert(contentText(tree).includes('仍缺少子女身份。'))
  assert(contentText(tree).includes('两条关系已齐全。'))
  const detailButton = find(states[1], node => node.type === 'button' && contentText(node).includes('Wilson Phillips'))
  detailButton.props.onClick()
  tree = app.render()
  assert(contentText(find(tree, node => node.props.className === 'dsh-paper-wiki-evidence-detail')).includes('Chynna 是 Michelle 的女儿'))
})

function calculation(mode = 'illustrative') {
  return { type: 'calculation', title: '关系覆盖比例', mode, formula: '已提供关系 / 所需关系', precision: 3, resultLabel: '比例',
    interpretation: '初始值中两条所需关系只提供了一条。', references: [ref()],
    inputs: [
      { id: 'known', label: '已提供关系', meaning: '当前提供了多少条关系。', value: 1, ...(mode === 'illustrative' && { min: 0, max: 4, step: 1 }) },
      { id: 'required', label: '所需关系', meaning: '为了演算而给定的分母。', value: 2, ...(mode === 'illustrative' && { min: 0, max: 4, step: 1 }) },
    ], expression: { op: 'divide', args: [{ input: 'known' }, { input: 'required' }] } }
}

test('illustrative calculations update one trusted result, reject zero denominators and restore initial inputs', () => {
  const app = fixture([calculation()])
  let tree = app.render()
  assert(contentText(tree).includes('构造计算（非实测）'))
  assert(contentText(tree).includes('当前提供了多少条关系。'))
  assert.equal(find(tree, node => node.props.className === 'dsh-paper-wiki-calculation-result').children[1].children[0], '0.500')
  all(tree, node => node.type === 'input' && node.props.type === 'range')[0].props.onChange({ target: { value: '2' } })
  tree = app.render()
  assert.equal(all(tree, node => node.type === 'input' && node.props.type === 'number')[0].props.value, '2')
  assert.equal(find(tree, node => node.props.className === 'dsh-paper-wiki-calculation-result').children[1].children[0], '1.000')
  all(tree, node => node.type === 'input' && node.props.type === 'number')[1].props.onChange({ target: { value: '0' } })
  tree = app.render()
  const result = find(tree, node => node.props.className === 'dsh-paper-wiki-calculation-result')
  assert.equal(find(result, node => node.type === 'output'), undefined)
  assert(contentText(result).includes('无法完成计算'))
  assert(!contentText(tree).includes('Infinity'))
  find(tree, node => node.props.className === 'dsh-paper-wiki-calculation-reset').props.onClick()
  tree = app.render()
  assert.equal(find(tree, node => node.props.className === 'dsh-paper-wiki-calculation-result').children[1].children[0], '0.500')
})

test('paper calculations expose fixed values and meanings without editable controls', () => {
  const tree = fixture([calculation('paper')]).render()
  assert.equal(all(tree, node => node.type === 'input').length, 0)
  assert(contentText(tree).includes('基于论文数值'))
  assert(contentText(tree).includes('为了演算而给定的分母。'))
  assert.equal(find(tree, node => node.props.className === 'dsh-paper-wiki-calculation-result').children[1].children[0], '0.500')
})

test('JSON presentation preserves large integers and duplicate keys and only changes safe outside whitespace', () => {
  const sensitive = ['{"id":9007199254740993}', '{"label":"first","label":"second"}']
  const data = { text: 'a  b "c" \\ folder', n: 1 }
  const safelyFormatted = '{ "text" : ' + JSON.stringify(data.text) + ', "n": 1 }'
  const tree = fixture([{ type: 'example', title: 'JSON 保真', mode: 'illustrative', references: [ref()],
    steps: [...sensitive, safelyFormatted].map((code, index) => ({ label: String(index + 1), code, language: 'json', explanation: '完整保留示例数据。' })) }]).render()
  const code = all(tree, node => node.type === 'markdown').map(node => node.props.text)
  assert.equal(code[0], '```json\n' + sensitive[0] + '\n```')
  assert.equal(code[1], '```json\n' + sensitive[1] + '\n```')
  assert.equal(code[2], '```json\n' + JSON.stringify(data, null, 2) + '\n```')
  assert(code[2].includes('a  b'))
})

test('off-grid initial calculation values stay exact while normal slider steps remain discrete', () => {
  const block = calculation()
  Object.assign(block.inputs[0], { value: 2.5, min: 0, max: 10, step: 1 })
  const app = fixture([block])
  let tree = app.render()
  let ranges = all(tree, node => node.type === 'input' && node.props.type === 'range')
  let numbers = all(tree, node => node.type === 'input' && node.props.type === 'number')
  assert.equal(ranges[0].props.value, 2.5)
  assert.equal(ranges[0].props.step, 'any')
  assert.equal(numbers[0].props.value, 2.5)
  assert.equal(numbers[0].props.step, 'any')
  assert.equal(ranges[1].props.step, 1)
  assert.equal(numbers[1].props.step, 1)
  assert.equal(find(tree, node => node.props.className === 'dsh-paper-wiki-calculation-result').children[1].children[0], '1.250')
  numbers[0].props.onChange({ target: { value: '3' } })
  tree = app.render()
  ranges = all(tree, node => node.type === 'input' && node.props.type === 'range')
  numbers = all(tree, node => node.type === 'input' && node.props.type === 'number')
  assert.equal(ranges[0].props.step, 1)
  assert.equal(numbers[0].props.step, 1)
  assert.equal(find(tree, node => node.props.className === 'dsh-paper-wiki-calculation-result').children[1].children[0], '1.500')
  assert.equal(block.inputs[0].value, 2.5)
  assert.equal(block.inputs[0].step, 1)
})

test('long edge labels use two compact lines outside nodes while full labels remain accessible', () => {
  const block = diagram()
  const labels = ['标题转小写并保留 ID 对应', 'FindTheRelatedPassageAndKeepItsOriginalIdentifier',
    '同一列中的反向关系也不应覆盖节点', '<script>UntrustedLabelWithVeryLongText</script>']
  block.edges.forEach((edge, index) => { edge.label = labels[index] })
  const tree = fixture([block]).render()
  const groups = all(tree, node => String(node.props.className).includes('dsh-paper-wiki-diagram-label-group'))
  const nodes = all(tree, node => node.props.className === 'dsh-paper-wiki-diagram-node')
  const rectangles = []
  groups.forEach((group, index) => {
    const lines = all(group, node => node.type === 'tspan')
    assert(lines.length > 0 && lines.length <= 2)
    assert(lines.at(-1).children[0].endsWith('…'))
    for (const line of lines) {
      const units = Array.from(line.children[0]).reduce((sum, character) => sum + (/^[\x20-\x7e]$/.test(character) ? 1 : 2), 0)
      assert(units <= 10, 'a line fits at most five CJK or ten mono ASCII characters')
    }
    assert.equal(find(group, node => node.type === 'title').children[0], labels[index])
    const rect = find(group, node => node.type === 'rect').props
    assert(rect.width <= 76)
    for (const node of nodes) {
      const n = node.props.style
      const overlaps = rect.x < n.left + n.width && rect.x + rect.width > n.left
        && rect.y < n.top + n.height && rect.y + rect.height > n.top
      assert.equal(overlaps, false, 'same-column and reversed-edge labels stay in the gap')
    }
    for (const earlier of rectangles) {
      const overlaps = rect.x < earlier.x + earlier.width && rect.x + rect.width > earlier.x
        && rect.y < earlier.y + earlier.height && rect.y + rect.height > earlier.y
      assert.equal(overlaps, false, 'nearby label boxes occupy separate positions')
    }
    rectangles.push(rect)
  })
  const relations = contentText(find(tree, node => node.props.className === 'dsh-paper-wiki-diagram-relations'))
  labels.forEach(label => assert(relations.includes(label)))
  assert.equal(all(tree, node => node.type === 'script' || node.props.dangerouslySetInnerHTML).length, 0)
  const svg = find(tree, node => node.type === 'svg')
  const firstLabel = svg.children.findIndex(node => String(node?.props?.className).includes('dsh-paper-wiki-diagram-label-group'))
  assert(svg.children.slice(firstLabel).every(node => String(node?.props?.className).includes('dsh-paper-wiki-diagram-label-group')),
    'all backgrounds and labels are painted after every connecting line')
})
