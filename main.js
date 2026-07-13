const { app, BrowserWindow, globalShortcut, nativeImage, session, Menu, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;
let isPlaying = false;
let isMiniPlayer = false;

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

    const updateThumbar = () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        mainWindow.setThumbarButtons([
            { tooltip: "J'aime", icon: iconLike, click() { controlSuno('like'); } },
            { tooltip: 'Précédent', icon: iconPrev, click() { controlSuno('prev'); } },
            { tooltip: isPlaying ? 'Pause' : 'Play', icon: isPlaying ? iconPause : iconPlay, click() { controlSuno('playpause'); } },
            { tooltip: 'Stop', icon: iconStop, click() { controlSuno('stop'); } },
            { tooltip: 'Suivant', icon: iconNext, click() { controlSuno('next'); } },
            { tooltip: 'Mini Lecteur', icon: iconMini, click() { toggleMiniPlayer(); } }
        ]);
    };

    const toggleMiniPlayer = () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;

        if (isMiniPlayer) {
            mainWindow.setAlwaysOnTop(false);
            mainWindow.setResizable(true);
            mainWindow.setSize(1280, 800);
            mainWindow.center();
            mainWindow.webContents.executeJavaScript(`
                let style = document.getElementById('flora-mini-player');
                if(style) style.remove();
            `).catch(() => {});
            isMiniPlayer = false;
        } else {
            mainWindow.setAlwaysOnTop(true);
            mainWindow.setSize(1000, 120);
            mainWindow.setResizable(false);
            mainWindow.webContents.executeJavaScript(`
                if(!document.getElementById('flora-mini-player')) {
                    let style = document.createElement('style');
                    style.id = 'flora-mini-player';
                    style.innerHTML = \`
                        body { overflow: hidden !important; }
                        footer {
                            position: fixed !important;
                            bottom: 0 !important;
                            left: 0 !important;
                            width: 100vw !important;
                            z-index: 9999999 !important;
                            background-color: #121212 !important;
                        }
                    \`;
                    document.head.appendChild(style);
                }
            `).catch(() => {});
            isMiniPlayer = true;
        }
    };

    const controlSuno = (action) => {
        if (!mainWindow || mainWindow.isDestroyed()) return;

        mainWindow.webContents.executeJavaScript(`
            try {
                let audios = document.querySelectorAll('audio, video');
                let btns;
                if ('${action}' === 'playpause') {
                    let audioTrouve = false;
                    for (let i = 0; i < audios.length; i++) {
                        if (audios[i].src || audios[i].currentSrc) {
                            if (audios[i].paused) audios[i].play();
                            else audios[i].pause();
                            audioTrouve = true; break;
                        }
                    }
                    if (!audioTrouve) {
                        btns = document.querySelectorAll('button[aria-label="Play"], button[aria-label="Pause"], button[data-testid="play-button"]');
                        if (btns.length > 0) btns[btns.length - 1].click();
                    }
                }
                else if ('${action}' === 'stop') {
                    for (let i = 0; i < audios.length; i++) {
                        if (audios[i].src || audios[i].currentSrc) {
                            audios[i].pause();
                            audios[i].currentTime = 0;
                            break;
                        }
                    }
                }
                else if ('${action}' === 'prev') {
                    btns = document.querySelectorAll('button[aria-label*="Previous"], button[aria-label*="Précédent"]');
                    if (btns.length > 0) btns[btns.length - 1].click();
                }
                else if ('${action}' === 'next') {
                    btns = document.querySelectorAll('button[aria-label*="Next"], button[aria-label*="Suivant"]');
                    if (btns.length > 0) btns[btns.length - 1].click();
                }
                else if ('${action}' === 'like') {
                    btns = document.querySelectorAll('button[aria-label*="Like"], button[aria-label*="Favorite"], button[aria-label*="aime"]');
                    if (btns.length > 0) btns[btns.length - 1].click();
                }
            } catch(e) {}
        `).catch(() => {});
    };

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        updateThumbar();

        const soundPath = path.join(__dirname, 'startup.mp3');
        if (fs.existsSync(soundPath)) {
            const soundBase64 = fs.readFileSync(soundPath).toString('base64');
            mainWindow.webContents.executeJavaScript(`
                let startupSound = new Audio("data:audio/mp3;base64,${soundBase64}");
                startupSound.volume = 0.6;
                startupSound.play().catch(e => console.log("Son bloqué", e));
            `).catch(() => {});
        }

        setInterval(() => {
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.executeJavaScript(`
                    (function() {
                        let audios = document.querySelectorAll('audio, video');
                        for (let i = 0; i < audios.length; i++) {
                            if (audios[i].src || audios[i].currentSrc) {
                                return !audios[i].paused;
                            }
                        }
                        return false;
                    })()
                `).then((playing) => {
                    if (playing !== isPlaying) {
                        isPlaying = playing;
                        updateThumbar();
                    }
                }).catch(() => {});
            }
        }, 500);
    });

    globalShortcut.register('CommandOrControl+Space', () => { controlSuno('playpause'); });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
