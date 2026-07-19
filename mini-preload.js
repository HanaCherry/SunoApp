const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('sunoMini', {
    control: (action, value) => ipcRenderer.invoke('mini-control', action, value),
    onPlayerState: (callback) => {
        ipcRenderer.on('player-state', (_event, state) => callback(state));
    }
});
