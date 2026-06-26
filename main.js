const { app, BrowserWindow, globalShortcut, nativeImage, session, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// Désactive la sécurité qui bloque le son automatique au démarrage
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let mainWindow;
let isPlaying = false; 
let isMiniPlayer = false; 

app.on('ready', () => {
    const customSession = session.fromPartition('persist:sunoCache');

    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'icone_flora.ico'),
        backgroundColor: '#121212',
        show: false,
        webPreferences: { 
            nodeIntegration: false,
            session: customSession,
            backgroundThrottling: false
        }
    });

    mainWindow.loadURL('https://suno.com');

    // Menu contextuel avec options copier/coller
    mainWindow.webContents.on('context-menu', (params) => {
        const template = [
            {
                label: 'Copier',
                accelerator: 'CmdOrCtrl+C',
                visible: params.selectionText.length > 0,
                click: () => {
                    mainWindow.webContents.copy();
                }
            },
            {
                label: 'Coller',
                accelerator: 'CmdOrCtrl+V',
                click: () => {
                    mainWindow.webContents.paste();
                }
            },
            {
                label: 'Couper',
                accelerator: 'CmdOrCtrl+X',
                visible: params.selectionText.length > 0,
                click: () => {
                    mainWindow.webContents.cut();
                }
            }
        ];
        
        const menu = Menu.buildFromTemplate(template);
        menu.popup({ window: mainWindow });
    });

    const iconLike = nativeImage.createFromPath(path.join(__dirname, 'like.png')).resize({width: 32, height: 32});
    const iconPrev = nativeImage.createFromPath(path.join(__dirname, 'prec.png')).resize({width: 32, height: 32});
    const iconPlay = nativeImage.createFromPath(path.join(__dirname, 'play.png')).resize({width: 32, height: 32});
    const iconPause = nativeImage.createFromPath(path.join(__dirname, 'pause.png')).resize({width: 32, height: 32});
    const iconStop = nativeImage.createFromPath(path.join(__dirname, 'stop.png')).resize({width: 32, height: 32});
    const iconNext = nativeImage.createFromPath(path.join(__dirname, 'suiv.png')).resize({width: 32, height: 32});
    const iconMini = nativeImage.createFromPath(path.join(__dirname, 'mini.png')).resize({width: 32, height: 32});

    const updateThumbar = () => {
        if (!mainWindow) return;
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
        if (isMiniPlayer) {
            mainWindow.setAlwaysOnTop(false);
            mainWindow.setResizable(true);
            mainWindow.setSize(1280, 800);
            mainWindow.center();
            mainWindow.webContents.executeJavaScript(`
                let style = document.getElementById('flora-mini-player');
                if(style) style.remove();
            `);
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
            `);
            isMiniPlayer = true;
        }
    };

    const controlSuno = (action) => {
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
        
        // LA MAGIE DU SON EST ICI !
        const soundPath = path.join(__dirname, 'startup.mp3');
        if (fs.existsSync(soundPath)) {
            const soundBase64 = fs.readFileSync(soundPath).toString('base64');
            mainWindow.webContents.executeJavaScript(`
                let startupSound = new Audio("data:audio/mp3;base64,${soundBase64}");
                startupSound.volume = 0.6; // Volume à 60%
                startupSound.play().catch(e => console.log("Son bloqué", e));
            `);
        }
        
        setInterval(() => {
            if(mainWindow) {
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
                }).catch(()=>{});
            }
        }, 500);
    });

    globalShortcut.register('CommandOrControl+Space', () => { controlSuno('playpause'); });
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
