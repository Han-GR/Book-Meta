import { App, Notice, Plugin, TFile, TFolder } from 'obsidian'
import { DEFAULT_SETTINGS, BookMetaSettingTab, BookMetaSettings, tr } from './settings'
import { parseEpub, BookMeta } from './epub'
import { applyTemplate } from './template'

function slug(s: string) {
  return s
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function join(arr?: string[]) {
  return arr && arr.length ? arr.join(',') : ''
}

function buildTemplateData(meta: BookMeta, coverPath: string) {
  const dates = (meta.dates || [])
    .map((d) => (d.event ? `${d.event}:${d.value}` : d.value))
    .filter(Boolean)
  const identifiers = (meta.identifiers || [])
    .map((i) => `${i.scheme || ''}:${i.value}`)
    .filter(Boolean)
  const out: Record<string, string> = {
    title: meta.title || '',
    author: meta.author || '',
    authors: join(meta.authors),
    publisher: meta.publisher || '',
    isbn: meta.isbn || '',
    description: meta.description || '',
    subjects: join(meta.subjects),
    languages: join(meta.languages),
    contributors: join(meta.contributors),
    rights: meta.rights || '',
    sources: join(meta.sources),
    relations: join(meta.relations),
    coverage: meta.coverage || '',
    type: meta.type || '',
    format: meta.format || '',
    dates: join(dates),
    identifiers: join(identifiers),
    coverPath: coverPath || '',
    identifiers_json: JSON.stringify(meta.identifiers || []),
    meta_json: JSON.stringify(meta.meta || []),
    manifest_json: JSON.stringify(meta.manifest || []),
    spine_json: JSON.stringify(meta.spine || []),
    tocNav_json: JSON.stringify(meta.tocNav || []),
    tocNcx_json: JSON.stringify(meta.tocNcx || []),
  }
  const prefixed: Record<string, string> = {}
  for (const k in out) prefixed[`bookmeta.${k}`] = out[k]
  return prefixed
}

async function ensureFolder(app: App, path: string) {
  if (!path) return
  const parts = path.split('/').filter(Boolean)
  let curr = ''
  for (const p of parts) {
    curr = curr ? `${curr}/${p}` : p
    const f = app.vault.getAbstractFileByPath(curr)
    if (!f) await app.vault.createFolder(curr)
  }
}

async function listEpubs(folder: TFolder) {
  const out: TFile[] = []
  const stack: TFolder[] = [folder]
  while (stack.length) {
    const f = stack.pop()!
    for (const c of f.children) {
      if (c instanceof TFolder) stack.push(c)
      else if (c instanceof TFile && c.extension.toLowerCase() === 'epub') out.push(c)
    }
  }
  return out
}

export default class BookMetaPlugin extends Plugin {
  settings!: BookMetaSettings
  async onload() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS)
    await this.loadSettings()
    this.addCommand({
      id: 'book-meta-go',
      name: 'book meta go',
      callback: async () => {
        await this.run()
      },
    })
    this.addSettingTab(new BookMetaSettingTab(this.app, this))
  }
  async run() {
    const s = this.settings
    if (!s.inputFolder) {
      new Notice(tr(this, 'notice_set_input'))
      return
    }
    const input = this.app.vault.getAbstractFileByPath(s.inputFolder)
    if (!(input instanceof TFolder)) {
      new Notice(tr(this, 'notice_invalid_folder'))
      return
    }
    await ensureFolder(this.app, s.metadataFolder)
    await ensureFolder(this.app, s.outputFolder)
    const tplFile = s.templatePath ? this.app.vault.getAbstractFileByPath(s.templatePath) : null
    const tpl = tplFile instanceof TFile ? await this.app.vault.read(tplFile) : ''
    const epubs = await listEpubs(input)
    let ok = 0
    let list_len = epubs.length
    for (const f of epubs) {
      try {
        const ab = await this.app.vault.readBinary(f)
        const meta = await parseEpub(ab)
        const baseName = slug(f.basename)
        const coverPath = await this.saveCover(meta, baseName)
        const jsonDir = s.metadataFolder ? `${s.metadataFolder}/datas` : `datas`
        await ensureFolder(this.app, jsonDir)
        const jsonPath = `${jsonDir}/${baseName}.json`
        await this.app.vault.create(
          jsonPath,
          JSON.stringify(
            {
              ...meta,
              coverPath,
            },
            null,
            2
          )
        )
        const noteName = `${baseName}.md`
        const outPath = s.outputFolder ? `${s.outputFolder}/${noteName}` : noteName
        const content = applyTemplate(
          tpl ||
            '{{bookmeta.title}}\n{{bookmeta.authors}}\n{{bookmeta.publisher}}\n{{bookmeta.isbn}}\n{{bookmeta.coverPath}}',
          buildTemplateData(meta, coverPath || '')
        )
        await this.app.vault.create(outPath, content)
        ok++
      } catch (e) {
        if (e instanceof Error && e.message.includes('File already exists')) list_len--
        continue
        new Notice(`${tr(this, 'notice_failed')}${f.path}`)
      }
    }
    new Notice(`${tr(this, 'notice_done')} ${ok}/${list_len}`)
  }
  async saveSettings() {
    await this.saveData(this.settings)
  }
  async loadSettings() {
    const data = await this.loadData()
    this.settings = Object.assign({}, DEFAULT_SETTINGS, data || {})
  }
  async saveCover(meta: BookMeta, baseName: string) {
    const s = this.settings
    if (!meta.cover || !meta.cover.data) return ''
    const ext = meta.cover.mime.includes('png') ? 'png' : 'jpg'
    const coverRel = `covers/${baseName}.${ext}`
    const dir = s.metadataFolder || ''
    const full = dir ? `${dir}/${coverRel}` : coverRel
    const parent = full.split('/').slice(0, -1).join('/')
    await ensureFolder(this.app, parent)
    await this.app.vault.createBinary(full, meta.cover.data)
    return full
  }
}
