        fill(document.getElementById('sunoapp-top-menu') || document.createElement('div'));
        fill(document.getElementById('sunoapp-now-card') || document.createElement('div'));
        fill(document.getElementById('sunoapp-waveform') || document.createElement('div'));
        const rail = document.getElementById('sunoapp-rail-settings');
        if (rail) {
            const svg = rail.querySelector('svg');
            rail.setAttribute('data-i18n', 'settings');
            rail.textContent = '';
            if (svg) rail.appendChild(svg);
            rail.appendChild(document.createTextNode(t('settings')));
        }
        const sel = document.getElementById('sunoapp-lang');
        if (sel && !sel.dataset.ready) {
            const saved = localStorage.getItem('sunoapp-lang') || 'auto';
            const opt = document.createElement('option');
            opt.value = 'auto'; opt.textContent = t('languageAuto');
            sel.appendChild(opt);
            Object.keys(i18n.names || {}).forEach((code) => {
                const o = document.createElement('option');
                o.value = code; o.textContent = i18n.names[code];
                sel.appendChild(o);
            });
            sel.value = (saved === 'auto' || i18n.dict[saved]) ? saved : 'auto';
            if (![...sel.options].some((o) => o.value === sel.value)) sel.value = 'auto';
            sel.dataset.ready = '1';
            sel.addEventListener('change', () => {
                localStorage.setItem('sunoapp-lang', sel.value);
                applyI18n();
                if (typeof renderUserPresets === 'function') renderUserPresets();
            });
        } else if (sel) {
            sel.options[0] && (sel.options[0].textContent = t('languageAuto'));
        }
        const ab = document.getElementById('sunoapp-ab');
        if (ab) ab.textContent = state.eqBypass ? t('abOriginal') : t('abProcess');
    };
    window.__sunoApplyI18n = applyI18n;
    applyI18n();


    const popover = document.getElementById('sunoapp-menu-popover');
    document.getElementById('sunoapp-menu-button').addEventListener('click', () => popover.classList.toggle('open'));
    document.getElementById('sunoapp-open-settings').addEventListener('click', () => {
        popover.classList.remove('open');
        setSettingsOpen(true);
    });
    const setSettingsOpen = (open) => {
        overlay.classList.toggle('open', open);
        document.getElementById('sunoapp-rail-settings')?.classList.toggle('active', open);
    };
    document.getElementById('sunoapp-close-settings').addEventListener('click', () => setSettingsOpen(false));
    document.getElementById('sunoapp-open-mini').addEventListener('click', () => window.open('sunoapp://mini', '_blank'));

    let syncMusicTheme = () => {};
    const applyUiTheme = (id) => {
        const theme = ['nuit', 'clair', 'cherry', 'aurore', 'glass', 'aero', 'musique'].includes(id) ? id : 'nuit';
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
        syncMusicTheme();
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
        const profile = sidebarText(/^floracherry$/i);
        const earn = sidebarText(/earn credits|gagner des cr/i);
        const create = Array.from(document.querySelectorAll('a[href]')).find((a) => /\/create(?:\/|$)/i.test(a.getAttribute('href') || '') && a.getBoundingClientRect().left < 280);
        const pr = profile ? profile.getBoundingClientRect() : null;
        const profileVisible = pr && pr.height >= 12 && pr.top >= 40 && pr.bottom < window.innerHeight - 80;
        if (!profileVisible || !earn) {
            box.style.display = 'none';
            return;
        }
        box.style.display = 'flex';
        const col = (create || earn || profile).getBoundingClientRect();
        const left = Math.round(col.left);
        const width = Math.round(col.width);
        const top = Math.round(pr.bottom + 4);
        let maxH = 44;
        if (earn) {
            const gap = Math.round(earn.getBoundingClientRect().top - 6 - top);
            maxH = Math.max(36, Math.min(48, gap));
        }
        box.style.left = left + 'px';
        box.style.width = width + 'px';
        box.style.top = top + 'px';
        box.style.maxHeight = maxH + 'px';
        box.style.overflow = 'hidden';
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
            `;
            document.body.appendChild(box);
            box.querySelector('#sunoapp-rail-settings').addEventListener('click', (event) => {
                event.preventDefault();
                setSettingsOpen(true);
            });
        }
        placeRail();
    };
    mountSidebarTools();
    applyI18n();
    window.addEventListener('resize', placeRail);

    const status = document.getElementById('sunoapp-audio-status');
    const sliders = Array.from(document.querySelectorAll('.sa-band input'));

    const waveform = document.createElement('div');
    waveform.id = 'sunoapp-waveform';
    waveform.innerHTML = '<canvas aria-label="Forme d\'onde de la musique" data-i18n="waveformCanvas" data-i18n-attr="aria-label"></canvas>';
    document.body.appendChild(waveform);
    const waveformCanvas = waveform.querySelector('canvas');
    const waveformContext = waveformCanvas.getContext('2d');

    const nowCard = document.createElement('section');
    nowCard.id = 'sunoapp-now-card';
    nowCard.innerHTML = `
        <div class="sa-now-cover-wrap"><img class="sa-now-cover" alt="Pochette du morceau" data-i18n="coverAlt" data-i18n-attr="alt"><button class="sa-now-cover-play" title="Lecture ou pause" data-i18n="playPause" data-i18n-attr="title"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7Z"/></svg></button></div>
        <div class="sa-now-copy"><div class="sa-now-title" data-i18n="nowPlaying">Morceau en lecture</div><div class="sa-now-style">Suno</div></div>
        <div class="sa-now-main">
            <div class="sa-now-wave"><div class="sa-now-wave-host"></div><div class="sa-now-times"><span class="sa-now-current">0:00</span><span class="sa-now-duration">0:00</span></div></div>
            <div class="sa-now-actions">
                <button class="sa-now-action" data-now-action="like" title="J'aime" data-i18n="like" data-i18n-attr="title"></button>
                <button class="sa-now-action" data-now-action="dislike" title="Je n'aime pas" data-i18n="dislike" data-i18n-attr="title"></button>
                <button class="sa-now-action" data-now-action="pin" title="Épingler" data-i18n="pin" data-i18n-attr="title"></button>
                <button class="sa-now-action" data-now-action="share" title="Partager" data-i18n="share" data-i18n-attr="title"></button>
                <button class="sa-now-action remix" data-now-action="remix" title="Remix"></button>
            </div>
        </div>
        <button class="sa-now-more" title="Plus d'options" data-i18n="more" data-i18n-attr="title" aria-haspopup="menu" aria-expanded="false"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/></svg></button>
    `;
    document.body.appendChild(nowCard);
    applyI18n();
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
