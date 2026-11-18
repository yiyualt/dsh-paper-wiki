import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { open, realpath } from 'node:fs/promises'
import { basename, isAbsolute, join } from 'node:path'
import { readConfiguredModel } from './src/configured-model.js'
import { generateExplanation, MAX_EXPLANATION_CHARACTERS, explanationError } from './src/paper-explanation.js'
import { MAX_PDF_BYTES, readPaper } from './src/paper-source.js'
import { createPaperStorage, validPaperId } from './src/paper-storage.js'

export const name = 'dsh-paper-wiki'
export const inject = ['connection', 'llm', 'agentDefaultModel', 'profileContext']
const root = '/api/dsh-paper-wiki/'
const json = (data, status = 200) => Response.json(data, { status, headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } })
const fail = (message, status = 400) => json({ error: message }, status)
const isJson = request => request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() === 'application/json'
const publicPaper = ({ pages, ...paper }) => paper

async function readBytes(request, limit, signal) {
  const length = Number(request.headers.get('content-length'))
  if (Number.isFinite(length) && length > limit) throw explanationError('upload-too-large', '文件超过 30 MB 上限。', 413)
  const reader = request.body?.getReader()
  if (!reader) throw explanationError('empty-upload', '请选择一个 PDF 文件。', 400)
  const chunks = []
  let size = 0
  const abort = () => { void reader.cancel(signal.reason).catch(() => {}) }
  signal.addEventListener('abort', abort, { once: true })
  try {
    for (;;) {
      signal.throwIfAborted()
      const { done, value } = await reader.read()
      signal.throwIfAborted()
      if (done) break
      size += value.byteLength
      if (size > limit) throw explanationError('upload-too-large', '文件超过 30 MB 上限。', 413)
      chunks.push(value)
    }
    return Buffer.concat(chunks, size)
  } finally {
    signal.removeEventListener('abort', abort)
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}

async function readLocalPaper(path, signal) {
  if (typeof path !== 'string' || path.length > 4096 || !isAbsolute(path) || path.includes('\0') || !/\.pdf$/i.test(path)) {
    throw explanationError('paper-path-invalid', '请输入 DSH 所在电脑上 PDF 文件的绝对路径。', 400)
  }
  let handle
  try {
    const resolved = await realpath(path)
    handle = await open(resolved, constants.O_RDONLY | (constants.O_NONBLOCK ?? 0) | (constants.O_NOFOLLOW ?? 0))
    const info = await handle.stat()
    if (!info.isFile()) throw explanationError('paper-path-invalid', '所选路径不是普通 PDF 文件。', 400)
    if (info.size > MAX_PDF_BYTES) throw explanationError('upload-too-large', '文件超过 30 MB 上限。', 413)
    // Bound the read even when the file grows after stat().
    const bytes = Buffer.alloc(Math.min(info.size + 1, MAX_PDF_BYTES + 1))
    let offset = 0
    while (offset < bytes.length) {
      signal.throwIfAborted()
      const { bytesRead } = await handle.read(bytes, offset, bytes.length - offset, offset)
      if (!bytesRead) break
      offset += bytesRead
    }
    if (offset > info.size) throw explanationError('paper-changed', '读取时 PDF 文件发生变化，请重试。', 409)
    return { bytes: bytes.subarray(0, offset), fileName: basename(resolved) }
  } catch (error) {
    if (error?.status) throw error
    signal.throwIfAborted()
    throw explanationError('paper-path-unavailable', '无法读取这个 PDF，请检查文件路径和读取权限。', 404)
  } finally { await handle?.close() }
}

export function apply(ctx, config = {}) {
  const storage = createPaperStorage(join(ctx.profileContext.dir, 'dsh-paper-wiki', 'papers'))
  const lifetime = new AbortController()
  const jobs = new Map(), removing = new Set()
  let active, latest, importing = false
  ctx.effect(() => () => lifetime.abort())

  function progress(job) {
    if (!job) return null
    return { id: job.id, paperId: job.paperId, phase: job.phase,
      elapsedMs: Math.max(0, (job.finishedAt ?? Date.now()) - job.startedAt),
      ...(job.error && { error: job.error }) }
  }

  function register(path, methods, fetch) {
    ctx.connection.fetch.register({ path: root + path, methods, requestBody: 'buffered', async fetch(request) {
      try { return await fetch(request) } catch (error) {
        if (request.signal.aborted) return fail('请求已取消。', 499)
        if (Number.isInteger(error?.status) && error.status >= 400 && error.status <= 599) return fail(error.message, error.status)
        return fail('操作失败，请检查 DSH 数据目录是否可写后重试。', 500)
      }
    } })
  }

  register('papers', ['GET', 'POST'], async request => {
    if (request.method === 'GET') {
      const id = new URL(request.url).searchParams.get('id')
      if (id === null) return json({ papers: await storage.list() })
      if (!validPaperId(id)) return fail('论文编号无效。')
      const paper = await storage.get(id)
      return paper ? json(publicPaper(paper)) : fail('找不到这篇论文。', 404)
    }
    if (importing) return fail('另一篇论文正在导入，请稍后重试。', 409)
    const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
    if (!['application/pdf', 'application/json'].includes(type)) return fail('请上传 PDF 文件或提供 JSON 本地路径。', 415)
    importing = true
    const timeout = AbortSignal.timeout(120_000)
    const signal = AbortSignal.any([request.signal, lifetime.signal, timeout])
    try {
      let bytes, fileName
      if (type === 'application/json') {
        const body = await request.json().catch(() => null)
        ;({ bytes, fileName } = await readLocalPaper(body?.paperPath, signal))
      } else {
        const encodedName = request.headers.get('x-paper-filename') ?? 'paper.pdf'
        try { fileName = decodeURIComponent(encodedName) } catch { return fail('文件名格式无效。') }
        bytes = await readBytes(request, MAX_PDF_BYTES, signal)
      }
      const source = await readPaper(bytes, { fileName, signal })
      signal.throwIfAborted()
      const paper = { id: randomUUID(), createdAt: new Date().toISOString(), ...source, explanation: null }
      return json(publicPaper(await storage.save(paper, bytes)), 201)
    } catch (error) {
      if (timeout.aborted) return fail('论文导入超过 2 分钟上限，请重试。', 504)
      if (signal.aborted) return fail('论文导入已取消。', 503)
      throw error
    } finally { importing = false }
  })

  register('papers/delete', ['POST'], async request => {
    if (!isJson(request)) return fail('请求必须是 JSON。', 415)
    const body = await request.json().catch(() => null), id = body?.id
    if (!validPaperId(id)) return fail('论文编号无效。')
    if (active?.paperId === id) return fail('论文正在讲解，请先取消任务再删除。', 409)
    if (removing.has(id)) return fail('论文正在删除。', 409)
    removing.add(id)
    try {
      await storage.remove(id)
      for (const [key, job] of jobs) if (job.paperId === id) jobs.delete(key)
      if (latest?.paperId === id) latest = undefined
      return new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } })
    } finally { removing.delete(id) }
  })

  async function run(job, paper) {
    const timeout = AbortSignal.timeout(18 * 60_000)
    const signal = AbortSignal.any([lifetime.signal, job.controller.signal, timeout])
    try {
      let llm = ctx.llm, selection
      try {
        if (config.modelConfigFile !== undefined) {
          llm = await readConfiguredModel(config.modelConfigFile, signal, { streamResponses: true, transportRetries: 2 })
          selection = { model: llm.model }
        } else selection = ctx.agentDefaultModel.currentSelection()
        if (!llm?.stream || !selection?.model) throw new Error('No model')
      } catch {
        signal.throwIfAborted()
        throw explanationError('model-unavailable', '模型配置不可用，请检查 DSH 默认模型或本插件的 modelConfigFile。')
      }
      const explanation = await generateExplanation(llm, selection, paper, signal, phase => { job.phase = phase })
      signal.throwIfAborted()
      job.phase = 'saving'
      if (!await storage.setExplanation(paper.id, explanation)) throw new Error('Missing paper')
      job.phase = 'completed'
    } catch (error) {
      job.phase = job.controller.signal.aborted || lifetime.signal.aborted ? 'cancelled' : 'failed'
      job.error = job.phase === 'cancelled' ? '讲解已取消，论文存档和已有讲解已保留。'
        : timeout.aborted ? '讲解超过 18 分钟上限，请重试。'
          : error?.status ? error.message : '讲解保存失败，请检查数据目录后重试。'
    } finally {
      job.finishedAt = Date.now()
      if (active === job) active = undefined
    }
  }

  register('generation', ['GET', 'POST'], async request => {
    if (request.method === 'GET') {
      const id = new URL(request.url).searchParams.get('id')
      if (id !== null && !validPaperId(id)) return fail('任务编号无效。')
      return json({ job: progress(id === null ? active ?? latest : jobs.get(id)) })
    }
    if (!isJson(request)) return fail('请求必须是 JSON。', 415)
    const body = await request.json().catch(() => null)
    if (!validPaperId(body?.id)) return fail('论文编号无效。')
    const paper = await storage.get(body.id)
    if (!paper) return fail('找不到这篇论文。', 404)
    if (removing.has(body.id)) return fail('论文正在删除。', 409)
    if (active) return json({ error: '已有论文正在讲解。', job: progress(active) }, 409)
    if (paper.pages.reduce((size, page) => size + page.text.length + 40, 0) > MAX_EXPLANATION_CHARACTERS) {
      return fail('论文文字超过第一版的 12 万字符讲解上限，请导入较短的论文或节选 PDF。', 422)
    }
    const job = { id: randomUUID(), paperId: paper.id, phase: 'writing', startedAt: Date.now(), controller: new AbortController() }
    active = latest = job
    jobs.set(job.id, job)
    if (jobs.size > 16) jobs.delete(jobs.keys().next().value)
    void run(job, paper)
    return json({ job: progress(job) }, 202)
  })

  register('generation/cancel', ['POST'], async request => {
    if (!isJson(request)) return fail('请求必须是 JSON。', 415)
    const body = await request.json().catch(() => null)
    if (!validPaperId(body?.id)) return fail('任务编号无效。')
    const job = jobs.get(body.id)
    if (!job) return fail('找不到这个任务。', 404)
    if (job.phase === 'saving') return fail('讲解正在保存，请等待完成。', 409)
    if (active === job) job.controller.abort()
    return json({ job: progress(job) })
  })
}
