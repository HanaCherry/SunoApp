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
        document.body.dataset.sunoappTheme = theme;
        localStorage.setItem('sunoapp-ui-theme', theme);
        document.querySelectorAll('.sa-theme').forEach((button) => {
            button.classList.toggle('active', button.dataset.theme === theme);
        });
    };
    applyUiTheme(state.uiTheme);
    document.querySelectorAll('.sa-theme').forEach((button) => {
        button.addEventListener('click', () => applyUiTheme(button.dataset.theme));
    });

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
        let hash = Array.from(title || 'Suno').reduce((value, character) => ((value * 33) ^ character.charCodeAt(0)) >>> 0, 5381);
        const fallbackHue = hash % 360;
        let first = `hsl(${fallbackHue} 82% 61%)`;
        let second = `hsl(${(fallbackHue + 48) % 360} 86% 62%)`;
        try {
            const response = await fetch(sourceUrl, { credentials: 'omit' });
            if (!response.ok) throw new Error('Cover unavailable');
            const bitmap = await createImageBitmap(await response.blob());
            const sampleCanvas = document.createElement('canvas');
            sampleCanvas.width = 24;
            sampleCanvas.height = 24;
            const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
            sampleContext.drawImage(bitmap, 0, 0, 24, 24);
            const pixels = sampleContext.getImageData(0, 0, 24, 24).data;
            const vivid = [];
            for (let index = 0; index < pixels.length; index += 4) {
                const red = pixels[index], green = pixels[index + 1], blue = pixels[index + 2];
                const maximum = Math.max(red, green, blue), minimum = Math.min(red, green, blue);
                const saturation = maximum - minimum;
                const brightness = (red + green + blue) / 3;
                if (brightness > 32 && brightness < 238) vivid.push({ red, green, blue, score: saturation * .8 + brightness * .2 });
            }
            vivid.sort((a, b) => b.score - a.score);
            const primary = vivid[Math.min(8, vivid.length - 1)];
            const secondary = vivid.find((color) => primary && Math.abs(color.red - primary.red) + Math.abs(color.green - primary.green) + Math.abs(color.blue - primary.blue) > 105) || vivid[Math.min(35, vivid.length - 1)];
            if (primary) first = toHex(primary.red, primary.green, primary.blue);
            if (secondary) second = toHex(secondary.red, secondary.green, secondary.blue);
        } catch (_) {}
        if (state.themeSource !== sourceUrl) return;
        state.themeStart = first;
        state.themeEnd = second;
        nowCard.style.setProperty('--sa-accent-1', first);
        nowCard.style.setProperty('--sa-accent-2', second);
    };
    const activateSunoAction = (action) => {
        const row = state.activeTrackRow;
        if (!row?.isConnected) return false;
        const sourceButtons = Array.from(row.querySelectorAll('button')).filter((button) => !button.closest('#sunoapp-now-card'));
        const labelOf = (button) => `${button.getAttribute('aria-label') || ''} ${button.title || ''} ${button.textContent || ''}`.trim();
        const patterns = {
            like: /like|j'aime|thumbs up/i,
            dislike: /dislike|je n'aime pas|thumbs down/i,
            pin: /pin|éping/i,
            share: /share|partag/i,
            remix: /remix/i,
            more: /more|plus|options/i
        };
        let source = sourceButtons.find((button) => patterns[action]?.test(labelOf(button)));
        if (!source && action === 'more') {
            source = sourceButtons.find((button) => button.querySelectorAll('circle').length >= 3 || /\.\.\.|…/.test(button.textContent || '') || button.hasAttribute('data-context-menu'));
        }
        if (!source && action !== 'more') {
            const shortcut = nowCard.querySelector(`[data-now-action="${action}"]`);
            const signature = shortcut?.querySelector('path')?.getAttribute('d');
            if (signature) source = sourceButtons.find((button) => button.querySelector(`path[d="${CSS.escape(signature)}"]`));
        }
        if (!source) source = state.sourceActions[action];
        if (!source?.isConnected) return false;
        const rect = source.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        const originalChildren = Array.from(row.children).filter((element) => element !== nowCard);
        nowCard.style.setProperty('pointer-events', 'none', 'important');
        originalChildren.forEach((element) => element.style.setProperty('pointer-events', 'auto', 'important'));
        window.open(`sunoapp://native-click?x=${encodeURIComponent(rect.left + rect.width / 2)}&y=${encodeURIComponent(rect.top + rect.height / 2)}`);
        setTimeout(() => {
            nowCard.style.removeProperty('pointer-events');
            originalChildren.forEach((element) => element.style.removeProperty('pointer-events'));
        }, 180);
        return true;
    };
    ['like', 'dislike', 'pin', 'share', 'remix'].forEach((action) => {
        nowCard.querySelector(`[data-now-action="${action}"]`).addEventListener('click', () => activateSunoAction(action));
    });
    const moreControl = nowCard.querySelector('.sa-now-more');
    moreControl.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        event.stopPropagation();
    });
    moreControl.addEventListener('click', (event) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        customTrackMenu.hidden = true;
        moreControl.setAttribute('aria-expanded', 'false');
        activateSunoAction('more');
    });
    document.addEventListener('click', (event) => {
        if (!customTrackMenu.hidden && !customTrackMenu.contains(event.target) && event.target !== moreControl) {
            customTrackMenu.hidden = true;
            moreControl.setAttribute('aria-expanded', 'false');
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !customTrackMenu.hidden) {
            customTrackMenu.hidden = true;
            moreControl.setAttribute('aria-expanded', 'false');
            moreControl.focus();
        }
    });
    customTrackMenu.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', () => {
        const action = button.dataset.action;
        state.sourceActions[action]?.click();
        document.dispatchEvent(new CustomEvent('suno:action', { detail: { action, trackRow: state.activeTrackRow } }));
        customTrackMenu.hidden = true;
        moreControl.setAttribute('aria-expanded', 'false');
    }));

    const attachWaveformToLoadedSong = () => {
        // Overlay the custom card with position:fixed. Never append it into a
        // virtualized row or hide/move that row's children — Suno reuses those nodes.
        if (!state.customPlayerEnabled || document.body.classList.contains('sunoapp-studio')) {
            state.activeTrackRow?.classList.remove('sunoapp-source-row-hidden');
            nowCard.classList.remove('sunoapp-now-overlay');
            nowCard.style.display = 'none';
            waveform.classList.remove('attached', 'visible');
            if (waveform.parentElement !== document.body) document.body.appendChild(waveform);
            return false;
        }
        if (!state.audioElement) {
            state.audioElement = Array.from(document.querySelectorAll('audio, video')).find((candidate) => candidate.src || candidate.currentSrc) || null;
        }
        const playbarButton = document.querySelector('button[aria-label*="Playbar: Play" i], button[aria-label*="Playbar: Pause" i]');
        let playerRoot = playbarButton?.parentElement || null;
        for (let depth = 0; playerRoot && depth < 7; depth++) {
            if (playerRoot.querySelector('img') && playerRoot.querySelectorAll('button').length >= 5) break;
