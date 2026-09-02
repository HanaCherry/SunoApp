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
                state.filters[index].gain.setTargetAtTime(gain, state.audioContext.currentTime, 0.035);
                sliders[index].value = String(gain);
                document.getElementById(`sa-gain-${index}`).textContent = `${gain > 0 ? '+' : ''}${gain} dB`;
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

    document.querySelectorAll('.sa-mode').forEach((button) => {
        button.addEventListener('click', () => setGains(presets[button.dataset.mode], button.dataset.mode));
        button.classList.toggle('active', button.dataset.mode === state.mode);
    });
    sliders.forEach((slider) => slider.addEventListener('input', () => setGains(sliders.map((item) => Number(item.value)), 'custom')));

    const refreshProfile = () => {
        const creditElement = Array.from(document.querySelectorAll('*'))
            .filter((element) => element.isConnected && /^\s*[\d,.]+\s+Credits?\s*$/i.test(element.textContent || ''))
            .sort((first, second) => first.querySelectorAll('*').length - second.querySelectorAll('*').length)[0];
        if (!creditElement) return;

        let source = creditElement.parentElement;
        for (let depth = 0; source && depth < 4; depth++) {
            if (source.querySelector('img') && (source.textContent || '').length < 180) break;
            source = source.parentElement;
        }
        if (!source) return;

        source.classList.add('sunoapp-profile-centered');
        source.style.display = 'flex';
        state.profileSource = source;
    };

    refreshProfile();
    window.__sunoAppProfileTimer = setInterval(refreshProfile, 2500);

    const repairFullscreenBounds = () => {
        if (document.body.classList.contains('sunoapp-studio')) {
            document.querySelectorAll('.sunoapp-bounded-fullscreen').forEach((element) => element.classList.remove('sunoapp-bounded-fullscreen'));
            return;
        }
        Array.from(document.body.querySelectorAll(':scope > div, :scope > section')).forEach((element) => {
            if (element.id?.startsWith('sunoapp-')) return;
            const computed = getComputedStyle(element);
            if (computed.position !== 'fixed') return;
            const zIndex = Number.parseInt(computed.zIndex, 10);
            if (!Number.isFinite(zIndex) || zIndex < 50) return;
            const rect = element.getBoundingClientRect();
            const isFullscreenLayer = rect.top < 39 && rect.left < 4 && rect.width > window.innerWidth * .92 && rect.height > window.innerHeight * .82;
            element.classList.toggle('sunoapp-bounded-fullscreen', isFullscreenLayer);
        });
    };
    repairFullscreenBounds();
    window.__sunoAppBoundsTimer = setInterval(repairFullscreenBounds, 700);
})();
