        .sa-now-more { align-self: center; justify-self: center; display: inline-flex !important; position: static !important; align-items: center; justify-content: center; width: 42px !important; height: 42px !important; min-width: 42px !important; min-height: 42px !important; margin: 0 !important; padding: 0 !important; border: 1px solid rgba(255,255,255,.1); border-radius: 50% !important; color: #fff; background: rgba(255,255,255,.035); font-size: 18px; line-height: 1; transform: none !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; cursor: pointer; }
        .sa-now-more svg { display: block; flex: 0 0 18px; width: 18px; height: 18px; margin: 0; }
        .sa-now-more:hover, .sa-now-more[aria-expanded="true"] { border-color: rgba(255,255,255,.2); background: rgba(255,255,255,.085); }
        #sunoapp-custom-track-menu { position: fixed; z-index: 2147483646; width: 238px; max-height: min(650px, calc(100vh - 50px)); overflow: auto; padding: 7px; border: 1px solid rgba(255,255,255,.1); border-radius: 15px; color: #f3f3f5; background: rgba(22,24,30,.98); box-shadow: 0 24px 60px rgba(0,0,0,.58), inset 0 1px rgba(255,255,255,.04); backdrop-filter: blur(22px); }
        #sunoapp-custom-track-menu[hidden] { display: none; }
        .sa-track-menu-group { padding: 4px 0; }
        .sa-track-menu-group + .sa-track-menu-group { border-top: 1px solid rgba(255,255,255,.075); }
        .sa-track-menu-item { display: grid; grid-template-columns: 22px 1fr 16px; align-items: center; gap: 9px; width: 100%; min-height: 38px; padding: 7px 9px; border: 0; border-radius: 9px; color: inherit; background: transparent; font-size: 13px; font-weight: 620; text-align: left; cursor: pointer; }
        .sa-track-menu-item:hover { background: rgba(255,255,255,.075); }
        .sa-track-menu-item svg { width: 18px; height: 18px; fill: currentColor; }
        .sa-track-menu-item .chevron { width: 14px; height: 14px; color: #8f9199; }
        .sa-track-menu-item.danger { color: #ff7181; }
        #sunoapp-now-card.sunoapp-now-overlay { display: grid; }
        .sunoapp-centered-song-menu { position: fixed !important; transform: none !important; margin: 0 !important; z-index: 2147483646 !important; }
        @media (max-width: 1250px) { #sunoapp-now-card { grid-template-columns: 62px 112px minmax(220px,1fr) 38px; gap: 9px; padding: 7px 9px; } .sa-now-cover { width: 58px; height: 58px; } .sa-now-title { font-size: 14px; } }
        .sunoapp-bounded-fullscreen { top: 38px !important; bottom: 0 !important; height: calc(100vh - 38px) !important; max-height: calc(100vh - 38px) !important; }
        @media (max-width: 850px) {
            #sunoapp-top-menu { left: 14px; top: 86px; }
            .sa-modes { grid-template-columns: repeat(2, 1fr); }
        }
    `;
    document.head.appendChild(style);

    document.body.classList.add('sunoapp-frameless');
    const favicon = document.querySelector('link[rel*="icon"]')?.href || '';
    const titlebar = document.createElement('header');
    titlebar.id = 'sunoapp-titlebar';
    titlebar.innerHTML = `
        <div class="sa-title-brand">${favicon ? `<img src="${favicon}" alt="">` : ''}<span>SunoApp</span></div>
        <div class="sa-title-center">Suno • Lecteur musical</div>
        <div class="sa-window-controls">
            <button class="sa-window-button" data-window-action="window-minimize" aria-label="Réduire" title="Réduire">
                <svg viewBox="0 0 16 16"><path d="M3 8.5h10"/></svg>
            </button>
            <button class="sa-window-button" data-window-action="window-maximize" aria-label="Agrandir ou restaurer" title="Agrandir ou restaurer">
                <svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="1"/></svg>
            </button>
            <button class="sa-window-button close" data-window-action="window-close" aria-label="Fermer" title="Fermer">
                <svg viewBox="0 0 16 16"><path d="m3.5 3.5 9 9M12.5 3.5l-9 9"/></svg>
            </button>
        </div>
    `;
    titlebar.querySelectorAll('[data-window-action]').forEach((button) => {
        button.addEventListener('click', () => window.open(`sunoapp://${button.dataset.windowAction}`, '_blank'));
    });
    document.body.appendChild(titlebar);

    const refreshPageMode = () => {
        const isStudio = /^\/(studio|create)(?:\/|$)/i.test(location.pathname);
        document.body.classList.toggle('sunoapp-studio', isStudio);
        const candidates = Array.from(document.body.children)
            .filter((element) => !element.id?.startsWith('sunoapp-') && element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE');
        candidates.forEach((element) => {
            element.classList.toggle('sunoapp-studio-root', isStudio);
            element.style.removeProperty('--sunoapp-studio-scale-y');
        });
        const title = document.querySelector('.sa-title-center');
        if (title) title.textContent = isStudio ? 'Suno • Création' : 'Suno • Lecteur musical';
    };

    refreshPageMode();
    window.__sunoAppPageModeTimer = setInterval(refreshPageMode, 700);

    const menu = document.createElement('div');
    menu.id = 'sunoapp-top-menu';
    menu.innerHTML = `
        <button class="sa-glass-button" id="sunoapp-menu-button" aria-label="Menu SunoApp" title="Menu SunoApp">
            <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>
        </button>
        <div id="sunoapp-menu-popover">
            <button class="sa-menu-item" id="sunoapp-open-settings">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>
                Paramètres
            </button>
            <button class="sa-menu-item" id="sunoapp-open-mini">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="15" height="12" rx="2"/><rect x="12" y="12" width="9" height="8" rx="2"/></svg>
                Mini-lecteur
            </button>
        </div>
    `;
    document.body.appendChild(menu);

    const overlay = document.createElement('div');
    overlay.id = 'sunoapp-settings-overlay';
    overlay.innerHTML = `
        <section class="sa-settings-card">
            <header class="sa-settings-head"><h2>Paramètres SunoApp</h2><button class="sa-close" id="sunoapp-close-settings">×</button></header>
            <div class="sa-section-title">Qualité et mode sonore</div>
            <div class="sa-modes">
                <button class="sa-mode" data-mode="flat">Neutre</button>
                <button class="sa-mode" data-mode="bass">Basses</button>
                <button class="sa-mode" data-mode="vocal">Voix</button>
                <button class="sa-mode" data-mode="clarity">Clarté</button>
                <button class="sa-mode" data-mode="immersive">Immersif</button>
                <button class="sa-mode" data-mode="cinema51">Cinéma 5.1 virtuel</button>
                <button class="sa-mode" data-mode="surround71">Surround 7.1 virtuel</button>
                <button class="sa-mode" data-mode="atmos">Atmos virtuel</button>
            </div>
            <div class="sa-section-title">Égaliseur</div>
            <div class="sa-eq">
                ${frequencies.map((frequency, index) => `
                    <div class="sa-band">
                        <output id="sa-gain-${index}">0 dB</output>
                        <input type="range" min="-12" max="12" step="1" value="0" data-band="${index}" aria-label="${frequency} Hz">
                        <label>${frequency >= 1000 ? (frequency / 1000) + 'k' : frequency} Hz</label>
                    </div>
                `).join('')}
            </div>
            <div class="sa-section-title">Affichage du lecteur</div>
            <div class="sa-option-row">
                <div class="sa-option-copy"><strong>Forme d'onde audio</strong><span>Affiche la musique et sa progression sous le morceau.</span></div>
                <label class="sa-switch" title="Afficher la forme d'onde"><input id="sunoapp-waveform-toggle" type="checkbox" ${state.waveformEnabled ? 'checked' : ''}><span></span></label>
            </div>
            <div class="sa-option-row" style="margin-top:8px">
                <div class="sa-option-copy"><strong>Lecteur personnalisé</strong><span>Carte overlay sur le morceau en cours, sans modifier la liste virtualisée de Suno.</span></div>
                <label class="sa-switch" title="Afficher le lecteur personnalisé"><input id="sunoapp-custom-player-toggle" type="checkbox" ${state.customPlayerEnabled ? 'checked' : ''}><span></span></label>
            </div>
            <div id="sunoapp-audio-status">Sélectionnez un mode pour activer le traitement audio.</div>
        </section>
    `;
    document.body.appendChild(overlay);

    const popover = document.getElementById('sunoapp-menu-popover');
    document.getElementById('sunoapp-menu-button').addEventListener('click', () => popover.classList.toggle('open'));
    document.getElementById('sunoapp-open-settings').addEventListener('click', () => {
        popover.classList.remove('open');
        overlay.classList.add('open');
    });
    document.getElementById('sunoapp-close-settings').addEventListener('click', () => overlay.classList.remove('open'));
    document.getElementById('sunoapp-open-mini').addEventListener('click', () => window.open('sunoapp://mini', '_blank'));

    const status = document.getElementById('sunoapp-audio-status');
    const sliders = Array.from(document.querySelectorAll('.sa-band input'));

    const waveform = document.createElement('div');
    waveform.id = 'sunoapp-waveform';
    waveform.innerHTML = '<canvas aria-label="Forme d\'onde de la musique"></canvas>';
    document.body.appendChild(waveform);
    const waveformCanvas = waveform.querySelector('canvas');
    const waveformContext = waveformCanvas.getContext('2d');

    const nowCard = document.createElement('section');
    nowCard.id = 'sunoapp-now-card';
    nowCard.innerHTML = `
        <div class="sa-now-cover-wrap"><img class="sa-now-cover" alt="Pochette du morceau"><button class="sa-now-cover-play" title="Lecture ou pause"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7Z"/></svg></button></div>
        <div class="sa-now-copy"><div class="sa-now-title">Morceau en lecture</div><div class="sa-now-style">Suno</div></div>
        <div class="sa-now-main">
            <div class="sa-now-wave"><div class="sa-now-wave-host"></div><div class="sa-now-times"><span class="sa-now-current">0:00</span><span class="sa-now-duration">0:00</span></div></div>
            <div class="sa-now-actions">
                <button class="sa-now-action" data-now-action="like" title="J'aime"></button>
                <button class="sa-now-action" data-now-action="dislike" title="Je n'aime pas"></button>
                <button class="sa-now-action" data-now-action="pin" title="Épingler"></button>
                <button class="sa-now-action" data-now-action="share" title="Partager"></button>
                <button class="sa-now-action remix" data-now-action="remix" title="Remix"></button>
            </div>
        </div>
        <button class="sa-now-more" title="Plus d'options" aria-haspopup="menu" aria-expanded="false"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/></svg></button>
    `;
    const menuIcon = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>`;
    const chevron = '<svg class="chevron" viewBox="0 0 24 24"><path d="M9 7.343c0-.89 1.077-1.337 1.707-.707l4.657 4.657a1 1 0 0 1 0 1.414l-4.657 4.657c-.63.63-1.707.184-1.707-.707z"></path></svg>';
    const customTrackMenu = document.createElement('div');
    customTrackMenu.id = 'sunoapp-custom-track-menu';
    customTrackMenu.setAttribute('role', 'menu');
    customTrackMenu.hidden = true;
    customTrackMenu.innerHTML = `
        <div class="sa-track-menu-group">
            <button class="sa-track-menu-item" data-action="remix">${menuIcon('M3.2 14.17a1 1 0 0 1 1.23-.7l2.89.8a1 1 0 0 1-.53 1.93l-.49-.14A7 7 0 0 0 18 15.59c.21-.35.58-.59.98-.59.73 0 1.24.72.89 1.36A9 9 0 0 1 4.5 16.98l-.17.62a1 1 0 0 1-1.93-.54zM12 3a9 9 0 0 1 7.86 4.62l.22-.52a1 1 0 0 1 1.84.79l-1.18 2.76a1 1 0 0 1-1.31.52l-2.76-1.18a1 1 0 0 1 .79-1.84l.53.23A7 7 0 0 0 5.99 8.41c-.21.35-.57.59-.98.59-.73 0-1.23-.72-.88-1.36A9 9 0 0 1 12 3') }<span>Remix</span>${chevron}</button>
            <button class="sa-track-menu-item" data-action="edit">${menuIcon('M4.89 20A.89.89 0 0 1 4 19.11v-2.52c0-.24.09-.46.26-.63L15.73 4.51q.27-.25.59-.38Q16.64 4 17 4t.69.13q.33.14.58.4l1.22 1.25q.27.24.39.58a1.93 1.93 0 0 1 0 1.34 1.7 1.7 0 0 1-.39.59L8.04 19.74a.9.9 0 0 1-.63.26z') }<span>Edit</span>${chevron}</button>
        </div>
        <div class="sa-track-menu-group">
            <button class="sa-track-menu-item" data-action="publish">${menuIcon('M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20m0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16') }<span>Publish</span><span></span></button>
            <button class="sa-track-menu-item" data-action="share">${menuIcon('M13 4.04c0-.95 1.17-1.4 1.81-.69l6.91 7.67c.35.4.35 1 0 1.39l-6.91 7.68c-.64.7-1.81.25-1.81-.7v-3.52c-3.76 0-6.46 1.63-8.73 3.35-.67.51-1.63.08-1.57-.76C3.22 11.02 9.18 7.5 13 7.5z') }<span>Share</span>${chevron}</button>
            <button class="sa-track-menu-item" data-action="download">${menuIcon('M12 15.58q-.2 0-.38-.07a.9.9 0 0 1-.32-.21l-3.6-3.6a.92.92 0 0 1-.29-.7q.02-.4.29-.7.3-.3.71-.31a.93.93 0 0 1 .71.28L11 12.15V5a1 1 0 0 1 2 0v7.15l1.88-1.88a.93.93 0 0 1 .71-.28q.41.01.71.31.28.3.29.7a.92.92 0 0 1-.29.7l-3.6 3.6q-.15.15-.32.21a1.1 1.1 0 0 1-.38.07M6 20a2 2 0 0 1-2-2v-2a1 1 0 0 1 2 0v2h12v-2a1 1 0 0 1 2 0v2a2 2 0 0 1-2 2z') }<span>Download</span>${chevron}</button>
            <button class="sa-track-menu-item" data-action="manage">${menuIcon('M5.67 18.33A1.67 1.67 0 0 1 4 16.67v-10A1.67 1.67 0 0 1 5.67 5h4.31l2.35 1.67H19a1.67 1.67 0 0 1 1.67 1.66v8.34A1.67 1.67 0 0 1 19 18.33z') }<span>Manage</span>${chevron}</button>
        </div>
        <div class="sa-track-menu-group">
            <button class="sa-track-menu-item" data-action="queue">${menuIcon('M4 17a1 1 0 1 1 0-2h6a1 1 0 1 1 0 2zm0-4a1 1 0 1 1 0-2h10a1 1 0 1 1 0 2zm0-4a1 1 0 1 1 0-2h10a1 1 0 1 1 0 2zm13.56 11.96A1 1 0 0 1 16 20.13v-4.26a1 1 0 0 1 1.56-.83l3.19 2.13a1 1 0 0 1 0 1.66z') }<span>Add to Queue</span><span></span></button>
            <button class="sa-track-menu-item" data-action="playlist">${menuIcon('M12 4c-.63 0-1.14.51-1.14 1.14v5.72H5.14a1.14 1.14 0 0 0 0 2.28h5.72v5.72a1.14 1.14 0 0 0 2.28 0v-5.72h5.72a1.14 1.14 0 0 0 0-2.28h-5.72V5.14C13.14 4.51 12.63 4 12 4') }<span>Add to Playlist</span><span></span></button>
            <button class="sa-track-menu-item" data-action="radio">${menuIcon('M12 9.23A2.76 2.76 0 1 0 12 14.78 2.76 2.76 0 0 0 12 9.23M8.84 7.35a.94.94 0 0 1 0 1.31 4.7 4.7 0 0 0 0 6.58.94.94 0 0 1-1.29 1.3c-2.45-2.5-2.43-6.6-.01-9.17a.89.89 0 0 1 1.3-.02m6.32.1a.89.89 0 0 1 1.28 0c2.45 2.5 2.43 6.6.01 9.17a.89.89 0 0 1-1.28.03.94.94 0 0 1-.03-1.31 4.7 4.7 0 0 0 0-6.58.94.94 0 0 1 .02-1.31') }<span>Song Radio</span><span></span></button>
        </div>
        <div class="sa-track-menu-group"><button class="sa-track-menu-item danger" data-action="trash">${menuIcon('M7.31 20.5a1.8 1.8 0 0 1-1.81-1.81V6h-.25a.75.75 0 0 1 0-1.5H9a.88.88 0 0 1 .88-.89h4.24A.88.88 0 0 1 15 4.5h3.75a.75.75 0 0 1 0 1.5h-.25v12.69a1.8 1.8 0 0 1-1.81 1.81z') }<span>Move to Trash</span><span></span></button></div>
    `;
    document.body.appendChild(customTrackMenu);
    const formatTime = (seconds) => Number.isFinite(seconds) ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}` : '0:00';
    nowCard.querySelector('.sa-now-cover-play').addEventListener('click', () => {
        if (!state.audioElement) return;
        if (state.audioElement.paused) state.audioElement.play().catch(() => {});
        else state.audioElement.pause();
    });
    const toHex = (red, green, blue) => `#${[red, green, blue].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0')).join('')}`;
    const applyCoverTheme = async (sourceUrl, title) => {
        if (!sourceUrl || sourceUrl === state.themeSource) return;
        state.themeSource = sourceUrl;
