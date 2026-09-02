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
            <div class="sa-section-title">Thème de l'interface</div>
            <div class="sa-themes">
                <button class="sa-theme" type="button" data-theme="nuit">Nuit</button>
                <button class="sa-theme" type="button" data-theme="clair">Clair</button>
                <button class="sa-theme" type="button" data-theme="cherry">Cherry</button>
                <button class="sa-theme" type="button" data-theme="aurore">Aurore</button>
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

    const applyUiTheme = (id) => {
        const theme = ['nuit', 'clair', 'cherry', 'aurore'].includes(id) ? id : 'nuit';
        state.uiTheme = theme;
        document.documentElement.dataset.sunoappTheme = theme;
        document.body.dataset.sunoappTheme = theme;
        document.documentElement.style.colorScheme = theme === 'clair' ? 'light' : 'dark';
        localStorage.setItem('sunoapp-ui-theme', theme);
        document.querySelectorAll('[data-theme]').forEach((button) => {
            const on = button.dataset.theme === theme;
            button.classList.toggle('active', on);
            if (button.hasAttribute('data-sunoapp-nav')) {
                if (on) button.setAttribute('aria-current', 'page');
                else button.removeAttribute('aria-current');
            }
        });
    };
    applyUiTheme(state.uiTheme);
    document.addEventListener('click', (event) => {
        const themeButton = event.target.closest('.sa-theme[data-theme]');
        if (themeButton) applyUiTheme(themeButton.dataset.theme);
    });

    const sidebarText = (re) => Array.from(document.querySelectorAll('a, button, [role="link"], [role="button"]')).find((el) => {
        if (el.closest('#sunoapp-rail-tools, #sunoapp-titlebar, #sunoapp-settings-overlay, #sunoapp-top-menu')) return false;
        const rect = el.getBoundingClientRect();
        if (rect.width < 8 || rect.left > 280) return false;
        return re.test((el.textContent || '').replace(/\s+/g, ' ').trim());
    });

    const placeRail = () => {
        const box = document.getElementById('sunoapp-rail-tools');
        if (!box) return;
        const create = Array.from(document.querySelectorAll('a[href]')).find((a) => /\/create(?:\/|$)/i.test(a.getAttribute('href') || '') && a.getBoundingClientRect().left < 280);
        const earn = sidebarText(/earn credits|gagner des cr/i);
        const labs = sidebarText(/^labs$/i);
        const more = sidebarText(/more$/i);
        const profile = sidebarText(/^floracherry$/i);
        const anchor = create || earn || profile;
        if (!anchor) {
            box.style.left = '8px';
            box.style.top = '220px';
            box.style.width = '210px';
            box.style.maxHeight = '42vh';
            return;
        }
        const col = anchor.getBoundingClientRect();
        const left = Math.max(4, Math.round(col.left));
        const width = Math.max(168, Math.min(240, Math.round(col.width + 28)));
        let top = 250;
        if (profile) top = Math.round(profile.getBoundingClientRect().bottom + 6);
        else if (create) top = Math.round(create.getBoundingClientRect().bottom + 120);
        let bottom = window.innerHeight - 150;
        if (earn) bottom = Math.round(earn.getBoundingClientRect().top - 8);
        else if (labs) bottom = Math.round(labs.getBoundingClientRect().top - 8);
        else if (more) bottom = Math.round(more.getBoundingClientRect().top - 8);
        box.style.left = left + 'px';
        box.style.width = width + 'px';
        box.style.top = Math.max(90, top) + 'px';
        box.style.maxHeight = Math.max(140, bottom - top) + 'px';
    };

    mountSidebarTools = () => {
        let box = document.getElementById('sunoapp-rail-tools');
        if (!box) {
            box = document.createElement('div');
            box.id = 'sunoapp-rail-tools';
            box.innerHTML = `
                <button type="button" class="sa-rail-item" id="sunoapp-rail-settings">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>
                    Paramètres
                </button>
                <div class="sa-rail-label">Thèmes</div>
                <div class="sa-rail-grid">
                    <button type="button" class="sa-rail-item sa-theme" data-theme="nuit">Nuit</button>
                    <button type="button" class="sa-rail-item sa-theme" data-theme="clair">Clair</button>
                    <button type="button" class="sa-rail-item sa-theme" data-theme="cherry">Cherry</button>
                    <button type="button" class="sa-rail-item sa-theme" data-theme="aurore">Aurore</button>
                </div>
                <div class="sa-rail-label">Égaliseur</div>
                <div class="sa-rail-grid">
                    <button type="button" class="sa-rail-item sa-mode" data-mode="flat">Neutre</button>
                    <button type="button" class="sa-rail-item sa-mode" data-mode="bass">Basses</button>
                    <button type="button" class="sa-rail-item sa-mode" data-mode="vocal">Voix</button>
                    <button type="button" class="sa-rail-item sa-mode" data-mode="clarity">Clarté</button>
                    <button type="button" class="sa-rail-item sa-mode" data-mode="immersive">Immersif</button>
                    <button type="button" class="sa-rail-item sa-mode" data-mode="cinema51">Cinéma 5.1</button>
                    <button type="button" class="sa-rail-item sa-mode" data-mode="surround71">7.1</button>
                    <button type="button" class="sa-rail-item sa-mode" data-mode="atmos">Atmos</button>
                </div>
            `;
            document.body.appendChild(box);
            box.querySelector('#sunoapp-rail-settings').addEventListener('click', (event) => {
                event.preventDefault();
                overlay.classList.add('open');
            });
            applyUiTheme(state.uiTheme);
        }
        placeRail();
        document.querySelectorAll('#sunoapp-rail-tools .sa-mode').forEach((button) => {
            button.classList.toggle('active', button.dataset.mode === state.mode);
        });
    };
    mountSidebarTools();
    window.addEventListener('resize', placeRail);

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
