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
            for (let index = 0; index < impulseLength; index++) {
                const envelope = Math.pow(1 - index / impulseLength, 3.1);
                data[index] = (Math.random() * 2 - 1) * envelope;
            }
        }
        state.convolver.buffer = impulse;
        state.dryGain.gain.value = 1;
        state.wetGain.gain.value = 0;
        state.compressor.threshold.value = -5;
        state.compressor.knee.value = 8;
        state.compressor.ratio.value = 2;

        previous.connect(state.dryGain);
        previous.connect(state.convolver);
        state.dryGain.connect(state.compressor);
        state.convolver.connect(state.wetGain);
        state.wetGain.connect(state.compressor);
        state.compressor.connect(state.analyser);
        state.analyser.connect(state.audioContext.destination);
    };

    const waveformToggle = document.getElementById('sunoapp-waveform-toggle');
    waveformToggle.addEventListener('change', async () => {
        state.waveformEnabled = waveformToggle.checked;
        localStorage.setItem('sunoapp-waveform-enabled', String(state.waveformEnabled));
        if (!state.waveformEnabled) {
            waveform.classList.remove('visible');
            status.textContent = 'Forme d\'onde masquée.';
            return;
        }
        try {
            await connectAudio();
            status.textContent = 'Forme d\'onde active : elle apparaît automatiquement pendant la lecture.';
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
            status.textContent = 'Lecteur personnalisé désactivé.';
        } else {
            status.textContent = 'Lecteur personnalisé activé.';
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
    document.addEventListener('play', watchMedia, true);
    window.addEventListener('scroll', () => { if (state.customPlayerEnabled) attachWaveformToLoadedSong(); }, true);
    window.addEventListener('resize', () => { if (state.customPlayerEnabled) attachWaveformToLoadedSong(); });
    window.__sunoAppWaveformTimer = setInterval(watchMedia, 1400);

    const setGains = async (gains, mode = 'custom') => {
        try {
            await connectAudio();
            gains.forEach((gain, index) => {
                if (state.filters[index]) state.filters[index].gain.setTargetAtTime(gain, state.audioContext.currentTime, 0.035);
                document.querySelectorAll(`.sa-band input[data-band="${index}"]`).forEach((input) => {
                    input.value = String(gain);
                });
                const label = `${gain > 0 ? '+' : ''}${gain} dB`;
                const legacy = document.getElementById(`sa-gain-${index}`);
                if (legacy) legacy.textContent = label;
                document.querySelectorAll(`[data-sa-gain="${index}"]`).forEach((output) => {
                    output.textContent = label;
                });
            });
            state.wetGain.gain.setTargetAtTime(spatialMix[mode] ?? spatialMix.custom, state.audioContext.currentTime, .05);
            document.querySelectorAll('.sa-mode').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
            if (mode !== 'custom') localStorage.setItem('sunoapp-sound-mode', mode);
            const modeLabel = document.querySelector(`[data-mode="${mode}"]`)?.textContent || mode;
            status.textContent = mode === 'custom'
                ? 'Égaliseur personnalisé actif.'
                : `Mode ${modeLabel} actif${['cinema51', 'surround71', 'atmos'].includes(mode) ? ' — spatialisation stéréo simulée.' : '.'}`;
        } catch (error) {
            status.textContent = error.message || 'Traitement audio indisponible pour ce morceau.';
        }
    };

    window.__sunoAppSetGains = setGains;
    document.querySelectorAll('.sa-mode').forEach((button) => {
        button.classList.toggle('active', button.dataset.mode === state.mode);
    });
    document.addEventListener('click', (event) => {
        const modeButton = event.target.closest('.sa-mode[data-mode]');
        if (!modeButton) return;
        const preset = presets[modeButton.dataset.mode];
        if (preset) setGains(preset, modeButton.dataset.mode);
    });
    document.addEventListener('input', (event) => {
        const slider = event.target.closest && event.target.closest('.sa-band input[data-band]');
        if (!slider) return;
        const root = slider.closest('.sa-eq');
        const inputs = root ? Array.from(root.querySelectorAll('input[data-band]')) : sliders;
