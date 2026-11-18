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

test('example tabs change code and its explanation together and support arrow and Home keys', () => {
  const app = fixture([{ type: 'example', title: '一次方法调用', mode: 'illustrative', references: [ref()], steps: [
    { label: '输入', language: 'json', code: '{"query":"A"}', explanation: 'query 是要处理的问题。' },
    { label: '输出', language: 'json', code: '{"label":1}', explanation: 'label 是该输入对应的结果。' },
  ] }])
  let tree = app.render()
  assert(contentText(tree).includes('构造示例'))
  assert(contentText(tree).includes('（第 2 页）'))
  assert(!contentText(tree).includes(ref().quote))
  let tabs = all(tree, node => node.props.role === 'tab')
  assert.deepEqual(tabs.map(tab => tab.props['aria-selected']), [true, false])
  assert.deepEqual(tabs.map(tab => tab.props.tabIndex), [0, -1])
  assert(find(tree, node => node.type === 'markdown').props.text.includes('{"query":"A"}'))
  const codeRegion = find(tree, node => node.props.className === 'dsh-paper-wiki-example-code')
  assert.equal(codeRegion.props.role, 'region')
  assert.equal(codeRegion.props.tabIndex, 0)
  assert.equal(codeRegion.props['aria-label'], '输入：代码')
  assert(contentText(tree).includes('query 是要处理的问题。'))
  tabs[1].props.onClick()
  tree = app.render()
  assert(find(tree, node => node.type === 'markdown').props.text.includes('{"label":1}'))
  assert(contentText(tree).includes('label 是该输入对应的结果。'))
  assert(!contentText(tree).includes('query 是要处理的问题。'))
  let focused = -1, prevented = false
  tabs = all(tree, node => node.props.role === 'tab')
  const keyboard = key => ({ key, preventDefault() { prevented = true }, currentTarget: { parentElement: {
    querySelectorAll: () => tabs.map((_, i) => ({ focus() { focused = i } })),
  } } })
  tabs[1].props.onKeyDown(keyboard('ArrowRight'))
  assert(prevented)
  assert.equal(focused, 0)
  tree = app.render()
  assert(find(tree, node => node.type === 'markdown').props.text.includes('{"query":"A"}'))
  tabs = all(tree, node => node.props.role === 'tab')
  tabs[0].props.onKeyDown(keyboard('End'))
  tree = app.render()
  assert(find(tree, node => node.type === 'markdown').props.text.includes('{"label":1}'))
  tabs = all(tree, node => node.props.role === 'tab')
  tabs[1].props.onKeyDown(keyboard('Home'))
  tree = app.render()
  const selected = all(tree, node => node.props.role === 'tab').find(tab => tab.props['aria-selected'])
  assert.equal(find(tree, node => node.props.role === 'tabpanel').props['aria-labelledby'], selected.props.id)
  assert.equal(selected.props['aria-controls'], find(tree, node => node.props.role === 'tabpanel').props.id)
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

test('method stages keep their real input, operation and output synchronized', () => {
  const treeFixture = fixture([{ type: 'flow', title: '判定过程', references: [ref(3)], steps: [
    { title: '抽取', input: '查询与片段', operation: '逐片段分类', output: '片段标签' },
    { title: '比较', input: '原输入与修改后输入', operation: '计算结果差异', output: '差异数值' },
  ] }])
  let tree = treeFixture.render()
  let tabs = all(tree, node => node.props.role === 'tab')
  assert.equal(tabs[1].props['aria-label'], '第 2 步：比较')
  assert.deepEqual(all(tree, node => node.type === 'dd').map(node => node.children[0]), ['查询与片段', '逐片段分类', '片段标签'])
  tabs[1].props.onClick()
  tree = treeFixture.render()
  assert.deepEqual(all(tree, node => node.type === 'dd').map(node => node.children[0]), ['原输入与修改后输入', '计算结果差异', '差异数值'])
  assert.deepEqual(all(tree, node => node.type === 'dt').map(node => node.children[0]), ['输入', '处理', '输出'])
  tabs = all(tree, node => node.props.role === 'tab')
  assert.deepEqual(tabs.map(tab => tab.props['aria-selected']), [false, true])
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

test('changing chapters resets step selection without mixing the previous code and explanation', () => {
  const example = label => ({ type: 'example', title: '输入输出', mode: 'illustrative', references: [ref()], steps: [
    { label: '输入', language: 'text', code: label + ' input', explanation: label + ' input explanation' },
    { label: '输出', language: 'text', code: label + ' output', explanation: label + ' output explanation' },
  ] })
  const app = fixture([example('A')])
  let tree = app.render()
  all(tree, node => node.props.role === 'tab')[1].props.onClick()
  tree = app.render()
  assert(find(tree, node => node.type === 'markdown').props.text.includes('A output'))
  app.setChapter('results', [example('B')])
  tree = app.render()
  assert(find(tree, node => node.type === 'markdown').props.text.includes('B input'))
  assert(contentText(tree).includes('B input explanation'))
  assert(!contentText(tree).includes('A output explanation'))
})
