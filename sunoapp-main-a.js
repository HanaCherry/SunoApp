const { app, BrowserWindow, globalShortcut, nativeImage, session, Menu, shell, clipboard, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const sunoI18n = require('./sunoapp-i18n.js');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;
let miniWindow;
let spectrumWindow;
let spectrumTimer = null;
let isPlaying = false;

const SAFE_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const sanitizeSelection = (text = '') => String(text ?? '').replace(/\s+/g, ' ').trim();

const isAllowedExternalUrl = (candidate) => {
    if (!candidate || typeof candidate !== 'string') return false;
    try {
        const parsed = new URL(candidate);
        return SAFE_EXTERNAL_PROTOCOLS.has(parsed.protocol);
    } catch (error) {
        return false;
    }
};

const openExternalSearch = (url) => {
    if (!isAllowedExternalUrl(url)) {
        console.warn('URL externe bloquée:', url);
        return;
    }
    shell.openExternal(url).catch((error) => {
        console.error('Erreur ouverture lien externe:', error);
    });
};

const openTranslationWindow = (text, targetLang = 'fr') => {
    const selectedText = sanitizeSelection(text);
    if (!selectedText) return;

    const safeTarget = /^[a-z-]{2,5}$/i.test(String(targetLang || '')) ? String(targetLang) : 'fr';

    const translateWindow = new BrowserWindow({
        width: 920,
        height: 720,
        title: 'SunoApp - Traduction',
        autoHideMenuBar: true,
        backgroundColor: '#121212',
        icon: path.join(__dirname, 'app-icon.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    const encodedText = encodeURIComponent(selectedText);
    translateWindow.loadURL(`https://translate.google.com/?sl=auto&tl=${safeTarget}&text=${encodedText}&op=translate`);
};

const buildContextMenu = (params = {}) => {
    const selectedText = sanitizeSelection(params.selectionText || '');
    const hasSelection = selectedText.length > 0;
    const editFlags = params.editFlags || {};
    const suggestions = Array.isArray(params.dictionarySuggestions) ? params.dictionarySuggestions.slice(0, 6) : [];
    const hasMisspelledWord = !!params.misspelledWord;
    const currentUrl = mainWindow?.webContents?.getURL?.() || '';

    const template = [];

    if (hasMisspelledWord) {
        if (suggestions.length > 0) {
            template.push({
                label: `Corriger "${params.misspelledWord}"`,
                submenu: suggestions.map((suggestion) => ({
                    label: suggestion,
                    click: () => mainWindow.webContents.replaceMisspelling(suggestion)
                }))
            });
        } else {
            template.push({
                label: `Aucune suggestion pour "${params.misspelledWord}"`,
                enabled: false
            });
        }

        template.push({
            label: 'Ajouter au dictionnaire',
            click: () => {
                try {
                    mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord);
                } catch (error) {
                    console.error('Erreur dictionnaire:', error);
                }
            }
        });
        template.push({ type: 'separator' });
    }

    template.push(
        { label: 'Annuler', role: 'undo', enabled: !!editFlags.canUndo },
        { label: 'Rétablir', role: 'redo', enabled: !!editFlags.canRedo },
        { type: 'separator' },
        { label: 'Couper', role: 'cut', enabled: !!editFlags.canCut },
        { label: 'Copier', role: 'copy', enabled: !!editFlags.canCopy || hasSelection },
        { label: 'Coller', role: 'paste', enabled: !!editFlags.canPaste || !!params.isEditable },
        { label: 'Coller sans mise en forme', role: 'pasteAndMatchStyle', enabled: !!editFlags.canPaste || !!params.isEditable },
        { label: 'Supprimer', role: 'delete', enabled: !!editFlags.canDelete },
        { type: 'separator' },
        { label: 'Tout sélectionner', role: 'selectAll', enabled: !!editFlags.canSelectAll || !!params.isEditable }
    );

    if (hasSelection) {
        template.push(
            { type: 'separator' },
            {
                label: 'Copier la sélection',
                click: () => clipboard.writeText(selectedText)
            },
            {
                label: 'Rechercher la sélection',
                submenu: [
                    {
                        label: 'Google',
                        click: () => openExternalSearch(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`)
                    },
                    {
                        label: 'YouTube',
                        click: () => openExternalSearch(`https://www.youtube.com/results?search_query=${encodeURIComponent(selectedText)}`)
                    },
                    {
                        label: 'Suno',
                        click: () => openExternalSearch(`https://suno.com/search?q=${encodeURIComponent(selectedText)}`)
                    }
                ]
            },
            {
                label: 'Traduire la sélection',
                submenu: [
                    { label: 'Vers français', click: () => openTranslationWindow(selectedText, 'fr') },
                    { label: 'Vers anglais', click: () => openTranslationWindow(selectedText, 'en') },
                    { label: 'Vers portugais', click: () => openTranslationWindow(selectedText, 'pt') },
                    { label: 'Vers japonais', click: () => openTranslationWindow(selectedText, 'ja') },
                    { label: 'Vers coréen', click: () => openTranslationWindow(selectedText, 'ko') }
                ]
            }
        );
    }

    if (params.linkURL && isAllowedExternalUrl(params.linkURL)) {
        template.push(
            { type: 'separator' },
            {
                label: 'Ouvrir le lien dans le navigateur',
                click: () => openExternalSearch(params.linkURL)
            },
            {
                label: 'Copier le lien',
                click: () => clipboard.writeText(params.linkURL)
            }
        );
    }

    if (params.srcURL && isAllowedExternalUrl(params.srcURL)) {
        template.push(
            { type: 'separator' },
            {
                label: 'Copier le lien du média',
                click: () => clipboard.writeText(params.srcURL)
            },
            {
                label: 'Ouvrir le média dans le navigateur',
                click: () => openExternalSearch(params.srcURL)
            }
        );
    }

    template.push(
        { type: 'separator' },
        {
            label: 'Recharger SunoApp',
            accelerator: 'CmdOrCtrl+R',
            click: () => mainWindow.webContents.reload()
        },
        {
            label: 'Retour',
            enabled: mainWindow.webContents.canGoBack(),
            click: () => mainWindow.webContents.goBack()
        },
        {
            label: 'Suivant',
            enabled: mainWindow.webContents.canGoForward(),
            click: () => mainWindow.webContents.goForward()
        },
        {
            label: 'Copier l\'adresse de la page',
            enabled: !!currentUrl,
            click: () => clipboard.writeText(currentUrl)
        }
    );

    return Menu.buildFromTemplate(template);
};

app.whenReady().then(() => {
    const customSession = session.fromPartition('persist:sunoCache');

    try {
        customSession.setSpellCheckerLanguages(['fr', 'en-US', 'pt-BR']);
    } catch (error) {
        console.error('Erreur activation correction orthographique:', error);
    }

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        frame: false,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'app-icon.ico'),
        backgroundColor: '#121212',
        show: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            session: customSession,
            spellcheck: true,
            backgroundThrottling: false
        }
    });

    mainWindow.loadURL('https://suno.com');

    mainWindow.webContents.on('context-menu', (event, params) => {
        try {
            buildContextMenu(params).popup({ window: mainWindow });
        } catch (error) {
            console.error('Erreur menu clic droit:', error);
        }
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url === 'sunoapp://mini') {
            toggleMiniPlayer();
            return { action: 'deny' };
        }
        if (url === 'sunoapp://spectrum') {
            toggleSpectrumWindow();
            return { action: 'deny' };
        }
        if (url === 'sunoapp://fullscreen') {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.setFullScreen(!mainWindow.isFullScreen());
            }
            return { action: 'deny' };
        }
        if (url === 'sunoapp://window-minimize') {
            mainWindow.minimize();
            return { action: 'deny' };
        }
        if (url === 'sunoapp://window-maximize') {
            if (mainWindow.isMaximized()) mainWindow.unmaximize();
            else mainWindow.maximize();
            return { action: 'deny' };
        }
        if (url === 'sunoapp://window-close') {
            mainWindow.close();
            return { action: 'deny' };
        }
        if (url.startsWith('sunoapp://native-click')) {
            try {
                const target = new URL(url);
                const x = Number(target.searchParams.get('x'));
                const y = Number(target.searchParams.get('y'));
                const display = screen.getPrimaryDisplay();
                const bounds = display?.workArea || display?.bounds || { width: 0, height: 0 };
                const maxX = Number(bounds.width || 0);
                const maxY = Number(bounds.height || 0);

                if (
                    Number.isFinite(x) && Number.isFinite(y) &&
                    x >= 0 && y >= 0 &&
                    x <= maxX && y <= maxY
                ) {
                    mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: Math.round(x), y: Math.round(y) });
                    mainWindow.webContents.sendInputEvent({ type: 'mouseDown', x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 });
                    mainWindow.webContents.sendInputEvent({ type: 'mouseUp', x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 });
                } else {
                    console.warn('Clic native bloqué: coordonnées hors limites', { x, y, maxX, maxY });
                }
            } catch (error) {
                console.error('Erreur raccourci Suno:', error);
            }
            return { action: 'deny' };
        }
        openExternalSearch(url);
        return { action: 'deny' };
    });

    const iconLike = nativeImage.createFromPath(path.join(__dirname, 'like.png')).resize({ width: 32, height: 32 });
    const iconPrev = nativeImage.createFromPath(path.join(__dirname, 'prec.png')).resize({ width: 32, height: 32 });
    const iconPlay = nativeImage.createFromPath(path.join(__dirname, 'play.png')).resize({ width: 32, height: 32 });
    const iconPause = nativeImage.createFromPath(path.join(__dirname, 'pause.png')).resize({ width: 32, height: 32 });
    const iconStop = nativeImage.createFromPath(path.join(__dirname, 'stop.png')).resize({ width: 32, height: 32 });
    const iconNext = nativeImage.createFromPath(path.join(__dirname, 'suiv.png')).resize({ width: 32, height: 32 });
    const iconMini = nativeImage.createFromPath(path.join(__dirname, 'mini.png')).resize({ width: 32, height: 32 });

    const tt = (key) => sunoI18n.t(key, null, sunoI18n.resolve(app.getLocale()));

    const updateThumbar = () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.setThumbarButtons([
            { tooltip: tt('like'), icon: iconLike, click() { controlSuno('like'); } },
            { tooltip: tt('prev'), icon: iconPrev, click() { controlSuno('prev'); } },
            { tooltip: isPlaying ? tt('pause') : tt('play'), icon: isPlaying ? iconPause : iconPlay, click() { controlSuno('playpause'); } },
            { tooltip: tt('stop'), icon: iconStop, click() { controlSuno('stop'); } },
            { tooltip: tt('next'), icon: iconNext, click() { controlSuno('next'); } },
            { tooltip: tt('miniPlayer'), icon: iconMini, click() { toggleMiniPlayer(); } }
        ]);
    };

    const placeMiniPlayerBottomRight = (width, height) => {
        if (!miniWindow || miniWindow.isDestroyed()) return;
        const display = screen.getDisplayNearestPoint(screen.getCursorScreenPoint());
        const { x, y, width: workWidth, height: workHeight } = display.workArea;
        const margin = 18;
        miniWindow.setBounds({
            x: x + workWidth - width - margin,
            y: y + workHeight - height - margin,
            width,
            height
        }, true);
        miniWindow.moveTop();
    };

    const toggleMiniPlayer = () => {
        if (miniWindow && !miniWindow.isDestroyed()) {
            miniWindow.close();
            return;
        }

        miniWindow = new BrowserWindow({
            width: 400,
            height: 540,
            minWidth: 360,
            minHeight: 460,
            maxWidth: 560,
            maxHeight: 760,
            frame: false,
            transparent: true,
            hasShadow: false,
            resizable: true,
            maximizable: false,
            fullscreenable: false,
            alwaysOnTop: true,
            skipTaskbar: false,
            backgroundColor: '#00000000',
            icon: path.join(__dirname, 'app-icon.ico'),
            webPreferences: {
                preload: path.join(__dirname, 'mini-preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true
            }
        });

        miniWindow.loadFile(path.join(__dirname, 'mini-player.html'));
        placeMiniPlayerBottomRight(400, 540);
        miniWindow.setAlwaysOnTop(true, 'screen-saver');
        miniWindow.moveTop();
        miniWindow.on('closed', () => { miniWindow = null; });
    };

    const stopSpectrumPump = () => {
        if (spectrumTimer) {
            clearInterval(spectrumTimer);
            spectrumTimer = null;
        }
    };

    const toggleSpectrumWindow = () => {
        if (spectrumWindow && !spectrumWindow.isDestroyed()) {
            spectrumWindow.close();
            return;
        }

        spectrumWindow = new BrowserWindow({
            width: 760,
            height: 280,
            minWidth: 420,
            minHeight: 180,
            frame: false,
            transparent: true,
            hasShadow: false,
            resizable: true,
            maximizable: false,
            fullscreenable: false,
            alwaysOnTop: true,
            skipTaskbar: false,
            backgroundColor: '#00000000',
            icon: path.join(__dirname, 'app-icon.ico'),
            webPreferences: {
                preload: path.join(__dirname, 'spectrum-preload.js'),
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true
            }
        });

        spectrumWindow.loadFile(path.join(__dirname, 'spectrum.html'));
        spectrumWindow.setAlwaysOnTop(true, 'screen-saver');
        spectrumWindow.moveTop();
        spectrumWindow.on('closed', () => {
            spectrumWindow = null;
            stopSpectrumPump();
        });

        stopSpectrumPump();
        spectrumTimer = setInterval(() => {
            if (!spectrumWindow || spectrumWindow.isDestroyed() || !mainWindow || mainWindow.isDestroyed()) return;
            mainWindow.webContents.executeJavaScript(
                "(function(){try{return window.__sunoAppGetSpectrum?window.__sunoAppGetSpectrum():null}catch(e){return null}})()"
            ).then((payload) => {
                if (spectrumWindow && !spectrumWindow.isDestroyed() && payload) {
                    spectrumWindow.webContents.send('spectrum-data', payload);
                }
            }).catch(() => {});
        }, 40);
    };

    const installMiniPlayerButton = () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        if (window.__sunoAppMiniButtonInstalled) return;
        window.__sunoAppMiniButtonInstalled = true;

        mainWindow.webContents.executeJavaScript(`
            (function() {
                const ensureMiniButton = () => {
                    if (document.getElementById('sunoapp-mini-launcher')) return;

                    const visible = (element) => {
                        if (!element) return false;
                        const rect = element.getBoundingClientRect();
                        const style = window.getComputedStyle(element);
                        return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
                    };
                    const buttonText = (candidate) => [
                        candidate.getAttribute('aria-label'),
                        candidate.getAttribute('data-testid'),
                        candidate.title,
                        candidate.textContent
                    ].filter(Boolean).join(' ').trim();
                    const findButton = (patterns) => Array.from(document.querySelectorAll('button,[role="button"]'))
                        .filter(visible)
                        .find((candidate) => patterns.some((pattern) => pattern.test(buttonText(candidate))));
                    const volumeButton = findButton([/volume/i, /mute/i, /sound/i]);
                    const detailsButton = findButton([/song details/i, /détails du morceau/i, /more/i, /options/i, /menu/i]);
                    const mediaButton = findButton([/playbar/i, /play/i, /pause/i, /next/i, /previous/i, /skip/i]);
                    const mediaElement = Array.from(document.querySelectorAll('audio,video')).find((media) => media.src || media.currentSrc);
                    let anchorButton = detailsButton || volumeButton || mediaButton;
                    if (!anchorButton && mediaElement) {
                        let node = mediaElement.parentElement;
                        for (let depth = 0; node && depth < 10; depth++) {
                            const buttons = Array.from(node.querySelectorAll('button,[role="button"]')).filter(visible);
                            if (buttons.length >= 2) {
                                anchorButton = buttons[buttons.length - 1];
                                break;
                            }
                            node = node.parentElement;
                        }
                    }
                    if (!anchorButton?.parentElement) return;

                    let playbar = anchorButton.parentElement;
                    for (let depth = 0; playbar && depth < 7; depth++) {
                        const rect = playbar.getBoundingClientRect();
                        const hasMediaControls = playbar.querySelectorAll('button,[role="button"]').length >= 2;
                        if (rect.width >= window.innerWidth * 0.55 && rect.height >= 42 && rect.height <= 180 && hasMediaControls) break;
                        playbar = playbar.parentElement;
                    }
                    if (playbar) playbar.classList.add('sunoapp-glass-playbar');

                    const button = document.createElement('button');
                    button.id = 'sunoapp-mini-launcher';
                    button.type = 'button';
                    button.title = ${JSON.stringify(tt('openMini'))};
                    button.setAttribute('aria-label', ${JSON.stringify(tt('openMini'))});
                    button.innerHTML = \`
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="3" y="4" width="15" height="12" rx="2.2"></rect>
                            <rect x="12" y="12" width="9" height="8" rx="2"></rect>
                        </svg>
                    \`;
                    button.addEventListener('click', () => window.open('sunoapp://mini', '_blank'));
                    anchorButton.parentElement.insertBefore(button, anchorButton);

                    const fullscreenButton = document.createElement('button');
                    fullscreenButton.id = 'sunoapp-fullscreen-launcher';
                    fullscreenButton.type = 'button';
                    fullscreenButton.title = ${JSON.stringify(tt('fullscreen'))};
                    fullscreenButton.setAttribute('aria-label', ${JSON.stringify(tt('fullscreen'))});
                    fullscreenButton.innerHTML = \`
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M9 4H4v5M15 4h5v5M4 15v5h5M20 15v5h-5"></path>
                        </svg>
                    \`;
                    fullscreenButton.addEventListener('click', () => window.open('sunoapp://fullscreen', '_blank'));
                    anchorButton.parentElement.insertBefore(fullscreenButton, anchorButton);
                };

                if (!document.getElementById('sunoapp-mini-launcher-style')) {
                    const style = document.createElement('style');
                    style.id = 'sunoapp-mini-launcher-style';
                    style.textContent = \`
                        #sunoapp-mini-launcher,
                        #sunoapp-fullscreen-launcher {
                            display: inline-grid !important;
                            place-items: center !important;
                            flex: 0 0 auto !important;
                            width: 32px !important;
                            height: 32px !important;
                            margin: 0 3px !important;
                            padding: 6px !important;
                            border: 0 !important;
                            border-radius: 50% !important;
                            color: rgba(255,255,255,.78) !important;
                            background: transparent !important;
                            cursor: pointer !important;
                        }
                        #sunoapp-mini-launcher:hover,
                        #sunoapp-fullscreen-launcher:hover {
                            color: #fff !important;
                            background: rgba(255,255,255,.1) !important;
                        }
                        #sunoapp-mini-launcher svg,
                        #sunoapp-fullscreen-launcher svg {
                            width: 20px !important;
                            height: 20px !important;
                            fill: none !important;
                            stroke: currentColor !important;
                            stroke-width: 1.8 !important;
                            pointer-events: none !important;
                        }
                        .sunoapp-glass-playbar {
                            background: linear-gradient(180deg, rgba(31,31,36,.56), rgba(13,13,17,.48)) !important;
                            border-top: 1px solid rgba(255,255,255,.12) !important;
                            box-shadow: inset 0 1px rgba(255,255,255,.045), 0 -12px 32px rgba(0,0,0,.16) !important;
                            backdrop-filter: blur(28px) saturate(175%) !important;
                            -webkit-backdrop-filter: blur(28px) saturate(175%) !important;
                        }
                    \`;
                    document.head.appendChild(style);
                }

                ensureMiniButton();
                if (!window.__sunoMiniButtonObserver) {
                    window.__sunoMiniButtonObserver = new MutationObserver(ensureMiniButton);
                    window.__sunoMiniButtonObserver.observe(document.body, { childList: true, subtree: true });
                }
            })();
        `).catch(() => {});
    };

    const installSunoAppEnhancements = () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        if (window.__sunoAppEnhancementsInstalled) return;
        window.__sunoAppEnhancementsInstalled = true;

        const enhancementScript = [
            'sunoapp-i18n-1.js',
            'sunoapp-i18n-2.js',
            'sunoapp-i18n-3.js',
            'sunoapp-i18n-4.js',
            'sunoapp-i18n-5.js',
            'sunoapp-i18n-6.js',
            'sunoapp-i18n-7.js',
            'sunoapp-i18n-8.js',
            'sunoapp-i18n-9.js',
            'sunoapp-i18n-10.js',
            'sunoapp-i18n-11.js',
            'sunoapp-i18n-12.js',
            'sunoapp-i18n-13.js',
            'main-enhancements.js',
            'sunoapp-enh-2.js',
            'sunoapp-enh-3.js',
            'sunoapp-enh-3b.js',
            'sunoapp-enh-4.js',
            'sunoapp-enh-5.js',
            'sunoapp-enh-6.js'
        ].map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');

        const diagnosticScript = `
            (() => {
                const source = ${JSON.stringify(enhancementScript)};
                try {
                    const runner = new Function(source);
                    runner();
                    return { ok: true };
                } catch (error) {
                    return {
                        ok: false,
                        name: error?.name || 'Error',
                        message: error?.message || String(error),
                        stack: error?.stack || ''
                    };
                }
            })()
        `;

        mainWindow.webContents.executeJavaScript(diagnosticScript).then((result) => {
            if (!result?.ok) {
                console.error('Erreur interface SunoApp:', `${result.name}: ${result.message}\n${result.stack}`);
            }
        }).catch((error) => {
            console.error('Erreur injection interface SunoApp:', error);
        });
    };

    let integrationTimer = null;
    let studioMode = false;
    let windowBoundsBeforeStudio = null;
    const syncStudioWindow = () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        const currentUrl = mainWindow.webContents.getURL();
        const isStudio = /^https:\/\/(?:www\.)?suno\.com\/(?:studio|create)(?:\/|$)/i.test(currentUrl);
        if (isStudio && !studioMode) {
            studioMode = true;
            if (!mainWindow.isMaximized() && !mainWindow.isFullScreen()) {
                windowBoundsBeforeStudio = mainWindow.getBounds();
                mainWindow.maximize();
            }
        } else if (!isStudio && studioMode) {
            studioMode = false;
            if (windowBoundsBeforeStudio && !mainWindow.isFullScreen()) {
                mainWindow.unmaximize();
                mainWindow.setBounds(windowBoundsBeforeStudio, true);
            }
            windowBoundsBeforeStudio = null;
        }
    };

    const installSunoIntegration = () => {
        clearTimeout(integrationTimer);
        syncStudioWindow();
        integrationTimer = setTimeout(() => {
            if (!mainWindow || mainWindow.isDestroyed()) return;
            const currentUrl = mainWindow.webContents.getURL();
            if (!/^https:\/\/(?:www\.)?suno\.com(?:\/|$)/i.test(currentUrl)) return;
            installMiniPlayerButton();
            installSunoAppEnhancements();
        }, 900);
    };

    mainWindow.webContents.on('dom-ready', installSunoIntegration);
    mainWindow.webContents.on('did-navigate-in-page', installSunoIntegration);

    ipcMain.removeHandler('mini-control');
    ipcMain.handle('mini-control', (_event, action, value) => {
        if (action === 'close-mini') {
            if (miniWindow && !miniWindow.isDestroyed()) miniWindow.close();
            return;
        }
        if (action === 'close-spectrum') {
            if (spectrumWindow && !spectrumWindow.isDestroyed()) spectrumWindow.close();
            return;
        }
        if (action === 'show-main') {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.show();
                mainWindow.focus();
            }
            return;
        }
        if (action === 'toggle-mini-size') {
            if (miniWindow && !miniWindow.isDestroyed()) {
                const [width] = miniWindow.getSize();
                miniWindow.setSize(width < 480 ? 520 : 400, width < 480 ? 700 : 540, true);
            }
            return;
        }
        if (action === 'always-on-top') {
            if (miniWindow && !miniWindow.isDestroyed()) {
                miniWindow.setAlwaysOnTop(Boolean(value), 'floating');
            }
            return;
        }
        if (action === 'resize-to-artwork') {
            if (miniWindow && !miniWindow.isDestroyed() && value?.width > 0 && value?.height > 0) {
                const ratio = Math.max(0.55, Math.min(2.2, value.width / value.height));
                let windowWidth = 400;
                if (ratio >= 1.35) windowWidth = 520;
                if (ratio <= 0.75) windowWidth = 380;

                const artworkWidth = windowWidth - 64;
                const artworkHeight = Math.max(220, Math.min(520, artworkWidth / ratio));
                const windowHeight = Math.round(Math.max(430, Math.min(760, artworkHeight + 204)));
                placeMiniPlayerBottomRight(windowWidth, windowHeight);
                miniWindow.setAlwaysOnTop(true, 'screen-saver');
            }
            return;
        }
        if (['playpause', 'prev', 'next', 'stop', 'like'].includes(action)) {
            controlSuno(action);
        }
    });

    const controlSuno = (action) => {
        if (!mainWindow || mainWindow.isDestroyed()) return;

        mainWindow.webContents.executeJavaScript(`
            try {
                const visible = (element) => {
                    if (!element) return false;
                    const rect = element.getBoundingClientRect();
                    const style = window.getComputedStyle(element);
                    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
                };
                const textOf = (element) => [
                    element.getAttribute('aria-label'),
                    element.getAttribute('data-testid'),
                    element.getAttribute('data-state'),
                    element.title,
                    element.textContent
                ].filter(Boolean).join(' ').trim();
                const clickButton = (patterns) => {
                    const buttons = Array.from(document.querySelectorAll('button,[role="button"]')).filter(visible);
                    const matches = buttons.filter((button) => patterns.some((pattern) => pattern.test(textOf(button))));
                    if (matches.length > 0) {
                        matches[matches.length - 1].click();
                        return true;
                    }
                    return false;
                };
                const medias = Array.from(document.querySelectorAll('audio, video')).filter((media) => media.src || media.currentSrc);
                const activeMedia = medias.find((media) => !media.paused) || medias[medias.length - 1];
                if ('${action}' === 'playpause') {
                    if (navigator.mediaSession?.playbackState === 'playing') {
                        if (!clickButton([/playbar.*pause/i, /pause/i, /paused/i])) activeMedia?.pause();
                    } else if (navigator.mediaSession?.playbackState === 'paused') {
                        if (!clickButton([/playbar.*play/i, /^play$/i, /play button/i])) activeMedia?.play?.();
                    } else if (activeMedia) {
                        if (activeMedia.paused) activeMedia.play();
                        else activeMedia.pause();
                    } else {
                        clickButton([/playbar.*(play|pause)/i, /^(play|pause)$/i, /(play|pause) button/i, /lecture/i]);
                    }
                }
                else if ('${action}' === 'stop') {
                    for (let i = 0; i < medias.length; i++) {
                        try {
                            medias[i].pause();
                            medias[i].currentTime = 0;
                        } catch (error) {
                            // Ignore media elements that do not allow seeking.
                        }
                    }
                }
                else if ('${action}' === 'prev') {
                    clickButton([/playbar.*(previous|prev|back)/i, /previous/i, /précédent/i, /prev/i, /back/i, /skip.*back/i]);
                }
                else if ('${action}' === 'next') {
                    clickButton([/playbar.*next/i, /next/i, /suivant/i, /skip.*forward/i]);
                }
                else if ('${action}' === 'like') {
                    clickButton([/like/i, /favorite/i, /favourite/i, /heart/i, /aime/i]);
                }
            } catch(e) {}
        `).catch(() => {});
    };

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        updateThumbar();

        const soundPath = path.join(__dirname, 'startup.mp3');
        if (fs.existsSync(soundPath)) {
            const fileBuffer = fs.readFileSync(soundPath);
            if (fileBuffer.length > 512 * 1024) {
                console.warn('startup.mp3 trop volumineux, son ignoré');
            } else {
                const soundDataUrl = `data:audio/mpeg;base64,${fileBuffer.toString('base64')}`;
                mainWindow.webContents.executeJavaScript(`
                    (() => {
                        try {
                            const startupSound = new Audio(${JSON.stringify(soundDataUrl)});
                            startupSound.volume = 0.6;
                            startupSound.play().catch(() => {});
                        } catch (error) {
                            console.warn('Son de démarrage bloqué:', error);
                        }
                    })();
                `).catch(() => {});
            }
        }

        let playerPollTimer = setInterval(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.executeJavaScript(`
                    (function() {
                        const visible = (element) => {
                            if (!element) return false;
                            const rect = element.getBoundingClientRect();
                            const style = window.getComputedStyle(element);
                            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
                        };
                        const textOf = (element) => [
                            element.getAttribute('aria-label'),
                            element.getAttribute('data-testid'),
                            element.title,
                            element.textContent
                        ].filter(Boolean).join(' ').trim();
                        const medias = Array.from(document.querySelectorAll('audio, video')).filter((media) => media.src || media.currentSrc);
                        const activeMedia = medias.find((media) => !media.paused) || medias[medias.length - 1];
                        const playing = navigator.mediaSession?.playbackState === 'playing' || Boolean(activeMedia && !activeMedia.paused);

                        const playbarButton = Array.from(document.querySelectorAll('button,[role="button"]'))
                            .filter(visible)
                            .find((button) => /playbar|play|pause|next|previous|skip/i.test(textOf(button)));
                        let playerRoot = playbarButton?.parentElement || activeMedia?.parentElement || null;
                        for (let depth = 0; playerRoot && depth < 7; depth++) {
                            const hasCover = !!playerRoot.querySelector('img');
                            const hasLinks = playerRoot.querySelectorAll('a').length >= 2;
                            const hasControls = playerRoot.querySelectorAll('button,[role="button"]').length >= 2;
                            if (hasCover && hasLinks && hasControls) break;
                            playerRoot = playerRoot.parentElement;
                        }

                        const playerLinks = playerRoot
                            ? Array.from(playerRoot.querySelectorAll('a')).filter((link) => link.textContent?.trim())
                            : [];
                        const titleLink = document.querySelector('[aria-label*="Playbar: Title" i], [aria-label*="Song title" i], [data-testid*="title" i]') || playerLinks[0];
                        const artistLink = document.querySelector('[aria-label*="Playbar: Artist" i], [aria-label*="Artist" i], [data-testid*="artist" i]') || playerLinks[1];
                        const coverImage = playerRoot?.querySelector('img') || document.querySelector('img[aria-label*="Playbar: Cover" i], img[aria-label*="cover" i], img[alt*="cover" i], img[alt*="album" i]');

                        const mediaMetadata = navigator.mediaSession?.metadata;
                        const mediaArtwork = mediaMetadata?.artwork;
                        const mediaCover = Array.isArray(mediaArtwork) && mediaArtwork.length
                            ? mediaArtwork[mediaArtwork.length - 1]?.src
                            : '';

                        const resolvedTitle = mediaMetadata?.title || titleLink?.textContent?.trim() || '';

                        return {
                            playing,
                            title: /suno\s*\|\s*ai music/i.test(resolvedTitle) ? '' : resolvedTitle,
                            artist: mediaMetadata?.artist || artistLink?.textContent?.trim() || 'SunoApp',
                            cover: mediaCover || coverImage?.src || ''
                        };
                    })()
                `).then((playerState) => {
                    if (playerState.playing !== isPlaying) {
                        isPlaying = playerState.playing;
                        updateThumbar();
                    }
                    if (miniWindow && !miniWindow.isDestroyed()) {
                        miniWindow.webContents.send('player-state', playerState);
                    }
                }).catch(() => {});
            }
        }, 1200);

        mainWindow.on('closed', () => {
            clearInterval(playerPollTimer);
        });
    });

    globalShortcut.register('CommandOrControl+Space', () => { controlSuno('playpause'); });
    globalShortcut.register('CommandOrControl+Shift+M', () => { toggleMiniPlayer(); });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
