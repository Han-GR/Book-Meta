# Book Meta

English | 中文

---

## English

A plugin for Obsidian to batch parse EPUB metadata, save covers, and generate notes.

**Features**
- Scan `.epub` files in a specified folder and parse metadata (title, authors, publisher, ISBN, languages, subjects, TOC, etc.)
- Save cover images into `covers/` subfolder
- Archive full metadata as `datas/<filename>.json`
- Generate notes based on a template into an output folder
- Support Chinese/English UI switch in settings
- File naming follows source filename

**Installation**
- Community Market (pending): Obsidian → Settings → Community plugins → Browse → search `Book Meta`
- Manual: Copy files to `<vault>/.obsidian/plugins/book-meta/`:
  - `manifest.json`
  - `main.js`
  - `styles.css` (optional)

**Settings**
- `Input Folder`: scan `.epub` files inside
- `Metadata Folder`: store `datas/*.json` and `covers/*`
- `Template File`: markdown template used to generate notes
- `Output Folder`: where notes are saved
- `Language`: Chinese / English

**Template placeholders** (namespace `bookmeta.`). All fields render to strings; list fields are joined with commas.

- Basic metadata
  - `{{bookmeta.title}}`: book title (from EPUB metadata)
  - `{{bookmeta.author}}`: primary author (usually first author)
  - `{{bookmeta.authors}}`: authors list, comma-separated (e.g., `Author A,Author B`)
  - `{{bookmeta.publisher}}`: publisher
  - `{{bookmeta.isbn}}`: ISBN if present, otherwise empty string
  - `{{bookmeta.description}}`: description/abstract
  - `{{bookmeta.subjects}}`: subjects, comma-separated (e.g., `Literature,Sci-fi`)
  - `{{bookmeta.languages}}`: languages, comma-separated (e.g., `zh,en`)
  - `{{bookmeta.contributors}}`: contributors (translator, editor, etc.), comma-separated
  - `{{bookmeta.rights}}`: rights
  - `{{bookmeta.sources}}`: sources, comma-separated
  - `{{bookmeta.relations}}`: related resources, comma-separated
  - `{{bookmeta.coverage}}`: coverage (spatial/temporal scope)
  - `{{bookmeta.type}}`: type (if provided)
  - `{{bookmeta.format}}`: format (if provided)
  - `{{bookmeta.dates}}`: dates, comma-separated; each item as `event:value` or `value` (e.g., `publication:2020-01-01`)
  - `{{bookmeta.identifiers}}`: identifiers, comma-separated; each item as `scheme:value` (e.g., `ISBN:978xxxx`)
  - `{{bookmeta.coverPath}}`: saved cover path (relative to vault)

- JSON serialization
  - `{{bookmeta.identifiers_json}}`: identifiers array JSON (with `scheme`, `value`)
  - `{{bookmeta.meta_json}}`: `<meta>` entries JSON (key-value and extended properties)
  - `{{bookmeta.manifest_json}}`: manifest resources JSON (`id`, `href`, `media-type`)
  - `{{bookmeta.spine_json}}`: spine JSON (reading order items)
  - `{{bookmeta.tocNav_json}}`: TOC from `nav.xhtml` (modern EPUB)
  - `{{bookmeta.tocNcx_json}}`: TOC from `toc.ncx` (legacy/compat)

- Folder info
  - `{{bookmeta.folderTitle}}`: optional folder title set in settings (for library name in templates)
  - `{{bookmeta.folderPath}}`: relative path of the folder containing current EPUB
  - `{{bookmeta.folderName}}`: folder name containing current EPUB

**Generated structure**
- Cover: `<metadataFolder>/covers/<filename>.<png|jpg>`
- Metadata JSON: `<metadataFolder>/datas/<filename>.json`
- Note: `<outputFolder>/<filename>.md`

**Usage**
- Configure folders and template in settings
- Run command `book meta go`
- Check notes in output folder and JSON/covers in metadata folder

**Development**
- Build: `npm run build`
- Type check: `npm run typecheck`
- Format: `npm run format`

**Donation**
- WeChat / Alipay: contact or share donation screenshot in Issues

---

## 中文说明

一个用于在 Obsidian 中批量解析 EPUB 元数据、生成封面与笔记的插件。

**功能**
- 扫描指定文件夹中的 `.epub` 文件并解析元数据（标题、作者、出版社、ISBN、语言、主题、目录等）
- 保存封面图片到 `covers/` 子目录
- 将完整元数据归档为 `datas/<文件名>.json`
- 根据模板生成笔记到指定输出文件夹
- 支持中英文界面切换（设置中选择）
- 生成文件命名与源文件名保持一致

**安装**
- 市场安装（待收录）：在 Obsidian → 设置 → 第三方插件 → 浏览，搜索 `Book Meta`。
- 手动安装：将以下文件复制到 `<你的库>/.obsidian/plugins/book-meta/`：
  - `manifest.json`
  - `main.js`
  - `styles.css`（如有）

**设置项**
- `读取文件夹`：扫描其中的 `.epub`
- `元数据保存文件夹`：保存 `datas/*.json` 与 `covers/*`
- `模板文件路径`：用于生成笔记的模板（`.md`）
- `模板输出文件夹`：笔记保存位置
- `语言`：中文 / English

**模板占位符**（命名空间前缀 `bookmeta.`）。所有字段最终渲染为字符串；列表类字段以逗号连接。

- 基础元数据
  - `{{bookmeta.title}}`：书名（来自 EPUB 元数据）
  - `{{bookmeta.author}}`：主作者（通常为第一个作者）
  - `{{bookmeta.authors}}`：作者列表，使用逗号分隔（如 `作者A,作者B`）
  - `{{bookmeta.publisher}}`：出版社
  - `{{bookmeta.isbn}}`：ISBN（如存在，否则为空字符串）
  - `{{bookmeta.description}}`：内容简介/摘要
  - `{{bookmeta.subjects}}`：主题标签，使用逗号分隔（如 `文学,科幻`）
  - `{{bookmeta.languages}}`：语言列表，使用逗号分隔（如 `zh,en`）
  - `{{bookmeta.contributors}}`：贡献者（译者、编辑等），逗号分隔
  - `{{bookmeta.rights}}`：版权信息
  - `{{bookmeta.sources}}`：来源信息，逗号分隔
  - `{{bookmeta.relations}}`：相关资源，逗号分隔
  - `{{bookmeta.coverage}}`：覆盖范围（时空/主题范围）
  - `{{bookmeta.type}}`：类型（若提供）
  - `{{bookmeta.format}}`：格式说明（若提供）
  - `{{bookmeta.dates}}`：日期列表，逗号分隔；每项形如 `event:value` 或仅 `value`（例如 `publication:2020-01-01`）
  - `{{bookmeta.identifiers}}`：标识符列表，逗号分隔；每项形如 `scheme:value`（例如 `ISBN:978xxxx`）
  - `{{bookmeta.coverPath}}`：封面图片保存路径（相对于 Vault）

- JSON 序列化
  - `{{bookmeta.identifiers_json}}`：标识符数组的 JSON（包含 `scheme`、`value`）
  - `{{bookmeta.meta_json}}`：`<meta>` 节点数组的 JSON（键值对、属性扩展信息）
  - `{{bookmeta.manifest_json}}`：清单资源的 JSON（`id`、`href`、`media-type`）
  - `{{bookmeta.spine_json}}`：阅读顺序的 JSON（正文项顺序）
  - `{{bookmeta.tocNav_json}}`：从 `nav.xhtml` 提取的目录 JSON（现代 EPUB 目录）
  - `{{bookmeta.tocNcx_json}}`：从 `toc.ncx` 提取的目录 JSON（旧版/兼容目录）

- 文件夹信息
  - `{{bookmeta.folderTitle}}`：设置中的“文件夹标题”（可为空；用于在模板中展示书库名称）
  - `{{bookmeta.folderPath}}`：当前 EPUB 所在的相对文件夹路径
  - `{{bookmeta.folderName}}`：当前 EPUB 所在文件夹名

**生成文件结构**
- 封面：`<metadataFolder>/covers/<文件名>.<png|jpg>`
- 元数据 JSON：`<metadataFolder>/datas/<文件名>.json`
- 笔记：`<outputFolder>/<文件名>.md`

**使用步骤**
- 在设置中配置各文件夹与模板路径
- 在命令面板运行 `book meta go`
- 查看输出文件夹中的笔记与元数据文件夹中的 JSON/封面

**开发与构建**
- 构建：`npm run build`
- 类型检查：`npm run typecheck`
- 代码格式化：`npm run format`

**捐赠**
- 微信 / 支付宝：可在 Issue 中联系或提交捐赠截图

感谢支持与使用！