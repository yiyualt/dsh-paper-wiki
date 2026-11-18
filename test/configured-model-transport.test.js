import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { readConfiguredModel } from '../src/configured-model.js'

const tools = ['wiki_read', 'wiki_publish'].map(name => ({ name, parameters: { type: 'object' } }))
const encoder = new TextEncoder()
const event = choice => 'data: ' + JSON.stringify({ choices: [{ index: 0, ...choice }] }) + '\r\n\r\n'
const completion = text => event({ delta: { role: 'assistant', content: text } })
  + event({ delta: {}, finish_reason: 'stop' }) + 'data: [DONE]\r\n\r\n'
function sse(text, width = 7) {
  const bytes = typeof text === 'string' ? encoder.encode(text) : text
  return new Response(new ReadableStream({ start(controller) {
    for (let index = 0; index < bytes.length; index += width) controller.enqueue(bytes.slice(index, index + width))
    controller.close()
  } }), { headers: { 'content-type': 'text/event-stream; charset=utf-8' } })
}
const json = (content = 'ready', finish_reason = 'stop', tool_calls = []) => Response.json({
  choices: [{ message: { content, tool_calls }, finish_reason }],
})
const consume = async (adapter, options = {}) => {
  const chunks = []
  for await (const chunk of adapter.stream({ messages: [], maxTokens: 20_000, tools,
    signal: new AbortController().signal, ...options })) chunks.push(chunk)
  return chunks
}
async function fixture(t, fetch, options = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'wiki-model-transport-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const config = join(dir, 'config.json')
  await writeFile(config, JSON.stringify({ judge: { url: 'https://model.invalid/chat/completions', model: 'fixture', api_key: 'dummy-test' } }))
  const original = globalThis.fetch
  globalThis.fetch = fetch
  t.after(() => { globalThis.fetch = original })
  return readConfiguredModel(config, new AbortController().signal, { streamResponses: true, transportRetries: 1, ...options })
}

test('Wiki SSE reconstructs UTF-8 text and interleaved indexed tool fragments before yielding complete calls', async t => {
  let body
  const wire = event({ delta: { content: '中文说明' } })
    + event({ delta: { tool_calls: [{ index: 1, id: 'read_1', function: { name: 'wiki_read', arguments: '{"path":"' } }] } })
    + event({ delta: { tool_calls: [{ index: 0, id: 'publish_', function: { name: 'wiki_pub', arguments: '{"kind":' } }] } })
    + event({ delta: { tool_calls: [{ index: 1, function: { arguments: '中文.py"}' } },
      { index: 0, id: '0', function: { name: 'lish', arguments: '"plan"}' } }] } })
    + event({ delta: {}, finish_reason: 'tool_calls' }) + 'data: [DONE]\r\n\r\n'
  const adapter = await fixture(t, async (_url, options) => { body = JSON.parse(options.body); return sse(wire, 1) })
  const chunks = await consume(adapter)
  assert.equal(body.stream, true)
  assert.equal(chunks.find(chunk => chunk.type === 'text-delta').text, '中文说明')
  assert.deepEqual(chunks.filter(chunk => chunk.type === 'block-end' && chunk.block.type === 'tool-call').map(chunk => chunk.block), [
    { type: 'tool-call', id: 'publish_0', name: 'wiki_publish', arguments: '{"kind":"plan"}' },
    { type: 'tool-call', id: 'read_1', name: 'wiki_read', arguments: '{"path":"中文.py"}' },
  ])
  assert.equal(chunks.at(-1).reason.kind, 'tool-calls')
  assert.equal(adapter.providerRetryPolicy().maxRetries, 0)
})

test('Wiki SSE accepts absent, null and empty optional tool types in interleaved calls', async t => {
  let wire
  const adapter = await fixture(t, async () => sse(wire, 1))
  for (const type of [undefined, null, '', 'function']) {
    wire = event({ delta: { tool_calls: [
      { index: 1, id: 'read_optional', type, function: { name: 'wiki_read', arguments: '{"path":' } },
      { index: 0, id: 'publish_optional', type, function: { name: 'wiki_publish', arguments: '{"kind":' } },
    ] } })
      + event({ delta: { tool_calls: [
        { index: 0, type: null, function: { arguments: '"plan"}' } },
        { index: 1, type: '', function: { arguments: '"core.js"}' } },
      ] } })
      + event({ delta: {}, finish_reason: 'tool_calls' }) + 'data: [DONE]\r\n\r\n'
    const chunks = await consume(adapter)
    assert.deepEqual(chunks.filter(chunk => chunk.type === 'block-end' && chunk.block.type === 'tool-call').map(chunk => chunk.block), [
      { type: 'tool-call', id: 'publish_optional', name: 'wiki_publish', arguments: '{"kind":"plan"}' },
      { type: 'tool-call', id: 'read_optional', name: 'wiki_read', arguments: '{"path":"core.js"}' },
    ])
    assert.equal(chunks.at(-1).reason.kind, 'tool-calls')
  }
})

test('Wiki SSE still rejects invalid tool types atomically without retry', async t => {
  let wire, requests = 0
  const adapter = await fixture(t, async () => { requests++; return sse(wire) })
  for (const type of ['custom', 'function_call', 0, false, {}, []]) {
    wire = event({ delta: { content: 'must not expose this text', tool_calls: [
      { index: 0, id: 'valid_first', type: 'function', function: { name: 'wiki_read', arguments: '{"path":"core.js"}' } },
    ] } })
      + event({ delta: { tool_calls: [
        { index: 1, id: 'invalid_second', type, function: { name: 'wiki_read', arguments: '{"path":"other.js"}' } },
      ] } })
      + event({ delta: {}, finish_reason: 'tool_calls' }) + 'data: [DONE]\r\n\r\n'
    const seen = [], before = requests
    await assert.rejects(async () => {
      for await (const chunk of adapter.stream({ messages: [], tools, maxTokens: 100 })) seen.push(chunk)
    }, error => error.code === 'MALFORMED_RESPONSE' && error.stage === 'SSE_TOOL_TYPE')
    assert.deepEqual(seen, [])
    assert.equal(requests - before, 1)
  }
})

test('an unfinished SSE response yields no text or tools while completion is still pending', async t => {
  let controller, settled = false
  const adapter = await fixture(t, async () => new Response(new ReadableStream({ start(value) {
    controller = value; controller.enqueue(encoder.encode(event({ delta: { content: '尚未完整' } })))
  } }), { headers: { 'content-type': 'text/event-stream' } }))
  const iterator = adapter.stream({ messages: [], maxTokens: 100, signal: new AbortController().signal })
  const pending = iterator.next().then(value => { settled = true; return value })
  await new Promise(resolve => setTimeout(resolve, 10))
  assert.equal(settled, false)
  controller.enqueue(encoder.encode(event({ delta: {}, finish_reason: 'stop' }) + 'data: [DONE]\n\n'))
  assert.equal((await pending).value.type, 'block-start')
  for await (const _ of iterator) {}
})

test('truncated streams retry once without exposing the first partial attempt or spending another tool turn', async t => {
  let requests = 0
  const adapter = await fixture(t, async () => ++requests === 1
    ? sse(event({ delta: { content: 'discarded partial attempt' } })) : sse(completion('完整结果')),
  { toolCallLimit: 1 })
  const chunks = await consume(adapter)
  assert.equal(requests, 2)
  assert.deepEqual(chunks.filter(chunk => chunk.type === 'text-delta').map(chunk => chunk.text), ['完整结果'])
  await assert.rejects(consume(adapter), error => error.code === 'INVALID_REQUEST')
  assert.equal(requests, 2)
})

test('a truncated final UTF-8 character closes the stream and can be retried safely', async t => {
  let requests = 0
  const prefix = encoder.encode('data: {"choices":[{"delta":{"content":"中')
  const adapter = await fixture(t, async () => ++requests === 1 ? sse(prefix.slice(0, -1), 1) : sse(completion('中文'), 2))
  assert.equal((await consume(adapter)).find(chunk => chunk.type === 'text-delta').text, '中文')
  assert.equal(requests, 2)
})

test('Wiki streaming mode accepts gateways returning complete JSON and never executes token-limited tool fragments', async t => {
  let requests = 0
  const adapter = await fixture(t, async () => ++requests === 1 ? json('JSON fallback')
    : json(null, 'length', [{ id: 'call_1', function: { name: 'wiki_read', arguments: '{"path":' } }]))
  assert.equal((await consume(adapter)).find(chunk => chunk.type === 'text-delta').text, 'JSON fallback')
  assert.deepEqual(await consume(adapter), [{ type: 'finish', reason: { kind: 'max-tokens' } }])
  assert.equal(requests, 2)
})

test('completed SSE length takes priority over any collected tool calls', async t => {
  const adapter = await fixture(t, async () => sse(event({ delta: { tool_calls: [{ index: 0, id: 'call',
    function: { name: 'wiki_read', arguments: '{"path":' } }] } })
    + event({ delta: {}, finish_reason: 'length' }) + 'data: [DONE]\n\n'))
  assert.deepEqual(await consume(adapter), [{ type: 'finish', reason: { kind: 'max-tokens' } }])
})

test('429 and 5xx responses retry once, while auth, 400 and malformed tool responses fail without retry', async t => {
  let requests = 0, status = 503
  const adapter = await fixture(t, async () => {
    requests++
    if ((status === 503 || status === 429) && requests % 2 === 0) return json()
    if (status === 200) return json('text must not leak', 'tool_calls', [{ id: 'bad', function: { name: 'wiki_read', arguments: '{' } }])
    return new Response('sensitive provider body', { status })
  })
  for (status of [503, 429]) { const before = requests; await consume(adapter); assert.equal(requests - before, 2) }
  for (status of [401, 400, 200]) {
    const before = requests, seen = []
    await assert.rejects(async () => { for await (const chunk of adapter.stream({ messages: [], tools, maxTokens: 100 })) seen.push(chunk) },
      error => ['AUTH', 'INVALID_REQUEST', 'MALFORMED_RESPONSE'].includes(error.code) && !JSON.stringify(error.failure).includes('sensitive'))
    assert.equal(requests - before, 1); assert.deepEqual(seen, [])
  }
})

test('Wiki transport retries are bounded at two and preserve only safe failure snapshots and cause codes', async t => {
  let requests = 0
  const adapter = await fixture(t, async () => {
    requests++
    throw Object.assign(new Error('https://private.invalid/?api_key=never-print'), { cause: { code: 'ECONNRESET' } })
  }, { transportRetries: 2 })
  await assert.rejects(consume(adapter), error => {
    assert.equal(error.code, 'TRANSPORT'); assert.equal(error.causeCode, 'ECONNRESET')
    assert.deepEqual(error.failure, { code: 'TRANSPORT', message: 'TRANSPORT (ECONNRESET)' })
    assert.doesNotMatch(JSON.stringify(error), /private|api_key|never-print/)
    return true
  })
  assert.equal(requests, 3)
})

test('known timeout causes retain their safe classification and the configured one-retry bound', async t => {
  let requests = 0
  const adapter = await fixture(t, async () => { requests++; throw Object.assign(new Error('fetch failed'), { cause: { code: 'UND_ERR_HEADERS_TIMEOUT' } }) })
  await assert.rejects(consume(adapter), error => error.code === 'TIMEOUT' && error.failure.code === 'TIMEOUT'
    && error.failure.message === 'TIMEOUT (UND_ERR_HEADERS_TIMEOUT)')
  assert.equal(requests, 2)
})

test('terminal stream truncation and any malformed call discard the entire response before yielding', async t => {
  let requests = 0, malformed = false
  const adapter = await fixture(t, async () => {
    requests++
    if (!malformed) return sse(event({ delta: { content: 'never expose incomplete response', tool_calls: [{ index: 0, id: 'call',
      function: { name: 'wiki_read', arguments: '{"path":"core.js"}' } }] } }))
    return json('never expose malformed response', 'tool_calls', [
      { id: 'first', function: { name: 'wiki_read', arguments: '{"path":"core.js"}' } },
      { id: 'second', function: { name: 'wiki_read', arguments: '{' } },
    ])
  }, { transportRetries: 2 })
  const seen = []
  await assert.rejects(async () => { for await (const chunk of adapter.stream({ messages: [], tools, maxTokens: 100 })) seen.push(chunk) },
    error => error.code === 'STREAM_CLOSED' && error.failure.code === 'STREAM_CLOSED')
  assert.equal(requests, 3); assert.deepEqual(seen, [])
  malformed = true
  await assert.rejects(async () => { for await (const chunk of adapter.stream({ messages: [], tools, maxTokens: 100 })) seen.push(chunk) },
    error => error.code === 'MALFORMED_RESPONSE')
  assert.equal(requests, 4); assert.deepEqual(seen, [])
})

test('unrecognized network details never enter the safe error snapshot', async t => {
  const adapter = await fixture(t, async () => { throw Object.assign(new Error('secret-url'), {
    code: 'TRANSPORT', status: 'https://secret.invalid', causeCode: 'secret-key', stage: 'PROVIDER_STAGE_secret-key',
  }) }, { transportRetries: 0 })
  await assert.rejects(consume(adapter), error => {
    assert.deepEqual(error.failure, { code: 'TRANSPORT', message: 'TRANSPORT' })
    assert.doesNotMatch(JSON.stringify(error), /secret/)
    return true
  })
})

test('abort cancels pending fetch, pending SSE reading and retry backoff without another attempt', async t => {
  let mode = 'fetch', requests = 0, cancelled = false
  const adapter = await fixture(t, async (_url, options) => {
    requests++
    if (mode === 'fetch') return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason), { once: true }))
    if (mode === 'body') return new Response(new ReadableStream({ cancel() { cancelled = true } }), { headers: { 'content-type': 'text/event-stream' } })
    throw new Error('network failed')
  }, { transportRetries: 2 })
  for (mode of ['fetch', 'body', 'backoff']) {
    const before = requests, controller = new AbortController(), reason = new Error('cancelled by test')
    const pending = consume(adapter, { signal: controller.signal })
    setTimeout(() => controller.abort(reason), 10)
    await assert.rejects(pending, error => error === reason)
    assert.equal(requests - before, 1)
  }
  assert.equal(cancelled, true)
})

test('legacy adapter defaults keep JSON requests, the existing error shape and existing retry policy', async t => {
  let body, fail = false, requests = 0, length = false
  const adapter = await fixture(t, async (_url, options) => {
    requests++; body = JSON.parse(options.body)
    if (fail) throw new Error('network failed')
    if (length) return json(null, 'length', [{ id: 'legacy', function: { name: 'wiki_read', arguments: '{"path":"core.js"}' } }])
    return json('legacy')
  }, { streamResponses: false, transportRetries: 0 })
  assert.equal((await consume(adapter)).find(chunk => chunk.type === 'text-delta').text, 'legacy')
  assert.equal(Object.hasOwn(body, 'stream'), false)
  assert.equal(adapter.providerRetryPolicy(), undefined)
  length = true
  assert.equal((await consume(adapter)).at(-1).reason.kind, 'tool-calls')
  fail = true
  await assert.rejects(consume(adapter), error => error.code === 'TRANSPORT' && error.failure === undefined)
  assert.equal(requests, 3)
})

test('Wiki transport options reject unbounded retries and invalid mode types before reading configuration', async () => {
  for (const options of [{ transportRetries: 3 }, { transportRetries: -1 }, { transportRetries: 1.5 }, { streamResponses: 'yes' }]) {
    await assert.rejects(readConfiguredModel('not-read.json', new AbortController().signal, options), error => error.code === 'MODEL_CONFIG')
  }
})

test('large healthy SSE envelopes preserve small tool payloads across many fragmented events', async t => {
  const argumentsText = JSON.stringify({ kind: 'section', text: '完整说明。'.repeat(1200) })
  const frame = choice => 'data: ' + JSON.stringify({
    id: 'chatcmpl-healthy-stream-with-repeated-protocol-metadata', object: 'chat.completion.chunk', created: 1700000000,
    model: 'compatible-reasoning-model-with-long-version-name', choices: [{ index: 0, ...choice }],
  }) + '\r\n\r\n'
  const wire = frame({ delta: { content: 'Ready.', tool_calls: [{ index: 0, id: 'publish_healthy',
    type: 'function', function: { name: 'wiki_publish', arguments: '' } }] } })
    + Array.from(argumentsText, char => frame({ delta: { tool_calls: [{ index: 0, function: { arguments: char } }] } })).join('')
    + frame({ delta: {}, finish_reason: 'tool_calls' }) + 'data: [DONE]\r\n\r\n'
  assert(wire.length > 1_000_000, 'The protocol envelope exceeds the old raw-stream limit')
  assert(argumentsText.length < 10_000, 'The actual generated payload is small')
  let requests = 0
  const adapter = await fixture(t, async () => { requests++; return sse(wire, 257) })
  const chunks = await consume(adapter)
  assert.equal(requests, 1)
  assert.equal(chunks.find(chunk => chunk.type === 'text-delta').text, 'Ready.')
  assert.deepEqual(chunks.filter(chunk => chunk.type === 'block-end' && chunk.block.type === 'tool-call').map(chunk => chunk.block), [
    { type: 'tool-call', id: 'publish_healthy', name: 'wiki_publish', arguments: argumentsText },
  ])
  assert.equal(chunks.at(-1).reason.kind, 'tool-calls')
})

test('one coalesced network chunk may contain more than a single SSE event budget in healthy small events', async t => {
  const frame = 'data: ' + JSON.stringify({ id: 'chatcmpl-' + 'm'.repeat(300), object: 'chat.completion.chunk',
    created: 1700000000, model: 'compatible-model', choices: [{ index: 0, delta: { content: 'x' } }] }) + '\n\n'
  const wire = frame.repeat(16_000) + event({ delta: {}, finish_reason: 'stop' }) + 'data: [DONE]\n\n'
  assert(wire.length > 7_000_000)
  const adapter = await fixture(t, async () => sse(wire, encoder.encode(wire).length))
  const chunks = await consume(adapter)
  assert.equal(chunks.find(chunk => chunk.type === 'text-delta').text, 'x'.repeat(16_000))
})

test('SSE net payload limits count text and every stored tool field before exposing any partial output', async t => {
  let wire
  const adapter = await fixture(t, async () => sse(wire, 65_536), { transportRetries: 0 })
  const args = JSON.stringify({ text: 'x'.repeat(399_980) })
  const id = 'i'.repeat(100_000), name = 'wiki_publish', content = 'c'.repeat(500_000)
  assert(content.length + id.length + args.length < 1_000_000)
  assert(content.length + id.length + args.length + name.length > 1_000_000)
  for (wire of [
    event({ delta: { content: 'x'.repeat(600_001) } }) + event({ delta: { content: 'y'.repeat(400_000) } }),
    event({ delta: { content, tool_calls: [{ index: 0, id, function: { name, arguments: args } }] } }),
  ]) {
    wire += event({ delta: {}, finish_reason: 'tool_calls' }) + 'data: [DONE]\n\n'
    const seen = []
    await assert.rejects(async () => { for await (const chunk of adapter.stream({ messages: [], tools, maxTokens: 20_000 })) seen.push(chunk) },
      error => error.code === 'MALFORMED_RESPONSE')
    assert.deepEqual(seen, [])
  }
})

test('SSE bounds stop oversized unfinished event buffers and lines before EOF', async t => {
  let suffix = '', cancelled = 0
  const adapter = await fixture(t, async () => new Response(new ReadableStream({
    start(controller) { controller.enqueue(encoder.encode(':' + 'x'.repeat(7_000_000) + suffix)) },
    cancel() { cancelled++ },
  }), { headers: { 'content-type': 'text/event-stream' } }), { transportRetries: 0 })
  for (suffix of ['', '\n']) {
    await assert.rejects(consume(adapter, { signal: AbortSignal.timeout(2000) }), error => error.code === 'MALFORMED_RESPONSE')
  }
  assert.equal(cancelled, 2)
})

test('excessive empty heartbeat frames and oversized JSON fallback bodies remain bounded', async t => {
  let response = sse('\n'.repeat(200_001) + completion('never expose this'), 65_536)
  const adapter = await fixture(t, async () => response, { transportRetries: 0 })
  await assert.rejects(consume(adapter), error => error.code === 'MALFORMED_RESPONSE')
  response = json('x'.repeat(1_000_000))
  await assert.rejects(consume(adapter), error => error.code === 'MALFORMED_RESPONSE')
})


test('safe protocol stages survive classification while arbitrary provider stages never enter snapshots', async t => {
  let stage = 'TOOL_ARGUMENTS'
  const adapter = await fixture(t, async () => { throw Object.assign(new Error('never-print-this-provider-body'), {
    code: 'MALFORMED_RESPONSE', stage, causeCode: 'ECONNRESET',
  }) }, { transportRetries: 0 })
  await assert.rejects(consume(adapter), error => {
    assert.equal(error.stage, 'TOOL_ARGUMENTS')
    assert.equal(error.causeCode, 'ECONNRESET')
    assert.deepEqual(error.failure, { code: 'MALFORMED_RESPONSE', message: 'MALFORMED_RESPONSE (ECONNRESET, TOOL_ARGUMENTS)' })
    assert.doesNotMatch(JSON.stringify(error), /never-print/)
    return true
  })
  for (stage of ['PROVIDER_STAGE', 'https://private.invalid/?api_key=never-print-this-key']) {
    await assert.rejects(consume(adapter), error => {
      assert.equal(error.stage, undefined)
      assert.deepEqual(error.failure, { code: 'MALFORMED_RESPONSE', message: 'MALFORMED_RESPONSE (ECONNRESET)' })
      assert.doesNotMatch(JSON.stringify(error), /PROVIDER_STAGE|private|api_key|never-print/)
      return true
    })
  }
})

test('parser and adapter validation branches report fixed stages without exposing response text or tool arguments', async t => {
  let response
  const adapter = await fixture(t, async () => response(), { transportRetries: 0 })
  const call = (id, name = 'wiki_read', args = '{"path":"core.js"}') => ({ id, function: { name, arguments: args } })
  const cases = [
    ['JSON_BODY_PARSE', 'MALFORMED_RESPONSE', () => new Response('{"choices":', { headers: { 'content-type': 'application/json' } })],
    ['SSE_CHOICES', 'MALFORMED_RESPONSE', () => sse('data: {"error":"never-print-this-provider-body"}\n\n')],
    ['SSE_TOOL_INDEX', 'MALFORMED_RESPONSE', () => sse(event({ delta: { tool_calls: [{ index: '0', ...call('tool') }] } }))],
    ['SSE_TERMINATOR', 'STREAM_CLOSED', () => sse(event({ delta: { content: 'never-print-this-provider-body' } }))],
    ['RESPONSE_SHAPE', 'MALFORMED_RESPONSE', () => Response.json({ choices: [] })],
    ['RESPONSE_FINISH', 'MALFORMED_RESPONSE', () => Response.json({ choices: [{ message: { content: 'never-print-this-provider-body' } }] })],
    ['RESPONSE_TOOLS', 'MALFORMED_RESPONSE', () => json('never-print-this-provider-body', 'stop', {})],
    ['RESPONSE_CONTENT', 'MALFORMED_RESPONSE', () => json(['never-print-this-provider-body'])],
    ['RESPONSE_EMPTY', 'EMPTY_RESPONSE', () => json(null)],
    ['TOOL_NAME', 'MALFORMED_RESPONSE', () => json('never-print-this-provider-body', 'tool_calls', [call('tool', 'never-print-this-provider-tool')])],
    ['TOOL_ID', 'MALFORMED_RESPONSE', () => json('never-print-this-provider-body', 'tool_calls', [call('duplicate'), call('duplicate')])],
    ['TOOL_ARGUMENTS', 'MALFORMED_RESPONSE', () => json('never-print-this-provider-body', 'tool_calls', [call('tool', 'wiki_read', '{"never-print-this-argument":')])],
  ]
  for (const [stage, code, create] of cases) {
    response = create
    const seen = []
    await assert.rejects(async () => { for await (const chunk of adapter.stream({ messages: [], tools, maxTokens: 100 })) seen.push(chunk) }, error => {
      assert.equal(error.code, code)
      assert.equal(error.stage, stage)
      assert.equal(error.failure.message, code + ' (' + stage + ')')
      assert.doesNotMatch(JSON.stringify(error), /never-print/)
      return true
    })
    assert.deepEqual(seen, [], stage + ' must remain atomic')
  }
})
