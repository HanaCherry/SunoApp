        } catch (error) {
            status.textContent = error.message || 'Traitement audio indisponible pour ce morceau.';
        }
    };

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
