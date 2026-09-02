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
