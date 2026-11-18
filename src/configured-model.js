import { readFile } from 'node:fs/promises'
import { readModelResponse } from './model-response.js'

function failure(code) {
  return Object.assign(new Error(code), { code })
}

const retryCodes = ['TRANSPORT', 'TIMEOUT', 'STREAM_CLOSED', 'RATE_LIMIT', 'SERVER']
const allowedTools = new Set(['wiki_list', 'wiki_read', 'wiki_read_batch', 'wiki_find', 'wiki_publish'])
const safeCauses = new Set(['UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET',
  'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ERR_STREAM_PREMATURE_CLOSE'])
const safeStages = new Set(['BODY_READER', 'PAYLOAD_LIMIT', 'SSE_EVENT_COUNT', 'SSE_AFTER_DONE', 'SSE_EVENT_JSON',
  'SSE_EVENT_JSON_EOF', 'SSE_CHOICES', 'SSE_AFTER_FINISH', 'SSE_CONTENT', 'SSE_TOOL_CALLS', 'SSE_TOOL_INDEX',
  'SSE_TOOL_ID', 'SSE_TOOL_TYPE', 'SSE_TOOL_NAME', 'SSE_TOOL_ARGUMENTS', 'SSE_FINISH', 'SSE_EVENT_LIMIT',
  'SSE_BUFFER_LIMIT', 'UTF8_DECODE', 'SSE_RAW_LIMIT', 'JSON_BODY_LIMIT', 'JSON_BODY_PARSE', 'SSE_TERMINATOR',
  'SSE_NO_CHOICE', 'SSE_NO_FINISH', 'RESPONSE_READ', 'CALL_LIMIT', 'HTTP_STATUS', 'RESPONSE_SHAPE',
  'RESPONSE_FINISH', 'RESPONSE_TOOLS', 'RESPONSE_CONTENT', 'RESPONSE_EMPTY', 'TOOL_NAME', 'TOOL_ID', 'TOOL_ARGUMENTS'])
const noOuterRetries = Object.freeze({ mode: 'normal', maxRetries: 0, retryableCodes: Object.freeze(retryCodes),
  initialDelayMs: 100, maxDelayMs: 100, jitterRatio: 0 })
function transportFailure(code, status, causeCode, stage) {
  status = Number.isInteger(status) && status >= 400 && status <= 599 ? status : undefined
  causeCode = safeCauses.has(causeCode) ? causeCode : undefined
  stage = safeStages.has(stage) ? stage : undefined
  const details = [causeCode, stage].filter(Boolean)
  const message = code + (details.length ? ` (${details.join(', ')})` : '')
  const snapshot = { code, message, ...(status !== undefined && { status }) }
  return Object.assign(new Error(message), { code, ...(status !== undefined && { status }),
    ...(causeCode && { causeCode }), ...(stage && { stage }), failure: Object.freeze(snapshot) })
}
function classifyTransport(error, body = false) {
  if (retryCodes.includes(error?.code) || ['MALFORMED_RESPONSE', 'EMPTY_RESPONSE', 'AUTH', 'INVALID_REQUEST'].includes(error?.code)) {
    return transportFailure(error.code, error.status, error.causeCode, error.stage)
  }
  const causeCode = [error?.code, error?.cause?.code].find(code => safeCauses.has(code))
  return transportFailure(causeCode && /TIMEOUT|ETIMEDOUT/.test(causeCode) ? 'TIMEOUT' : body ? 'STREAM_CLOSED' : 'TRANSPORT', undefined, causeCode,
    safeStages.has(error?.stage) ? error.stage : body ? 'RESPONSE_READ' : undefined)
}
function backoff(signal) {
  signal?.throwIfAborted()
  return new Promise((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason) }
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve() }, 100)
    signal?.addEventListener('abort', abort, { once: true })
  })
}

function wireMessage(message) {
  const content = message.content.filter(block => block.type === 'text').map(block => block.text).join('\n')
  if (message.role === 'tool') return { role: 'tool', tool_call_id: message.toolCallId, content }
  if (message.role !== 'assistant') return { role: message.role === 'developer' ? 'system' : message.role, content }
  const calls = message.content.filter(block => block.type === 'tool-call').map(block => ({
    id: block.id, type: 'function', function: { name: block.name, arguments: block.arguments },
  }))
  return { role: 'assistant', content: content || null, ...(calls.length && { tool_calls: calls }) }
}

export async function readConfiguredModel(configFile, signal, { toolCallLimit = 28, streamResponses = false, transportRetries = 0 } = {}) {
  if (!Number.isInteger(toolCallLimit) || toolCallLimit < 1 || toolCallLimit > 96 || typeof streamResponses !== 'boolean'
    || !Number.isInteger(transportRetries) || transportRetries < 0 || transportRetries > 2) throw failure('MODEL_CONFIG')
  const wikiTransport = streamResponses || transportRetries > 0
  let config
  let endpoint
  try {
    config = JSON.parse(await readFile(configFile, { encoding: 'utf8', signal })).judge
    endpoint = new URL(config.url)
  } catch {
    throw failure('MODEL_CONFIG')
  }

  if (!['http:', 'https:'].includes(endpoint.protocol) || endpoint.username || endpoint.password
    || endpoint.search || endpoint.hash || !endpoint.pathname.endsWith('/chat/completions')
    || typeof config.model !== 'string' || !config.model.trim()) throw failure('MODEL_CONFIG')

  const envKey = typeof config.api_key_env === 'string' ? process.env[config.api_key_env] : undefined
  const key = envKey?.trim() || (typeof config.api_key === 'string' && config.api_key.trim())
  if (!key) throw failure('MISSING_CREDENTIAL')
  const headers = new Headers(config.headers ?? {})
  headers.set('content-type', 'application/json')
  headers.set('authorization', `Bearer ${key}`)
  if (!headers.has('user-agent')) headers.set('user-agent', 'DSH Paper Wiki')

  let calls = 0
  const adapter = {
    model: config.model,
    providerInfo: provider => ({ id: provider, name: 'Paper Wiki GPT' }),
    providerRetryPolicy: () => wikiTransport ? noOuterRetries : undefined,
    listModels: async provider => [{ provider, id: config.model, name: config.model }],
    async prepareCall(provider, model) {
      return { model: { provider, id: model, name: model }, stream: options => adapter.stream(options) }
    },
    async *stream({ system, messages, maxTokens, tools, signal }) {
      if (tools?.length && ++calls > toolCallLimit) throw wikiTransport ? transportFailure('INVALID_REQUEST', undefined, undefined, 'CALL_LIMIT') : failure('INVALID_REQUEST')
      const reasoning = config.extra_body?.reasoning_effort
      const request = {
        model: config.model,
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          ...messages.map(wireMessage),
        ],
        max_tokens: Number.isInteger(config.max_tokens) && config.max_tokens > 0
          ? Math.min(maxTokens, config.max_tokens) : maxTokens,
        ...(typeof reasoning === 'string' && reasoning !== 'none' ? { reasoning_effort: reasoning } : {}),
        ...(streamResponses && { stream: true }),
        ...(tools?.length && { tools: tools.map(({ name, description, parameters }) => ({
          type: 'function', function: { name, description, parameters },
        })) }),
      }
      let data
      if (wikiTransport) {
        for (let attempt = 0; attempt <= transportRetries; attempt++) {
          let response
          try {
            signal?.throwIfAborted()
            try { response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(request), redirect: 'error', signal }) }
            catch (error) { signal?.throwIfAborted(); throw classifyTransport(error) }
            if (!response.ok) {
              await response.body?.cancel().catch(() => {})
              const status = response.status
              throw transportFailure(status >= 500 ? 'SERVER' : status === 429 ? 'RATE_LIMIT'
                : status === 401 || status === 403 ? 'AUTH' : 'INVALID_REQUEST', status, undefined, 'HTTP_STATUS')
            }
            try { data = await readModelResponse(response, signal) }
            catch (error) { signal?.throwIfAborted(); throw classifyTransport(error, true) }
            break
          } catch (error) {
            signal?.throwIfAborted()
            if (attempt === transportRetries || !retryCodes.includes(error.code)) throw error
            await backoff(signal)
          }
        }
      } else {
        let response
        try {
          response = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(request), redirect: 'error', signal })
        } catch { throw failure('TRANSPORT') }
        if (!response.ok) {
          await response.body?.cancel()
          const status = response.status
          const code = status >= 500 ? 'SERVER' : status === 429 ? 'RATE_LIMIT'
            : status === 401 || status === 403 ? 'AUTH' : 'INVALID_REQUEST'
          throw Object.assign(failure(code), { status })
        }
        data = await response.json().catch(() => undefined)
      }
      const choice = data?.choices?.[0]
      const content = choice?.message?.content
      const toolCalls = choice?.message?.tool_calls ?? []
      const limited = wikiTransport && !['stop', 'tool_calls'].includes(choice?.finish_reason)
      if (wikiTransport) {
        if (!choice) throw transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'RESPONSE_SHAPE')
        if (typeof choice.finish_reason !== 'string') throw transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'RESPONSE_FINISH')
        if (!Array.isArray(toolCalls)) throw transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'RESPONSE_TOOLS')
        if (content !== null && content !== undefined && typeof content !== 'string') throw transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'RESPONSE_CONTENT')
      }
      if ((typeof content !== 'string' || !content.trim()) && !toolCalls.length && !limited) {
        throw wikiTransport ? transportFailure('EMPTY_RESPONSE', undefined, undefined, 'RESPONSE_EMPTY') : failure('EMPTY_RESPONSE')
      }
      // Validate every call before yielding the first block, and discard token-limited tool fragments.
      const callIds = new Set()
      if (wikiTransport && !limited) for (const call of toolCalls) {
        if (!allowedTools.has(call?.function?.name) || !tools?.some(tool => tool.name === call?.function?.name)) throw transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'TOOL_NAME')
        if (typeof call.id !== 'string' || !call.id || callIds.has(call.id)) throw transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'TOOL_ID')
        if (typeof call.function?.arguments !== 'string') throw transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'TOOL_ARGUMENTS')
        callIds.add(call.id)
        try { const args = JSON.parse(call.function.arguments); if (!args || typeof args !== 'object' || Array.isArray(args)) throw 0 }
        catch { throw transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'TOOL_ARGUMENTS') }
      }
      let index = 0
      if (typeof content === 'string' && content.trim()) {
        yield { type: 'block-start', index, blockType: 'text' }
        yield { type: 'text-delta', index, text: content }
        yield { type: 'block-end', index: index++, block: { type: 'text', text: content } }
      }
      for (const call of limited ? [] : toolCalls) {
        const name = call?.function?.name
        const args = call?.function?.arguments
        if (!tools?.some(tool => tool.name === name) || !['wiki_list', 'wiki_read', 'wiki_read_batch', 'wiki_find', 'wiki_publish'].includes(name)) {
          throw wikiTransport ? transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'TOOL_NAME') : failure('MALFORMED_RESPONSE')
        }
        if (typeof call.id !== 'string') throw wikiTransport ? transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'TOOL_ID') : failure('MALFORMED_RESPONSE')
        if (typeof args !== 'string') throw wikiTransport ? transportFailure('MALFORMED_RESPONSE', undefined, undefined, 'TOOL_ARGUMENTS') : failure('MALFORMED_RESPONSE')
        yield { type: 'block-start', index, blockType: 'tool-call' }
        yield { type: 'tool-call-delta', index, id: call.id, name, argumentsDelta: args }
        yield { type: 'block-end', index: index++, block: { type: 'tool-call', id: call.id, name, arguments: args } }
      }
      const kind = limited ? 'max-tokens' : toolCalls.length ? 'tool-calls' : choice.finish_reason === 'stop' ? 'stop' : 'max-tokens'
      yield { type: 'finish', reason: { kind } }
    },
  }
  return adapter
}
