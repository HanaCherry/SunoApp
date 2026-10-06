const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const policy = require('../sunoapp-security');

test('browser translations match the source parts and run without Node privileges', () => {
    const source = Array.from({ length: 13 }, (_, i) => fs.readFileSync(path.join(root, `sunoapp-i18n-${i + 1}.js`), 'utf8')).join('');
    const bundle = fs.readFileSync(path.join(root, 'sunoapp-i18n-browser.js'), 'utf8');
    assert.equal(bundle, source);
    const window = {};
    vm.runInNewContext(bundle, { window });
    assert.equal(typeof window.__SUNO_I18N.t, 'function');
    assert.equal(window.__SUNO_I18N.t('play', null, 'fr'), require('../sunoapp-i18n').t('play', null, 'fr'));
});

async function boot(cookieLocale) {
    const windows = [], external = [], intervals = new Map(), timeouts = new Map();
    const handlers = new Map();
    class Window extends EventEmitter {
        constructor(options) {
            super(); this.options = options; this.destroyed = false; this.bounds = [];
            this.webContents = new EventEmitter();
            Object.assign(this.webContents, {
                mainFrame: { url: '' }, scripts: [], inputs: [],
                getURL() { return this.mainFrame.url; },
                getZoomFactor: () => 1,
                setWindowOpenHandler(fn) { this.popup = fn; },
                executeJavaScript(source) { new vm.Script(source); this.scripts.push(source); return Promise.resolve({ playing: false }); },
                sendInputEvent(event) { this.inputs.push(event); },
                send() {}, canGoBack: () => false, canGoForward: () => false,
            });
            windows.push(this);
        }
        loadURL(url) { this.webContents.mainFrame.url = url; }
        loadFile(file) { this.loadURL(pathToFileURL(file).href); }
        isDestroyed() { return this.destroyed; }
        close() { this.destroyed = true; this.emit('closed'); }
        getContentSize() { return [1280, 800]; }
        getSize() { return [400, 540]; }
        setBounds(bounds) { this.bounds.push(bounds); }
        setAlwaysOnTop(value) { this.top = value; }
        setSize() {} moveTop() {} show() {} focus() {} setThumbarButtons() {} setMenu() {}
        isMaximized() { return false; } isFullScreen() { return false; }
    }
    const app = new EventEmitter();
    Object.assign(app, { commandLine: { appendSwitch() {} }, whenReady: () => Promise.resolve(), getLocale: () => 'fr', quit() {} });
    const electron = {
        app, BrowserWindow: Window,
        globalShortcut: { register() {}, unregisterAll() {} },
        nativeImage: { createFromPath: () => ({ resize: () => ({}) }) },
        session: { fromPartition: () => ({ setSpellCheckerLanguages() {}, cookies: { get: () => Promise.resolve(cookieLocale ? [{ name: 'i18next', value: cookieLocale }] : []) } }) },
        Menu: { buildFromTemplate: template => ({ popup() {}, template }) },
        shell: { openExternal: url => { external.push(url); return Promise.resolve(); } }, clipboard: {},
        ipcMain: { removeHandler() {}, handle: (name, fn) => handlers.set(name, fn) },
        screen: { getCursorScreenPoint: () => ({}), getDisplayNearestPoint: () => ({ workArea: { x: 0, y: 0, width: 1920, height: 1080 } }) },
    };
    const context = {
        console, URL, process, __dirname: root,
        require: name => name === 'electron' ? electron : name.startsWith('.') ? require(path.join(root, name)) : require(name),
        setInterval(fn, ms) { const key = {}; intervals.set(key, { fn, ms }); return key; },
        clearInterval(key) { intervals.delete(key); },
        setTimeout(fn, ms) { const key = {}; timeouts.set(key, { fn, ms }); return key; },
        clearTimeout(key) { timeouts.delete(key); },
    };
    vm.runInNewContext(['sunoapp-main-a.js', 'sunoapp-main-b.js'].map(f => fs.readFileSync(path.join(root, f), 'utf8')).join(''), context);
    await Promise.resolve();
    await Promise.resolve();
    return { windows, external, intervals, timeouts, invoke: handlers.get('mini-control') };
}
const sender = window => ({ sender: window.webContents, senderFrame: window.webContents.mainFrame });

test('application startup restores the native Suno language without translating text', async () => {
    assert.equal((await boot('fr')).windows[0].webContents.getURL(), 'https://suno.com/fr');
    assert.equal((await boot('pt-BR')).windows[0].webContents.getURL(), 'https://suno.com/pt-br');
    assert.equal((await boot('invalid')).windows[0].webContents.getURL(), 'https://suno.com/');
});

test('external sink blocks native protocols and keeps web searches', async () => {
    const app = await boot(), main = app.windows[0];
    for (const url of ['file:///C:/Windows/system32/calc.exe', 'ms-settings:privacy', 'javascript:alert(1)', 'data:text/html,x', 'garbage', 'https://user:pass@example.com']) {
        main.webContents.popup({ url });
    }
    assert.deepEqual(app.external, []);
    main.webContents.popup({ url: 'HTTPS://example.com/music?q=hello%20world' });
    assert.deepEqual(app.external, ['https://example.com/music?q=hello%20world']);
});

test('IPC rejects strangers, subframes, navigated pages, wrong windows and invalid values', async () => {
    const app = await boot(), main = app.windows[0];
    main.webContents.popup({ url: 'sunoapp://mini' });
    main.webContents.popup({ url: 'sunoapp://spectrum' });
    const mini = app.windows[1], spectrum = app.windows[2];
    const before = main.webContents.scripts.length;
    app.invoke(sender(main), 'playpause');
    app.invoke({ sender: mini.webContents, senderFrame: { url: mini.webContents.getURL() } }, 'playpause');
    app.invoke(sender(spectrum), 'playpause');
    const localUrl = mini.webContents.getURL();
    mini.loadURL('https://evil.example'); app.invoke(sender(mini), 'playpause'); mini.loadURL(localUrl);
    assert.equal(main.webContents.scripts.length, before);
    for (const action of ['playpause', 'prev', 'next', 'stop', 'like']) app.invoke(sender(mini), action);
    assert.equal(main.webContents.scripts.length, before + 5);
    for (const value of [{ width: Infinity, height: Infinity }, { width: '400', height: 400 }, { width: -1, height: 2 }]) app.invoke(sender(mini), 'resize-to-artwork', value);
    assert.equal(mini.bounds.length, 1);
    app.invoke(sender(mini), 'resize-to-artwork', { width: 600, height: 600 });
    assert.equal(mini.bounds.length, 2);
    app.invoke(sender(mini), 'always-on-top', false); assert.equal(mini.top, false);
    app.invoke(sender(mini), 'always-on-top', 'false'); assert.equal(mini.top, false);
    app.invoke(sender(mini), 'resize-to-artwork', { width: 900, height: 600 });
    assert.equal(mini.top, false);
    app.invoke(sender(mini), 'close-spectrum'); assert.equal(spectrum.destroyed, false);
    app.invoke(sender(spectrum), 'close-spectrum'); assert.equal(spectrum.destroyed, true);
    app.invoke(sender(mini), 'close-mini'); assert.equal(mini.destroyed, true);
});

test('native clicks reject aliases, missing coordinates and out-of-window points', async () => {
    const app = await boot(), main = app.windows[0];
    for (const url of ['sunoapp://native-click', 'sunoapp://native-click?x=&y=1', 'sunoapp://native-click-other?x=1&y=1', 'sunoapp://native-click?x=1&x=2&y=3', 'sunoapp://native-click?x=Infinity&y=2', 'sunoapp://native-click?x=-0.1&y=2', 'sunoapp://native-click?x=1279.8&y=2', 'sunoapp://native-click?x=3&y=800']) main.webContents.popup({ url });
    assert.equal(main.webContents.inputs.length, 0);
    main.webContents.popup({ url: 'sunoapp://native-click?x=42.2&y=73.7' });
    assert.equal(main.webContents.inputs.length, 3);
    assert.equal(main.webContents.inputs[0].x, 42);
    assert.equal(main.webContents.inputs[0].y, 74);
    main.loadURL('https://evil.example');
    main.webContents.popup({ url: 'sunoapp://native-click?x=4&y=7' });
    assert.equal(main.webContents.inputs.length, 3);
});

test('local windows deny navigation and close with all polling timers', async () => {
    const app = await boot(), main = app.windows[0];
    main.emit('ready-to-show'); main.webContents.emit('dom-ready');
    main.webContents.popup({ url: 'sunoapp://mini' });
    main.webContents.popup({ url: 'sunoapp://spectrum' });
    for (const local of app.windows.slice(1)) {
        for (const event of ['will-navigate', 'will-frame-navigate', 'will-redirect']) {
            let blocked = false; local.webContents.emit(event, { preventDefault() { blocked = true; } }); assert.equal(blocked, true);
        }
        assert.equal(local.webContents.popup({ url: 'https://evil.example' }).action, 'deny');
    }
    assert.equal(app.intervals.size, 2); assert.equal(app.timeouts.size, 1);
    main.close();
    assert.equal(app.intervals.size, 0); assert.equal(app.timeouts.size, 0);
    assert.ok(app.windows.every(w => w.destroyed));
});

test('site boundaries, coordinate zoom and strict action types', () => {
    for (const url of ['https://suno.com/', 'https://www.suno.com/create?q=x']) assert.ok(policy.isSunoUrl(url));
    for (const url of ['http://suno.com', 'https://suno.com.evil.test', 'https://suno.com:8443', 'https://suno.com@evil.test']) assert.equal(policy.isSunoUrl(url), false);
    assert.deepEqual(policy.nativeClickPoint('sunoapp://native-click?x=10&y=20', 100, 100, 1.5), { x: 15, y: 30 });
    assert.equal(policy.validMiniAction('resize-to-artwork', { width: NaN, height: 1 }), false);
});

test('preload delivers player state without exposing the Electron event, with unsubscribe', () => {
    let bridge; const calls = []; const ipc = new EventEmitter(); ipc.invoke = (...args) => calls.push(args);
    vm.runInNewContext(fs.readFileSync(path.join(root, 'mini-preload.js'), 'utf8'), { require: () => ({ contextBridge: { exposeInMainWorld(name, api) { bridge = api; } }, ipcRenderer: ipc }) });
    let received; const stop = bridge.onPlayerState(state => { received = state; });
    const state = { title: 'Test', playing: true };
    ipc.emit('player-state', { secret: true }, state); assert.equal(received, state);
    stop(); assert.equal(ipc.listenerCount('player-state'), 0);
    bridge.onPlayerState(null); assert.equal(ipc.listenerCount('player-state'), 0);
    // Execute the actual mini-player script with a minimal DOM to verify the contract.
    const nodes = new Map(); const node = id => {
        if (!nodes.has(id)) nodes.set(id, { value: id === 'glassColor' ? '#1c1220' : '0.78', style: { setProperty() {} }, setAttribute() {}, removeAttribute() { delete this.src; }, addEventListener() {} });
        return nodes.get(id);
    };
    const document = { documentElement: { setAttribute() {} }, querySelectorAll: () => [], getElementById: node, addEventListener: (event, fn) => fn() };
    const html = fs.readFileSync(path.join(root, 'mini-player.html'), 'utf8');
    const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
    vm.runInNewContext(script, { window: { sunoMini: bridge }, document, URL });
    ipc.emit('player-state', {}, { title: '<song>', artist: 'Artist', playing: true, cover: 'https://example.com/cover.png' });
    assert.equal(node('title').textContent, '<song>'); assert.equal(node('artist').textContent, 'Artist');
    assert.equal(node('cover').src, 'https://example.com/cover.png');
    node('cover').naturalWidth = 600; node('cover').naturalHeight = 600;
    ipc.emit('player-state', {}, { title: '<song>', cover: 'https://example.com/cover.png' });
    ipc.emit('player-state', {}, { title: '<song>', cover: 'https://example.com/cover.png' });
    assert.equal(calls.length, 0, 'unchanged cover must not reposition the mini-player');
    ipc.emit('player-state', {}, { cover: 'file:///C:/private.png' }); assert.equal(node('cover').src, undefined);
});
