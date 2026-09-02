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

const sanitizeSelection = (text = '') => text.replace(/\s+/g, ' ').trim();

const openExternalSearch = (url) => {
    if (!url) return;
    shell.openExternal(url).catch((error) => {
        console.error('Erreur ouverture lien externe:', error);
    });
};

const openTranslationWindow = (text, targetLang = 'fr') => {
    const selectedText = sanitizeSelection(text);
    if (!selectedText) return;

    const translateWindow = new BrowserWindow({
        width: 920,
        height: 720,
        title: 'SunoApp - Traduction',
        autoHideMenuBar: true,
        backgroundColor: '#121212',
        icon: path.join(__dirname, 'icone_flora.ico'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true
        }
    });

    const encodedText = encodeURIComponent(selectedText);
    translateWindow.loadURL(`https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodedText}&op=translate`);
};

const buildContextMenu = (params) => {
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

    if (params.linkURL) {
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

    if (params.srcURL) {
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
            label: 'Copier l’adresse de la page',
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
        icon: path.join(__dirname, 'icone_flora.ico'),
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
                if (Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0) {
                    mainWindow.webContents.sendInputEvent({ type: 'mouseMove', x: Math.round(x), y: Math.round(y) });
                    mainWindow.webContents.sendInputEvent({ type: 'mouseDown', x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 });
                    mainWindow.webContents.sendInputEvent({ type: 'mouseUp', x: Math.round(x), y: Math.round(y), button: 'left', clickCount: 1 });
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
            icon: path.join(__dirname, 'icone_flora.ico'),
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
            icon: path.join(__dirname, 'icone_flora.ico'),
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

        mainWindow.webContents.executeJavaScript(`
            (function() {
                const ensureMiniButton = () => {
                    if (document.getElementById('sunoapp-mini-launcher')) return;

                    const volumeButton = Array.from(document.querySelectorAll('button')).find((candidate) => {
                        const label = [candidate.getAttribute('aria-label'), candidate.title, candidate.textContent]
                            .filter(Boolean).join(' ');
                        return /volume/i.test(label);
                    });
                    const detailsButton = Array.from(document.querySelectorAll('button')).find((candidate) => {
                        const label = [candidate.getAttribute('aria-label'), candidate.title, candidate.textContent]
                            .filter(Boolean).join(' ');
                        return /song details|détails du morceau/i.test(label);
                    });
                    const anchorButton = detailsButton || volumeButton;
                    if (!anchorButton?.parentElement) return;

                    let playbar = anchorButton.parentElement;
                    for (let depth = 0; playbar && depth < 7; depth++) {
                        const rect = playbar.getBoundingClientRect();
                        if (rect.width >= window.innerWidth * 0.82 && rect.height >= 58 && rect.height <= 150) break;
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

