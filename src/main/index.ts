import { app, BrowserWindow, ipcMain, dialog, clipboard, nativeImage } from 'electron'
import { join } from 'path'
import { writeFile, readFile, readdir, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import mysql from 'mysql2/promise'
import pg from 'pg'
import Store from 'electron-store'
import { autoUpdater } from 'electron-updater'

interface DBConfig {
  dbType: 'mysql' | 'postgres'
  host: string
  port: string
  user: string
  password: string
  database: string
}

// ─── Store 초기화
const store = new Store({
  schema: {
    recentConnections: { type: 'array', default: [] },
    obsidianVaultPath: { type: 'string', default: '' },
    windowBounds: { type: 'object', default: { width: 1280, height: 860 } },
  },
})

// ─── 윈도우 생성
let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const bounds = store.get('windowBounds') as { width?: number; height?: number }
  // dev: process.cwd() = 프로젝트 루트 / package: app.getAppPath() = 앱 번들
  const iconPath = join(
    app.isPackaged ? app.getAppPath() : process.cwd(),
    'build',
    'icon.png'
  )
  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 960,
    minHeight: 640,
    ...(existsSync(iconPath) && { icon: iconPath }),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#0F1117',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  mainWindow.on('resize', () => {
    const [width, height] = mainWindow!.getSize()
    store.set('windowBounds', { width, height })
  })
  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    setupAutoUpdater()
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── 자동 업데이트
function setupAutoUpdater(): void {
  autoUpdater.autoDownload = false
  autoUpdater.on('update-available', (info) =>
    mainWindow?.webContents.send('update-available', { version: info.version })
  )
  autoUpdater.on('update-not-available', () =>
    mainWindow?.webContents.send('update-not-available')
  )
  autoUpdater.on('download-progress', (p) =>
    mainWindow?.webContents.send('update-progress', { percent: Math.round(p.percent) })
  )
  autoUpdater.on('update-downloaded', () =>
    mainWindow?.webContents.send('update-downloaded')
  )
  autoUpdater.on('error', (e) =>
    mainWindow?.webContents.send('update-error', e.message)
  )
  setTimeout(() => autoUpdater.checkForUpdates(), 3000)
}
ipcMain.handle('check-for-updates', () => autoUpdater.checkForUpdates())
ipcMain.handle('download-update', () => autoUpdater.downloadUpdate())
ipcMain.handle('install-update', () => autoUpdater.quitAndInstall())

// ─── DB 스캔
interface SchemaColumn {
  name: string
  type: string
  isPK: boolean
  isFK: boolean
  isNullable: boolean
  comment: string
  description?: string
}
interface SchemaTable {
  name: string
  columns: SchemaColumn[]
}
interface SchemaRelation {
  from: { table: string; column: string }
  to: { table: string; column: string }
}
interface Schema {
  tables: SchemaTable[]
  relations: SchemaRelation[]
}

interface ColRow {
  table_name?: string
  TABLE_NAME?: string
  column_name?: string
  COLUMN_NAME?: string
  data_type?: string
  DATA_TYPE?: string
  character_maximum_length?: number | null
  COLUMN_TYPE?: string
  column_key?: string
  COLUMN_KEY?: string
  is_nullable?: string
  IS_NULLABLE?: string
  column_comment?: string
  COLUMN_COMMENT?: string
}
interface RelRow {
  fromTable?: string
  FROM_TABLE?: string
  fromColumn?: string
  FROM_COLUMN?: string
  toTable?: string
  TO_TABLE?: string
  toColumn?: string
  TO_COLUMN?: string
}

function formatColumnType(row: ColRow, dbType: 'mysql' | 'postgres'): string {
  if (dbType === 'mysql') {
    return (row.COLUMN_TYPE ?? row.DATA_TYPE ?? '').toUpperCase()
  }
  const dt = (row.data_type ?? '').toLowerCase()
  const maxLen = row.character_maximum_length
  if ((dt === 'character varying' || dt === 'varchar') && maxLen != null) {
    return `VARCHAR(${maxLen})`
  }
  if (dt === 'character' && maxLen != null) {
    return `CHAR(${maxLen})`
  }
  return (row.data_type ?? '').toUpperCase()
}

function buildSchema(
  columns: ColRow[],
  relations: RelRow[],
  dbType: 'mysql' | 'postgres'
): Schema {
  const tableMap: Record<string, { name: string; columns: SchemaTable['columns'] }> = {}
  for (const row of columns) {
    const name = (dbType === 'postgres' ? row.table_name : row.TABLE_NAME)!
    if (!tableMap[name]) tableMap[name] = { name, columns: [] }
    const rawComment = dbType === 'postgres' ? (row.column_comment || '') : (row.COLUMN_COMMENT || '')
    tableMap[name].columns.push({
      name: (dbType === 'postgres' ? row.column_name : row.COLUMN_NAME)!,
      type: formatColumnType(row, dbType),
      isPK: (dbType === 'postgres' ? row.column_key : row.COLUMN_KEY) === 'PRI',
      isFK: false,
      isNullable: (dbType === 'postgres' ? row.is_nullable : row.IS_NULLABLE) === 'YES',
      comment: rawComment,
      description: rawComment || undefined,
    })
  }
  const fkSet = new Set(
    relations.map((r) => `${r.fromTable ?? r.FROM_TABLE}__${r.fromColumn ?? r.FROM_COLUMN}`)
  )
  for (const table of Object.values(tableMap)) {
    for (const col of table.columns) {
      if (fkSet.has(`${table.name}__${col.name}`)) col.isFK = true
    }
  }
  return {
    tables: Object.values(tableMap),
    relations: relations.map((r) => ({
      from: {
        table: (r.fromTable ?? r.FROM_TABLE)!,
        column: (r.fromColumn ?? r.FROM_COLUMN)!,
      },
      to: {
        table: (r.toTable ?? r.TO_TABLE)!,
        column: (r.toColumn ?? r.TO_COLUMN)!,
      },
    })),
  }
}

async function scanMySQL(config: DBConfig): Promise<Schema> {
  const conn = await mysql.createConnection({
    host: config.host,
    port: Number(config.port) || 3306,
    user: config.user,
    password: config.password,
    database: config.database,
    connectTimeout: 10000,
  })
  const [columns] = await conn.query(
    `SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE,COLUMN_TYPE,COLUMN_KEY,IS_NULLABLE,COLUMN_COMMENT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,ORDINAL_POSITION`,
    [config.database]
  )
  const [relations] = await conn.query(
    `SELECT TABLE_NAME AS fromTable,COLUMN_NAME AS fromColumn,REFERENCED_TABLE_NAME AS toTable,REFERENCED_COLUMN_NAME AS toColumn FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [config.database]
  )
  await conn.end()
  return buildSchema(columns as ColRow[], relations as RelRow[], 'mysql')
}

async function scanPostgres(config: DBConfig): Promise<Schema> {
  const client = new pg.Client({
    host: config.host,
    port: Number(config.port) || 5432,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionTimeoutMillis: 10000,
  })
  await client.connect()
  const { rows: columns } = await client.query(
    `SELECT c.table_name,c.column_name,c.data_type,c.character_maximum_length,c.is_nullable,CASE WHEN pk.column_name IS NOT NULL THEN 'PRI' ELSE '' END AS column_key,col_description((c.table_schema||'.'||c.table_name)::regclass::oid,c.ordinal_position) AS column_comment FROM information_schema.columns c LEFT JOIN (SELECT ku.table_name,ku.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage ku ON tc.constraint_name=ku.constraint_name AND tc.table_schema=ku.table_schema WHERE tc.constraint_type='PRIMARY KEY' AND tc.table_schema='public') pk ON c.table_name=pk.table_name AND c.column_name=pk.column_name WHERE c.table_schema='public' ORDER BY c.table_name,c.ordinal_position`
  )
  const { rows: relations } = await client.query(
    `SELECT tc.table_name AS "fromTable",kcu.column_name AS "fromColumn",ccu.table_name AS "toTable",ccu.column_name AS "toColumn" FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name AND tc.table_schema=kcu.table_schema JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name WHERE tc.constraint_type='FOREIGN KEY' AND tc.table_schema='public'`
  )
  await client.end()
  return buildSchema(columns as ColRow[], relations as RelRow[], 'postgres')
}

ipcMain.handle('scan-db', async (_, config: DBConfig) => {
  const result =
    config.dbType === 'postgres' ? await scanPostgres(config) : await scanMySQL(config)
  const { password: _pw, ...safe } = config
  saveRecentConnection(safe)
  return result
})

/** Mermaid comment에 허용되지 않는 문자 치환 (따옴표, 줄바꿈 등) */
function sanitizeMermaidComment(text: string): string {
  return text
    .replace(/"/g, "'")
    .replace(/\r?\n/g, ' ')
    .trim()
}

// ─── Mermaid 생성 (테이블 필터링 지원)
function schemaToMermaid(
  schema: Schema,
  dbName: string,
  includedTables: string[] | null
): string {
  const tableSet = includedTables ? new Set(includedTables) : null
  const filtered = tableSet
    ? schema.tables.filter((t) => tableSet.has(t.name))
    : schema.tables
  const lines = ['erDiagram']
  for (const table of filtered) {
    lines.push(`  ${table.name} {`)
    for (const col of table.columns) {
      const flags = [col.isPK ? 'PK' : '', col.isFK ? 'FK' : ''].filter(Boolean).join(',')
      const desc = (col.description ?? col.comment ?? '').trim()
      const comment = desc ? ` "${sanitizeMermaidComment(desc)}"` : ''
      lines.push(`    ${col.type} ${col.name}${flags ? ' ' + flags : ''}${comment}`)
    }
    lines.push('  }')
  }
  const seen = new Set<string>()
  for (const rel of schema.relations) {
    if (tableSet && (!tableSet.has(rel.from.table) || !tableSet.has(rel.to.table))) continue
    const key = `${rel.from.table}__${rel.to.table}`
    if (seen.has(key)) continue
    seen.add(key)
    lines.push(`  ${rel.from.table} }o--|| ${rel.to.table} : "${rel.from.column}"`)
  }
  return lines.join('\n')
}
ipcMain.handle(
  'generate-mermaid',
  (_, { schema, dbName, includedTables }: { schema: Schema; dbName: string; includedTables: string[] | null }) =>
    schemaToMermaid(schema, dbName, includedTables)
)

// ─── 최근 연결 기록
function saveRecentConnection(config: Omit<DBConfig, 'password'>): void {
  const list = store.get('recentConnections') as Array<{ id: string }>
  const id = `${config.dbType}__${config.host}__${config.database}`
  const entry = {
    id,
    label: `${config.database} @ ${config.host}`,
    ...config,
    savedAt: new Date().toISOString(),
  }
  const filtered = list.filter((c) => c.id !== id)
  store.set('recentConnections', [entry, ...filtered].slice(0, 10))
}
ipcMain.handle('get-recent-connections', () => store.get('recentConnections'))
ipcMain.handle('delete-recent-connection', (_, id: string) => {
  const list = (store.get('recentConnections') as Array<{ id: string }>).filter((c) => c.id !== id)
  store.set('recentConnections', list)
  return list
})
ipcMain.handle('clear-recent-connections', () => store.set('recentConnections', []))

// ─── 파일 저장
function buildMarkdown(mermaidCode: string, dbName: string): string {
  return `# ${dbName} ERD\n\n> Generated by ERD Generator · ${new Date().toLocaleString('ko-KR')}\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n`
}
ipcMain.handle('save-markdown', async (_, { mermaidCode, dbName }: { mermaidCode: string; dbName: string }) => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: 'ERD 저장',
    defaultPath: `${dbName}-erd.md`,
    filters: [{ name: 'Markdown', extensions: ['md'] }],
  })
  if (canceled || !filePath) return { saved: false }
  const pathToSave = filePath.toLowerCase().endsWith('.md') ? filePath : `${filePath}.md`
  await writeFile(pathToSave, buildMarkdown(mermaidCode, dbName), 'utf-8')
  return { saved: true, filePath: pathToSave }
})

/** ERD 마크다운 파일에서 mermaid 코드와 dbName 추출 */
function parseMarkdownFile(content: string): { mermaidCode: string; dbName: string } | null {
  const titleMatch = content.match(/^#\s+(.+?)\s+ERD/m)
  const dbName = titleMatch ? titleMatch[1].trim() : 'unknown'
  const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)```/)
  const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : ''
  if (!mermaidCode) return null
  return { mermaidCode, dbName }
}

ipcMain.handle('load-markdown', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    title: 'ERD 마크다운 불러오기',
    filters: [{ name: 'Markdown', extensions: ['md'] }],
    properties: ['openFile'],
  })
  if (canceled || !filePaths[0]) return { loaded: false }
  if (!filePaths[0].toLowerCase().endsWith('.md')) {
    return { loaded: false, error: '.md 파일만 불러올 수 있습니다.' }
  }
  try {
    const content = await readFile(filePaths[0], 'utf-8')
    const parsed = parseMarkdownFile(content)
    if (!parsed) return { loaded: false, error: 'Mermaid ERD 코드를 찾을 수 없습니다.' }
    return { loaded: true, ...parsed, filePath: filePaths[0] }
  } catch (e) {
    return { loaded: false, error: (e as Error).message }
  }
})

// ─── 클립보드
ipcMain.handle('copy-clipboard', (_, text: string) => {
  clipboard.writeText(text)
  return true
})

// ─── PNG/SVG 내보내기
ipcMain.handle(
  'export-image',
  async (
    _,
    {
      dataUrl,
      format,
      dbName,
    }: { dataUrl: string; format: string; dbName: string }
  ) => {
    const ext = format === 'svg' ? 'svg' : 'png'
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: `ERD ${format.toUpperCase()} 내보내기`,
      defaultPath: `${dbName}-erd.${ext}`,
      filters: [{ name: format.toUpperCase(), extensions: [ext] }],
    })
    if (canceled || !filePath) return { saved: false }
    if (format === 'svg') {
      await writeFile(
        filePath,
        Buffer.from(dataUrl.replace(/^data:image\/svg\+xml;base64,/, ''), 'base64')
      )
    } else {
      await writeFile(filePath, nativeImage.createFromDataURL(dataUrl).toPNG())
    }
    return { saved: true, filePath }
  }
)

// ─── Obsidian Vault 연동
ipcMain.handle('get-obsidian-vault', () => store.get('obsidianVaultPath'))
ipcMain.handle('clear-obsidian-vault', () => store.set('obsidianVaultPath', ''))

ipcMain.handle('pick-obsidian-vault', async () => {
  const { filePaths, canceled } = await dialog.showOpenDialog({
    title: 'Obsidian Vault 선택',
    properties: ['openDirectory'],
    message: '.obsidian 폴더가 있는 Vault 루트를 선택하세요',
  })
  if (canceled || !filePaths[0]) return { picked: false }
  const vaultPath = filePaths[0]
  store.set('obsidianVaultPath', vaultPath)
  return { picked: true, vaultPath, isValid: existsSync(join(vaultPath, '.obsidian')) }
})

ipcMain.handle('list-vault-folders', async () => {
  const vaultPath = store.get('obsidianVaultPath') as string
  if (!vaultPath || !existsSync(vaultPath)) return []
  try {
    const entries = await readdir(vaultPath, { withFileTypes: true })
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
      .map((e) => e.name)
      .sort()
  } catch {
    return []
  }
})

ipcMain.handle(
  'save-to-obsidian',
  async (
    _,
    {
      mermaidCode,
      dbName,
      subFolder,
    }: { mermaidCode: string; dbName: string; subFolder: string | null }
  ) => {
    const vaultPath = store.get('obsidianVaultPath') as string
    if (!vaultPath) return { saved: false, error: 'Vault 경로가 설정되지 않았습니다.' }
    const erdFolder = subFolder ? join(vaultPath, subFolder, 'ERD') : join(vaultPath, 'ERD')
    if (!existsSync(erdFolder)) await mkdir(erdFolder, { recursive: true })
    const fileName = `${dbName}-erd.md`
    const filePath = join(erdFolder, fileName)
    await writeFile(filePath, buildMarkdown(mermaidCode, dbName), 'utf-8')
    return { saved: true, filePath, fileName }
  }
)
