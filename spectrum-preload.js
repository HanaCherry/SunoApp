const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('sunoSpectrum', {
    onData: (cb) => {
        if (typeof cb !== 'function') return;
        const listener = (_event, data) => cb(data);
        ipcRenderer.on('spectrum-data', listener);
        return () => ipcRenderer.removeListener('spectrum-data', listener);
    },
    close: () => ipcRenderer.invoke('mini-control', 'close-spectrum')
});
