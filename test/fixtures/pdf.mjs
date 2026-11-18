/** Small deterministic PDF, independent of the PDF parser under test. */
export function createPdf(texts, title = 'A local paper', { unicode = false, encrypted = false, wrap = false } = {}) {
  const objects = [null, '<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>']
  const kids = []
  for (const text of texts) {
    const page = objects.length
    const lines = wrap ? text.match(/.{1,78}(?:\s+|$)|\S+/g).map(line => line.trim()) : [text]
    const stream = 'BT /F1 12 Tf 72 720 Td ' + lines.map(line => '(' + line.replace(/[\\()]/g, '\\$&') + ') Tj 0 -18 Td').join(' ') + ' ET'
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${page + 1} 0 R >>`,
      `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`)
    kids.push(`${page} 0 R`)
  }
  objects[2] = `<< /Type /Pages /Count ${texts.length} /Kids [${kids.join(' ')}] >>`
  const info = objects.length
  objects.push(`<< /Title (${title.replace(/[\\()]/g, '\\$&')}) >>`)
  if (unicode) {
    const map = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /FixtureUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<00> <FF>\nendcodespacerange\n4 beginbfchar\n<41> <4E2D>\n<42> <6587>\n<43> <8BBA>\n<44> <6587>\nendbfchar\nendcmap\nCMapName currentdict /CMap defineresource pop\nend\nend'
    objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /ToUnicode ${objects.length} 0 R >>`
    objects.push(`<< /Length ${Buffer.byteLength(map)} >>\nstream\n${map}\nendstream`)
  }
  let encryption = ''
  if (encrypted) {
    encryption = `/Encrypt ${objects.length} 0 R /ID [<0123456789ABCDEF0123456789ABCDEF> <0123456789ABCDEF0123456789ABCDEF>]`
    objects.push(`<< /Filter /Standard /V 1 /R 2 /Length 40 /O <${'00'.repeat(32)}> /U <${'00'.repeat(32)}> /P -4 >>`)
  }
  let data = '%PDF-1.7\n', offsets = [0]
  for (let i = 1; i < objects.length; i++) { offsets.push(Buffer.byteLength(data)); data += `${i} 0 obj\n${objects[i]}\nendobj\n` }
  const xref = Buffer.byteLength(data)
  data += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets.slice(1).map(offset => String(offset).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size ${objects.length} /Root 1 0 R /Info ${info} 0 R ${encryption} >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(data)
}
