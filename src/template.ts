export function applyTemplate(tpl: string, data: Record<string, string>) {
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => {
    const v = data[key] ?? ''
    return v
  })
}
