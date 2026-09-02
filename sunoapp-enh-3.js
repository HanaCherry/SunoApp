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

    const findNavPrototype = () => {
        const paths = ['/library', '/studio', '/create', '/explore', '/search', '/home'];
        const links = Array.from(document.querySelectorAll('a[href]')).filter((anchor) => {
            if (anchor.hasAttribute('data-sunoapp-nav')) return false;
            try {
                const url = new URL(anchor.href, location.origin);
                if (url.origin !== location.origin) return false;
                return paths.some((path) => url.pathname === path || url.pathname.startsWith(path + '/'));
            } catch (_) {
                return false;
            }
        });
        if (!links.length) return null;
        return links.find((anchor) => /\/library(?:\/|$)/i.test(anchor.pathname || anchor.getAttribute('href') || '')) || links[links.length - 1];
    };

    const setLeafText = (root, text) => {
        const leaves = Array.from(root.querySelectorAll('*')).filter((el) => !el.childElementCount && (el.textContent || '').trim());
        if (leaves.length) {
            leaves[leaves.length - 1].textContent = text;
            return;
        }
        const node = Array.from(root.childNodes).find((child) => child.nodeType === 3 && child.textContent.trim());
        if (node) node.textContent = ' ' + text + ' ';
    };

    const ensureNavItem = (proto, spec) => {
        let node = document.getElementById(spec.id);
        if (node && proto.parentElement && node.parentElement !== proto.parentElement) {
            proto.parentElement.appendChild(node);
        }
        if (node) return node;
        node = proto.cloneNode(true);
        node.id = spec.id;
        node.setAttribute('data-sunoapp-nav', spec.kind);
        node.setAttribute('href', '#sunoapp-' + spec.kind);
        if (spec.theme) {
            node.classList.add('sa-theme');
            node.setAttribute('data-theme', spec.theme);
        }
        if (spec.mode) {
            node.classList.add('sa-mode');
            node.setAttribute('data-mode', spec.mode);
        }
        node.removeAttribute('aria-current');
        setLeafText(node, spec.label);
        node.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (spec.theme) applyUiTheme(spec.theme);
            if (spec.mode && presets[spec.mode] && window.__sunoAppSetGains) window.__sunoAppSetGains(presets[spec.mode], spec.mode);
        });
        proto.parentElement.appendChild(node);
        return node;
    };

    mountSidebarTools = () => {
        const proto = findNavPrototype();
        if (!proto || !proto.parentElement) return;
        const items = [
            { id: 'sunoapp-nav-theme-nuit', kind: 'theme', theme: 'nuit', label: 'Nuit' },
            { id: 'sunoapp-nav-theme-clair', kind: 'theme', theme: 'clair', label: 'Clair' },
            { id: 'sunoapp-nav-theme-cherry', kind: 'theme', theme: 'cherry', label: 'Cherry' },
            { id: 'sunoapp-nav-theme-aurore', kind: 'theme', theme: 'aurore', label: 'Aurore' },
            { id: 'sunoapp-nav-eq-flat', kind: 'eq', mode: 'flat', label: 'Neutre' },
            { id: 'sunoapp-nav-eq-bass', kind: 'eq', mode: 'bass', label: 'Basses' },
            { id: 'sunoapp-nav-eq-vocal', kind: 'eq', mode: 'vocal', label: 'Voix' },
            { id: 'sunoapp-nav-eq-clarity', kind: 'eq', mode: 'clarity', label: 'Clarté' },
            { id: 'sunoapp-nav-eq-immersive', kind: 'eq', mode: 'immersive', label: 'Immersif' },
            { id: 'sunoapp-nav-eq-cinema51', kind: 'eq', mode: 'cinema51', label: 'Cinéma 5.1' },
            { id: 'sunoapp-nav-eq-surround71', kind: 'eq', mode: 'surround71', label: 'Surround 7.1' },
            { id: 'sunoapp-nav-eq-atmos', kind: 'eq', mode: 'atmos', label: 'Atmos' }
        ];
        items.forEach((spec) => ensureNavItem(proto, spec));
        applyUiTheme(state.uiTheme);
        document.querySelectorAll('a[data-sunoapp-nav="eq"]').forEach((node) => {
            const on = node.getAttribute('data-mode') === state.mode;
            node.classList.toggle('active', on);
            if (on) node.setAttribute('aria-current', 'page');
            else node.removeAttribute('aria-current');
        });
    };
    mountSidebarTools();

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
