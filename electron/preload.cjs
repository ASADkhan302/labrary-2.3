const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  sendWindowAction: (action) => ipcRenderer.send('window-action', action),
  platform: process.platform,
});
