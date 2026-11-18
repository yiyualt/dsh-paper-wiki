import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const root = dirname(dirname(fileURLToPath(import.meta.url)))
const temporary = await mkdtemp(join(tmpdir(), 'dsh-paper-wiki-package-'))
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const npmCli = process.env.npm_execpath
assert(npmCli, 'Run this check with npm run check:package')
const npm = args => exec(process.execPath, [npmCli, ...args], {
  cwd: root, timeout: 120_000, maxBuffer: 4 * 1024 * 1024, windowsHide: true,
})

try {
  const builtClient = await readFile(join(root, 'client.js'))
  const { stdout } = await npm(['pack', '--json', '--ignore-scripts', '--pack-destination', temporary])
  const [packed] = JSON.parse(stdout)
  assert.equal(packed.version, manifest.version)
  const paths = packed.files.map(file => file.path)
  const allowed = new Set([...manifest.files, 'package.json', 'README.md', 'src/client.js'])
  for (const path of paths) assert(allowed.has(path), `Unexpected package file: ${path}`)
  for (const path of manifest.files) assert(paths.includes(path), `Missing runtime file: ${path}`)
  assert(paths.includes('THIRD_PARTY_NOTICES.md'))

  const install = join(temporary, 'install')
  await npm(['install', '--prefix', install, '--offline', '--ignore-scripts', '--no-audit', '--no-fund',
    '--package-lock=false', join(temporary, packed.filename)])
  const installed = join(install, 'node_modules', manifest.name)
  for (const path of paths) {
    const bytes = await readFile(join(installed, path))
    if (path.endsWith('.js')) await exec(process.execPath, ['--check', join(installed, path)], {
      timeout: 30_000, windowsHide: true,
    })
    if (path === 'client.js') assert(bytes.equals(builtClient), 'Packaged browser bundle differs from the build')
  }

  const probe = join(install, 'probe.mjs')
  await writeFile(probe, `import assert from 'node:assert/strict'\nimport {readFile} from 'node:fs/promises'\n` +
    `import {apply, name, inject} from 'dsh-paper-wiki'\n` +
    `assert.equal(name, 'dsh-paper-wiki'); assert.equal(typeof apply, 'function'); assert(Array.isArray(inject))\n` +
    `const manifest=JSON.parse(await readFile(new URL(import.meta.resolve('dsh-paper-wiki/package.json'))))\n` +
    `assert.equal(manifest.version, ${JSON.stringify(manifest.version)})\n` +
    `assert(import.meta.resolve('dsh-paper-wiki/client').endsWith('/client.js'))\n` +
    `const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs')\n` +
    `assert.equal(typeof pdfjs.getDocument, 'function'); assert.equal(pdfjs.version, ${JSON.stringify(manifest.dependencies['pdfjs-dist'])})\n`)
  await exec(process.execPath, [probe], { cwd: install, timeout: 30_000, windowsHide: true })
  const sha256 = createHash('sha256').update(await readFile(join(temporary, packed.filename))).digest('hex')
  console.log(JSON.stringify({ version: manifest.version, files: paths.length, cleanOfflineInstall: true,
    syntax: 'passed', exports: 'passed', pdfDependency: 'passed', browserBundle: 'identical', sha256 }, null, 2))
} finally {
  await rm(temporary, { recursive: true, force: true })
}
