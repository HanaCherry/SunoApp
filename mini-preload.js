const { contextBridge, ipcRenderer } = require('electron');

const actions = new Set(['close-mini', 'show-main', 'toggle-mini-size', 'always-on-top',
    'resize-to-artwork', 'playpause', 'prev', 'next', 'stop', 'like']);

contextBridge.exposeInMainWorld('sunoMini', {
    control: (action, value) => {
        if (!actions.has(action)) return;
        return ipcRenderer.invoke('mini-control', action, value);
    },
    onPlayerState: (callback) => {
        if (typeof callback !== 'function') return;
        const listener = (_event, state) => callback(state);
        ipcRenderer.on('player-state', listener);
        return () => ipcRenderer.removeListener('player-state', listener);
    }
});
