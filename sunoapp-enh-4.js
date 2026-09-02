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
        syncMusicTheme();
    };
    const MUSIC_VARS = ['--sa-bg', '--sa-titlebar', '--sa-accent', '--sa-accent-2', '--sa-border', '--sa-surface', '--sa-btn'];
    syncMusicTheme = () => {
        const roots = [document.documentElement, document.body];
        if (state.uiTheme !== 'musique') {
            roots.forEach((el) => MUSIC_VARS.forEach((name) => el.style.removeProperty(name)));
            return;
        }
        const first = state.themeStart || '#ff5474';
        const second = state.themeEnd || '#ff8a5c';
        const paint = {
            '--sa-accent': first,
            '--sa-accent-2': second,
            '--sa-bg': `color-mix(in srgb, ${first} 28%, #09090c)`,
            '--sa-titlebar': `color-mix(in srgb, ${first} 22%, rgba(12,12,16,.78))`,
            '--sa-border': `color-mix(in srgb, ${second} 35%, rgba(255,255,255,.1))`,
            '--sa-surface': `color-mix(in srgb, ${first} 18%, rgba(16,16,20,.84))`,
            '--sa-btn': `color-mix(in srgb, ${first} 24%, rgba(255,255,255,.08))`
        };
        roots.forEach((el) => Object.entries(paint).forEach(([name, value]) => el.style.setProperty(name, value)));
    };
    syncMusicTheme();
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
            playerRoot = playerRoot.parentElement;
        }
        const playerLinks = playerRoot ? Array.from(playerRoot.querySelectorAll('a')).filter((link) => link.textContent?.trim()) : [];
        const playbarTitle = document.querySelector('[aria-label*="Playbar: Title" i]') || playerLinks[0];
        const title = navigator.mediaSession?.metadata?.title?.trim() || playbarTitle?.textContent?.trim();
        if (!title) return false;
        const playbarCover = playerRoot?.querySelector('img');
        const artworkUrl = navigator.mediaSession?.metadata?.artwork?.slice(-1)[0]?.src || playbarCover?.currentSrc || playbarCover?.src || '';
        const audioUrl = state.audioElement?.currentSrc || state.audioElement?.src || '';
        const nextTrackKey = `${title}|${artworkUrl}|${audioUrl}`;
        const trackChanged = nextTrackKey !== state.trackKey;
        if (trackChanged) {
            state.trackKey = nextTrackKey;
            state.sourceActions = {};
            state.themeSource = '';
            state.waveformPeaks = null;
        }
        const candidates = Array.from(document.querySelectorAll('a, button, div, span'))
            .filter((element) => {
                if (nowCard.contains(element)) return false;
                if (element === playbarTitle || element.contains(playbarTitle)) return false;
                if ((element.textContent || '').trim() !== title) return false;
                const rect = element.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && rect.left > window.innerWidth * .32 && rect.bottom < window.innerHeight - 75;
            })
            .map((element) => {
                const color = getComputedStyle(element).color.match(/[\d.]+/g)?.map(Number) || [0, 0, 0];
                const pinkScore = color[0] - ((color[1] + color[2]) / 2);
                let row = element.parentElement;
                for (let depth = 0; row && depth < 6; depth++) {
                    if (row.querySelector('img') && row.querySelectorAll('button').length >= 3) break;
                    row = row.parentElement;
                }
                const playingScore = row?.querySelector('button[aria-label*="pause" i], [data-state="playing"]') ? 1000 : 0;
                const rowImage = row?.querySelector('img');
                const rowArtwork = rowImage?.currentSrc || rowImage?.src || '';
                const artworkScore = artworkUrl && rowArtwork && (rowArtwork === artworkUrl || rowArtwork.includes(artworkUrl) || artworkUrl.includes(rowArtwork)) ? 5000 : 0;
                return { element, score: artworkScore + playingScore + pinkScore };
            })
            .sort((first, second) => second.score - first.score || first.element.querySelectorAll('*').length - second.element.querySelectorAll('*').length);
        const titleElement = candidates[0]?.element;
        if (!titleElement) return false;

        let rowCursor = titleElement.parentElement;
        const possibleRows = [];
        for (let depth = 0; rowCursor && depth < 9; depth++) {
            const rect = rowCursor.getBoundingClientRect();
            if (rowCursor.querySelector('img') && rowCursor.querySelectorAll('button').length >= 3 && rect.height >= 70 && rect.height < 190) possibleRows.push(rowCursor);
            rowCursor = rowCursor.parentElement;
        }
        const activeRow = possibleRows.sort((first, second) => second.getBoundingClientRect().width - first.getBoundingClientRect().width)[0];
        if (!activeRow?.parentElement) return false;
        if (state.activeTrackRow && state.activeTrackRow !== activeRow) state.activeTrackRow.classList.remove('sunoapp-source-row-hidden');
        state.activeTrackRow = activeRow;
        const overlayRect = activeRow.getBoundingClientRect();
        nowCard.style.top = `${Math.round(overlayRect.top)}px`;
        nowCard.style.left = `${Math.round(overlayRect.left)}px`;
        nowCard.style.width = `${Math.round(overlayRect.width)}px`;
        nowCard.style.height = `${Math.round(overlayRect.height)}px`;
        nowCard.classList.add('sunoapp-now-overlay');
        if (nowCard.parentElement !== document.body) document.body.appendChild(nowCard);

        const cover = activeRow.querySelector('img');
        const textSnippets = Array.from(activeRow.querySelectorAll('div, span, p'))
            .map((element) => (element.textContent || '').trim())
            .filter((value) => value && value !== title && value.length > 5 && value.length < 180)
            .sort((first, second) => second.length - first.length);
        const coverSource = cover?.currentSrc || cover?.src || '';
        nowCard.querySelector('.sa-now-cover').src = coverSource;
        applyCoverTheme(coverSource, title);
        nowCard.querySelector('.sa-now-title').textContent = title;
        nowCard.querySelector('.sa-now-style').textContent = textSnippets[0] || 'Création Suno';
        const sourceButtons = Array.from(activeRow.querySelectorAll('button')).filter((button) => !button.closest('#sunoapp-now-card'));
