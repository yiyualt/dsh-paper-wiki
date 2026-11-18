import { readFile } from 'node:fs/promises'

let loaded
export function loadPaperExplainerSkill() {
  loaded ??= Promise.all(['SKILL.md', 'references/teaching-patterns.md', 'references/app-contract.md'].map(async path => {
    const text = await readFile(new URL('../skills/paper-explainer/' + path, import.meta.url), 'utf8')
    return `--- paper-explainer/${path} ---\n` + text.replace(/^---\n[\s\S]*?\n---\n/, '')
  })).then(resources => '你在论文百科内执行 paper-explainer skill。以下指令与参考资料已加载，无需访问文件。直接解释实际对象，不使用比喻或类比。\n\n' + resources.join('\n\n'))
  return loaded
}

export function validateTeachingPlan(value, catalog) {
  const fail = message => { throw Object.assign(new Error(message), { code: 'explanation-invalid', status: 502 }) }
  const string = (value, max) => typeof value === 'string' && value.trim() && value.length <= max
  if (!string(value?.task, 1800) || !Array.isArray(value.concepts) || value.concepts.length < 5 || value.concepts.length > 10
    || !['paper', 'illustrative'].includes(value.example?.mode) || !string(value.example.question, 1000)
    || !string(value.example.input, 6000) || !string(value.example.baseline, 4000) || !string(value.example.method, 6000)
    || !string(value.example.output, 4000) || !Array.isArray(value.visuals) || value.visuals.length < 2 || value.visuals.length > 5) fail('教学设计需要明确任务、核心术语、完整同例和至少两种图示。')
  const refs = references => {
    if (!Array.isArray(references) || !references.length || references.length > 6) fail('教学设计缺少原文依据。')
    return references.map(ref => {
      if (typeof ref?.sourceId !== 'string') fail('教学设计必须选择已提供的来源编号。')
      catalog.resolveReference(ref)
      return { sourceId: ref.sourceId }
    })
  }
  const concepts = value.concepts.map(item => {
    if (!string(item?.term, 100) || !string(item.meaning, 700) || !string(item.example, 900) || !string(item.role, 700)) fail('核心术语需要定义、作用和具体微例。')
    return { term: item.term.trim(), meaning: item.meaning.trim(), example: item.example.trim(), role: item.role.trim(), references: refs(item.references) }
  })
  if (new Set(concepts.map(item => item.term)).size !== concepts.length) fail('教学设计的核心术语不能重复。')
  const chapterIds = ['overview', 'task', 'baselines', 'method', 'setup', 'results', 'analysis']
  const visuals = value.visuals.map(item => {
    if (!['diagram', 'evidence', 'calculation', 'chart'].includes(item?.type) || !chapterIds.includes(item.chapterId)
      || !string(item.question, 500)) fail('图示需要说明类型、所在章节和要回答的具体问题。')
    return { type: item.type, chapterId: item.chapterId, question: item.question.trim() }
  })
  if (new Set(visuals.map(item => item.type)).size < 2) fail('教学设计至少需要两种互补的可视化。')
  return { task: value.task.trim(), concepts, example: { mode: value.example.mode, question: value.example.question.trim(),
    input: value.example.input.trim(), baseline: value.example.baseline.trim(), method: value.example.method.trim(), output: value.example.output.trim(),
    references: refs(value.example.references) }, visuals }
}
