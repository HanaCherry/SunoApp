const { pathToFileURL } = require('node:url');

const MINI_ACTIONS = new Set(['close-mini', 'show-main', 'toggle-mini-size',
    'always-on-top', 'resize-to-artwork', 'playpause', 'prev', 'next', 'stop', 'like']);

const isExternalUrl = (value) => {
    if (typeof value !== 'string') return false;
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
    } catch { return false; }
};

const isSunoUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && ['suno.com', 'www.suno.com'].includes(url.hostname)
            && !url.port && !url.username && !url.password;
    } catch { return false; }
};

const isLocalSender = (event, window, filename) => {
    if (!window || window.isDestroyed()) return false;
    const contents = window.webContents;
    return event.sender === contents && event.senderFrame === contents.mainFrame
        && event.senderFrame?.url === pathToFileURL(filename).href;
};

const validMiniAction = (action, value) => {
    if (!MINI_ACTIONS.has(action)) return false;
    if (action === 'always-on-top') return typeof value === 'boolean';
    if (action === 'resize-to-artwork') {
        return value !== null && typeof value === 'object'
            && Number.isFinite(value.width) && Number.isFinite(value.height)
            && value.width > 0 && value.height > 0;
    }
    return value === undefined;
};

const nativeClickPoint = (value, width, height, zoom = 1) => {
    try {
        const url = new URL(value);
        if (url.protocol !== 'sunoapp:' || url.host !== 'native-click'
            || url.username || url.password || url.hash || !['', '/'].includes(url.pathname)) return null;
        if ([...url.searchParams.keys()].some(key => !['x', 'y'].includes(key))) return null;
        if (!Number.isFinite(zoom) || zoom <= 0) return null;
        const point = {};
        for (const [key, limit] of [['x', width], ['y', height]]) {
            const values = url.searchParams.getAll(key);
            if (values.length !== 1 || !values[0].trim()) return null;
            const coordinate = Number(values[0]);
            if (!Number.isFinite(coordinate) || coordinate < 0) return null;
            point[key] = Math.round(coordinate * zoom);
            if (point[key] >= limit || !Number.isFinite(limit) || limit <= 0) return null;
        }
        return point;
    } catch { return null; }
};

module.exports = { isExternalUrl, isSunoUrl, isLocalSender, validMiniAction, nativeClickPoint };
