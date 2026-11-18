import { validateContentBlocks } from './paper-content.js'

const chapters = new Set(['overview', 'task', 'baselines', 'method', 'setup', 'results', 'analysis'])
const languages = new Set(['json', 'python', 'text'])
const record = value => value && typeof value === 'object' && !Array.isArray(value)
const invalid = message => { throw Object.assign(new Error(message), { code: 'explanation-invalid', status: 502 }) }
function text(value, maximum, label) {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) invalid(label + '格式无效或过长。')
  return value.trim()
}

/** Canonicalize a shared case; a catalog resolves model source IDs, storage validates exact page quotes. */
export function validateCaseStudy(paper, value, catalog) {
  if (!record(value) || !['paper', 'illustrative'].includes(value.mode)
    || !Array.isArray(value.references) || value.references.length < 1 || value.references.length > 6
    || !Array.isArray(value.steps) || value.steps.length < 2 || value.steps.length > 6) invalid('常驻案例需要类型、原文依据和 2 至 6 个阶段。')
  const references = catalog ? value.references.map((ref, index) => catalog.resolveReference(ref, '常驻案例引用 ' + (index + 1))) : value.references
  const canonical = validateContentBlocks(paper, [{ type: 'paragraph', text: '案例所解释的方法依据', references }], 'case-study')[0].references
  const steps = value.steps.map(step => {
    if (!record(step) || !chapters.has(step.chapterId) || !languages.has(step.language)) invalid('案例阶段需要已知章节和代码语言。')
    text(step.code, 6000, '案例代码')
    const code = step.code.replace(/\r\n?/g, '\n'), lines = code.split('\n')
    if (lines.length > 80) invalid('案例每阶段代码最多 80 行。')
    if (step.language === 'json') { try { JSON.parse(code) } catch { invalid('案例 JSON 代码无法解析。') } }
    if (!Array.isArray(step.annotations) || step.annotations.length < 1 || step.annotations.length > Math.min(20, lines.length)) invalid('案例每阶段需要对应真实代码行的简短解释。')
    const seen = new Set()
    const annotations = step.annotations.map(annotation => {
      if (!record(annotation) || !Number.isInteger(annotation.line) || annotation.line < 1 || annotation.line > lines.length || seen.has(annotation.line)
        || !lines[annotation.line - 1].trim()) invalid('案例行解释的行号不存在、重复或指向空行。')
      seen.add(annotation.line)
      return { line: annotation.line, explanation: text(annotation.explanation, 220, '代码行解释') }
    })
    const file = text(step.file, 80, '案例文件名')
    if (!/^[\p{L}\p{N}_. -]+$/u.test(file) || file === '.' || file === '..') invalid('案例文件名只能是展示用文件名。')
    return { label: text(step.label, 50, '案例阶段名称'), file, chapterId: step.chapterId, language: step.language,
      code, explanation: text(step.explanation, 220, '案例阶段解释'), annotations }
  })
  if (new Set(steps.map(step => step.file)).size !== steps.length) invalid('案例阶段的展示文件名不能重复。')
  return { title: text(value.title, 100, '案例标题'), mode: value.mode, references: canonical, steps }
}
