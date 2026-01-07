import JSZip from 'jszip'

export interface BookMeta {
  title: string
  author: string
  authors?: string[]
  publisher: string
  isbn: string
  cover: {
    mime: string
    path: string
    data: ArrayBuffer | null
  } | null
  identifiers?: { id?: string; scheme?: string; value: string }[]
  subjects?: string[]
  languages?: string[]
  description?: string
  contributors?: string[]
  dates?: { event?: string; value: string }[]
  rights?: string
  sources?: string[]
  relations?: string[]
  coverage?: string
  type?: string
  format?: string
  meta?: { name?: string; property?: string; content?: string }[]
  manifest?: { id: string; href: string; mediaType: string; properties?: string }[]
  spine?: { idref: string; linear?: string; properties?: string }[]
  tocNav?: { label: string; href: string }[]
  tocNcx?: { label: string; src: string }[]
}

function text(el: Element | null) {
  return el ? (el.textContent ?? '').trim() : ''
}

function texts(parent: Element | null, selector: string) {
  if (!parent) return [] as string[]
  return Array.from(parent.querySelectorAll(selector))
    .map((e) => text(e))
    .filter(Boolean)
}

function detectIsbnFromIdentifiers(ids: { scheme?: string; value: string }[]) {
  for (const it of ids) {
    const scheme = (it.scheme || '').toLowerCase()
    const v = (it.value || '').toLowerCase()
    if (scheme === 'isbn') return it.value
    if (v.startsWith('urn:isbn:')) return v.replace('urn:isbn:', '')
  }
  return ids.length ? ids[0].value : ''
}

function parseIdentifiers(metadataEl: Element | null) {
  if (!metadataEl) return [] as { id?: string; scheme?: string; value: string }[]
  return Array.from(metadataEl.querySelectorAll('dc\\:identifier, identifier'))
    .map((el) => ({
      id: el.getAttribute('id') || undefined,
      scheme: el.getAttribute('opf:scheme') || el.getAttribute('scheme') || undefined,
      value: text(el),
    }))
    .filter((it) => it.value)
}

function parseMetaTags(metadataEl: Element | null) {
  if (!metadataEl) return [] as { name?: string; property?: string; content?: string }[]
  return Array.from(metadataEl.querySelectorAll('meta')).map((el) => ({
    name: el.getAttribute('name') || undefined,
    property: el.getAttribute('property') || undefined,
    content: el.getAttribute('content') || undefined,
  }))
}

async function readZipText(zip: JSZip, path: string) {
  const f = zip.file(path)
  return await f?.async('string')
}

export async function parseEpub(ab: ArrayBuffer) {
  const zip = await JSZip.loadAsync(ab)
  const containerXml = await zip.file('META-INF/container.xml')?.async('string')
  if (!containerXml) throw new Error('container.xml 缺失')
  const dom = new DOMParser().parseFromString(containerXml, 'application/xml')
  const rootfileEl = dom.querySelector('rootfile')
  const opfPath = rootfileEl?.getAttribute('full-path') || ''
  if (!opfPath) throw new Error('OPF 路径缺失')
  const opfXml = await zip.file(opfPath)?.async('string')
  if (!opfXml) throw new Error('OPF 文件缺失')
  const opfDom = new DOMParser().parseFromString(opfXml, 'application/xml')
  const metadataEl = opfDom.querySelector('metadata') as Element
  const manifestEl = opfDom.querySelector('manifest') as Element
  const spineEl = opfDom.querySelector('spine') as Element
  const base = opfPath.split('/').slice(0, -1).join('/')

  const identifiers = parseIdentifiers(metadataEl)
  const title = text(metadataEl?.querySelector('dc\\:title, title'))
  const authors = texts(metadataEl, 'dc\\:creator, creator')
  const author = authors[0] || ''
  const publisher = text(metadataEl?.querySelector('dc\\:publisher, publisher'))
  const subjects = texts(metadataEl, 'dc\\:subject, subject')
  const description = text(metadataEl?.querySelector('dc\\:description, description'))
  const languages = texts(metadataEl, 'dc\\:language, language')
  const contributors = texts(metadataEl, 'dc\\:contributor, contributor')
  const rights = text(metadataEl?.querySelector('dc\\:rights, rights'))
  const sources = texts(metadataEl, 'dc\\:source, source')
  const relations = texts(metadataEl, 'dc\\:relation, relation')
  const coverage = text(metadataEl?.querySelector('dc\\:coverage, coverage'))
  const typeVal = text(metadataEl?.querySelector('dc\\:type, type'))
  const format = text(metadataEl?.querySelector('dc\\:format, format'))
  const dateEls = Array.from(metadataEl?.querySelectorAll('dc\\:date, date') || [])
  const dates = dateEls
    .map((el) => ({ event: el.getAttribute('event') || undefined, value: text(el) }))
    .filter((d) => d.value)
  const metaTags = parseMetaTags(metadataEl)
  const isbn = detectIsbnFromIdentifiers(identifiers)

  let cover = null as BookMeta['cover']
  const metaCover = metadataEl?.querySelector('meta[name="cover"]')
  const coverId = metaCover?.getAttribute('content') || ''
  if (coverId) {
    const coverItem = manifestEl?.querySelector(`item[id="${coverId}"]`)
    if (coverItem) {
      const href = coverItem.getAttribute('href') || ''
      const mime = coverItem.getAttribute('media-type') || ''
      const coverPath = base ? `${base}/${href}` : href
      const data = (await zip.file(coverPath)?.async('arraybuffer')) || null
      cover = { mime, path: href, data }
    }
  }

  const manifest = Array.from(manifestEl?.querySelectorAll('item') || []).map((el) => ({
    id: el.getAttribute('id') || '',
    href: el.getAttribute('href') || '',
    mediaType: el.getAttribute('media-type') || '',
    properties: el.getAttribute('properties') || undefined,
  }))

  const spine = Array.from(spineEl?.querySelectorAll('itemref') || []).map((el) => ({
    idref: el.getAttribute('idref') || '',
    linear: el.getAttribute('linear') || undefined,
    properties: el.getAttribute('properties') || undefined,
  }))

  let tocNav = undefined as BookMeta['tocNav']
  const navItem = manifest.find((i) => (i.properties || '').split(/\s+/).includes('nav'))
  if (navItem) {
    const navPath = base ? `${base}/${navItem.href}` : navItem.href
    const navHtml = await readZipText(zip, navPath)
    if (navHtml) {
      const navDom = new DOMParser().parseFromString(navHtml, 'text/html')
      const navEl = navDom.querySelector('nav[epub\\:type="toc"], nav[role="doc-toc"], nav')
      if (navEl) {
        tocNav = Array.from(navEl.querySelectorAll('a'))
          .map((a) => ({
            label: (a.textContent || '').trim(),
            href: a.getAttribute('href') || '',
          }))
          .filter((i) => i.label || i.href)
      }
    }
  }

  let tocNcx = undefined as BookMeta['tocNcx']
  const ncxItem = manifest.find((i) => i.mediaType === 'application/x-dtbncx+xml')
  if (ncxItem) {
    const ncxPath = base ? `${base}/${ncxItem.href}` : ncxItem.href
    const ncxXml = await readZipText(zip, ncxPath)
    if (ncxXml) {
      const ncxDom = new DOMParser().parseFromString(ncxXml, 'application/xml')
      const navPoints = Array.from(ncxDom.querySelectorAll('navPoint'))
      tocNcx = navPoints
        .map((np) => ({
          label: text(np.querySelector('navLabel > text')),
          src: np.querySelector('content')?.getAttribute('src') || '',
        }))
        .filter((i) => i.label || i.src)
    }
  }

  const meta: BookMeta = {
    title,
    author,
    authors,
    publisher,
    isbn,
    cover,
    identifiers,
    subjects,
    languages,
    description,
    contributors,
    dates,
    rights,
    sources,
    relations,
    coverage,
    type: typeVal,
    format,
    meta: metaTags,
    manifest,
    spine,
    tocNav,
    tocNcx,
  }
  return meta
}
