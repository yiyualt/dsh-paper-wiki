import { readFile, writeFile } from 'node:fs/promises'

const [client, styles] = await Promise.all([
  readFile(new URL('../src/client.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/paper-styles.css', import.meta.url), 'utf8'),
])
await writeFile(new URL('../client.js', import.meta.url), `;(() => {\nconst paperWikiStyles = ${JSON.stringify(styles.replace(/\r\n?/g, '\n'))}\n${client.replace(/\r\n?/g, '\n')}\n})()\n`)
