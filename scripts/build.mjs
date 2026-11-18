import { readFile, writeFile } from 'node:fs/promises'

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8')
const [client, styles, progress, progressStyles, content, contentStyles, calculation, html, exportStyles, exportBehavior] = await Promise.all([
  read('src/client.js'), read('src/paper-styles.css'), read('src/generation-progress.js'), read('src/progress-styles.css'),
  read('src/paper-blocks.js'), read('src/content-styles.css'), read('src/paper-calculation.js'),
  read('src/paper-html.js'), read('src/export-styles.css'), read('src/export-behavior.js'),
])
const inline = source => source.replace(/\r\n?/g, '\n').replace(/^import .* from .*\n/gm, '').replace(/^export /gm, '')
await writeFile(new URL('../client.js', import.meta.url), `;(() => {\nconst paperWikiStyles = ${JSON.stringify(styles + '\n' + progressStyles + '\n' + contentStyles)}\nconst paperExportStyles = ${JSON.stringify(exportStyles)}\nconst paperExportBehavior = ${JSON.stringify(exportBehavior)}\n${[calculation, progress, content, html, client].map(inline).join('\n')}\n})()\n`)
