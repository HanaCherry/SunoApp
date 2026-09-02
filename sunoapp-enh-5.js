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
        if (!media) throw new Error(t('statusNeedTrack'));
        if (state.audioElement === media && state.source) return;

        if (!state.audioContext) state.audioContext = new AudioContext();
        if (state.audioContext.state === 'suspended') await state.audioContext.resume();

        state.audioElement = media;
        state.source = state.audioContext.createMediaElementSource(media);
        state.filters = frequencies.map((frequency, index) => {
            const filter = state.audioContext.createBiquadFilter();
            filter.type = index === 0 ? 'lowshelf' : index === frequencies.length - 1 ? 'highshelf' : 'peaking';
            filter.frequency.value = frequency;
            filter.Q.value = index === 0 || index === frequencies.length - 1 ? 0.7 : 1.05;
            return filter;
        });

        let previous = state.source;
        state.filters.forEach((filter) => {
            previous.connect(filter);
            previous = filter;
        });

        state.preamp = state.audioContext.createGain();
        state.preamp.gain.value = 1;
        previous.connect(state.preamp);
        previous = state.preamp;

        state.haas = state.audioContext.createDelay(0.05);
        state.haas.delayTime.value = 0;
        const splitter = state.audioContext.createChannelSplitter(2);
        const merger = state.audioContext.createChannelMerger(2);
        previous.connect(splitter);
        splitter.connect(merger, 0, 0);
        splitter.connect(state.haas, 1);
        state.haas.connect(merger, 0, 1);
        previous = merger;

        state.dryGain = state.audioContext.createGain();
        state.wetGain = state.audioContext.createGain();
        state.convolver = state.audioContext.createConvolver();
        state.compressor = state.audioContext.createDynamicsCompressor();
        state.analyser = state.audioContext.createAnalyser();
        state.analyser.fftSize = 2048;
        state.analyser.smoothingTimeConstant = .68;

        const rate = state.audioContext.sampleRate;
        const impulseLength = Math.floor(rate * .55);
        const impulse = state.audioContext.createBuffer(2, impulseLength, rate);
        const early = [0.007, 0.013, 0.019, 0.027, 0.036];
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let index = 0; index < impulseLength; index++) {
                const t = index / rate;
                const envelope = Math.pow(1 - index / impulseLength, 2.4) * Math.exp(-t * 5.5);
                data[index] = (Math.random() * 2 - 1) * envelope * 0.35;
            }
            early.forEach((ms, i) => {
                const at = Math.floor(ms * rate) + (channel ? 90 : 0);
                if (at < impulseLength) data[at] += (i % 2 ? -1 : 1) * (0.22 - i * 0.03) * (channel ? 0.85 : 1);
            });
        }
        state.convolver.buffer = impulse;
        state.dryGain.gain.value = 1;
        state.wetGain.gain.value = 0;
        state.compressor.threshold.value = -8;
        state.compressor.knee.value = 10;
        state.compressor.ratio.value = 3;
        state.compressor.attack.value = 0.003;
        state.compressor.release.value = 0.14;

        state.echoDelay = state.audioContext.createDelay(1.2);
        state.echoFb = state.audioContext.createGain();
        state.echoSend = state.audioContext.createGain();
        state.echoDelay.delayTime.value = Number(document.getElementById('sunoapp-echo-time')?.value || 0.32);
        state.echoFb.gain.value = 0.34;
        state.echoSend.gain.value = Number(document.getElementById('sunoapp-echo')?.value || 0);
        previous.connect(state.echoSend);
        state.echoSend.connect(state.echoDelay);
        state.echoDelay.connect(state.echoFb);
        state.echoFb.connect(state.echoDelay);

        previous.connect(state.dryGain);
        previous.connect(state.convolver);
        state.dryGain.connect(state.compressor);
        state.convolver.connect(state.wetGain);
        state.wetGain.connect(state.compressor);
        state.echoDelay.connect(state.compressor);
        state.panner = state.audioContext.createStereoPanner();
        state.panLfo = state.audioContext.createOscillator();
        state.panDepth = state.audioContext.createGain();
        state.panLfo.type = 'sine';
        state.panLfo.frequency.value = Number(document.getElementById('sunoapp-autopan-rate')?.value || 0.28);
        state.panDepth.gain.value = document.getElementById('sunoapp-autopan')?.checked ? 1 : 0;
        state.panLfo.connect(state.panDepth);
        state.panDepth.connect(state.panner.pan);
        state.panLfo.start();
        state.compressor.connect(state.panner);
        state.panner.connect(state.analyser);
        state.analyser.connect(state.audioContext.destination);
    };

    const waveformToggle = document.getElementById('sunoapp-waveform-toggle');
    waveformToggle.addEventListener('change', async () => {
        state.waveformEnabled = waveformToggle.checked;
        localStorage.setItem('sunoapp-waveform-enabled', String(state.waveformEnabled));
        if (!state.waveformEnabled) {
            waveform.classList.remove('visible');
            status.textContent = t('statusWaveOff');
            return;
        }
        try {
            await connectAudio();
            status.textContent = t('statusWaveOn');
        } catch (error) {
            status.textContent = error.message || 'La forme d\'onde sera affichée dès le prochain morceau.';
        }
    });
    const customPlayerToggle = document.getElementById('sunoapp-custom-player-toggle');
    customPlayerToggle.addEventListener('change', () => {
        state.customPlayerEnabled = customPlayerToggle.checked;
        localStorage.setItem('sunoapp-custom-player-enabled', String(state.customPlayerEnabled));
        if (!state.customPlayerEnabled) {
            state.activeTrackRow?.classList.remove('sunoapp-source-row-hidden');
            nowCard.classList.remove('sunoapp-now-overlay');
            nowCard.style.display = 'none';
            waveform.classList.remove('attached', 'visible');
            document.body.appendChild(waveform);
            status.textContent = t('statusCustomOff');
        } else {
            status.textContent = t('statusCustomOn');
            attachWaveformToLoadedSong();
        }
    });

    const analyseWholeTrack = async (media) => {
        const sourceUrl = media?.currentSrc || media?.src || '';
        if (!sourceUrl || sourceUrl === state.waveformSource) return;
        state.waveformSource = sourceUrl;
        state.waveformPeaks = null;
        try {
            const response = await fetch(sourceUrl, { credentials: 'omit' });
            if (!response.ok) throw new Error(`Audio ${response.status}`);
            const bytes = await response.arrayBuffer();
            const decoder = state.audioContext || new AudioContext();
            const buffer = await decoder.decodeAudioData(bytes.slice(0));
            const channel = buffer.getChannelData(0);
            const bucketCount = 720;
            const bucketSize = Math.max(1, Math.floor(channel.length / bucketCount));
            const peaks = new Float32Array(bucketCount);
            let maximum = .0001;
            for (let bucket = 0; bucket < bucketCount; bucket++) {
                const start = bucket * bucketSize;
                const end = Math.min(channel.length, start + bucketSize);
                let peak = 0;
                for (let sample = start; sample < end; sample += Math.max(1, Math.floor(bucketSize / 90))) {
                    peak = Math.max(peak, Math.abs(channel[sample]));
                }
                peaks[bucket] = peak;
                maximum = Math.max(maximum, peak);
            }
            for (let index = 0; index < peaks.length; index++) peaks[index] = Math.pow(peaks[index] / maximum, .72);
            if (state.waveformSource === sourceUrl) state.waveformPeaks = peaks;
        } catch (_) {
            state.waveformPeaks = null;
        }
    };

    const watchMedia = () => {
        if (!state.waveformEnabled) return;
        const media = Array.from(document.querySelectorAll('audio, video')).find((candidate) => candidate.src || candidate.currentSrc);
        if (media && media !== state.audioElement) connectAudio().catch(() => {});
        if (media) analyseWholeTrack(media);
        attachWaveformToLoadedSong();
    };
