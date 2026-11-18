window.__ModuleLoader__.load({
  id: 'dsh-paper-wiki',
  factory(require) {
    const React = require('react')
    const primitives = require('@deepseek-ai/dsh-client-ui-primitives')
    const { Button, MarkdownText, Modal } = primitives
    const { createElement: h, useEffect, useId, useRef, useSyncExternalStore } = React
    const GenerationProgress = createPaperGenerationProgress(React, primitives)
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
        chapter: 0, formOpen: false, file: null, preparing: null, importing: false,
        openingId: null, deletion: null, generation: null, offline: false, generating: false }
      let disposed = false, initialized = false, openRevision = 0, listRequest, openRequest, importRequest, pollRequest, deleteRequest
      let pollTimer, pollingId, generationRequest
      let creationPaperId, cancelAfterCreateId
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
        if (cancelAfterCreateId === job.paperId) {
          cancelAfterCreateId = null
          update({ preparing: null })
          await cancelGeneration()
        }
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
      async function recoverGeneration(includeFinished = false) {
        const request = controller()
        try {
          const data = await readResponse(await fetch(api('generation'), { credentials: 'same-origin', signal: request.signal }))
          if (!request.signal.aborted && !generationRequest && validJob(data?.job)
            && (includeFinished || !terminal.has(data.job.phase))) await acceptJob(data.job, true)
        } catch { /* The library remains usable if no generation can be recovered. */ }
        finally { controllers.delete(request) }
      }
      async function createWiki() {
        if (disposed || snapshot.importing || snapshot.generating || !snapshot.file
          || snapshot.generation && !terminal.has(snapshot.generation.phase)) return
        const file = snapshot.file
        creationPaperId = cancelAfterCreateId = null
        const request = importRequest = controller()
        const revision = ++openRevision
        openRequest?.abort()
        update({ importing: true, formOpen: false, error: '', preparing: {
          id: 'preparing', phase: 'reading', fileName: file.name, elapsedMs: 0, receivedAt: Date.now(),
        } })
        try {
          if (file.size > 30 * 1024 * 1024 || !/\.pdf$/i.test(file.name)) throw new Error('请选择不超过 30 MB 的 PDF 文件。')
          const response = await fetch(api('papers'), { method: 'POST', credentials: 'same-origin', signal: request.signal,
            headers: { 'content-type': 'application/pdf', 'x-paper-filename': encodeURIComponent(file.name) }, body: file })
          const result = paperRecord(await readResponse(response))
          if (!result) throw new Error('导入结果不完整，请重试。')
          if (!request.signal.aborted) {
            creationPaperId = result.id
            listRequest?.abort()
            update({ papers: merge([metadata(result)]), historyStatus: 'ready', file: null,
              ...(revision === openRevision ? { result, chapter: 0, formOpen: false } : {}) })
            await generate(result.id)
          }
        } catch (error) {
          if (!request.signal.aborted) update({ error: error.message || '无法读取论文，请重试。', ...(revision === openRevision && { formOpen: true }) })
        } finally {
          controllers.delete(request)
          if (importRequest === request) {
            importRequest = null
            update({ importing: false, preparing: null, ...(request.signal.aborted && revision === openRevision && { formOpen: true }) })
          }
        }
      }
      async function generate(paperId = snapshot.result?.id) {
        if (disposed || !uuid.test(paperId) || snapshot.generating || snapshot.generation && !terminal.has(snapshot.generation.phase)) return
        if (!snapshot.importing) cancelAfterCreateId = null
        const request = generationRequest = controller()
        update({ generating: true, error: '' })
        try {
          const response = await fetch(api('generation'), { method: 'POST', credentials: 'same-origin', signal: request.signal,
            headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: paperId }) })
          const data = await response.json().catch(() => null)
          if ((response.ok || response.status === 409) && validJob(data?.job)) {
            await acceptJob(data.job, true)
            if (data.job.paperId !== paperId) update({ error: '已有论文正在生成，请稍后重试。' })
          } else throw new Error(data?.error || '无法开始讲解，请重试。')
        } catch (error) { if (!request.signal.aborted) { update({ error: error.message }); void recoverGeneration(true) } }
        finally { controllers.delete(request); if (generationRequest === request) { generationRequest = null; update({ generating: false }) } }
      }
      async function cancelGeneration() {
        if (snapshot.preparing && importRequest) {
          cancelAfterCreateId = creationPaperId
          importRequest.abort()
          return
        }
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
        loadPapers, openPaper, createWiki, generate, cancelGeneration, deletePaper,
        setFile(file) { update({ file: file || null, error: '' }) },
        setFormOpen(formOpen) { update({ formOpen, error: '',
          ...(formOpen && snapshot.generation && terminal.has(snapshot.generation.phase) && { generation: null }) }) },
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
    function ImportForm({ store, state, formId }) {
      const fileInput = useRef(null), heading = useRef(null), titleId = useId()
      const busy = state.importing || state.generating || state.generation && !terminal.has(state.generation.phase)
      useEffect(() => { heading.current?.focus() }, [])
      return h('section', { id: formId, className: 'dsh-paper-wiki-form-card', 'aria-labelledby': titleId },
        h('h2', { id: titleId, ref: heading, tabIndex: -1, className: 'dsh-paper-wiki-form-title' }, '新建 Wiki'),
        h('form', { className: 'dsh-paper-wiki-form', onSubmit: event => { event.preventDefault(); void store.createWiki() } },
          h('input', { ref: fileInput, type: 'file', hidden: true, accept: '.pdf,application/pdf', 'aria-label': '论文文件',
            onChange: event => { const file = event.target.files?.[0]; if (file) store.setFile(file); event.target.value = '' } }),
          h('div', { className: 'dsh-paper-wiki-file-field' },
            h(Button, { type: 'button', variant: 'outline', disabled: busy, onClick: () => fileInput.current?.click() }, '选择论文'),
            state.file && h('span', { title: state.file.name }, state.file.name)),
          h(Button, { type: 'submit', variant: 'primary', disabled: busy || !state.file }, '生成讲解')))
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
      useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [paper.id, state.chapter])
      return h('div', { className: 'dsh-paper-wiki-reader' },
        h('div', { className: 'dsh-paper-wiki-reader-heading' }, h('div', null, h('p', { className: 'dsh-paper-wiki-eyebrow' }, '本地论文 · ' + paper.pageCount + ' 页'),
          h('h1', { ref: heading, tabIndex: -1 }, paper.title), h('p', { className: 'dsh-paper-wiki-file-name' }, paper.fileName)),
          explanation && h('div', { className: 'dsh-paper-wiki-actions' }, h(Button, { size: 'sm', variant: 'outline', onClick: () => downloadMarkdown(paper) }, '导出讲解'),
            h(Button, { size: 'sm', variant: 'primary', disabled: state.importing || state.generating || active,
              onClick: () => void store.generate() }, state.generating ? '正在提交…' : '重新讲解'))),
        paper.warnings.length > 0 && h('div', { className: 'dsh-paper-wiki-warning', role: 'note' }, paper.warnings.map((warning, index) => h('p', { key: index }, warning))),
        explanation ? h('div', { className: 'dsh-paper-wiki-columns' }, h('aside', { className: 'dsh-paper-wiki-sidebar' }, h(ChapterDirectory, { state, store })),
          h('article', { className: 'dsh-paper-wiki-article', 'aria-label': '论文讲解' },
            h('header', { className: 'dsh-paper-wiki-article-header' }, h('h2', { className: 'dsh-paper-wiki-article-title' }, chapter.title),
              h('div', { className: 'dsh-paper-wiki-meta' }, h('span', null, '中文讲解'),
                explanation.model && h('span', null, explanation.model), explanation.createdAt && h('time', { dateTime: explanation.createdAt }, dateFormat.format(new Date(explanation.createdAt))))),
            h('div', { className: 'dsh-paper-wiki-prose' }, h(MarkdownText, { text: sourceMarkdown(chapter.markdown, paper), omitHtml: true, labels }))))
          : h('div', { className: 'dsh-paper-wiki-explanation-empty' },
            h(Button, { variant: 'primary', disabled: state.importing || state.generating || active, onClick: () => void store.generate() }, '生成讲解')))

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
      const generation = state.preparing || state.generation
      const showProgress = generation && (state.preparing || active || !state.result || generation.paperId === state.result.id && generation.phase !== 'completed')
      const progressOwnsResult = !state.result?.explanation && showProgress && (state.preparing || generation.paperId === state.result?.id)
      const title = generation && (generation.fileName || state.papers.find(paper => paper.id === generation.paperId)?.title)
      return h('section', { className: 'dsh-paper-wiki-page', 'aria-label': '论文百科', ref: page, 'data-reading': state.result ? '' : undefined },
        h('style', null, paperWikiStyles), state.deletion && h(DeleteDialog, { store, deletion: state.deletion }),
        h('div', { className: 'dsh-paper-wiki-shell' },
          h('header', { className: 'dsh-paper-wiki-bar' }, state.result
            ? h('nav', { className: 'dsh-paper-wiki-breadcrumb', 'aria-label': '当前位置' }, h('button', { type: 'button', onClick: store.returnToLibrary }, '论文库'),
              h(Glyph, { kind: 'chevron' }), h('span', { title: state.result.title }, state.result.title))
            : h('h1', { className: 'dsh-paper-wiki-brand' }, h('span', { className: 'dsh-paper-wiki-brand-icon' }, h(PaperIcon, { size: 20 })), '论文库'),
            !state.result && h('div', { className: 'dsh-paper-wiki-actions' }, h(Button, { size: 'sm', variant: state.formOpen ? 'outline' : 'primary', disabled: state.importing || state.generating || active,
              icon: state.formOpen ? undefined : h(Glyph, { kind: 'plus' }), 'aria-expanded': state.formOpen,
              'aria-controls': state.formOpen ? formId : undefined,
              onClick: () => store.setFormOpen(!state.formOpen) }, state.formOpen ? '取消新建' : '新建 Wiki'))),
          h('div', { className: state.result ? 'dsh-paper-wiki-reading' : 'dsh-paper-wiki-library' },
            showProgress && h(GenerationProgress, { generation: { ...generation, title }, offline: state.offline, store }),
            state.error && h('p', { role: 'alert', className: 'dsh-paper-wiki-feedback' }, state.error),
            state.result ? !progressOwnsResult && h(PaperReader, { state, store }) : h(React.Fragment, null,
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
