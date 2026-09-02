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
            const hasDotsIcon = button.querySelectorAll('circle').length >= 3 || /\.\.\.|…/.test(button.textContent || '');
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
                target.innerHTML = shortcutMarkup[action] || source.innerHTML;
                target.dataset.sunoappSource = action;
            }
            source.classList.add('sunoapp-native-hit-target');
        });
        const host = nowCard.querySelector('.sa-now-wave-host');
        if (waveform.parentElement !== host) host.appendChild(waveform);
        waveform.style.width = '100%';
        waveform.classList.add('attached');
        return true;
    };

    const drawWaveform = () => {
        state.waveformFrame = requestAnimationFrame(drawWaveform);
        if (!state.waveformEnabled) {
            waveform.classList.remove('visible');
            return;
        }
        attachWaveformToLoadedSong();
        if (!waveform.classList.contains('attached')) return;
        const rect = waveformCanvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.max(1, Math.floor(rect.width * ratio));
        const height = Math.max(1, Math.floor(rect.height * ratio));
        if (waveformCanvas.width !== width || waveformCanvas.height !== height) {
            waveformCanvas.width = width;
            waveformCanvas.height = height;
        }
        const samples = new Uint8Array(512);
        if (state.waveformPeaks?.length) {
            for (let index = 0; index < samples.length; index++) {
                const peakIndex = Math.min(state.waveformPeaks.length - 1, Math.floor(index / samples.length * state.waveformPeaks.length));
                samples[index] = 128 + Math.round(state.waveformPeaks[peakIndex] * 118);
            }
        } else {
            const seedText = navigator.mediaSession?.metadata?.title || 'SunoApp';
            let seed = Array.from(seedText).reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
            for (let index = 0; index < samples.length; index++) {
                seed = (seed * 1664525 + 1013904223) >>> 0;
                const envelope = .32 + .68 * Math.sin(Math.PI * index / samples.length);
                const rhythm = .55 + .45 * Math.abs(Math.sin(index * .19));
                samples[index] = 128 + Math.round((((seed >>> 16) / 65535) * 2 - 1) * 112 * envelope * rhythm);
            }
        }
        const progress = state.audioElement && Number.isFinite(state.audioElement.duration) && state.audioElement.duration > 0
            ? Math.min(1, state.audioElement.currentTime / state.audioElement.duration) : 0;
        nowCard.querySelector('.sa-now-current').textContent = formatTime(state.audioElement?.currentTime || 0);
        nowCard.querySelector('.sa-now-duration').textContent = formatTime(state.audioElement?.duration || 0);
        nowCard.querySelector('.sa-now-cover-play').innerHTML = state.audioElement?.paused
            ? '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7Z"/></svg>'
            : '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM14 5h4v14h-4z"/></svg>';
        waveformContext.clearRect(0, 0, width, height);
        waveformContext.strokeStyle = 'rgba(255,255,255,.055)';
        waveformContext.lineWidth = Math.max(1, ratio * .5);
        waveformContext.beginPath();
        waveformContext.moveTo(0, height / 2);
        waveformContext.lineTo(width, height / 2);
        waveformContext.stroke();
        waveformContext.beginPath();
        for (let x = 0; x < width; x++) {
            const index = Math.min(samples.length - 1, Math.floor(x / width * samples.length));
            const amplitude = Math.abs(samples[index] - 128) / 128;
            const shaped = Math.max(1.2 * ratio, amplitude * height * .48);
            waveformContext.moveTo(x + .5, height / 2 - shaped);
            waveformContext.lineTo(x + .5, height / 2 + shaped);
        }
        const gradient = waveformContext.createLinearGradient(0, 0, width, 0);
        const playedStop = Math.min(.998, Math.max(.002, progress));
        gradient.addColorStop(0, state.themeStart);
        gradient.addColorStop(playedStop, state.themeEnd);
        gradient.addColorStop(playedStop + .002, 'rgba(255,255,255,.28)');
        gradient.addColorStop(1, 'rgba(255,255,255,.15)');
        waveformContext.strokeStyle = gradient;
        waveformContext.lineWidth = Math.max(1, ratio);
        waveformContext.stroke();
        waveformContext.fillStyle = 'rgba(255,255,255,.8)';
        waveformContext.fillRect(Math.round(progress * width), 2 * ratio, ratio, height - 4 * ratio);
        waveform.classList.toggle('visible', waveform.classList.contains('attached'));
    };
    drawWaveform();

    const connectAudio = async () => {
        const media = Array.from(document.querySelectorAll('audio, video')).find((candidate) => candidate.src || candidate.currentSrc);
        if (!media) throw new Error('Lancez un morceau avant d’activer l’égaliseur.');
        if (state.audioElement === media && state.source) return;

        if (!state.audioContext) state.audioContext = new AudioContext();
        if (state.audioContext.state === 'suspended') await state.audioContext.resume();

        state.audioElement = media;
        state.source = state.audioContext.createMediaElementSource(media);
        state.filters = frequencies.map((frequency, index) => {
            const filter = state.audioContext.createBiquadFilter();
            filter.type = index === 0 ? 'lowshelf' : index === frequencies.length - 1 ? 'highshelf' : 'peaking';
            filter.frequency.value = frequency;
            filter.Q.value = 1;
            return filter;
        });

        let previous = state.source;
        state.filters.forEach((filter) => {
            previous.connect(filter);
            previous = filter;
        });

        state.dryGain = state.audioContext.createGain();
        state.wetGain = state.audioContext.createGain();
        state.convolver = state.audioContext.createConvolver();
        state.compressor = state.audioContext.createDynamicsCompressor();
        state.analyser = state.audioContext.createAnalyser();
        state.analyser.fftSize = 1024;
        state.analyser.smoothingTimeConstant = .72;

        const impulseLength = Math.floor(state.audioContext.sampleRate * .42);
        const impulse = state.audioContext.createBuffer(2, impulseLength, state.audioContext.sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
