/** Self-authored evidence for generation/storage/API checks; not a published paper. */
export const evidenceTexts = [
  'We study exact product-title retrieval. Input is a product title query and a list of product IDs with titles; output is the matching product ID or null. Query PHONE matches product p1 titled phone. We compare two fixed models on the same inputs.',
  'The case-sensitive exact baseline fails when a query differs only in letter case. Our method lowercases both query and product titles, then returns the first exact match. It returns null if no match exists. This changes case handling only, not semantic matching.',
  'The evaluation set has 20 manually specified queries over 10 product titles. The queries are fixed with no training or parameter search. Both methods use the same queries and product list. Accuracy is the fraction of queries returning the annotated product ID.',
  'On the fixed evaluation set, the exact baseline has 60% accuracy and the lowercase method has 80% accuracy. Lowercasing without title matching cannot produce a product ID. Both methods fail on paraphrases that contain different words.',
  'The improvement is concentrated on queries differing only in case. The small manually specified English-only set does not establish generalization to other languages, semantic matching, or real customer traffic. Latency and statistical significance were not measured.',
]
export const evidencePaper = { title: 'Case normalization study', fileName: 'case-study.pdf', pageCount: evidenceTexts.length,
  pages: evidenceTexts.map((text, index) => ({ number: index + 1, text })) }
export function richDraft() {
  const ref = page => ({ page, quote: evidenceTexts[page - 1] })
  const paragraph = (text, page) => ({ type: 'paragraph', text, references: [ref(page)] })
  const table = (title, columns, rows, page) => ({ type: 'table', title, columns, rows, references: [ref(page)] })
  return { chapters: [
    { id: 'overview', blocks: [paragraph('论文研究商品标题的精确检索：给定查询和商品列表，返回标题匹配的商品 ID。作者只改变大小写处理，在固定输入上比较精确匹配与小写归一化方法。', 1)] },
    { id: 'task', blocks: [paragraph('输入包含一个查询字符串和有 ID 的商品标题列表。输出是首个匹配商品的 ID，没有匹配则为 null；这里的成功标准是是否返回标注 ID，不是语义相似度。', 1),
      { type: 'example', title: '同一个查询的输入与输出', mode: 'paper', references: [ref(1), ref(2)], steps: [
        { label: '输入', language: 'json', code: JSON.stringify({ query: 'PHONE', products: [{ id: 'p1', title: 'phone' }] }, null, 2), explanation: 'query 是待匹配标题；products 中的 id 标识商品。查询和标题仅大小写不同。' },
        { label: '归一化', language: 'json', code: JSON.stringify({ query: 'phone', products: [{ id: 'p1', title: 'phone' }] }, null, 2), explanation: '将查询和标题都转为小写，商品 ID 保持 p1。' },
        { label: '输出', language: 'json', code: JSON.stringify({ product_id: 'p1' }, null, 2), explanation: '归一化后标题相同，返回 p1；没有匹配时输出 null。' },
      ] }] },
    { id: 'baselines', blocks: [paragraph('大小写敏感的精确匹配把 PHONE 与 phone 视为不同标题。作者通过统一大小写来处理这种差异；这不等于解决同义改写。', 2),
      table('匹配方法与适用边界', ['方法', '做法', '问题'], [['精确基线', '直接比较字符串', '大小写不同会漏掉'], ['作者方法', '双方小写后精确匹配', '仍无法识别不同词的改写']], 2)] },
    { id: 'method', blocks: [paragraph('方法先消除字母大小写差异，再保留精确匹配规则。它的变化可以定位到归一化环节；随后仍需找到相同标题才能得到商品 ID。', 2),
      { type: 'flow', title: '从标题到商品 ID', references: [ref(2)], steps: [
        { title: '统一大小写', input: '查询 PHONE 与商品 p1 的标题 phone', operation: '查询与所有商品标题转为小写，保留商品 ID', output: '查询 phone 与商品 p1 的标题 phone' },
        { title: '查找首个精确匹配', input: '小写后的查询及带 ID 的商品列表', operation: '按列表顺序比较标题；首个相同标题即停止', output: '找到则返回商品 ID p1，否则返回 null' },
      ] }] },
    { id: 'setup', blocks: [paragraph('比较使用同一组固定查询与商品列表，不训练模型或搜索参数。准确率衡量返回标注 ID 的查询比例，越高越好；固定输入控制了两种方法的数据差异。', 3),
      table('固定评测条件', ['项目', '设置'], [['数据', '20 个手工查询，10 个商品标题'], ['训练', '无训练和参数搜索'], ['对照', '两个方法使用相同输入'], ['指标', '返回标注商品 ID 的查询比例']], 3)] },
    { id: 'results', blocks: [paragraph('同一固定评测集上，基线准确率 60%，小写方法 80%，增加 20 个百分点。这说明本评测中的大小写处理有效，不能据此断言在真实流量中也有同样提升。', 4),
      { type: 'chart', title: '固定查询集准确率', context: '同一组 20 个手工查询与 10 个商品标题，无训练。', metric: '准确率', unit: '%', direction: 'higher', references: [ref(3), ref(4)], data: [
        { label: '精确匹配基线', value: 60, display: '60%', reference: ref(4) },
        { label: '小写归一化', value: 80, display: '80%', reference: ref(4) },
      ] }] },
    { id: 'analysis', blocks: [paragraph('提升集中于仅大小写不同的查询。两种方法都不能处理词语不同的改写；小规模、仅英语、人工设置的评测没有证明跨语言或真实流量泛化，也未测延迟和统计显著性。', 5)] },
  ] }
}

export function teachingPlanFixture() {
  const concepts = [
    ['查询', '用户希望匹配的商品标题字符串', '输入中的 PHONE', '决定要找哪个标题', 1],
    ['候选商品', '可以被返回的带标识商品条目', 'p1 的标题是 phone', '提供待比较的标题和可返回ID', 1],
    ['商品ID', '列表中用于指明具体商品的稳定标识', 'p1 与标题 phone 对应', '匹配后返回该标识而不是改写标题', 1],
    ['小写归一化', '把大写字母转换为小写后再比较', 'PHONE 变为 phone', '消除只由大小写造成的不匹配', 2],
    ['准确率', '正确返回标注商品的查询数占全部查询数的比例', '16条正确、总20条，得到80%', '对比同一评测集上的返回是否正确', 3],
  ].map(([term, meaning, example, role, page]) => ({ term, meaning, example, role, references: [{ sourceId: `p${page}-s1` }] }))
  return { task: '把商品标题查询变为首个匹配的商品ID；大小写不同会使直接比较漏掉目标。', concepts,
    example: { mode: 'illustrative', question: 'PHONE能否找到标题phone的商品p1？', input: '查询PHONE，唯一候选p1标题phone。',
      baseline: '直接比较PHONE与phone，不相同，返回null。', method: '双方转小写后比较，phone相同，返回p1。', output: 'product_id=p1。', references: [{ sourceId: 'p2-s1' }] },
    visuals: [{ type: 'diagram', chapterId: 'method', question: '查询怎样经小写变换匹配到商品ID？' },
      { type: 'calculation', chapterId: 'setup', question: '准确率怎样从正确数和总查询数计算？' },
      { type: 'chart', chapterId: 'results', question: '同一固定查询集两种规则准确率有何不同？' }] }
}

export function teachingDraft() {
  const value = richDraft(), plan = teachingPlanFixture()
  const references = page => [{ page, quote: evidenceTexts[page - 1] }]
  value.chapters[1].blocks.splice(1, 0, { type: 'terms', title: '先认清输入、对象和比较规则', references: references(1),
    items: plan.concepts.map(({ term, meaning, example, role }) => ({ term, meaning, example, role })) })
  value.chapters[3].blocks.push({ type: 'diagram', title: '同一查询从文本变为商品ID', mode: 'illustrative', description: '三列依次是输入、转换后的字符串和匹配结果。',
    columns: [{ id: 'input', label: '输入' }, { id: 'normalized', label: '变换' }, { id: 'output', label: '输出' }],
    nodes: [{ id: 'q', label: 'PHONE', detail: '查询字符串', column: 'input' }, { id: 'n', label: 'phone', detail: '转换为小写后的查询', column: 'normalized' },
      { id: 'p', label: 'p1', detail: '标题phone匹配，返回ID p1', column: 'output' }],
    edges: [{ id: 'lower', from: 'q', to: 'n', label: '转为小写' }, { id: 'match', from: 'n', to: 'p', label: '相同标题映射到ID' }],
    steps: [{ label: '转换', explanation: '保留查询内容，只统一大小写。', activeNodes: ['q', 'n'], activeEdges: ['lower'] },
      { label: '匹配', explanation: '与同样小写后的商品标题比较，返回对应ID。', activeNodes: ['n', 'p'], activeEdges: ['match'] }], references: references(2) })
  value.chapters[4].blocks.push({ type: 'calculation', title: '用小计数算准确率', mode: 'illustrative', formula: '准确率 = 正确数 / 查询总数 × 100',
    inputs: [{ id: 'correct', label: '正确数', meaning: '教学给定的正确返回数', value: 16, min: 0, max: 20, step: 1 },
      { id: 'total', label: '总数', meaning: '参与评测的查询数', value: 20 }],
    expression: { op: 'multiply', args: [{ op: 'divide', args: [{ input: 'correct' }, { input: 'total' }] }, { number: 100 }] },
    precision: 1, resultLabel: '准确率（%）', interpretation: '给定16条正确、20条总查询，计算得80%；改动是教学计数，不是在重跑实验。', references: references(3) })
  return value
}


/** A compact visual lesson; the complete case is held once in its own reading column. */
export function compactTeachingDraft() {
  const value = teachingDraft()
  value.title = '大小写不同，为什么会漏掉同一个商品？'
  value.summary = '把查询和商品标题都转为小写，再做精确匹配；它修复大小写差异，不解决同义改写。'
  value.caseStudy = {
    title: '同一查询：PHONE → p1', mode: 'illustrative',
    references: [{ page: 1, quote: evidenceTexts[0] }, { page: 2, quote: evidenceTexts[1] }],
    steps: [
      { label: '输入', file: '01_input.json', chapterId: 'task', language: 'json',
        code: '{\n  "query": "PHONE",\n  "products": [{"id": "p1", "title": "phone"}]\n}',
        explanation: '查询与商品标题只有大小写不同，商品的稳定标识是 p1。',
        annotations: [{ line: 2, explanation: 'PHONE 是用户要查的标题。' }, { line: 3, explanation: '候选商品 p1 的标题是小写 phone。' }] },
      { label: '基线', file: '02_baseline.json', chapterId: 'baselines', language: 'json',
        code: '{\n  "comparison": "PHONE != phone",\n  "product_id": null\n}',
        explanation: '直接逐字符比较不相等，因此返回空结果。',
        annotations: [{ line: 2, explanation: '大小写敏感的规则把这两个标题判为不相同。' }, { line: 3, explanation: 'null 表示没有找到商品，并不是新商品 ID。' }] },
      { label: '作者方法', file: '03_normalized.json', chapterId: 'method', language: 'json',
        code: '{\n  "normalized_query": "phone",\n  "matched_title": "phone",\n  "product_id": "p1"\n}',
        explanation: '双方转小写后匹配，返回原商品 ID p1。',
        annotations: [{ line: 2, explanation: '只统一字母大小写，不替换词语。' }, { line: 4, explanation: '相同标题对应商品 p1，因此输出 p1。' }] },
    ],
  }
  for (const chapter of value.chapters) chapter.blocks = chapter.blocks.filter(block => !['example', 'flow'].includes(block.type))
  return value
}
