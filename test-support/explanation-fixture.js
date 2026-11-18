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
