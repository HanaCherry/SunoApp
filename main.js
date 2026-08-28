const { app, BrowserWindow, globalShortcut, nativeImage, session, Menu, shell, clipboard, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;
let miniWindow;
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
                    button.title = 'Ouvrir le mini-lecteur';
                    button.setAttribute('aria-label', 'Ouvrir le mini-lecteur');
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
                    fullscreenButton.title = 'Plein écran';
                    fullscreenButton.setAttribute('aria-label', 'Plein écran');
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
        const enhancementScript = fs.readFileSync(path.join(__dirname, 'main-enhancements.js'), 'utf8');
        const diagnosticScript = `
            (() => {
                try {
                    ${enhancementScript}
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

    // Suno now performs several navigations while booting. Injecting during one
    // of those transitions destroys the JavaScript context and used to leave the
    // custom UI missing. Wait for the final DOM and retry once the page settles.
    let integrationTimer = null;
    let studioMode = false;
    let windowBoundsBeforeStudio = null;
    const syncStudioWindow = () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        const isStudio = /^https:\/\/(?:www\.)?suno\.com\/studio(?:\/|$)/i.test(mainWindow.webContents.getURL());
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
                        btns = document.querySelectorAll('button[aria-label*="Playbar: Play" i], button[aria-label*="Playbar: Pause" i], button[aria-label="Play" i], button[aria-label="Pause" i], button[aria-label="Lecture" i], button[data-testid*="play" i], button[data-testid*="pause" i]');
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
                    btns = document.querySelectorAll('button[aria-label*="Previous" i], button[aria-label*="Précédent" i], button[aria-label*="Back" i], button[data-testid*="previous" i], button[data-testid*="prev" i]');
                    if (btns.length > 0) btns[btns.length - 1].click();
                }
                else if ('${action}' === 'next') {
                    btns = document.querySelectorAll('button[aria-label*="Next" i], button[aria-label*="Suivant" i], button[data-testid*="next" i]');
                    if (btns.length > 0) btns[btns.length - 1].click();
                }
                else if ('${action}' === 'like') {
                    btns = document.querySelectorAll('button[aria-label*="Like" i], button[aria-label*="Favorite" i], button[aria-label*="aime" i], button[data-testid*="like" i]');
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
                        let playing = false;
                        for (let i = 0; i < audios.length; i++) {
                            if (audios[i].src || audios[i].currentSrc) {
                                playing = !audios[i].paused;
                                break;
                            }
                        }

                        const playbarButton = document.querySelector('button[aria-label*="Playbar: Play" i], button[aria-label*="Playbar: Pause" i]');
                        let playerRoot = playbarButton?.parentElement || null;
                        for (let depth = 0; playerRoot && depth < 7; depth++) {
                            const hasCover = !!playerRoot.querySelector('img');
                            const hasLinks = playerRoot.querySelectorAll('a').length >= 2;
                            const hasControls = playerRoot.querySelectorAll('button').length >= 5;
                            if (hasCover && hasLinks && hasControls) break;
                            playerRoot = playerRoot.parentElement;
                        }

                        const playerLinks = playerRoot
                            ? Array.from(playerRoot.querySelectorAll('a')).filter((link) => link.textContent?.trim())
                            : [];
                        const titleLink = document.querySelector('[aria-label*="Playbar: Title" i]') || playerLinks[0];
                        const artistLink = document.querySelector('[aria-label*="Playbar: Artist" i]') || playerLinks[1];
                        const coverImage = playerRoot?.querySelector('img') || document.querySelector('img[aria-label*="Playbar: Cover" i], img[alt*="cover" i]');

                        const mediaMetadata = navigator.mediaSession?.metadata;
                        const mediaArtwork = mediaMetadata?.artwork;
                        const mediaCover = Array.isArray(mediaArtwork) && mediaArtwork.length
                            ? mediaArtwork[mediaArtwork.length - 1]?.src
                            : '';

                        const resolvedTitle = mediaMetadata?.title || titleLink?.textContent?.trim() || '';

                        return {
                            playing: navigator.mediaSession?.playbackState === 'playing' || playing,
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
        }, 500);
    });

    globalShortcut.register('CommandOrControl+Space', () => { controlSuno('playpause'); });
    globalShortcut.register('CommandOrControl+Shift+M', () => { toggleMiniPlayer(); });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
