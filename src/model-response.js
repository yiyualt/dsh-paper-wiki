const invalid = (code, stage) => Object.assign(new Error(code), { code, stage })
const maximumCharacters = 1_000_000
// A JSON string may escape every UTF-16 code unit as six characters.
const maximumEventCharacters = maximumCharacters * 6 + 64_000
const maximumStreamCharacters = 128_000_000
const maximumEvents = 200_000

// Buffer a complete protocol response before exposing any text or tool call.
export async function readModelResponse(response, signal) {
  signal?.throwIfAborted()
  const reader = response.body?.getReader()
  if (!reader) throw invalid('EMPTY_RESPONSE', 'BODY_READER')
  const decoder = new TextDecoder('utf-8', { fatal: true })
  const sse = /\btext\/event-stream\b/i.test(response.headers.get('content-type') ?? '')
  let buffer = '', json = '', data = [], rawCharacters = 0, eventCharacters = 0, events = 0, payloadCharacters = 0, done = false, finished
  let seenChoice = false, content = ''
  const calls = new Map()
  function payload(length) {
    payloadCharacters += length
    if (payloadCharacters > maximumCharacters) throw invalid('MALFORMED_RESPONSE', 'PAYLOAD_LIMIT')
  }
  function append(old, value) {
    if (old === value) return old
    payload(value.length)
    return old + value
  }
  function event(eof = false) {
    if (++events > maximumEvents) throw invalid('MALFORMED_RESPONSE', 'SSE_EVENT_COUNT')
    eventCharacters = 0
    if (!data.length) return
    const body = data.join('\n'); data = []
    if (body === '[DONE]') { done = true; return }
    if (done) throw invalid('MALFORMED_RESPONSE', 'SSE_AFTER_DONE')
    let item
    try { item = JSON.parse(body) } catch { throw invalid(eof ? 'STREAM_CLOSED' : 'MALFORMED_RESPONSE', eof ? 'SSE_EVENT_JSON_EOF' : 'SSE_EVENT_JSON') }
    if (!Array.isArray(item?.choices)) throw invalid('MALFORMED_RESPONSE', 'SSE_CHOICES')
    for (const choice of item.choices) {
      if (choice.index !== undefined && choice.index !== 0) continue
      seenChoice = true
      if (finished !== undefined && (choice.delta?.content || choice.delta?.tool_calls?.length)) throw invalid('MALFORMED_RESPONSE', 'SSE_AFTER_FINISH')
      const delta = choice.delta ?? {}
      if (delta.content !== undefined && delta.content !== null) {
        if (typeof delta.content !== 'string') throw invalid('MALFORMED_RESPONSE', 'SSE_CONTENT')
        payload(delta.content.length)
        content += delta.content
      }
      if (delta.tool_calls !== undefined && !Array.isArray(delta.tool_calls)) throw invalid('MALFORMED_RESPONSE', 'SSE_TOOL_CALLS')
      for (const part of delta.tool_calls ?? []) {
        if (!Number.isSafeInteger(part.index) || part.index < 0 || part.index > 63) throw invalid('MALFORMED_RESPONSE', 'SSE_TOOL_INDEX')
        const call = calls.get(part.index) ?? { id: '', type: 'function', function: { name: '', arguments: '' } }
        if (part.id !== undefined) {
          if (typeof part.id !== 'string') throw invalid('MALFORMED_RESPONSE', 'SSE_TOOL_ID')
          call.id = append(call.id, part.id)
        }
        // Some compatible streams serialize absent optional metadata as null or an empty string.
        if (part.type != null && part.type !== '' && part.type !== 'function') throw invalid('MALFORMED_RESPONSE', 'SSE_TOOL_TYPE')
        if (part.function?.name !== undefined) {
          if (typeof part.function.name !== 'string') throw invalid('MALFORMED_RESPONSE', 'SSE_TOOL_NAME')
          call.function.name = append(call.function.name, part.function.name)
        }
        if (part.function?.arguments !== undefined) {
          if (typeof part.function.arguments !== 'string') throw invalid('MALFORMED_RESPONSE', 'SSE_TOOL_ARGUMENTS')
          payload(part.function.arguments.length)
          call.function.arguments += part.function.arguments
        }
        calls.set(part.index, call)
      }
      if (choice.finish_reason !== undefined && choice.finish_reason !== null) {
        if (typeof choice.finish_reason !== 'string' || (finished !== undefined && finished !== choice.finish_reason)) throw invalid('MALFORMED_RESPONSE', 'SSE_FINISH')
        finished = choice.finish_reason
      }
    }
  }
  function line(value) {
    if (!value) { event(); return }
    eventCharacters += value.length + 1
    if (eventCharacters > maximumEventCharacters) throw invalid('MALFORMED_RESPONSE', 'SSE_EVENT_LIMIT')
    if (value === 'data' || value.startsWith('data:')) data.push(value === 'data' ? '' : value.slice(5).replace(/^ /, ''))
  }
  function lines(eof = false) {
    while (buffer.length) {
      const index = buffer.search(/[\r\n]/)
      if (index < 0 || (!eof && buffer[index] === '\r' && index === buffer.length - 1)) break
      const width = buffer[index] === '\r' && buffer[index + 1] === '\n' ? 2 : 1
      line(buffer.slice(0, index)); buffer = buffer.slice(index + width)
    }
    if (eventCharacters + buffer.length > maximumEventCharacters) throw invalid('MALFORMED_RESPONSE', 'SSE_BUFFER_LIMIT')
    if (eof) {
      if (buffer) line(buffer)
      buffer = ''; event(true)
    }
  }
  const abort = () => { void reader.cancel(signal.reason).catch(() => {}) }
  signal?.addEventListener('abort', abort, { once: true })
  try {
    while (!done) {
      signal?.throwIfAborted()
      const chunk = await reader.read()
      signal?.throwIfAborted()
      let text
      try { text = chunk.done ? decoder.decode() : decoder.decode(chunk.value, { stream: true }) }
      catch { throw invalid('STREAM_CLOSED', 'UTF8_DECODE') }
      if (sse) {
        rawCharacters += text.length
        if (rawCharacters > maximumStreamCharacters) throw invalid('MALFORMED_RESPONSE', 'SSE_RAW_LIMIT')
        buffer += text
        lines(chunk.done)
      } else {
        if (json.length + text.length > maximumCharacters) throw invalid('MALFORMED_RESPONSE', 'JSON_BODY_LIMIT')
        json += text
      }
      if (chunk.done) break
    }
    if (!sse) {
      try { return JSON.parse(json) } catch { throw invalid('MALFORMED_RESPONSE', 'JSON_BODY_PARSE') }
    }
    if (!done) throw invalid('STREAM_CLOSED', 'SSE_TERMINATOR')
    if (!seenChoice) throw invalid('STREAM_CLOSED', 'SSE_NO_CHOICE')
    if (finished === undefined) throw invalid('STREAM_CLOSED', 'SSE_NO_FINISH')
    return { choices: [{ message: { role: 'assistant', content: content || null,
      tool_calls: [...calls.entries()].sort(([a], [b]) => a - b).map(([, call]) => call) }, finish_reason: finished }] }
  } finally {
    signal?.removeEventListener('abort', abort)
    void reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
