const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('sunoSpectrum', {
    onData: (cb) => ipcRenderer.on('spectrum-data', (_e, data) => cb(data)),
    close: () => ipcRenderer.invoke('mini-control', 'close-spectrum')
});
