import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  scanDB: (config: unknown) => ipcRenderer.invoke('scan-db', config),
  generateMermaid: (payload: unknown) => ipcRenderer.invoke('generate-mermaid', payload),

  getRecentConnections: () => ipcRenderer.invoke('get-recent-connections'),
  deleteRecentConnection: (id: string) => ipcRenderer.invoke('delete-recent-connection', id),
  clearRecentConnections: () => ipcRenderer.invoke('clear-recent-connections'),

  saveMarkdown: (payload: unknown) => ipcRenderer.invoke('save-markdown', payload),
  loadMarkdown: () => ipcRenderer.invoke('load-markdown'),
  copyClipboard: (text: string) => ipcRenderer.invoke('copy-clipboard', text),
  exportImage: (payload: unknown) => ipcRenderer.invoke('export-image', payload),

  getObsidianVault: () => ipcRenderer.invoke('get-obsidian-vault'),
  pickObsidianVault: () => ipcRenderer.invoke('pick-obsidian-vault'),
  clearObsidianVault: () => ipcRenderer.invoke('clear-obsidian-vault'),
  listVaultFolders: () => ipcRenderer.invoke('list-vault-folders'),
  saveToObsidian: (payload: unknown) => ipcRenderer.invoke('save-to-obsidian', payload),

  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateEvent: (channel: string, cb: (...args: unknown[]) => void) => {
    const valid = [
      'update-available',
      'update-not-available',
      'update-progress',
      'update-downloaded',
      'update-error',
    ]
    if (valid.includes(channel)) ipcRenderer.on(channel, (_e, ...args) => cb(...args))
  },
  offUpdateEvent: (channel: string) => ipcRenderer.removeAllListeners(channel),
})
