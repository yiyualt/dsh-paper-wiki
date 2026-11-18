;(() => {
const paperWikiStyles = ".dsh-paper-wiki-page {\n  --wiki-paper: var(--dsw-alias-bg-base);\n  --wiki-canvas: color-mix(in srgb, var(--dsw-alias-bg-module-platform) 56%, var(--wiki-paper));\n  --wiki-ink: var(--dsw-alias-label-primary);\n  --wiki-muted: var(--dsw-alias-label-secondary);\n  --wiki-line: var(--dsw-alias-border-l2);\n  --wiki-accent: color-mix(in srgb, var(--dsw-alias-link) 77%, #6f52bf);\n  --wiki-accent-ink: color-mix(in srgb, var(--wiki-accent) 78%, var(--wiki-ink));\n  --wiki-accent-fill: color-mix(in srgb, var(--wiki-accent) 11%, transparent);\n  --wiki-accent-line: color-mix(in srgb, var(--wiki-accent) 19%, transparent);\n  --wiki-gutter: clamp(16px, 3.25vw, 48px);\n  flex: 1; min-width: 0; min-height: 0; overflow: auto;\n  background: var(--wiki-canvas); color: var(--wiki-ink); font-family: var(--dsw-font-family);\n}\n.dsh-paper-wiki-page * { box-sizing: border-box; }\n.dsh-paper-wiki-shell { max-width: 1344px; margin-inline: auto; padding: 0 var(--wiki-gutter) 48px; container: dsh-paper-wiki / inline-size; }\n.dsh-paper-wiki-bar { display: flex; align-items: center; justify-content: space-between; min-height: 68px; gap: 12px; border-bottom: 1px solid var(--wiki-line); margin-bottom: 24px; }\n.dsh-paper-wiki-page:not([data-reading]) .dsh-paper-wiki-bar { max-width: 860px; margin-inline: auto; }\n.dsh-paper-wiki-brand { display: inline-flex; align-items: center; gap: 11px; min-width: 0; margin: 0; color: var(--wiki-ink); font-size: 21px; font-weight: 690; line-height: 1.4; }\n.dsh-paper-wiki-brand-icon, .dsh-paper-wiki-history-icon { display: grid; place-items: center; flex: none; width: 37px; height: 37px; border-radius: 9px; background: var(--wiki-accent-fill); color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-breadcrumb { display: flex; align-items: center; gap: 8px; min-width: 0; font-size: 14px; color: var(--wiki-muted); }\n.dsh-paper-wiki-breadcrumb > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--wiki-ink); font-weight: 650; }\n.dsh-paper-wiki-breadcrumb > svg { flex: none; }\n.dsh-paper-wiki-breadcrumb > button { flex: none; padding: 8px; margin-left: -8px; border: 0; border-radius: 7px; color: var(--wiki-accent-ink); background: transparent; font: inherit; font-weight: 630; cursor: pointer; }\n.dsh-paper-wiki-breadcrumb > button:hover { background: var(--wiki-accent-fill); }\n.dsh-paper-wiki-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }\n.dsh-paper-wiki-bar > .dsh-paper-wiki-actions { flex: none; }\n.dsh-paper-wiki-page button { font-family: inherit; }\n.dsh-paper-wiki-actions button, .dsh-paper-wiki-bar > button { min-height: 35px; border-radius: 8px; font-weight: 620; white-space: nowrap; }\n.dsh-paper-wiki-library, .dsh-paper-wiki-reading { display: grid; gap: 18px; min-width: 0; }\n.dsh-paper-wiki-library { max-width: 860px; margin-inline: auto; }\n.dsh-paper-wiki-history h2 { margin: 4px 0 10px; font-size: 15px; font-weight: 660; line-height: 1.5; }\n.dsh-paper-wiki-library-status { margin: 0 0 10px; color: var(--wiki-muted); font-size: 13px; }\n.dsh-paper-wiki-library-status[role='alert'] { color: var(--dsw-alias-state-error-primary); }\n.dsh-paper-wiki-library-empty { display: grid; justify-items: center; gap: 10px; padding: clamp(30px, 6cqi, 56px) 20px; border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); color: var(--wiki-muted); text-align: center; }\n.dsh-paper-wiki-library-empty p { margin: 0; color: var(--wiki-ink); font-size: 14px; font-weight: 600; }\n.dsh-paper-wiki-history-list { margin: 0; padding: 4px; border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); list-style: none; }\n.dsh-paper-wiki-history-row { display: grid; grid-template-columns: minmax(0, 1fr) 46px; align-items: center; gap: 1px; }\n.dsh-paper-wiki-history-row + .dsh-paper-wiki-history-row { border-top: 1px solid var(--wiki-line); }\n.dsh-paper-wiki-history-item { display: grid; grid-template-columns: 37px minmax(0, 1fr) auto; align-items: center; gap: 12px; width: 100%; min-height: 73px; padding: 10px 9px 10px 12px; border: 0; border-radius: 8px; background: transparent; color: var(--wiki-muted); text-align: left; font: inherit; cursor: pointer; }\n.dsh-paper-wiki-history-item:hover, .dsh-paper-wiki-history-item[aria-busy='true'] { background: var(--wiki-accent-fill); }\n.dsh-paper-wiki-history-item[aria-busy='true'] { cursor: wait; }\n.dsh-paper-wiki-history-copy { display: grid; gap: 5px; min-width: 0; }\n.dsh-paper-wiki-history-copy strong { color: var(--wiki-ink); font-size: 14px; font-weight: 650; line-height: 1.4; overflow-wrap: anywhere; }\n.dsh-paper-wiki-history-meta { display: flex; flex-wrap: wrap; gap: 3px 12px; font-size: 12px; line-height: 1.5; }\n.dsh-paper-wiki-ready { color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-delete { display: grid; place-items: center; justify-self: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 7px; background: transparent; color: var(--wiki-muted); cursor: pointer; }\n.dsh-paper-wiki-delete:hover { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 9%, transparent); color: var(--dsw-alias-state-error-primary); }\n.dsh-paper-wiki-page button:disabled { cursor: not-allowed; opacity: .55; }\n.dsh-paper-wiki-form-card { padding: clamp(19px, 4cqi, 34px); border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); }\n.dsh-paper-wiki-form-title { margin: 0 0 20px; font-size: clamp(19px, 3cqi, 24px); font-weight: 680; }\n.dsh-paper-wiki-form { display: grid; gap: 17px; }\n.dsh-paper-wiki-upload { position: relative; display: grid; justify-items: center; gap: 8px; padding: 26px 18px; border: 1px dashed var(--wiki-accent-line); border-radius: 10px; background: color-mix(in srgb, var(--wiki-accent) 3%, var(--wiki-paper)); text-align: center; color: var(--wiki-muted); cursor: pointer; }\n.dsh-paper-wiki-upload:hover, .dsh-paper-wiki-upload:focus-within { border-color: var(--wiki-accent); background: var(--wiki-accent-fill); }\n.dsh-paper-wiki-upload strong { max-width: 100%; font-size: 14px; color: var(--wiki-ink); overflow-wrap: anywhere; }\n.dsh-paper-wiki-upload span { font-size: 12px; }\n.dsh-paper-wiki-upload > svg { color: var(--wiki-accent-ink); margin-bottom: 3px; }\n.dsh-paper-wiki-upload input { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; }\n.dsh-paper-wiki-path-option { color: var(--wiki-muted); font-size: 12px; }\n.dsh-paper-wiki-path-option summary { cursor: pointer; }\n.dsh-paper-wiki-path-option[open] summary { margin-bottom: 12px; }\n.dsh-paper-wiki-field { display: grid; gap: 7px; font-size: 13px; color: var(--wiki-ink); }\n.dsh-paper-wiki-field > input { width: 100%; min-width: 0; min-height: 38px; border: 1px solid var(--wiki-line); border-radius: 8px; background: var(--wiki-canvas); color: var(--wiki-ink); font: inherit; padding: 8px 11px; }\n.dsh-paper-wiki-form-footer { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }\n.dsh-paper-wiki-hint { margin: 0; color: var(--wiki-muted); font-size: 12px; line-height: 1.65; }\n.dsh-paper-wiki-feedback { margin: 0; padding: 11px 14px; border-radius: 9px; background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 8%, transparent); color: var(--dsw-alias-state-error-primary); font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }\n.dsh-paper-wiki-confirm-delete { --dsw-alias-button-primary-fill: var(--dsw-alias-state-error-primary); --dsw-alias-button-primary-hover: var(--dsw-alias-state-error-primary); }\n.dsh-paper-wiki-error { color: var(--dsw-alias-state-error-primary); }\n.dsh-paper-wiki-generation { padding: clamp(18px, 3cqi, 27px); border: 1px solid var(--wiki-accent-line); border-radius: 12px; background: linear-gradient(145deg, color-mix(in srgb, var(--wiki-accent) 7%, var(--wiki-paper)), var(--wiki-paper) 75%); }\n.dsh-paper-wiki-generation-header { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; }\n.dsh-paper-wiki-generation h2 { margin: 0; font-size: 18px; font-weight: 660; }\n.dsh-paper-wiki-generation p { margin: 12px 0 0; font-size: 13px; color: var(--wiki-muted); line-height: 1.6; }\n.dsh-paper-wiki-clock { font-size: 12px; color: var(--wiki-muted); font-variant-numeric: tabular-nums; }\n.dsh-paper-wiki-generation-actions { display: flex; justify-content: flex-end; margin-top: 12px; }\n.dsh-paper-wiki-progressbar { position: relative; height: 3px; overflow: hidden; border-radius: 3px; margin-top: 20px; background: var(--wiki-accent-fill); }\n.dsh-paper-wiki-progressbar::after { content: ''; display: block; width: 30%; height: 100%; background: var(--wiki-accent); animation: dsh-paper-wiki-progress 2s ease-in-out infinite; }\n@keyframes dsh-paper-wiki-progress { from { transform: translateX(-100%); } to { transform: translateX(434%); } }\n.dsh-paper-wiki-generation-stages { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 7px 12px; padding: 0; margin: 14px 0 0; list-style: none; color: var(--wiki-muted); font-size: 12px; }\n.dsh-paper-wiki-generation-stages [data-active] { color: var(--wiki-accent-ink); font-weight: 650; }\n.dsh-paper-wiki-generation-stages [data-done] { color: var(--wiki-ink); }\n.dsh-paper-wiki-reader { min-width: 0; }\n.dsh-paper-wiki-reader-heading { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 18px; padding: 4px 0 22px; }\n.dsh-paper-wiki-reader-heading > div:first-child { flex: 1 1 280px; min-width: 0; }\n.dsh-paper-wiki-eyebrow { margin: 0 0 8px; color: var(--wiki-accent-ink); font-size: 12px; font-weight: 600; }\n.dsh-paper-wiki-reader-heading h1 { margin: 0; color: var(--wiki-ink); font-size: clamp(23px, 3.2cqi, 34px); font-weight: 700; line-height: 1.3; letter-spacing: -.02em; overflow-wrap: anywhere; }\n.dsh-paper-wiki-reader-heading h1:focus { outline: none; }\n.dsh-paper-wiki-file-name { margin: 9px 0 0; color: var(--wiki-muted); font-size: 12px; overflow-wrap: anywhere; }\n.dsh-paper-wiki-warning { border: 1px solid var(--wiki-accent-line); border-radius: 9px; background: var(--wiki-accent-fill); padding: 10px 13px; margin-bottom: 16px; font-size: 12px; color: var(--wiki-muted); line-height: 1.65; }\n.dsh-paper-wiki-warning p { margin: 0; }\n.dsh-paper-wiki-warning p + p { margin-top: 6px; }\n.dsh-paper-wiki-columns { display: grid; grid-template-columns: minmax(0, 1fr); align-items: start; gap: 12px; }\n.dsh-paper-wiki-sidebar { min-width: 0; }\n.dsh-paper-wiki-rail-label, .dsh-paper-wiki-chapter-list { display: none; }\n.dsh-paper-wiki-rail-label { margin: 0 0 9px; padding-inline: 11px; font-size: 12px; font-weight: 650; color: var(--wiki-muted); }\n.dsh-paper-wiki-chapter-list { gap: 4px; padding: 0; margin: 0; list-style: none; }\n.dsh-paper-wiki-chapter-button { display: block; width: 100%; min-height: 38px; padding: 9px 11px; border: 0; border-radius: 7px; background: transparent; color: var(--wiki-muted); text-align: left; font: inherit; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; cursor: pointer; }\n.dsh-paper-wiki-chapter-button:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--wiki-ink); }\n.dsh-paper-wiki-chapter-button[aria-current='page'] { background: var(--wiki-accent-fill); color: var(--wiki-accent-ink); font-weight: 650; }\n.dsh-paper-wiki-chapter-picker { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 10px; padding: 9px 10px; border: 1px solid var(--wiki-line); border-radius: 9px; background: var(--wiki-paper); font-size: 12px; color: var(--wiki-muted); }\n.dsh-paper-wiki-chapter-picker select { width: 100%; min-width: 0; min-height: 34px; padding: 4px 8px; border: 1px solid var(--wiki-line); border-radius: 7px; color: var(--wiki-ink); background: var(--wiki-canvas); font: inherit; }\n.dsh-paper-wiki-article { --wiki-reading-pad: clamp(17px, 3.3cqi, 35px); min-width: 0; border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); }\n.dsh-paper-wiki-article-header { padding: clamp(20px, 3.25cqi, 33px) var(--wiki-reading-pad) 23px; border-bottom: 1px solid var(--wiki-line); overflow-wrap: anywhere; }\n.dsh-paper-wiki-article-title { margin: 0; font-size: clamp(24px, 3.55cqi, 37px); line-height: 1.23; letter-spacing: -.026em; font-weight: 700; }\n.dsh-paper-wiki-meta { display: flex; flex-wrap: wrap; gap: 8px 13px; margin-top: 15px; font-size: 12px; line-height: 1.5; color: var(--wiki-muted); }\n.dsh-paper-wiki-prose { padding: 24px var(--wiki-reading-pad) 30px; min-width: 0; font-size: 15px; line-height: 1.85; overflow-wrap: anywhere; }\n.dsh-paper-wiki-prose a { color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-prose pre { max-width: 100%; overflow-x: auto; }\n.dsh-paper-wiki-prose table { display: block; max-width: 100%; overflow-x: auto; }\n.dsh-paper-wiki-prose :is(h1,h2,h3,h4) { line-height: 1.4; }\n.dsh-paper-wiki-page :is(button,input,select,summary,a):focus-visible { outline: 2px solid var(--wiki-accent); outline-offset: 2px; }\n@container dsh-paper-wiki (min-width: 705px) {\n  .dsh-paper-wiki-columns { grid-template-columns: minmax(165px, 210px) minmax(0, 1fr); gap: clamp(18px, 2.7cqi, 32px); }\n  .dsh-paper-wiki-sidebar { position: sticky; top: 20px; max-height: calc(100dvh - 90px); overflow-y: auto; padding: 12px 9px; border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); }\n  .dsh-paper-wiki-rail-label { display: block; }\n  .dsh-paper-wiki-chapter-list { display: grid; }\n  .dsh-paper-wiki-chapter-picker { display: none; }\n}\n@container dsh-paper-wiki (max-width: 440px) {\n  .dsh-paper-wiki-bar { min-height: 58px; margin-bottom: 16px; }\n  .dsh-paper-wiki-history-row { grid-template-columns: minmax(0, 1fr) 34px; }\n  .dsh-paper-wiki-history-item { gap: 8px; padding-left: 6px; }\n  .dsh-paper-wiki-history-item > svg { display: none; }\n  .dsh-paper-wiki-clock { width: 100%; }\n}\n@media (prefers-reduced-motion: reduce) { .dsh-paper-wiki-progressbar::after { animation: none; width: 100%; opacity: .6; } }\n.dsh-paper-wiki-explanation-empty { display: grid; justify-items: center; gap: 12px; padding: clamp(34px, 6cqi, 60px) 20px; border: 1px solid var(--wiki-line); border-radius: 12px; background: var(--wiki-paper); text-align: center; }\n.dsh-paper-wiki-explanation-empty > svg { color: var(--wiki-accent-ink); }\n.dsh-paper-wiki-explanation-empty h2 { margin: 0; font-size: 18px; font-weight: 650; }\n.dsh-paper-wiki-explanation-empty p { margin: 0 0 3px; color: var(--wiki-muted); font-size: 13px; line-height: 1.7; }\n"
window.__ModuleLoader__.load({
  id: 'dsh-paper-wiki',
  factory(require) {
    const React = require('react')
    const { Button, MarkdownText, Modal } = require('@deepseek-ai/dsh-client-ui-primitives')
    const { createElement: h, useEffect, useId, useRef, useState, useSyncExternalStore } = React
    const panelId = 'dsh-paper-wiki'
    const uuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i
    const terminal = new Set(['completed', 'failed', 'cancelled'])
    const dateFormat = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
    const labels = { code: { copyLabel: '复制', copiedLabel: '已复制' }, footnotes: '脚注' }
    const api = (path, query = {}) => {
      const url = new URL('api/dsh-paper-wiki/' + path, document.baseURI)
      for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value)
      return url
    }
    function metadata(value) {
      if (!uuid.test(value?.id) || typeof value.fileName !== 'string' || typeof value.title !== 'string'
        || !Number.isSafeInteger(value.pageCount) || value.pageCount < 1 || !Number.isFinite(new Date(value.createdAt).getTime())) return null
      return { id: value.id, title: value.title, fileName: value.fileName, pageCount: value.pageCount,
        createdAt: value.createdAt, sha256: value.sha256, explained: value.explained === true || Boolean(value.explanation) }
    }
    function paperRecord(value) {
      const item = metadata(value)
      if (!item) return null
      const explanation = value.explanation
      if (explanation && (!Array.isArray(explanation.chapters) || !explanation.chapters.length
        || explanation.chapters.some(chapter => typeof chapter.id !== 'string' || typeof chapter.title !== 'string' || typeof chapter.markdown !== 'string'))) return null
      return { ...item, warnings: Array.isArray(value.warnings) ? value.warnings.filter(item => typeof item === 'string') : [], explanation }
    }
    function validJob(value) {
      return value && uuid.test(value.id) && uuid.test(value.paperId)
        && ['reading', 'writing', 'reviewing', 'saving', 'completed', 'failed', 'cancelled'].includes(value.phase)
    }
    async function readResponse(response) {
      const value = await response.json().catch(() => null)
      if (!response.ok) throw new Error(typeof value?.error === 'string' ? value.error : '操作失败，请重试。')
      return value
    }
    function createPaperStore() {
      let snapshot = { papers: [], historyStatus: 'idle', error: '', result: null,
        chapter: 0, formOpen: false, file: null, paperPath: '', importing: false,
        openingId: null, deletion: null, generation: null, offline: false, generating: false }
      let disposed = false, initialized = false, openRevision = 0, listRequest, openRequest, importRequest, pollRequest, deleteRequest
      let pollTimer, pollingId, generationRequest
      const listeners = new Set()
      const controllers = new Set()
      const controller = () => { const value = new AbortController(); controllers.add(value); return value }
      const update = patch => { if (!disposed) { snapshot = { ...snapshot, ...patch }; for (const listener of listeners) listener() } }
      const merge = values => {
        const items = new Map(snapshot.papers.map(item => [item.id, item]))
        for (const item of values) if (item) items.set(item.id, item)
        return [...items.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
      }
      async function loadPapers() {
        listRequest?.abort()
        const request = listRequest = controller()
        update({ historyStatus: 'loading', error: '' })
        try {
          const data = await readResponse(await fetch(api('papers'), { credentials: 'same-origin', signal: request.signal }))
          if (!Array.isArray(data?.papers)) throw new Error('无法读取论文库。')
          if (!request.signal.aborted) update({ papers: data.papers.map(metadata).filter(Boolean), historyStatus: 'ready' })
        } catch { if (!request.signal.aborted) update({ historyStatus: 'error' }) }
        finally { controllers.delete(request); if (listRequest === request) listRequest = null }
      }
      async function fetchPaper(id, signal) {
        const value = paperRecord(await readResponse(await fetch(api('papers', { id }), { credentials: 'same-origin', signal })))
        if (!value || value.id !== id) throw new Error('论文记录不完整，请重新导入。')
        return value
      }
      async function openPaper(id) {
        if (disposed || snapshot.openingId === id) return
        openRequest?.abort()
        const revision = ++openRevision
        const request = openRequest = controller()
        update({ openingId: id, error: '' })
        try {
          const result = await fetchPaper(id, request.signal)
          if (!request.signal.aborted && revision === openRevision) update({ result, chapter: 0, formOpen: false })
        } catch (error) { if (!request.signal.aborted && revision === openRevision) update({ error: error.message }) }
        finally { controllers.delete(request); if (openRequest === request) { openRequest = null; update({ openingId: null }) } }
      }
      function stopPolling() {
        clearTimeout(pollTimer)
        pollRequest?.abort()
        pollingId = null
      }
      async function acceptJob(job, restore = false) {
        if (!validJob(job) || disposed) return
        update({ generation: { ...job, receivedAt: Date.now() }, offline: false, generating: false })
        if (terminal.has(job.phase)) {
          stopPolling()
          if (job.phase === 'completed') {
            const request = controller()
            try {
              const result = await fetchPaper(job.paperId, request.signal)
              if (!request.signal.aborted) update({ papers: merge([metadata(result)]),
                ...(snapshot.result?.id === result.id ? { result, chapter: 0 } : {}) })
            } catch (error) { if (!request.signal.aborted) update({ error: error.message }) }
            finally { controllers.delete(request) }
          }
          return
        }
        if (pollingId !== job.id || restore) { stopPolling(); pollingId = job.id; schedulePoll(job.id) }
      }
      function schedulePoll(id) {
        pollTimer = setTimeout(async () => {
          if (disposed || pollingId !== id) return
          const request = pollRequest = controller()
          try {
            const data = await readResponse(await fetch(api('generation', { id }), { credentials: 'same-origin', signal: request.signal }))
            if (!request.signal.aborted && data?.job === null) {
              await acceptJob({ ...snapshot.generation, id, phase: 'failed', error: '生成任务已中断或 DSH 已重启。请点击「生成讲解」重新尝试。' })
              return
            }
            if (!validJob(data?.job)) throw new Error('无法读取生成任务。')
            if (!request.signal.aborted) await acceptJob(data.job)
          } catch (error) { if (!request.signal.aborted) update({ offline: true }) }
          finally {
            controllers.delete(request)
            if (!disposed && pollingId === id) schedulePoll(id)
          }
        }, 1500)
      }
      async function recoverGeneration() {
        const request = controller()
        try {
          const data = await readResponse(await fetch(api('generation'), { credentials: 'same-origin', signal: request.signal }))
          if (!request.signal.aborted && !generationRequest && validJob(data?.job)) await acceptJob(data.job, true)
        } catch { /* The library remains usable if no generation can be recovered. */ }
        finally { controllers.delete(request) }
      }
      async function importPaper() {
        if (disposed || snapshot.importing || (!snapshot.file && !snapshot.paperPath.trim())) return
        const request = importRequest = controller()
        const revision = ++openRevision
        openRequest?.abort()
        update({ importing: true, error: '' })
        try {
          const file = snapshot.file
          if (file && (file.size > 30 * 1024 * 1024 || !/\.pdf$/i.test(file.name))) throw new Error('请选择不超过 30 MB 的 PDF 文件。')
          const response = await fetch(api('papers'), { method: 'POST', credentials: 'same-origin', signal: request.signal,
            headers: file ? { 'content-type': 'application/pdf', 'x-paper-filename': encodeURIComponent(file.name) } : { 'content-type': 'application/json' },
            body: file || JSON.stringify({ paperPath: snapshot.paperPath.trim() }) })
          const result = paperRecord(await readResponse(response))
          if (!result) throw new Error('导入结果不完整，请重试。')
          if (!request.signal.aborted) {
            listRequest?.abort()
            update({ papers: merge([metadata(result)]), historyStatus: 'ready', file: null, paperPath: '',
              ...(revision === openRevision ? { result, chapter: 0, formOpen: false } : {}) })
          }
        } catch (error) { if (!request.signal.aborted) update({ error: error.message || '无法导入论文，请重试。' }) }
        finally { controllers.delete(request); if (importRequest === request) { importRequest = null; update({ importing: false }) } }
      }
      async function generate() {
        const paperId = snapshot.result?.id
        if (disposed || !uuid.test(paperId) || snapshot.generating || snapshot.generation && !terminal.has(snapshot.generation.phase)) return
        const request = generationRequest = controller()
        update({ generating: true, error: '' })
        try {
          const response = await fetch(api('generation'), { method: 'POST', credentials: 'same-origin', signal: request.signal,
            headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: paperId }) })
          const data = await response.json().catch(() => null)
          if ((response.ok || response.status === 409) && validJob(data?.job)) await acceptJob(data.job, true)
          else throw new Error(data?.error || '无法开始讲解，请重试。')
        } catch (error) { if (!request.signal.aborted) { update({ error: error.message }); void recoverGeneration() } }
        finally { controllers.delete(request); if (generationRequest === request) { generationRequest = null; update({ generating: false }) } }
      }
      async function cancelGeneration() {
        if (!snapshot.generation || terminal.has(snapshot.generation.phase)) return
        const request = controller()
        try {
          const response = await fetch(api('generation/cancel'), { method: 'POST', credentials: 'same-origin', signal: request.signal,
            headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: snapshot.generation.id }) })
          const data = await readResponse(response)
          if (validJob(data?.job)) await acceptJob(data.job, true)
          else await recoverGeneration()
        } catch (error) { if (!request.signal.aborted) update({ error: error.message || '无法取消生成，请重试。' }) }
        finally { controllers.delete(request) }
      }
      async function deletePaper() {
        if (!snapshot.deletion || deleteRequest) return
        const item = snapshot.deletion.item
        const request = deleteRequest = controller()
        update({ deletion: { item, pending: true, error: '' } })
        try {
          const response = await fetch(api('papers/delete'), { method: 'POST', credentials: 'same-origin', signal: request.signal,
            headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: item.id }) })
          if (!response.ok) await readResponse(response)
          if (!request.signal.aborted) {
            listRequest?.abort()
            if (snapshot.openingId === item.id) { ++openRevision; openRequest?.abort() }
            update({ deletion: null, papers: snapshot.papers.filter(paper => paper.id !== item.id),
              ...(snapshot.result?.id === item.id ? { result: null } : {}),
              ...(snapshot.generation?.paperId === item.id && terminal.has(snapshot.generation.phase) ? { generation: null } : {}) })
          }
        } catch (error) { if (!request.signal.aborted) update({ deletion: { item, pending: false, error: error.message } }) }
        finally { controllers.delete(request); deleteRequest = null }
      }
      return {
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener) },
        getSnapshot: () => snapshot,
        initialize() { if (!initialized && !disposed) { initialized = true; void loadPapers(); void recoverGeneration() } },
        loadPapers, openPaper, importPaper, generate, cancelGeneration, deletePaper,
        setFile(file) { update({ file: file || null, paperPath: '', error: '' }) },
        setPath(paperPath) { update({ paperPath, file: null, error: '' }) },
        setFormOpen(formOpen) { update({ formOpen, error: '' }) },
        selectChapter(chapter) { if (snapshot.result?.explanation?.chapters[chapter]) update({ chapter }) },
        returnToLibrary() { ++openRevision; openRequest?.abort(); update({ result: null, openingId: null, formOpen: false, error: '' }) },
        requestDelete(item) { update({ deletion: { item, pending: false, error: '' } }) },
        cancelDelete() { if (!snapshot.deletion?.pending) update({ deletion: null }) },
        dispose() { disposed = true; stopPolling(); for (const request of controllers) request.abort(); listeners.clear() },
      }
    }
    function PaperIcon({ size = 20 }) {
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true },
        h('path', { d: 'M6 3.5h8l4 4v13H6z', strokeLinejoin: 'round' }), h('path', { d: 'M14 3.5v4h4M9 11h6M9 14h6M9 17h4', strokeLinecap: 'round' }))
    }
    function Glyph({ kind }) {
      return h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, 'aria-hidden': true },
        h('path', { d: kind === 'trash' ? 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7' : kind === 'plus' ? 'M12 5v14M5 12h14' : 'm9 5 7 7-7 7', strokeLinecap: 'round', strokeLinejoin: 'round' }))
    }
    function duration(ms) { const seconds = Math.floor((ms || 0) / 1000); return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0') }
    function GenerationProgress({ generation, offline, store }) {
      const [now, setNow] = useState(Date.now)
      useEffect(() => { if (terminal.has(generation.phase)) return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [generation.id, generation.phase])
      const stages = [['reading', '读取论文'], ['writing', '撰写讲解'], ['reviewing', '核对引用'], ['saving', '保存讲解']]
      const status = { reading: '正在读取论文', writing: '正在撰写论文讲解', reviewing: '正在核对论文引用', saving: '正在保存讲解', completed: '论文讲解已保存', failed: '本次讲解未完成', cancelled: '已取消讲解' }
      const active = !terminal.has(generation.phase)
      return h('section', { className: 'dsh-paper-wiki-generation', 'aria-label': '讲解进度' },
        h('div', { className: 'dsh-paper-wiki-generation-header' }, h('h2', { role: 'status' }, status[generation.phase]),
          h('span', { className: 'dsh-paper-wiki-clock' }, '已耗时 ', duration(generation.elapsedMs + (active ? Math.max(0, now - generation.receivedAt) : 0)))),
        active && h('div', { className: 'dsh-paper-wiki-progressbar', role: 'progressbar', 'aria-label': status[generation.phase] }),
        active && h('ol', { className: 'dsh-paper-wiki-generation-stages' }, stages.map(([phase, label], index) => h('li', { key: phase,
          'data-active': generation.phase === phase || undefined, 'data-done': index < stages.findIndex(item => item[0] === generation.phase) || undefined }, label))),
        generation.error && h('p', { role: 'alert' }, generation.error),
        offline && h('p', { role: 'status' }, '暂时无法连接 DSH，正在尝试恢复进度。'),
        h('div', { className: 'dsh-paper-wiki-generation-actions' }, active
          ? h(Button, { size: 'sm', variant: 'outline', onClick: () => void store.cancelGeneration() }, '取消讲解')
          : generation.phase === 'completed' && h(Button, { size: 'sm', variant: 'outline', onClick: () => void store.openPaper(generation.paperId) }, '打开讲解')))
    }
    function ImportForm({ store, state, formId }) {
      const fileId = useId(), pathId = useId()
      const titleId = useId(), heading = useRef(null)
      const busy = state.importing
      useEffect(() => { heading.current?.focus() }, [])
      return h('section', { id: formId, className: 'dsh-paper-wiki-form-card', 'aria-labelledby': titleId },
        h('h2', { id: titleId, ref: heading, tabIndex: -1, className: 'dsh-paper-wiki-form-title' }, '新建 Wiki'),
        h('form', { className: 'dsh-paper-wiki-form', onSubmit: event => { event.preventDefault(); void store.importPaper() } },
          h('label', { className: 'dsh-paper-wiki-upload', htmlFor: fileId }, h(PaperIcon, { size: 28 }),
            h('strong', null, state.file ? state.file.name : '选择 PDF 文件'), h('span', null, '支持含文本的 PDF · 最大 30 MB'),
            h('input', { id: fileId, type: 'file', name: 'paperFile', accept: '.pdf,application/pdf', disabled: busy,
              onChange: event => { store.setFile(event.target.files?.[0]); event.target.value = '' } })),
          h('details', { className: 'dsh-paper-wiki-path-option' }, h('summary', null, '从 DSH 所在电脑的路径导入'),
            h('label', { className: 'dsh-paper-wiki-field', htmlFor: pathId }, h('span', null, 'PDF 绝对路径'),
              h('input', { id: pathId, name: 'paperPath', type: 'text', autoComplete: 'off', spellCheck: false,
                value: state.paperPath, disabled: busy, placeholder: '/path/to/paper.pdf', onChange: event => store.setPath(event.target.value) }))),
          h('div', { className: 'dsh-paper-wiki-form-footer' }, h(Button, { type: 'submit', variant: 'primary',
            disabled: busy || (!state.file && !state.paperPath.trim()) }, state.importing ? '正在读取论文…' : '导入论文'),
            h('p', { className: 'dsh-paper-wiki-hint' }, '生成讲解时，论文文本会发送给当前配置的模型。'))))
    }
    function PaperLibrary({ store, state }) {
      const titleId = useId()
      return h('section', { className: 'dsh-paper-wiki-history', 'aria-labelledby': titleId },
        h('h2', { id: titleId }, '已保存论文'),
        ['idle', 'loading'].includes(state.historyStatus) && !state.papers.length && h('p', { role: 'status', className: 'dsh-paper-wiki-library-status' }, '正在读取论文…'),
        state.historyStatus === 'error' && h('div', { role: 'alert', className: 'dsh-paper-wiki-library-status' },
          h('p', null, '无法读取论文库，请重试。'),
          h(Button, { type: 'button', size: 'sm', onClick: () => void store.loadPapers() }, '重试')),
        state.historyStatus === 'ready' && !state.papers.length && h('div', { className: 'dsh-paper-wiki-library-empty' },
          h(PaperIcon, { size: 25 }), h('p', null, '还没有已保存的论文')),
        state.papers.length > 0 && h('ul', { className: 'dsh-paper-wiki-history-list' }, state.papers.map(item => h('li', { key: item.id, className: 'dsh-paper-wiki-history-row' },
          h('button', { type: 'button', className: 'dsh-paper-wiki-history-item', 'aria-busy': state.openingId === item.id || undefined,
            onClick: () => void store.openPaper(item.id) }, h('span', { className: 'dsh-paper-wiki-history-icon' }, h(PaperIcon, { size: 19 })),
            h('span', { className: 'dsh-paper-wiki-history-copy' }, h('strong', { title: item.fileName }, item.title),
              h('span', { className: 'dsh-paper-wiki-history-meta' }, h('span', null, item.pageCount + ' 页'),
                h('span', { className: item.explained ? 'dsh-paper-wiki-ready' : undefined }, item.explained ? '已讲解' : '待讲解'),
                h('time', { dateTime: item.createdAt }, dateFormat.format(new Date(item.createdAt))))),
            state.openingId === item.id ? h('span', { role: 'status' }, '正在打开…') : h(Glyph, { kind: 'chevron' })),
          h('button', { type: 'button', className: 'dsh-paper-wiki-delete', title: '删除论文', 'aria-label': '删除论文 ' + item.title,
            disabled: state.generation?.paperId === item.id && !terminal.has(state.generation.phase), onClick: () => store.requestDelete(item) }, h(Glyph, { kind: 'trash' }))))))
    }
    function sourceMarkdown(markdown, paper) {
      function citation(href) {
        try {
          const url = new URL(href.replace(/&amp;/g, '&'), document.baseURI)
          if (url.searchParams.get('id') !== paper.id) return null
          const page = url.origin === 'https://dsh-paper-wiki.invalid' && url.pathname === '/source'
            ? Number(url.searchParams.get('page')) : url.pathname.endsWith('/api/dsh-paper-wiki/pdf')
              && /^#page=\d+$/.test(url.hash) ? Number(url.hash.slice(6)) : null
          return Number.isInteger(page) && page >= 1 && page <= paper.pageCount ? '（第 ' + page + ' 页）' : null
        } catch { return null }
      }
      let fence = null
      return markdown.split('\n').map(line => {
        const marker = /^\s*(`{3,}|~{3,})/.exec(line)
        if (marker) { if (!fence) fence = marker[1]; else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null; return line }
        if (fence) return line
        return line.split(/(`+[^`]*`+)/g).map((part, index) => index % 2 ? part : part
          .replace(/!?\[[^\]\n]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (match, href) => citation(href) || match)
          .replace(/<([^<>\s]+)>/g, (match, href) => citation(href) || match)
          .replace(/https?:\/\/[^\s<>()]+|(?:\/|api\/)[^\s<>()]+/g, href => citation(href) || href)).join('')
      }).join('\n')
    }
    function downloadMarkdown(paper) {
      const explanation = paper.explanation
      if (!explanation) return
      const markdown = '# ' + explanation.title + '\n\n'
        + explanation.chapters.map(chapter => '## ' + chapter.title + '\n\n' + sourceMarkdown(chapter.markdown, paper)).join('\n\n')
      const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url; link.download = paper.fileName.replace(/\.pdf$/i, '') + '-讲解.md'; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    function ChapterDirectory({ state, store }) {
      const selectId = useId(), chapters = state.result.explanation.chapters
      return h('nav', { 'aria-label': '讲解章节' }, h('h2', { className: 'dsh-paper-wiki-rail-label' }, '章节目录'),
        h('ul', { className: 'dsh-paper-wiki-chapter-list' }, chapters.map((chapter, index) => h('li', { key: chapter.id },
          h('button', { type: 'button', className: 'dsh-paper-wiki-chapter-button', 'aria-current': state.chapter === index ? 'page' : undefined,
            onClick: () => store.selectChapter(index) }, chapter.title)))),
        h('div', { className: 'dsh-paper-wiki-chapter-picker' }, h('label', { htmlFor: selectId }, '章节'),
          h('select', { id: selectId, value: state.chapter, onChange: event => store.selectChapter(Number(event.target.value)) },
            chapters.map((chapter, index) => h('option', { key: chapter.id, value: index }, chapter.title)))))
    }
    function PaperReader({ store, state }) {
      const paper = state.result, explanation = paper.explanation
      const chapter = explanation?.chapters[state.chapter]
      const heading = useRef(null)
      const active = state.generation && !terminal.has(state.generation.phase)
      const pending = state.generating || active && state.generation.paperId === paper.id
      useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [paper.id, state.chapter])
      return h('div', { className: 'dsh-paper-wiki-reader' },
        h('div', { className: 'dsh-paper-wiki-reader-heading' }, h('div', null, h('p', { className: 'dsh-paper-wiki-eyebrow' }, '本地论文 · ' + paper.pageCount + ' 页'),
          h('h1', { ref: heading, tabIndex: -1 }, paper.title), h('p', { className: 'dsh-paper-wiki-file-name' }, paper.fileName)),
          explanation && h('div', { className: 'dsh-paper-wiki-actions' }, h(Button, { size: 'sm', variant: 'outline', onClick: () => downloadMarkdown(paper) }, '导出讲解'),
            h(Button, { size: 'sm', variant: 'primary', disabled: state.generating || active,
              onClick: () => void store.generate() }, state.generating ? '正在提交…' : '重新讲解'))),
        paper.warnings.length > 0 && h('div', { className: 'dsh-paper-wiki-warning', role: 'note' }, paper.warnings.map((warning, index) => h('p', { key: index }, warning))),
        explanation ? h('div', { className: 'dsh-paper-wiki-columns' }, h('aside', { className: 'dsh-paper-wiki-sidebar' }, h(ChapterDirectory, { state, store })),
          h('article', { className: 'dsh-paper-wiki-article', 'aria-label': '论文讲解' },
            h('header', { className: 'dsh-paper-wiki-article-header' }, h('h2', { className: 'dsh-paper-wiki-article-title' }, chapter.title),
              h('div', { className: 'dsh-paper-wiki-meta' }, h('span', null, '中文讲解'),
                explanation.model && h('span', null, explanation.model), explanation.createdAt && h('time', { dateTime: explanation.createdAt }, dateFormat.format(new Date(explanation.createdAt))))),
            h('div', { className: 'dsh-paper-wiki-prose' }, h(MarkdownText, { text: sourceMarkdown(chapter.markdown, paper), omitHtml: true, labels }))))
          : h('section', { className: 'dsh-paper-wiki-explanation-empty', 'aria-label': '论文讲解' }, h(PaperIcon, { size: 30 }),
            h('h2', null, pending ? '正在生成论文讲解' : '论文已导入'),
            h('p', null, pending ? '完成后将在这里显示按章节组织的中文讲解。' : '点击生成讲解，了解研究问题、方法、实验结果与局限。'),
            h(Button, { variant: 'primary', disabled: state.generating || active, onClick: () => void store.generate() }, pending ? '正在生成…' : '生成讲解')))
    }
    function DeleteDialog({ store, deletion }) {
      return h(Modal, { open: true, title: '删除论文？', closeLabel: '关闭', onClose: store.cancelDelete,
        description: '将删除保存的 PDF、提取文本和讲解。',
        footer: h(React.Fragment, null, h(Button, { 'data-modal-autofocus': '', disabled: deletion.pending, onClick: store.cancelDelete }, '取消'),
          h(Button, { variant: 'primary', disabled: deletion.pending, className: 'dsh-paper-wiki-confirm-delete', onClick: () => void store.deletePaper() }, deletion.pending ? '正在删除…' : '删除')) },
        h('p', null, deletion.item.title), deletion.error && h('p', { role: 'alert', className: 'dsh-paper-wiki-error' }, deletion.error))
    }
    function PaperWikiPage({ store }) {
      const state = useSyncExternalStore(store.subscribe, store.getSnapshot), page = useRef(null)
      const formId = useId()
      useEffect(() => store.initialize(), [store])
      useEffect(() => { if (page.current) page.current.scrollTop = 0 }, [state.result?.id, state.chapter])
      const active = state.generation && !terminal.has(state.generation.phase)
      const showProgress = state.generation && (active || !state.result || state.generation.paperId === state.result.id && state.generation.phase !== 'completed')
      return h('section', { className: 'dsh-paper-wiki-page', 'aria-label': '论文百科', ref: page, 'data-reading': state.result ? '' : undefined },
        h('style', null, paperWikiStyles), state.deletion && h(DeleteDialog, { store, deletion: state.deletion }),
        h('div', { className: 'dsh-paper-wiki-shell' },
          h('header', { className: 'dsh-paper-wiki-bar' }, state.result
            ? h('nav', { className: 'dsh-paper-wiki-breadcrumb', 'aria-label': '当前位置' }, h('button', { type: 'button', onClick: store.returnToLibrary }, '论文库'),
              h(Glyph, { kind: 'chevron' }), h('span', { title: state.result.title }, state.result.title))
            : h('h1', { className: 'dsh-paper-wiki-brand' }, h('span', { className: 'dsh-paper-wiki-brand-icon' }, h(PaperIcon, { size: 20 })), '论文库'),
            !state.result && h('div', { className: 'dsh-paper-wiki-actions' }, h(Button, { size: 'sm', variant: state.formOpen ? 'outline' : 'primary', disabled: state.importing,
              icon: state.formOpen ? undefined : h(Glyph, { kind: 'plus' }), 'aria-expanded': state.formOpen,
              'aria-controls': state.formOpen ? formId : undefined,
              onClick: () => store.setFormOpen(!state.formOpen) }, state.formOpen ? '取消新建' : '新建 Wiki'))),
          h('div', { className: state.result ? 'dsh-paper-wiki-reading' : 'dsh-paper-wiki-library' },
            showProgress && h(GenerationProgress, { generation: state.generation, offline: state.offline, store }),
            state.error && h('p', { role: 'alert', className: 'dsh-paper-wiki-feedback' }, state.error),
            state.result ? h(PaperReader, { state, store }) : h(React.Fragment, null,
              state.formOpen && h(ImportForm, { store, state, formId }), h(PaperLibrary, { store, state })))))
    }
    return {
      name: panelId, inject: ['slots'],
      apply(ctx) {
        const store = createPaperStore()
        ctx.effect(() => () => store.dispose())
        ctx.slots.inject('main', () => ctx.slots.register({ name: 'main', key: panelId, inject: () => ({ store }) }, PaperWikiPage))
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({ name: 'sidebar.panellist', id: panelId, label: '论文百科', order: 11 }, PaperIcon))
      },
    }
  },
})

})()
