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
            source = sourceButtons.find((button) => button.querySelectorAll('circle').length >= 3 || /\.\.\.|\u2026/.test(button.textContent || '') || button.hasAttribute('data-context-menu'));
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
        const labelOf = (button) => `${button.getAttribute('aria-label') || ''} ${button.title || ''} ${button.textContent || ''}`.trim();
        const rowRect = activeRow.getBoundingClientRect();
        const rowCenterY = rowRect.top + rowRect.height / 2;
        const remixButton = sourceButtons
            .filter((button) => /remix/i.test(labelOf(button)))
            .sort((first, second) => Math.abs((first.getBoundingClientRect().top + first.getBoundingClientRect().bottom) / 2 - rowCenterY) - Math.abs((second.getBoundingClientRect().top + second.getBoundingClientRect().bottom) / 2 - rowCenterY))[0];
        const menuCandidates = sourceButtons.filter((button) => {
            const label = labelOf(button);
            const hasDotsIcon = button.querySelectorAll('circle').length >= 3 || /\.\.\.|\u2026/.test(button.textContent || '');
            const isContextTrigger = button.hasAttribute('data-context-menu-trigger') || button.hasAttribute('data-context-menu');
            return /more|plus|options/i.test(label) || hasDotsIcon || isContextTrigger;
        });
        const moreButton = menuCandidates.sort((first, second) => second.getBoundingClientRect().right - first.getBoundingClientRect().right)[0] || null;
        const remixRect = remixButton?.getBoundingClientRect();
        const iconButtons = sourceButtons.filter((button) => {
            const rect = button.getBoundingClientRect();
            const hasNoText = !(button.textContent || '').trim();
            const isCompact = rect.width >= 20 && rect.width <= 64 && rect.height >= 20 && rect.height <= 64;
            const isOnTrackLine = Math.abs((rect.top + rect.bottom) / 2 - rowCenterY) < Math.max(38, rowRect.height * .45);
            return hasNoText && isCompact && isOnTrackLine && button !== moreButton;
        });
        const regularButtons = iconButtons
            .filter((button) => !remixRect || button.getBoundingClientRect().right <= remixRect.left + 4)
            .sort((first, second) => first.getBoundingClientRect().left - second.getBoundingClientRect().left)
            .slice(-4);
        state.sourceActions = {
            like: sourceButtons.find((button) => /like|j'aime|thumbs up/i.test(labelOf(button))) || regularButtons[0] || state.sourceActions.like,
            dislike: sourceButtons.find((button) => /dislike|je n'aime pas|thumbs down/i.test(labelOf(button))) || regularButtons[1] || state.sourceActions.dislike,
            pin: sourceButtons.find((button) => /pin|éping/i.test(labelOf(button))) || regularButtons[2] || state.sourceActions.pin,
            share: sourceButtons.find((button) => /share|partag/i.test(labelOf(button))) || regularButtons[3] || state.sourceActions.share,
            remix: remixButton || state.sourceActions.remix,
            more: moreButton || state.sourceActions.more
        };
        const shortcutMarkup = {
            like: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 10.5 11 4.8c.8-1.3 2.8-.7 2.8.8v4h4.1c1.6 0 2.7 1.5 2.2 3l-1.7 5.1c-.3.9-1.2 1.5-2.2 1.5H7.5m0-8.7v8.7H4.8c-.8 0-1.4-.6-1.4-1.4v-5.9c0-.8.6-1.4 1.4-1.4z"/></svg>',
            dislike: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 13.5 11 19.2c.8 1.3 2.8.7 2.8-.8v-4h4.1c1.6 0 2.7-1.5 2.2-3l-1.7-5.1c-.3-.9-1.2-1.5-2.2-1.5H7.5m0 8.7V4.8H4.8c-.8 0-1.4.6-1.4 1.4v5.9c0 .8.6 1.4 1.4 1.4z"/></svg>',
            pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 6 0-1 5 3 3v1H7v-1l3-3zM12 13v7"/></svg>',
            share: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M10 7H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-4"/></svg>',
            remix: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3.5c4.5 0 4.5 10 9 10H20M17 14l3 3-3 3M4 17h3.5c1.1 0 2-.6 2.8-1.5M14 8.5c.7-.9 1.4-1.5 2.2-1.5H20M17 4l3 3-3 3"/></svg><span>Remix</span>'
        };
        const actionsHost = nowCard.querySelector('.sa-now-actions');
        ['like', 'dislike', 'pin', 'share', 'remix'].forEach((action) => {
            const target = nowCard.querySelector(`[data-now-action="${action}"]`);
            const source = state.sourceActions[action];
            if (!target || !source?.isConnected) {
                if (target) target.style.display = 'none';
                return;
            }
            source.style.removeProperty('display');
            target.style.removeProperty('display');
            if (target.dataset.sunoappSource !== action) {
