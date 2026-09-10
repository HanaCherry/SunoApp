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
        ].map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('');
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
        const isStudio = /^https:\/\/(?:www\.)?suno\.com\/(?:studio|create)(?:\/|$)/i.test(mainWindow.webContents.getURL());
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
                        const coverImage = playerRoot?.querySelector('img') || document.querySelector('img[aria-label*="Playbar: Cover" i], img[aria-label*="cover" i], img[alt*="cover" i], img[src*="image"], img[src*="cdn"]');

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
        }, 500);
    });

    globalShortcut.register('CommandOrControl+Space', () => { controlSuno('playpause'); });
    globalShortcut.register('CommandOrControl+Shift+M', () => { toggleMiniPlayer(); });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
