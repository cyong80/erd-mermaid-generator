// DB 연결 설정
export interface DBConfig {
  dbType: 'mysql' | 'postgres'
  host: string
  port: string
  user: string
  password: string
  database: string
}

// 스키마 타입
export interface SchemaColumn {
  name: string
  type: string
  isPK: boolean
  isFK: boolean
  isNullable: boolean
  comment: string
  /** 컬럼 설명 (comment와 동일하게 사용, Mermaid에 표시) */
  description?: string
}

export interface SchemaTable {
  name: string
  columns: SchemaColumn[]
}

export interface SchemaRelation {
  from: { table: string; column: string }
  to: { table: string; column: string }
}

export interface Schema {
  tables: SchemaTable[]
  relations: SchemaRelation[]
}

// 최근 연결
export interface RecentConnection extends Omit<DBConfig, 'password'> {
  id: string
  label?: string
  savedAt: string
}

// IPC API 타입
export interface ElectronAPI {
  platform: NodeJS.Platform
  scanDB: (config: DBConfig) => Promise<Schema>
  generateMermaid: (payload: { schema: Schema; dbName: string; includedTables: string[] | null }) => Promise<string>

  getRecentConnections: () => Promise<RecentConnection[]>
  deleteRecentConnection: (id: string) => Promise<RecentConnection[]>
  clearRecentConnections: () => Promise<void>

  saveMarkdown: (payload: { mermaidCode: string; dbName: string }) => Promise<{ saved: boolean; filePath?: string }>
  loadMarkdown: () => Promise<{ loaded: boolean; mermaidCode?: string; dbName?: string; filePath?: string; error?: string }>
  copyClipboard: (text: string) => Promise<void>
  exportImage: (payload: { dataUrl: string; format: string; dbName: string }) => Promise<{ saved: boolean; filePath?: string }>

  getObsidianVault: () => Promise<string>
  pickObsidianVault: () => Promise<{ picked: boolean; vaultPath?: string; isValid?: boolean }>
  clearObsidianVault: () => Promise<void>
  listVaultFolders: () => Promise<string[]>
  saveToObsidian: (payload: { mermaidCode: string; dbName: string; subFolder: string | null }) => Promise<{ saved: boolean; filePath?: string; error?: string }>

  checkForUpdates: () => Promise<void>
  downloadUpdate: () => Promise<void>
  installUpdate: () => Promise<void>
  onUpdateEvent: (channel: string, cb: (...args: unknown[]) => void) => void
  offUpdateEvent: (channel: string) => void
}

declare global {
  interface Window {
    api: ElectronAPI
    __fillForm?: (conn: RecentConnection) => void
    mermaid?: {
      initialize: (config: object) => void
      render: (id: string, code: string) => Promise<{ svg: string }>
    }
  }
}
