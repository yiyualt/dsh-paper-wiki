export function createPaperGenerationProgress(React, primitives) {
  const { createElement: h, useEffect, useId, useState } = React
  const { Button, IconCheckOutlineRegular } = primitives
  const terminal = new Set(['completed', 'failed', 'cancelled'])
  const stages = [
    { phase: 'reading', label: '读取论文', status: '正在读取论文', detail: '读取论文文本。' },
    { phase: 'writing', label: '撰写讲解', status: '正在撰写讲解', detail: '组织章节与论文引用。' },
    { phase: 'reviewing', label: '核对内容', status: '正在核对内容', detail: '核对内容与引用。' },
    { phase: 'saving', label: '保存讲解', status: '正在保存讲解', detail: '保存讲解。' },
  ]

  function durationLabel(milliseconds) {
    const seconds = Math.floor(Math.max(0, Number(milliseconds) || 0) / 1000)
    const minutes = Math.floor(seconds / 60)
    return (minutes ? `${minutes} 分 ` : '') + `${seconds % 60} 秒`
  }

  function GenerationClock({ elapsedMs, receivedAt }) {
    const [now, setNow] = useState(() => Date.now())
    useEffect(() => {
      const timer = setInterval(() => setNow(Date.now()), 250)
      return () => clearInterval(timer)
    }, [])
    const elapsed = Math.max(0, Number(elapsedMs) || 0)
    const seconds = Math.floor((elapsed + (Number.isFinite(receivedAt) ? Math.max(0, now - receivedAt) : 0)) / 1000)
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0')
    return h('div', { className: 'dsh-paper-wiki-clock' },
      h('span', null, '已耗时'),
      h('time', { role: 'timer', 'aria-label': '生成耗时', dateTime: `PT${seconds}S` },
        minutes + ':' + String(seconds % 60).padStart(2, '0')))
  }

  return function GenerationProgress({ generation, offline, store }) {
    const titleId = useId()
    const index = stages.findIndex(stage => stage.phase === generation.phase)
    const stage = stages[index]
    const title = generation.title || generation.fileName || '论文'
    if (terminal.has(generation.phase)) {
      const completed = generation.phase === 'completed'
      const failed = generation.phase === 'failed'
      const state = store.getSnapshot?.()
      const busy = Boolean(state?.generating || state?.importing || state?.preparing
        || state?.generation && !terminal.has(state.generation.phase))
      return h('div', { className: 'dsh-paper-wiki-generation-done', 'data-state': generation.phase },
        h('p', { role: failed ? 'alert' : 'status' },
          completed && h(IconCheckOutlineRegular, { size: 16, 'aria-hidden': true }),
          completed ? 'Wiki 已保存' : failed ? generation.error || '本次讲解未完成。' : '已取消讲解',
          h('span', null, title + ' · 用时 ' + durationLabel(generation.elapsedMs))),
        generation.paperId && h(Button, { size: 'sm', variant: 'outline', disabled: !completed && busy,
          onClick: () => completed ? void store.openPaper(generation.paperId) : void store.generate(generation.paperId) },
          completed ? '打开讲解' : '重新尝试'))
    }

    return h('section', { className: 'dsh-paper-wiki-generation', 'aria-labelledby': titleId },
      h('div', { className: 'dsh-paper-wiki-generation-header' },
        h('div', null,
          h('p', { className: 'dsh-paper-wiki-generation-repo' }, title),
          h('h2', { id: titleId, role: 'status' }, stage?.status ?? '正在提交任务')),
        h(GenerationClock, { elapsedMs: generation.elapsedMs, receivedAt: generation.receivedAt })),
      h('div', { className: 'dsh-paper-wiki-progressbar', role: 'progressbar', 'aria-labelledby': titleId }),
      h('ol', { className: 'dsh-paper-wiki-generation-stages', 'aria-label': '生成阶段' },
        stages.map(({ phase, label }, i) => h('li', {
          key: phase,
          'data-state': i < index ? 'done' : i === index ? 'active' : 'waiting',
          'aria-current': i === index ? 'step' : undefined,
        },
        h('span', { className: 'dsh-paper-wiki-stage-marker', 'aria-hidden': true },
          i < index && h(IconCheckOutlineRegular, { size: 13 })),
        label))),
      offline && h('p', { className: 'dsh-paper-wiki-generation-detail' }, '正在重新连接，稍后会同步进度。'),
      h('div', { className: 'dsh-paper-wiki-generation-actions' },
        h(Button, { size: 'sm', variant: 'outline', onClick: () => void store.cancelGeneration() }, '取消讲解')))
  }
}
