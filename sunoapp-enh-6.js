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
            const extraReverb = Number(document.getElementById('sunoapp-reverb')?.value || 0);
            state.wetGain.gain.setTargetAtTime(Math.min(0.62, (spatialMix[mode] ?? spatialMix.custom) + extraReverb), state.audioContext.currentTime, .05);
            if (state.haas) state.haas.delayTime.setTargetAtTime(haasDelay[mode] ?? 0, state.audioContext.currentTime, .05);
            document.querySelectorAll('.sa-mode').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
            if (mode !== 'custom') localStorage.setItem('sunoapp-sound-mode', mode);
            const modeLabel = document.querySelector(`[data-mode="${mode}"]`)?.textContent || mode;
            status.textContent = mode === 'custom'
                ? t('statusEqCustom')
                : `Mode ${modeLabel} actif${['cinema51', 'surround71', 'atmos'].includes(mode) ? ' — spatialisation casque (simulation).' : '.'}`;
        } catch (error) {
            status.textContent = error.message || 'Traitement audio indisponible pour ce morceau.';
        }
    };


    const preamp = document.getElementById('sunoapp-preamp');
    const preampOut = document.getElementById('sunoapp-preamp-out');
    preamp?.addEventListener('input', async () => {
        const db = Number(preamp.value);
        if (preampOut) preampOut.textContent = `${db > 0 ? '+' : ''}${db} dB`;
        try {
            await connectAudio();
            const lin = Math.pow(10, db / 20);
            state.preamp?.gain.setTargetAtTime(lin, state.audioContext.currentTime, .04);
        } catch (_) {}
    });

    const readUserPresets = () => {
        try { return JSON.parse(localStorage.getItem('sunoapp-user-eq') || '[]'); } catch (_) { return []; }
    };
    const writeUserPresets = (list) => localStorage.setItem('sunoapp-user-eq', JSON.stringify(list));
    const currentGains = () => Array.from(document.querySelectorAll('.sa-eq input[data-band]')).map((item) => Number(item.value));
    const renderUserPresets = () => {
        const host = document.getElementById('sunoapp-user-presets');
        if (!host) return;
        const list = readUserPresets();
        host.innerHTML = list.length
            ? list.map((preset, index) => `<button type="button" class="sa-user-preset" data-load-eq="${index}">${preset.name.replace(/[<>&]/g, '')}<span class="sa-del" data-del-eq="${index}">×</span></button>`).join('')
            : `<span class="sa-eq-note">${t('statusNoPresets')}</span>`;
    };
    renderUserPresets();
    document.getElementById('sunoapp-preset-save')?.addEventListener('click', () => {
        const name = (document.getElementById('sunoapp-preset-name')?.value || '').trim().slice(0, 32);
        if (!name) {
            status.textContent = t('statusNeedName');
            return;
        }
        const list = readUserPresets();
        const entry = {
            name,
            gains: currentGains(),
            preamp: Number(preamp?.value || 0),
            wet: state.wetGain?.gain.value || 0,
            haas: state.haas?.delayTime.value || 0
        };
        const existing = list.findIndex((item) => item.name.toLowerCase() === name.toLowerCase());
        if (existing >= 0) list[existing] = entry;
        else list.push(entry);
        writeUserPresets(list);
        renderUserPresets();
        status.textContent = t('statusPresetSaved', {name});
    });
    document.getElementById('sunoapp-user-presets')?.addEventListener('click', async (event) => {
        const del = event.target.closest('[data-del-eq]');
        if (del) {
            const list = readUserPresets();
            list.splice(Number(del.dataset.delEq), 1);
            writeUserPresets(list);
            renderUserPresets();
            return;
        }
        const load = event.target.closest('[data-load-eq]');
        if (!load) return;
        const preset = readUserPresets()[Number(load.dataset.loadEq)];
        if (!preset) return;
        await setGains(preset.gains, 'custom');
        if (preamp) {
            preamp.value = String(preset.preamp || 0);
            preamp.dispatchEvent(new Event('input'));
        }
        try {
            await connectAudio();
            const now = state.audioContext.currentTime;
            if (state.wetGain) state.wetGain.gain.setTargetAtTime(preset.wet || 0, now, .05);
            if (state.haas) state.haas.delayTime.setTargetAtTime(preset.haas || 0, now, .05);
        } catch (_) {}
        status.textContent = t('statusPresetLoaded', {name: preset.name});
    });
    const abButton = document.getElementById('sunoapp-ab');
    abButton?.addEventListener('click', async () => {
        try {
            await connectAudio();
            state.eqBypass = !state.eqBypass;
            abButton.classList.toggle('on', state.eqBypass);
            abButton.textContent = state.eqBypass ? t('abOriginal') : t('abProcess');
            const now = state.audioContext.currentTime;
            if (state.eqBypass) {
                state.eqSnapshot = {
                    gains: currentGains(),
                    preamp: Number(preamp?.value || 0),
                    wet: state.wetGain?.gain.value || 0,
                    haas: state.haas?.delayTime.value || 0
                };
                state.filters.forEach((filter) => filter.gain.setTargetAtTime(0, now, .03));
                state.preamp?.gain.setTargetAtTime(1, now, .03);
                state.wetGain?.gain.setTargetAtTime(0, now, .03);
                state.haas?.delayTime.setTargetAtTime(0, now, .03);
                state.echoSend?.gain.setTargetAtTime(0, now, .03);
                state.compressor?.ratio.setTargetAtTime(1, now, .03);
                status.textContent = t('statusAbOff');
            } else {
                const snap = state.eqSnapshot;
                if (snap?.gains) await setGains(snap.gains, 'custom');
                if (preamp) {
                    preamp.value = String(snap?.preamp || 0);
                    preamp.dispatchEvent(new Event('input'));
                }
                state.wetGain?.gain.setTargetAtTime(snap?.wet || 0, state.audioContext.currentTime, .03);
                state.haas?.delayTime.setTargetAtTime(snap?.haas || 0, state.audioContext.currentTime, .03);
                state.compressor?.ratio.setTargetAtTime(3, state.audioContext.currentTime, .03);
                status.textContent = t('statusAbOn');
            }
        } catch (error) {
            status.textContent = error.message || t('statusNeedTrack');
        }
    });
    const spectrum = document.getElementById('sunoapp-spectrum');
    const spectrumContext = spectrum?.getContext('2d');
    const drawSpectrum = () => {
        if (!spectrum || !spectrumContext) return;
        requestAnimationFrame(drawSpectrum);
        const width = spectrum.width, height = spectrum.height;
        spectrumContext.clearRect(0, 0, width, height);
        if (!overlay.classList.contains('open') || !state.analyser) {
            spectrumContext.fillStyle = 'rgba(255,255,255,.12)';
            spectrumContext.fillRect(0, height - 2, width, 2);
            return;
        }
        const bins = new Uint8Array(state.analyser.frequencyBinCount);
        state.analyser.getByteFrequencyData(bins);
        const step = Math.max(1, Math.floor(bins.length / 72));
        const barWidth = width / 72;
        for (let i = 0; i < 72; i++) {
            const value = bins[Math.min(bins.length - 1, i * step)] / 255;
            const barHeight = Math.max(2, value * height);
            spectrumContext.fillStyle = `hsla(${320 - i * 2.4}, 86%, ${58 + value * 20}%, .9)`;
            spectrumContext.fillRect(i * barWidth + 1, height - barHeight, barWidth - 2, barHeight);
        }
    };
    drawSpectrum();

    const panToggle = document.getElementById('sunoapp-autopan');
    const panRate = document.getElementById('sunoapp-autopan-rate');
    const panRateOut = document.getElementById('sunoapp-autopan-rate-out');
    const panLabel = (hz) => hz < 0.18 ? t('panVerySlow') : hz < 0.35 ? t('panSlow') : hz < 0.7 ? t('panMid') : t('panFast');
    const applyAutoPan = async () => {
        const on = !!panToggle?.checked;
        const hz = Number(panRate?.value || 0.28);
        if (panRateOut) panRateOut.textContent = panLabel(hz);
        localStorage.setItem('sunoapp-autopan', on ? 'true' : 'false');
        localStorage.setItem('sunoapp-autopan-rate', String(hz));
        try {
            await connectAudio();
            const now = state.audioContext.currentTime;
            state.panDepth?.gain.setTargetAtTime(on ? 1 : 0, now, .08);
            state.panLfo?.frequency.setTargetAtTime(hz, now, .08);
            if (!state.eqBypass) status.textContent = on ? t('statusPanOn') : t('statusPanOff');
        } catch (error) {
            status.textContent = error.message || t('statusNeedTrack');
        }
    };
    if (localStorage.getItem('sunoapp-autopan') === 'true' && panToggle) panToggle.checked = true;
    if (localStorage.getItem('sunoapp-autopan-rate') && panRate) panRate.value = localStorage.getItem('sunoapp-autopan-rate');
    if (panRateOut && panRate) panRateOut.textContent = panLabel(Number(panRate.value));
    panToggle?.addEventListener('change', applyAutoPan);
    panRate?.addEventListener('input', applyAutoPan);

    const pct = (v) => v <= 0.005 ? t('off') : `${Math.round(v * 100)}%`;
    const applySpace = async () => {
        const reverb = Number(document.getElementById('sunoapp-reverb')?.value || 0);
        const echo = Number(document.getElementById('sunoapp-echo')?.value || 0);
        const time = Number(document.getElementById('sunoapp-echo-time')?.value || 0.32);
        const reverbOut = document.getElementById('sunoapp-reverb-out');
        const echoOut = document.getElementById('sunoapp-echo-out');
        const timeOut = document.getElementById('sunoapp-echo-time-out');
        if (reverbOut) reverbOut.textContent = pct(reverb);
        if (echoOut) echoOut.textContent = pct(echo);
        if (timeOut) timeOut.textContent = time < 0.22 ? t('echoShort') : time < 0.4 ? '1/4' : t('echoLong');
        try {
            await connectAudio();
            if (state.eqBypass) return;
            const now = state.audioContext.currentTime;
            const spatial = spatialMix[state.mode] ?? spatialMix.custom;
            state.wetGain?.gain.setTargetAtTime(Math.min(0.62, spatial + reverb), now, .05);
            state.echoSend?.gain.setTargetAtTime(echo, now, .05);
            state.echoDelay?.delayTime.setTargetAtTime(time, now, .08);
        } catch (error) {
            status.textContent = error.message || t('statusSpaceNeedTrack');
        }
    };
    ['sunoapp-reverb', 'sunoapp-echo', 'sunoapp-echo-time'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', applySpace);
    });
    document.getElementById('sunoapp-settings-mini')?.addEventListener('click', () => window.open('sunoapp://mini', '_blank'));
    document.getElementById('sunoapp-settings-spectrum')?.addEventListener('click', () => window.open('sunoapp://spectrum', '_blank'));
    window.__sunoAppGetSpectrum = () => {
        if (!state.analyser) return { bins: [], title: '', artist: '' };
        const raw = new Uint8Array(state.analyser.frequencyBinCount);
        state.analyser.getByteFrequencyData(raw);
        const bins = [];
        const n = 96;
        const step = Math.max(1, Math.floor(raw.length / n));
        for (let i = 0; i < n; i++) bins.push(raw[Math.min(raw.length - 1, i * step)]);
        const meta = navigator.mediaSession?.metadata;
        return {
            bins,
            title: meta?.title || document.title || t('spectrum'),
            artist: meta?.artist || ''
        };
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
        setGains(inputs.map((item) => Number(item.value)), 'custom');
    });

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
