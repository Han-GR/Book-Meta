import { App, PluginSettingTab, Setting, FuzzySuggestModal, TFolder, TFile } from 'obsidian'
import type BookMetaPlugin from './main'

export interface BookMetaSettings {
  inputFolder: string
  metadataFolder: string
  templatePath: string
  outputFolder: string
  language?: 'zh' | 'en'
}

export const DEFAULT_SETTINGS: BookMetaSettings = {
  inputFolder: '',
  metadataFolder: '',
  templatePath: '',
  outputFolder: '',
  language: 'en',
}

const STRINGS: Record<string, Record<string, string>> = {
  zh: {
    input_name: '读取文件夹',
    input_desc: '相对于当前库的路径,读取其中的EPUB文件',
    input_desc_ok: '路径有效,可读取EPUB文件',
    input_desc_bad: '路径不存在,请选择或创建该文件夹',
    meta_name: '元数据保存文件夹',
    meta_desc: '保存解析出的JSON与封面图片',
    meta_desc_ok: '路径有效,将在其中生成 JSON 与封面',
    meta_desc_bad: '路径不存在,将自动创建该文件夹',
    tpl_name: '模板文件路径',
    tpl_desc: '用于生成笔记的模板文件路径',
    tpl_desc_ok: '模板已找到,将用于笔记生成',
    tpl_desc_bad: '模板未找到,使用默认内容',
    out_name: '模板输出文件夹',
    out_desc: '根据模板生成的笔记保存到此文件夹',
    out_desc_ok: '路径有效,将在其中生成笔记',
    out_desc_bad: '路径不存在,将自动创建该文件夹',
    choose: '选择',
    lang_name: '语言',
    lang_desc: '选择插件界面语言',
    lang_zh: '中文',
    lang_en: 'English',
    notice_set_input: '请在设置中指定读取文件夹',
    notice_invalid_folder: '读取文件夹路径无效',
    notice_failed: '处理失败: ',
    notice_done: '处理完成',
  },
  en: {
    input_name: 'Input folder',
    input_desc: 'Path relative to vault, scan EPUB files inside',
    input_desc_ok: 'Path valid, EPUB files can be read',
    input_desc_bad: 'Path not found, please choose or create folder',
    meta_name: 'Metadata folder',
    meta_desc: 'Store parsed JSON and cover images',
    meta_desc_ok: 'Path valid, JSON and covers will be generated',
    meta_desc_bad: 'Path not found, folder will be auto created',
    tpl_name: 'Template file',
    tpl_desc: 'Template used to generate notes',
    tpl_desc_ok: 'Template found, will be used',
    tpl_desc_bad: 'Template not found, using default',
    out_name: 'Output folder',
    out_desc: 'Generated notes will be saved here',
    out_desc_ok: 'Path valid, notes will be generated inside',
    out_desc_bad: 'Path not found, folder will be auto created',
    choose: 'Select',
    lang_name: 'Language',
    lang_desc: 'Choose plugin UI language',
    lang_zh: 'Chinese',
    lang_en: 'English',
    notice_set_input: 'Please set input folder in settings',
    notice_invalid_folder: 'Invalid input folder path',
    notice_failed: 'Failed: ',
    notice_done: 'Completed',
  },
}

export function tr(plugin: BookMetaPlugin, key: string) {
  const lang = plugin.settings?.language || 'zh'
  return STRINGS[lang]?.[key] || STRINGS['zh'][key] || key
}

export class BookMetaSettingTab extends PluginSettingTab {
  plugin: BookMetaPlugin
  constructor(app: App, plugin: BookMetaPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }
  private collectFolders(root: TFolder) {
    const out: TFolder[] = []
    const stack: TFolder[] = [root]
    while (stack.length) {
      const f = stack.pop()
      if (!f) break
      out.push(f)
      for (const c of f.children) if (c instanceof TFolder) stack.push(c)
    }
    return out
  }
  private collectFiles(root: TFolder, exts?: string[]) {
    const out: TFile[] = []
    const stack: TFolder[] = [root]
    const set = exts && exts.length ? new Set(exts.map((e) => e.toLowerCase())) : null
    while (stack.length) {
      const f = stack.pop()
      if (!f) break
      for (const c of f.children) {
        if (c instanceof TFolder) stack.push(c)
        else if (c instanceof TFile) {
          if (!set || set.has(c.extension.toLowerCase())) out.push(c)
        }
      }
    }
    return out
  }
  private openFolderSuggest(onChoose: (path: string) => void) {
    const folders = this.collectFolders(this.app.vault.getRoot())
    const modal = new (class extends FuzzySuggestModal<TFolder> {
      items: TFolder[]
      onPick: (path: string) => void
      constructor(app: App, items: TFolder[], onPick: (path: string) => void) {
        super(app)
        this.items = items
        this.onPick = onPick
      }
      getItems() {
        return this.items
      }
      getItemText(item: TFolder) {
        return item.path
      }
      onChooseItem(item: TFolder) {
        this.onPick(item.path)
      }
    })(this.app, folders, onChoose)
    modal.open()
  }
  private openFileSuggest(exts: string[], onChoose: (path: string) => void) {
    const files = this.collectFiles(this.app.vault.getRoot(), exts)
    const modal = new (class extends FuzzySuggestModal<TFile> {
      items: TFile[]
      onPick: (path: string) => void
      constructor(app: App, items: TFile[], onPick: (path: string) => void) {
        super(app)
        this.items = items
        this.onPick = onPick
      }
      getItems() {
        return this.items
      }
      getItemText(item: TFile) {
        return item.path
      }
      onChooseItem(item: TFile) {
        this.onPick(item.path)
      }
    })(this.app, files, onChoose)
    modal.open()
  }
  display(): void {
    const { containerEl } = this
    containerEl.empty()
    const s1 = new Setting(containerEl)
      .setName(tr(this.plugin, 'input_name'))
      .setDesc(tr(this.plugin, 'input_desc'))
      .addText((text) =>
        text
          .setPlaceholder('Books/epub')
          .setValue(this.plugin.settings.inputFolder)
          .onChange((value) => {
            this.plugin.settings.inputFolder = value.trim()
            void this.plugin.saveSettings()
            const ok =
              this.app.vault.getAbstractFileByPath(this.plugin.settings.inputFolder) instanceof
              TFolder
            s1.setDesc(ok ? tr(this.plugin, 'input_desc_ok') : tr(this.plugin, 'input_desc_bad'))
          })
      )
      .addButton((btn) =>
        btn.setButtonText(tr(this.plugin, 'choose')).onClick(() => {
          this.openFolderSuggest((path) => {
            this.plugin.settings.inputFolder = path
            void this.plugin.saveSettings()
            const ok = this.app.vault.getAbstractFileByPath(path) instanceof TFolder
            s1.setDesc(ok ? tr(this.plugin, 'input_desc_ok') : tr(this.plugin, 'input_desc_bad'))
            this.display()
          })
        })
      )
    const s2 = new Setting(containerEl)
      .setName(tr(this.plugin, 'meta_name'))
      .setDesc(tr(this.plugin, 'meta_desc'))
      .addText((text) =>
        text
          .setPlaceholder('Books/meta')
          .setValue(this.plugin.settings.metadataFolder)
          .onChange((value) => {
            this.plugin.settings.metadataFolder = value.trim()
            void this.plugin.saveSettings()
            const ok =
              this.app.vault.getAbstractFileByPath(this.plugin.settings.metadataFolder) instanceof
              TFolder
            s2.setDesc(ok ? tr(this.plugin, 'meta_desc_ok') : tr(this.plugin, 'meta_desc_bad'))
          })
      )
      .addButton((btn) =>
        btn.setButtonText(tr(this.plugin, 'choose')).onClick(() => {
          this.openFolderSuggest((path) => {
            this.plugin.settings.metadataFolder = path
            void this.plugin.saveSettings()
            const ok = this.app.vault.getAbstractFileByPath(path) instanceof TFolder
            s2.setDesc(ok ? tr(this.plugin, 'meta_desc_ok') : tr(this.plugin, 'meta_desc_bad'))
            this.display()
          })
        })
      )
    const s3 = new Setting(containerEl)
      .setName(tr(this.plugin, 'tpl_name'))
      .setDesc(tr(this.plugin, 'tpl_desc'))
      .addText((text) =>
        text
          .setPlaceholder('Templates/book.md')
          .setValue(this.plugin.settings.templatePath)
          .onChange((value) => {
            this.plugin.settings.templatePath = value.trim()
            void this.plugin.saveSettings()
            const ok =
              this.app.vault.getAbstractFileByPath(this.plugin.settings.templatePath) instanceof
              TFile
            s3.setDesc(ok ? tr(this.plugin, 'tpl_desc_ok') : tr(this.plugin, 'tpl_desc_bad'))
          })
      )
      .addButton((btn) =>
        btn.setButtonText(tr(this.plugin, 'choose')).onClick(() => {
          this.openFileSuggest(['md'], (path) => {
            this.plugin.settings.templatePath = path
            void this.plugin.saveSettings()
            const ok = this.app.vault.getAbstractFileByPath(path) instanceof TFile
            s3.setDesc(ok ? tr(this.plugin, 'tpl_desc_ok') : tr(this.plugin, 'tpl_desc_bad'))
            this.display()
          })
        })
      )
    const s4 = new Setting(containerEl)
      .setName(tr(this.plugin, 'out_name'))
      .setDesc(tr(this.plugin, 'out_desc'))
      .addText((text) =>
        text
          .setPlaceholder('Books/notes')
          .setValue(this.plugin.settings.outputFolder)
          .onChange((value) => {
            this.plugin.settings.outputFolder = value.trim()
            void this.plugin.saveSettings()
            const ok =
              this.app.vault.getAbstractFileByPath(this.plugin.settings.outputFolder) instanceof
              TFolder
            s4.setDesc(ok ? tr(this.plugin, 'out_desc_ok') : tr(this.plugin, 'out_desc_bad'))
          })
      )
      .addButton((btn) =>
        btn.setButtonText(tr(this.plugin, 'choose')).onClick(() => {
          this.openFolderSuggest((path) => {
            this.plugin.settings.outputFolder = path
            void this.plugin.saveSettings()
            const ok = this.app.vault.getAbstractFileByPath(path) instanceof TFolder
            s4.setDesc(ok ? tr(this.plugin, 'out_desc_ok') : tr(this.plugin, 'out_desc_bad'))
            this.display()
          })
        })
      )
    new Setting(containerEl)
      .setName(tr(this.plugin, 'lang_name'))
      .setDesc(tr(this.plugin, 'lang_desc'))
      .addDropdown((dd) => {
        dd.addOption('zh', tr(this.plugin, 'lang_zh'))
        dd.addOption('en', tr(this.plugin, 'lang_en'))
        dd.setValue(this.plugin.settings.language || 'zh')
        dd.onChange((v) => {
          this.plugin.settings.language = v as BookMetaSettings['language']
          void this.plugin.saveSettings()
          this.display()
        })
      })
  }
}
