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
        body.sunoapp-frameless.sunoapp-studio { height: 100vh !important; min-height: 0 !important; overflow: hidden !important; }
        body.sunoapp-studio > .sunoapp-studio-root {
            height: calc(100vh - 38px) !important;
            min-height: 0 !important;
            max-height: calc(100vh - 38px) !important;
            overflow: hidden !important;
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
        #sunoapp-now-card { --sa-accent-1: #ff5474; --sa-accent-2: #ff8a5c; position: absolute; inset: 2px 8px 2px 0; z-index: 5; display: grid; grid-template-columns: 76px 150px minmax(300px,1fr) 44px; align-items: center; gap: 14px; box-sizing: border-box; margin: 0; padding: 9px 12px; border: 1px solid color-mix(in srgb, var(--sa-accent-1) 32%, rgba(255,255,255,.08)); border-radius: 17px; color: #fff; background: radial-gradient(circle at 7% 28%, color-mix(in srgb, var(--sa-accent-1) 16%, transparent), transparent 27%), radial-gradient(circle at 60% 100%, color-mix(in srgb, var(--sa-accent-2) 9%, transparent), transparent 38%), linear-gradient(145deg, rgba(27,28,35,.97), rgba(12,13,17,.96)); box-shadow: inset 0 1px rgba(255,255,255,.08), 0 10px 28px rgba(0,0,0,.3); backdrop-filter: blur(24px) saturate(155%); transition: border-color .45s, background .45s; }
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
        #sunoapp-now-card { inset: 2px 0; }
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
        const isStudio = /^\/studio(?:\/|$)/i.test(location.pathname);
        document.body.classList.toggle('sunoapp-studio', isStudio);
        Array.from(document.body.children)
            .filter((element) => !element.id?.startsWith('sunoapp-') && element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE')
            .forEach((element) => element.classList.toggle('sunoapp-studio-root', isStudio));
        const title = document.querySelector('.sa-title-center');
        if (title) title.textContent = isStudio ? 'Suno • Studio' : 'Suno • Lecteur musical';
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

    const overlay = document.createElement('div');
    overlay.id = 'sunoapp-settings-overlay';
    overlay.innerHTML = `
        <section class="sa-settings-card">
            <header class="sa-settings-head"><h2>Paramètres SunoApp</h2><button class="sa-close" id="sunoapp-close-settings">×</button></header>
            <div class="sa-section-title">Qualité et mode sonore</div>
            <div class="sa-modes">
                <button class="sa-mode" data-mode="flat">Neutre</button>
                <button class="sa-mode" data-mode="bass">Basses</button>
                <button class="sa-mode" data-mode="vocal">Voix</button>
                <button class="sa-mode" data-mode="clarity">Clarté</button>
                <button class="sa-mode" data-mode="immersive">Immersif</button>
                <button class="sa-mode" data-mode="cinema51">Cinéma 5.1 virtuel</button>
                <button class="sa-mode" data-mode="surround71">Surround 7.1 virtuel</button>
                <button class="sa-mode" data-mode="atmos">Atmos virtuel</button>
            </div>
            <div class="sa-section-title">Égaliseur</div>
            <div class="sa-eq">
                ${frequencies.map((frequency, index) => `
                    <div class="sa-band">
                        <output id="sa-gain-${index}">0 dB</output>
                        <input type="range" min="-12" max="12" step="1" value="0" data-band="${index}" aria-label="${frequency} Hz">
                        <label>${frequency >= 1000 ? (frequency / 1000) + 'k' : frequency} Hz</label>
                    </div>
                `).join('')}
            </div>
            <div class="sa-section-title">Affichage du lecteur</div>
            <div class="sa-option-row">
                <div class="sa-option-copy"><strong>Forme d'onde audio</strong><span>Affiche la musique et sa progression sous le morceau.</span></div>
                <label class="sa-switch" title="Afficher la forme d'onde"><input id="sunoapp-waveform-toggle" type="checkbox" ${state.waveformEnabled ? 'checked' : ''}><span></span></label>
            </div>
            <div class="sa-option-row" style="margin-top:8px">
                <div class="sa-option-copy"><strong>Lecteur personnalisé</strong><span>Active la carte colorée avec pochette, ondes et commandes Suno.</span></div>
                <label class="sa-switch" title="Activer le lecteur personnalisé"><input id="sunoapp-custom-player-toggle" type="checkbox" ${state.customPlayerEnabled ? 'checked' : ''}><span></span></label>
            </div>
            <div id="sunoapp-audio-status">Sélectionnez un mode pour activer le traitement audio.</div>
        </section>
    `;
    document.body.appendChild(overlay);

    const popover = document.getElementById('sunoapp-menu-popover');
    document.getElementById('sunoapp-menu-button').addEventListener('click', () => popover.classList.toggle('open'));
    document.getElementById('sunoapp-open-settings').addEventListener('click', () => {
        popover.classList.remove('open');
        overlay.classList.add('open');
    });
    document.getElementById('sunoapp-close-settings').addEventListener('click', () => overlay.classList.remove('open'));
    document.getElementById('sunoapp-open-mini').addEventListener('click', () => window.open('sunoapp://mini', '_blank'));

    const status = document.getElementById('sunoapp-audio-status');
    const sliders = Array.from(document.querySelectorAll('.sa-band input'));

    const waveform = document.createElement('div');
    waveform.id = 'sunoapp-waveform';
    waveform.innerHTML = '<canvas aria-label="Forme d\'onde de la musique"></canvas>';
    document.body.appendChild(waveform);
    const waveformCanvas = waveform.querySelector('canvas');
    const waveformContext = waveformCanvas.getContext('2d');

    const nowCard = document.createElement('section');
    nowCard.id = 'sunoapp-now-card';
    nowCard.innerHTML = `
        <div class="sa-now-cover-wrap"><img class="sa-now-cover" alt="Pochette du morceau"><button class="sa-now-cover-play" title="Lecture ou pause"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7Z"/></svg></button></div>
        <div class="sa-now-copy"><div class="sa-now-title">Morceau en lecture</div><div class="sa-now-style">Suno</div></div>
        <div class="sa-now-main">
            <div class="sa-now-wave"><div class="sa-now-wave-host"></div><div class="sa-now-times"><span class="sa-now-current">0:00</span><span class="sa-now-duration">0:00</span></div></div>
            <div class="sa-now-actions">
                <button class="sa-now-action" data-now-action="like" title="J'aime"></button>
                <button class="sa-now-action" data-now-action="dislike" title="Je n'aime pas"></button>
                <button class="sa-now-action" data-now-action="pin" title="Épingler"></button>
                <button class="sa-now-action" data-now-action="share" title="Partager"></button>
                <button class="sa-now-action remix" data-now-action="remix" title="Remix"></button>
            </div>
        </div>
        <button class="sa-now-more" title="Plus d'options" aria-haspopup="menu" aria-expanded="false"><svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none"/></svg></button>
    `;
    const menuIcon = (path) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>`;
    const chevron = '<svg class="chevron" viewBox="0 0 24 24"><path d="M9 7.343c0-.89 1.077-1.337 1.707-.707l4.657 4.657a1 1 0 0 1 0 1.414l-4.657 4.657c-.63.63-1.707.184-1.707-.707z"></path></svg>';
    const customTrackMenu = document.createElement('div');
    customTrackMenu.id = 'sunoapp-custom-track-menu';
    customTrackMenu.setAttribute('role', 'menu');
    customTrackMenu.hidden = true;
    customTrackMenu.innerHTML = `
        <div class="sa-track-menu-group">
            <button class="sa-track-menu-item" data-action="remix">${menuIcon('M3.2 14.17a1 1 0 0 1 1.23-.7l2.89.8a1 1 0 0 1-.53 1.93l-.49-.14A7 7 0 0 0 18 15.59c.21-.35.58-.59.98-.59.73 0 1.24.72.89 1.36A9 9 0 0 1 4.5 16.98l-.17.62a1 1 0 0 1-1.93-.54zM12 3a9 9 0 0 1 7.86 4.62l.22-.52a1 1 0 0 1 1.84.79l-1.18 2.76a1 1 0 0 1-1.31.52l-2.76-1.18a1 1 0 0 1 .79-1.84l.53.23A7 7 0 0 0 5.99 8.41c-.21.35-.57.59-.98.59-.73 0-1.23-.72-.88-1.36A9 9 0 0 1 12 3') }<span>Remix</span>${chevron}</button>
            <button class="sa-track-menu-item" data-action="edit">${menuIcon('M4.89 20A.89.89 0 0 1 4 19.11v-2.52c0-.24.09-.46.26-.63L15.73 4.51q.27-.25.59-.38Q16.64 4 17 4t.69.13q.33.14.58.4l1.22 1.25q.27.24.39.58a1.93 1.93 0 0 1 0 1.34 1.7 1.7 0 0 1-.39.59L8.04 19.74a.9.9 0 0 1-.63.26z') }<span>Edit</span>${chevron}</button>
        </div>
        <div class="sa-track-menu-group">
            <button class="sa-track-menu-item" data-action="publish">${menuIcon('M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20m0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16') }<span>Publish</span><span></span></button>
            <button class="sa-track-menu-item" data-action="share">${menuIcon('M13 4.04c0-.95 1.17-1.4 1.81-.69l6.91 7.67c.35.4.35 1 0 1.39l-6.91 7.68c-.64.7-1.81.25-1.81-.7v-3.52c-3.76 0-6.46 1.63-8.73 3.35-.67.51-1.63.08-1.57-.76C3.22 11.02 9.18 7.5 13 7.5z') }<span>Share</span>${chevron}</button>
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
        if (!state.waveformEnabled || !state.customPlayerEnabled) {
            state.activeTrackRow?.classList.remove('sunoapp-source-row-hidden');
            nowCard.remove();
            waveform.classList.remove('attached', 'visible');
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
            source.style.removeProperty('transform');
            const sourceRect = source.getBoundingClientRect();
            const targetRect = target.getBoundingClientRect();
            source.style.setProperty('transform', `translate(${targetRect.left - sourceRect.left}px, ${targetRect.top - sourceRect.top}px)`, 'important');
            source.style.setProperty('pointer-events', 'auto', 'important');
            source.style.setProperty('visibility', 'visible', 'important');
        });
        const moreTarget = nowCard.querySelector('.sa-now-more');
        if (moreButton?.isConnected && moreTarget !== moreButton) {
            moreButton.classList.add('sa-now-more', 'sunoapp-native-shortcut');
            moreButton.setAttribute('title', "Plus d'options");
            moreTarget?.remove();
            nowCard.appendChild(moreButton);
        }
        if (nowCard.parentElement !== activeRow) activeRow.appendChild(nowCard);
        activeRow.classList.add('sunoapp-source-row-hidden');
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
            nowCard.remove();
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
