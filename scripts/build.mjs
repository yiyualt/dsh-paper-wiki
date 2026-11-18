import { readFile, writeFile } from 'node:fs/promises'

const [client, styles, progress, progressStyles, content, contentStyles] = await Promise.all([
  readFile(new URL('../src/client.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/paper-styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/generation-progress.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/progress-styles.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/paper-blocks.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/content-styles.css', import.meta.url), 'utf8'),
])
await writeFile(new URL('../client.js', import.meta.url), `;(() => {\nconst paperWikiStyles = ${JSON.stringify((styles + '\n' + progressStyles + '\n' + contentStyles).replace(/\r\n?/g, '\n'))}\n${progress.replace(/\r\n?/g, '\n').replace(/^export /gm, '')}\n${content.replace(/\r\n?/g, '\n').replace(/^export /gm, '')}\n${client.replace(/\r\n?/g, '\n')}\n})()\n`)
