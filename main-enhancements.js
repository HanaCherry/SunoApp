(() => {
    if (window.__sunoAppEnhancementsInstalled) return;
    window.__sunoAppEnhancementsInstalled = true;

    const state = {
        audioContext: null,
        audioElement: null,
        source: null,
        filters: [],
        convolver: null,
        dryGain: null,
        wetGain: null,
        compressor: null,
        analyser: null,
        waveformFrame: null,
        waveformPeaks: null,
        waveformSource: '',
        trackKey: '',
        activeTrackRow: null,
        sourceActions: {},
        themeSource: '',
        themeStart: '#ff5474',
        themeEnd: '#ff8a5c',
        profileSource: null,
        mode: localStorage.getItem('sunoapp-sound-mode') || 'flat',
        waveformEnabled: localStorage.getItem('sunoapp-waveform-enabled') !== 'false',
        customPlayerEnabled: localStorage.getItem('sunoapp-custom-player-enabled') !== 'false'
    };

    const frequencies = [60, 230, 910, 3600, 14000];
    const presets = {
        flat: [0, 0, 0, 0, 0],
        bass: [7, 4, 1, -1, 0],
        vocal: [-2, 0, 3, 5, 2],
        clarity: [-2, -1, 1, 4, 6],
        immersive: [4, 1, -1, 2, 5],
        cinema51: [5, 2, -2, 3, 4],
        surround71: [3, 0, -2, 4, 6],
        atmos: [2, -1, 0, 5, 7]
    };
    const spatialMix = { flat: 0, bass: .02, vocal: .015, clarity: .025, immersive: .1, cinema51: .14, surround71: .19, atmos: .24, custom: .04 };

    const style = document.createElement('style');
    style.id = 'sunoapp-enhancements-style';
    style.textContent = `
        body.sunoapp-frameless { box-sizing: border-box !important; padding-top: 38px !important; }
        body.sunoapp-frameless.sunoapp-studio {
            padding-top: 38px !important;
            overflow: hidden !important;
            background: #0b0c10 !important;
        }
        body.sunoapp-studio > .sunoapp-studio-root {
            position: relative !important;
            width: 100% !important;
            height: calc(100vh - 38px) !important;
            max-height: calc(100vh - 38px) !important;
            min-height: 0 !important;
            overflow: hidden !important;
            transform: none !important;
        }
        body.sunoapp-studio #sunoapp-titlebar {
            background: #101217 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            border-bottom: 1px solid rgba(255,255,255,.06) !important;
        }
        body.sunoapp-studio .sa-title-center { color: rgba(255,255,255,.42); letter-spacing: .12em; text-transform: uppercase; font-size: 10px; font-weight: 650; }
        body.sunoapp-studio #sunoapp-now-card,
        body.sunoapp-studio #sunoapp-waveform,
        body.sunoapp-studio #sunoapp-mini-launcher,
        body.sunoapp-studio #sunoapp-fullscreen-launcher { display: none !important; }
        body.sunoapp-studio .sunoapp-glass-playbar {
            background: transparent !important;
            border-top: 0 !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
        }
        body.sunoapp-studio #sunoapp-top-menu {
            top: 48px !important;
            border: 1px solid rgba(255,255,255,.08) !important;
            background: rgba(16,18,23,.96) !important;
            backdrop-filter: blur(18px) saturate(140%) !important;
        }
        #sunoapp-titlebar {
            position: fixed; inset: 0 0 auto 0; z-index: 2147483647;
            display: grid; grid-template-columns: 220px 1fr 138px; align-items: center; height: 38px;
            border-bottom: 1px solid rgba(255,255,255,.08);
            color: rgba(255,255,255,.88); background: rgba(15,15,19,.88);
            box-shadow: inset 0 1px rgba(255,255,255,.045); backdrop-filter: blur(24px) saturate(160%);
            -webkit-app-region: drag;
        }
        .sa-title-brand { display: flex; align-items: center; gap: 9px; padding-left: 12px; font-size: 12px; font-weight: 720; }
        .sa-title-brand img { width: 21px; height: 21px; border-radius: 50%; object-fit: cover; }
        .sa-title-center { color: rgba(255,255,255,.28); font-size: 11px; text-align: center; }
        .sa-window-controls { display: grid; grid-template-columns: repeat(3, 46px); height: 100%; -webkit-app-region: no-drag; }
        .sa-window-button {
            display: grid; place-items: center; width: 46px; height: 38px; padding: 0; border: 0;
            color: rgba(255,255,255,.72); background: transparent; cursor: pointer;
        }
        .sa-window-button:hover { color: #fff; background: rgba(255,255,255,.09); }
        .sa-window-button.close:hover { background: #c42b3b; }
        .sa-window-button svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; }
        #sunoapp-top-menu, #sunoapp-settings-overlay { font-family: Inter, "SF Pro Display", "Segoe UI", sans-serif; }
        #sunoapp-top-menu {
            position: fixed; top: 3px; left: 112px; z-index: 2147483647; -webkit-app-region: no-drag;
        }
        .sa-glass-button {
            display: grid; place-items: center; width: 32px; height: 32px; padding: 0;
            border: 1px solid rgba(255,255,255,.11); border-radius: 10px;
            color: rgba(255,255,255,.86); background: rgba(25,25,30,.72);
            box-shadow: inset 0 1px rgba(255,255,255,.1), 0 8px 24px rgba(0,0,0,.28);
            backdrop-filter: blur(22px) saturate(160%); cursor: pointer;
        }
        .sa-glass-button:hover { color: #fff; background: rgba(42,42,48,.82); }
        .sa-glass-button svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
        #sunoapp-menu-popover {
            position: absolute; top: 38px; left: 0; display: none; width: 214px; padding: 8px;
            border: 1px solid rgba(255,255,255,.13); border-radius: 17px;
            background: rgba(18,18,22,.88); box-shadow: 0 20px 48px rgba(0,0,0,.48);
            backdrop-filter: blur(30px) saturate(170%);
        }
        #sunoapp-menu-popover.open { display: block; }
        .sa-menu-item {
            display: flex; align-items: center; gap: 11px; width: 100%; padding: 11px 12px;
            border: 0; border-radius: 11px; color: #fff; background: transparent;
            font-size: 14px; font-weight: 650; text-align: left; cursor: pointer;
        }
        .sa-menu-item:hover { background: rgba(255,255,255,.09); }
        .sa-menu-item svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; }
        .sunoapp-profile-centered {
            display: flex !important; flex-direction: column !important; align-items: center !important;
            justify-content: center !important; gap: 4px !important; width: 100% !important;
            padding: 12px 8px !important; text-align: center !important;
        }
        .sunoapp-profile-centered img {
            width: 58px !important; height: 58px !important; margin: 0 auto 7px !important;
            border: 2px solid rgba(255,255,255,.17) !important; border-radius: 50% !important;
            object-fit: cover !important; box-shadow: 0 8px 24px rgba(0,0,0,.34) !important;
        }
        .sunoapp-profile-centered * { text-align: center !important; }
        #sunoapp-settings-overlay {
            position: fixed; inset: 0; z-index: 2147483647; display: none; place-items: center;
            padding: 28px; background: rgba(3,3,6,.46); backdrop-filter: blur(14px);
        }
        #sunoapp-settings-overlay.open { display: grid; }
        .sa-settings-card {
            width: min(620px, 94vw); max-height: min(720px, 90vh); overflow: auto; padding: 25px;
            border: 1px solid rgba(255,255,255,.14); border-radius: 26px;
            color: #fff; background: linear-gradient(145deg, rgba(34,34,40,.94), rgba(11,11,15,.93));
            box-shadow: inset 0 1px rgba(255,255,255,.12), 0 28px 80px rgba(0,0,0,.6);
        }
        .sa-settings-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
        .sa-settings-head h2 { margin: 0; font-size: 24px; letter-spacing: -.025em; }
        .sa-close { width: 36px; height: 36px; border: 0; border-radius: 50%; color: #fff; background: rgba(255,255,255,.08); font-size: 22px; cursor: pointer; }
        .sa-section-title { margin: 22px 0 12px; color: rgba(255,255,255,.55); font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
        .sa-modes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .sa-mode { min-height: 62px; padding: 9px 7px; border: 1px solid rgba(255,255,255,.09); border-radius: 14px; color: rgba(255,255,255,.72); background: rgba(255,255,255,.045); font-size: 12px; font-weight: 720; cursor: pointer; }
        .sa-mode:hover { background: rgba(255,255,255,.09); }
        .sa-mode.active { color: #151515; border-color: #fff; background: #fff; }
        .sa-eq { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; padding: 20px 12px 12px; border-radius: 18px; background: rgba(255,255,255,.035); }
        .sa-band { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .sa-band input { width: 96px; accent-color: #ff6680; transform: rotate(-90deg); margin: 38px 0; }
        .sa-band output { color: rgba(255,255,255,.65); font-size: 11px; }
        .sa-band label { color: rgba(255,255,255,.82); font-size: 11px; font-weight: 720; }
        #sunoapp-audio-status { margin-top: 14px; min-height: 18px; color: rgba(255,255,255,.48); font-size: 12px; }
        .sa-option-row { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 14px 15px; border: 1px solid rgba(255,255,255,.08); border-radius: 16px; background: rgba(255,255,255,.035); }
        .sa-option-copy strong { display: block; margin-bottom: 3px; font-size: 14px; }
        .sa-option-copy span { color: rgba(255,255,255,.48); font-size: 12px; }
        .sa-switch { position: relative; width: 48px; height: 28px; flex: 0 0 auto; }
        .sa-switch input { position: absolute; opacity: 0; pointer-events: none; }
        .sa-switch span { position: absolute; inset: 0; border-radius: 99px; background: rgba(255,255,255,.16); box-shadow: inset 0 1px 3px rgba(0,0,0,.35); cursor: pointer; transition: .2s; }
        .sa-switch span::after { content: ''; position: absolute; top: 4px; left: 4px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 2px 7px rgba(0,0,0,.4); transition: .2s; }
        .sa-switch input:checked + span { background: linear-gradient(135deg, #ff4d72, #ff744d); }
        .sa-switch input:checked + span::after { transform: translateX(20px); }
        #sunoapp-waveform { display: none; position: relative; width: 100%; max-width: none; height: 34px; box-sizing: border-box; margin: 5px 0 3px; padding: 4px 9px; overflow: hidden; pointer-events: none; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; background: linear-gradient(135deg, rgba(255,255,255,.075), rgba(255,255,255,.025)); box-shadow: inset 0 1px rgba(255,255,255,.11), inset 0 -1px rgba(0,0,0,.2), 0 5px 18px rgba(0,0,0,.16); backdrop-filter: blur(18px) saturate(145%); opacity: 0; transform: translateY(2px); transition: opacity .25s, transform .25s, border-color .25s; }
        #sunoapp-waveform.visible { opacity: 1; transform: none; }
        #sunoapp-waveform.visible { border-color: rgba(255,112,137,.25); }
        #sunoapp-waveform.attached { display: block; }
        #sunoapp-waveform canvas { display: block; width: 100%; height: 100%; }
        .sunoapp-source-row-hidden { position: relative !important; }
        .sunoapp-source-row-hidden > *:not(#sunoapp-now-card) { visibility: visible !important; opacity: 0 !important; pointer-events: none !important; }
        #sunoapp-now-card { --sa-accent-1: #ff5474; --sa-accent-2: #ff8a5c; position: fixed !important; inset: auto !important; z-index: 2147483645; display: none; grid-template-columns: 76px 150px minmax(300px,1fr) 44px; align-items: center; gap: 14px; box-sizing: border-box; margin: 0; padding: 9px 12px; border: 1px solid color-mix(in srgb, var(--sa-accent-1) 32%, rgba(255,255,255,.08)); border-radius: 17px; color: #fff; background: radial-gradient(circle at 7% 28%, color-mix(in srgb, var(--sa-accent-1) 16%, transparent), transparent 27%), radial-gradient(circle at 60% 100%, color-mix(in srgb, var(--sa-accent-2) 9%, transparent), transparent 38%), linear-gradient(145deg, rgba(27,28,35,.97), rgba(12,13,17,.96)); box-shadow: inset 0 1px rgba(255,255,255,.08), 0 10px 28px rgba(0,0,0,.3); backdrop-filter: blur(24px) saturate(155%); transition: border-color .45s, background .45s; pointer-events: auto; }
        .sa-now-cover-wrap { position: relative; width: 70px; height: 70px; }
        .sa-now-cover { width: 70px; height: 70px; border-radius: 13px; object-fit: cover; box-shadow: 0 0 0 1px color-mix(in srgb, var(--sa-accent-1) 70%, white), 0 0 19px color-mix(in srgb, var(--sa-accent-1) 30%, transparent); transition: box-shadow .45s, filter .2s; }
        .sa-now-cover-play { position: absolute; inset: 50% auto auto 50%; display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border: 1px solid rgba(255,255,255,.22); border-radius: 50%; color: #111; background: rgba(255,255,255,.94); box-shadow: 0 6px 16px rgba(0,0,0,.35); opacity: 0; transform: translate(-50%,-50%) scale(.84); transition: opacity .18s, transform .18s; cursor: pointer; }
        .sa-now-cover-wrap:hover .sa-now-cover { filter: brightness(.68); }
        .sa-now-cover-wrap:hover .sa-now-cover-play { opacity: 1; transform: translate(-50%,-50%) scale(1); }
        .sa-now-cover-play svg { width: 17px; height: 17px; fill: currentColor; }
        .sa-now-copy { min-width: 0; }
        .sa-now-title { overflow: hidden; color: #fff; font-size: 16px; font-weight: 800; letter-spacing: -.02em; text-overflow: ellipsis; white-space: nowrap; }
        .sa-now-style { display: inline-block; max-width: 100%; margin-top: 7px; padding: 3px 7px; overflow: hidden; border: 1px solid rgba(255,255,255,.07); border-radius: 7px; color: rgba(255,255,255,.58); background: rgba(255,255,255,.055); font-size: 9px; text-overflow: ellipsis; white-space: nowrap; }
        .sa-now-main { min-width: 0; }
        .sa-now-wave { min-height: 42px; padding: 2px 7px 0; border: 1px solid rgba(255,255,255,.09); border-radius: 12px; background: rgba(5,6,9,.28); box-shadow: inset 0 1px rgba(255,255,255,.045); }
        .sa-now-wave #sunoapp-waveform { display: block; width: 100% !important; height: 26px; margin: 0; padding: 1px; border: 0; border-radius: 0; background: transparent; box-shadow: none; backdrop-filter: none; }
        .sa-now-times { display: flex; justify-content: space-between; margin: -1px 4px 3px; color: rgba(255,255,255,.7); font-size: 11px; }
        .sa-now-actions { display: flex; align-items: center; gap: 8px; min-height: 32px; margin-top: 5px; }
        .sa-now-action.remix { display: inline-grid !important; }
        .sa-now-action { display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 1px solid rgba(255,255,255,.09); border-radius: 50%; color: rgba(255,255,255,.76); background: rgba(255,255,255,.045); cursor: pointer; }
        .sa-now-action:hover { color: #fff; background: rgba(255,255,255,.1); }
        .sa-now-action.sunoapp-native-shortcut { display: grid !important; position: static !important; min-width: 26px !important; min-height: 26px !important; margin: 0 !important; padding: 0 !important; transform: none !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; }
        .sa-now-action.primary { width: 31px; height: 31px; border: 0; color: #fff; background: linear-gradient(135deg,#ff4779,#ff884d); box-shadow: 0 6px 15px rgba(255,76,112,.22); font-size: 13px; }
        .sa-now-action.remix { display: inline-flex !important; align-items: center; justify-content: center; width: auto !important; height: 30px !important; padding: 0 12px !important; border-radius: 15px !important; gap: 7px; font-size: 11px; font-weight: 750; letter-spacing: .01em; }
        .sa-now-action svg, .sa-now-more svg { display: block; width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        .sa-now-action.remix svg { width: 15px; height: 15px; color: var(--sa-accent-2); }
        .sa-now-action.sunoapp-native-shortcut svg { fill: currentColor !important; stroke: none !important; }
        .sunoapp-native-hit-target { visibility: visible !important; pointer-events: auto !important; z-index: 2147483645 !important; }
        .sa-now-more { align-self: center; justify-self: center; display: inline-flex !important; position: static !important; align-items: center; justify-content: center; width: 42px !important; height: 42px !important; min-width: 42px !important; min-height: 42px !important; margin: 0 !important; padding: 0 !important; border: 1px solid rgba(255,255,255,.1); border-radius: 50% !important; color: #fff; background: rgba(255,255,255,.035); font-size: 18px; line-height: 1; transform: none !important; opacity: 1 !important; visibility: visible !important; pointer-events: auto !important; cursor: pointer; }
        .sa-now-more svg { display: block; flex: 0 0 18px; width: 18px; height: 18px; margin: 0; }
        .sa-now-more:hover, .sa-now-more[aria-expanded="true"] { border-color: rgba(255,255,255,.2); background: rgba(255,255,255,.085); }
        #sunoapp-custom-track-menu { position: fixed; z-index: 2147483646; width: 238px; max-height: min(650px, calc(100vh - 50px)); overflow: auto; padding: 7px; border: 1px solid rgba(255,255,255,.1); border-radius: 15px; color: #f3f3f5; background: rgba(22,24,30,.98); box-shadow: 0 24px 60px rgba(0,0,0,.58), inset 0 1px rgba(255,255,255,.04); backdrop-filter: blur(22px); }
        #sunoapp-custom-track-menu[hidden] { display: none; }
        .sa-track-menu-group { padding: 4px 0; }
        .sa-track-menu-group + .sa-track-menu-group { border-top: 1px solid rgba(255,255,255,.075); }
        .sa-track-menu-item { display: grid; grid-template-columns: 22px 1fr 16px; align-items: center; gap: 9px; width: 100%; min-height: 38px; padding: 7px 9px; border: 0; border-radius: 9px; color: inherit; background: transparent; font-size: 13px; font-weight: 620; text-align: left; cursor: pointer; }
        .sa-track-menu-item:hover { background: rgba(255,255,255,.075); }
        .sa-track-menu-item svg { width: 18px; height: 18px; fill: currentColor; }
        .sa-track-menu-item .chevron { width: 14px; height: 14px; color: #8f9199; }
        .sa-track-menu-item.danger { color: #ff7181; }
        #sunoapp-now-card.sunoapp-now-overlay { display: grid; }
        .sunoapp-centered-song-menu { position: fixed !important; transform: none !important; margin: 0 !important; z-index: 2147483646 !important; }
        @media (max-width: 1250px) { #sunoapp-now-card { grid-template-columns: 62px 112px minmax(220px,1fr) 38px; gap: 9px; padding: 7px 9px; } .sa-now-cover { width: 58px; height: 58px; } .sa-now-title { font-size: 14px; } }
        .sunoapp-bounded-fullscreen { top: 38px !important; bottom: 0 !important; height: calc(100vh - 38px) !important; max-height: calc(100vh - 38px) !important; }
        @media (max-width: 850px) {
            #sunoapp-top-menu { left: 14px; top: 86px; }
            .sa-modes { grid-template-columns: repeat(2, 1fr); }
        }
    `;
    document.head.appendChild(style);

    document.body.classList.add('sunoapp-frameless');
    const favicon = document.querySelector('link[rel*="icon"]')?.href || '';
    const titlebar = document.createElement('header');
    titlebar.id = 'sunoapp-titlebar';
    titlebar.innerHTML = `
        <div class="sa-title-brand">${favicon ? `<img src="${favicon}" alt="">` : ''}<span>SunoApp</span></div>
        <div class="sa-title-center">Suno • Lecteur musical</div>
        <div class="sa-window-controls">
            <button class="sa-window-button" data-window-action="window-minimize" aria-label="Réduire" title="Réduire">
                <svg viewBox="0 0 16 16"><path d="M3 8.5h10"/></svg>
            </button>
            <button class="sa-window-button" data-window-action="window-maximize" aria-label="Agrandir ou restaurer" title="Agrandir ou restaurer">
                <svg viewBox="0 0 16 16"><rect x="3" y="3" width="10" height="10" rx="1"/></svg>
            </button>
            <button class="sa-window-button close" data-window-action="window-close" aria-label="Fermer" title="Fermer">
                <svg viewBox="0 0 16 16"><path d="m3.5 3.5 9 9M12.5 3.5l-9 9"/></svg>
            </button>
        </div>
    `;
    titlebar.querySelectorAll('[data-window-action]').forEach((button) => {
        button.addEventListener('click', () => window.open(`sunoapp://${button.dataset.windowAction}`, '_blank'));
    });
    document.body.appendChild(titlebar);

    const refreshPageMode = () => {
        const isStudio = /^\/(studio|create)(?:\/|$)/i.test(location.pathname);
        document.body.classList.toggle('sunoapp-studio', isStudio);
        const candidates = Array.from(document.body.children)
            .filter((element) => !element.id?.startsWith('sunoapp-') && element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE');
        candidates.forEach((element) => {
            element.classList.toggle('sunoapp-studio-root', isStudio);
            element.style.removeProperty('--sunoapp-studio-scale-y');
        });
        const title = document.querySelector('.sa-title-center');
        if (title) title.textContent = isStudio ? 'Suno • Création' : 'Suno • Lecteur musical';
    };

    refreshPageMode();
    window.__sunoAppPageModeTimer = setInterval(refreshPageMode, 700);

    const menu = document.createElement('div');
    menu.id = 'sunoapp-top-menu';
    menu.innerHTML = `
        <button class="sa-glass-button" id="sunoapp-menu-button" aria-label="Menu SunoApp" title="Menu SunoApp">
            <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>
        </button>
        <div id="sunoapp-menu-popover">
            <button class="sa-menu-item" id="sunoapp-open-settings">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>
                Paramètres
            </button>
            <button class="sa-menu-item" id="sunoapp-open-mini">
                <svg viewBox="0 0 24 24"><rect x="3" y="4" width="15" height="12" rx="2"/><rect x="12" y="12" width="9" height="8" rx="2"/></svg>
                Mini-lecteur
            </button>
        </div>
    `;
    document.body.appendChild(menu);
