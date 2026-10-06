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
        customPlayerEnabled: localStorage.getItem('sunoapp-custom-player-layout-v2') === 'true',
        uiTheme: localStorage.getItem('sunoapp-ui-theme') || 'nuit'
    };

    const i18n = window.__SUNO_I18N || { dict: { en: {}, fr: {} }, resolve: () => 'en', t: (k) => k };
    const t = (key, vars) => i18n.t(key, vars);
    window.__sunoT = t;

    const frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
    const presets = {
        flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        bass: [7, 6, 4, 2, 0, -1, -1, 0, 0, 0],
        vocal: [-2, -1, 0, 1, 2, 4, 5, 3, 1, -1],
        clarity: [-1, -1, 0, 0, 1, 2, 3, 5, 6, 4],
        immersive: [3, 2, 1, 0, -1, 1, 2, 3, 4, 5],
        cinema51: [5, 4, 2, 0, -2, 1, 3, 4, 3, 2],
        surround71: [4, 2, 0, -1, -1, 2, 3, 5, 6, 5],
        atmos: [3, 1, -1, -2, 0, 2, 3, 5, 6, 7],
        studio: [0, 0, 0, 0, 0, 0, 1, 1, 0, 0],
        warm: [3, 3, 2, 1, 0, 0, -1, -2, -3, -2],
        punch: [4, 5, 3, 0, -1, 0, 2, 3, 1, 0],
        air: [-1, 0, 0, 0, 0, 1, 2, 3, 6, 7],
        lofi: [4, 2, 0, -2, -3, -2, 0, 3, -4, -8],
        vinyl: [2, 1, 0, -1, 0, 1, 0, -1, 2, -3],
        club: [6, 5, 3, 0, -2, 0, 1, 2, 1, 0],
        acoustic: [1, 0, -1, 0, 2, 3, 2, 1, 3, 2],
        electronic: [5, 3, 1, -1, 0, 1, 2, 4, 5, 4],
        orchestral: [2, 1, 0, 1, 2, 3, 2, 3, 4, 3],
        night: [1, 1, 0, 0, -1, -1, -2, -3, -4, -3],
        wide: [1, 0, 0, 0, 0, 1, 2, 3, 3, 2],
        radio: [-6, -2, 1, 3, 4, 4, 3, 2, 0, -4],
        presence: [-1, 0, 0, 0, 1, 3, 5, 4, 2, 0]
    };
    const spatialMix = { flat: 0, bass: .02, vocal: .02, clarity: .03, immersive: .12, cinema51: .16, surround71: .2, atmos: .26, custom: .04, studio: 0, warm: .03, punch: .04, air: .05, lofi: .08, vinyl: .1, club: .08, acoustic: .06, electronic: .1, orchestral: .12, night: .02, wide: .2, radio: .03, presence: .04 };
    const haasDelay = { flat: 0, bass: 0, vocal: 0, clarity: 0, immersive: .00045, cinema51: .00075, surround71: .00105, atmos: .0014, custom: .0002, studio: 0, warm: .00015, punch: .0002, air: .00025, lofi: .0004, vinyl: .00035, club: .0003, acoustic: .00025, electronic: .0004, orchestral: .0005, night: 0, wide: .00125, radio: 0, presence: .00015 };

    const style = document.createElement('style');
    style.id = 'sunoapp-enhancements-style';
    style.textContent = `
        #sunoapp-settings-overlay {
            --sa-bg: #0b0c10;
            --sa-titlebar: rgba(16,18,23,.96);
            --sa-text: rgba(255,255,255,.88);
            --sa-muted: rgba(255,255,255,.42);
            --sa-accent: #ff5474;
            --sa-accent-2: #ff8a5c;
            --sa-border: rgba(255,255,255,.08);
            --sa-surface: rgba(18,18,22,.92);
            --sa-card: linear-gradient(145deg, rgba(34,34,40,.96), rgba(11,11,15,.94));
            --sa-btn: rgba(255,255,255,.08);
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="clair"], #sunoapp-settings-overlay[data-sunoapp-theme="clair"] {
            --sa-bg: #f3f1ec;
            --sa-titlebar: rgba(255,252,248,.96);
            --sa-text: rgba(28,24,22,.92);
            --sa-muted: rgba(28,24,22,.48);
            --sa-accent: #d9486e;
            --sa-accent-2: #e07a4a;
            --sa-border: rgba(40,32,28,.12);
            --sa-surface: rgba(255,255,255,.96);
            --sa-card: linear-gradient(145deg, #fff, #f6f1ea);
            --sa-btn: rgba(28,24,22,.07);
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="cherry"], #sunoapp-settings-overlay[data-sunoapp-theme="cherry"] {
            --sa-bg: #1a0d14;
            --sa-titlebar: rgba(42,14,28,.96);
            --sa-text: rgba(255,232,240,.94);
            --sa-muted: rgba(255,186,210,.55);
            --sa-accent: #ff4f86;
            --sa-accent-2: #ff9ac2;
            --sa-border: rgba(255,120,160,.18);
            --sa-surface: rgba(48,16,32,.94);
            --sa-card: linear-gradient(145deg, rgba(64,18,40,.96), rgba(22,8,16,.94));
            --sa-btn: rgba(255,120,160,.12);
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="aurore"], #sunoapp-settings-overlay[data-sunoapp-theme="aurore"] {
            --sa-bg: #07141a;
            --sa-titlebar: rgba(8,28,36,.96);
            --sa-text: rgba(230,248,250,.94);
            --sa-muted: rgba(140,210,214,.55);
            --sa-accent: #3ec6c9;
            --sa-accent-2: #f0c36a;
            --sa-border: rgba(80,200,190,.16);
            --sa-surface: rgba(10,36,44,.94);
            --sa-card: linear-gradient(145deg, rgba(12,48,56,.96), rgba(8,22,28,.94));
            --sa-btn: rgba(62,198,201,.12);
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="glass"], #sunoapp-settings-overlay[data-sunoapp-theme="glass"] {
            --sa-bg: #12141a;
            --sa-titlebar: rgba(255,255,255,.14);
            --sa-text: rgba(255,255,255,.94);
            --sa-muted: rgba(255,255,255,.5);
            --sa-accent: #7eb8ff;
            --sa-accent-2: #e8eef8;
            --sa-border: rgba(255,255,255,.22);
            --sa-surface: rgba(255,255,255,.12);
            --sa-card: linear-gradient(160deg, rgba(255,255,255,.2), rgba(255,255,255,.06));
            --sa-btn: rgba(255,255,255,.12);
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="aero"], #sunoapp-settings-overlay[data-sunoapp-theme="aero"] {
            --sa-bg: #0a2a4a;
            --sa-titlebar: rgba(120,190,255,.28);
            --sa-text: rgba(245,252,255,.96);
            --sa-muted: rgba(180,220,255,.62);
            --sa-accent: #5ec8ff;
            --sa-accent-2: #ffffff;
            --sa-border: rgba(180,230,255,.35);
            --sa-surface: rgba(40,120,200,.32);
            --sa-card: linear-gradient(180deg, rgba(200,230,255,.35), rgba(20,70,140,.45));
            --sa-btn: rgba(160,210,255,.18);
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="musique"], #sunoapp-settings-overlay[data-sunoapp-theme="musique"] {
            --sa-bg: #0c0c10;
            --sa-titlebar: rgba(20,20,24,.8);
            --sa-text: rgba(255,255,255,.94);
            --sa-muted: rgba(255,255,255,.5);
            --sa-accent: #ff5474;
            --sa-accent-2: #ff8a5c;
            --sa-border: rgba(255,255,255,.14);
            --sa-surface: rgba(24,24,28,.82);
            --sa-card: linear-gradient(145deg, rgba(40,40,48,.9), rgba(12,12,16,.92));
            --sa-btn: rgba(255,255,255,.1);
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="galaxy"], #sunoapp-settings-overlay[data-sunoapp-theme="galaxy"] {
            --sa-bg: #070513;
            --sa-titlebar: rgba(24, 16, 48, .92);
            --sa-text: #f4f6fb;
            --sa-muted: #aab1c4;
            --sa-accent: #c9bcff;
            --sa-accent-2: #ff9ac8;
            --sa-border: rgba(213, 201, 255, .16);
            --sa-surface: rgba(18, 14, 40, .94);
            --sa-card: linear-gradient(145deg, rgba(56, 32, 121, .55), rgba(7, 5, 19, .94));
            --sa-btn: rgba(134, 112, 239, .16);
        }
        .sa-themes { display: grid; grid-template-columns: repeat(auto-fill, minmax(108px, 1fr)); gap: 8px; }
        .sa-theme {
            min-height: 64px; padding: 10px 8px 8px; border: 1px solid var(--sa-border);
            border-radius: 14px; color: var(--sa-text); background: var(--sa-btn);
            font-size: 12px; font-weight: 720; cursor: pointer; text-align: left;
        }
        .sa-theme:hover { filter: brightness(1.08); }
        .sa-theme.active { border-color: var(--sa-accent); box-shadow: inset 0 0 0 1px var(--sa-accent); }
        .sa-theme::before {
            content: ''; display: block; width: 100%; height: 18px; margin-bottom: 8px;
            border-radius: 8px;
        }
        .sa-theme[data-theme="nuit"]::before { background: linear-gradient(90deg, #0b0c10, #ff5474); }
        .sa-theme[data-theme="clair"]::before { background: linear-gradient(90deg, #f3f1ec, #d9486e); }
        .sa-theme[data-theme="cherry"]::before { background: linear-gradient(90deg, #1a0d14, #ff4f86 55%, #ff9ac2); }
        .sa-theme[data-theme="aurore"]::before { background: linear-gradient(90deg, #07141a, #3ec6c9 55%, #f0c36a); }
        .sa-theme[data-theme="glass"]::before { background: linear-gradient(90deg, rgba(255,255,255,.55), #7eb8ff 60%, rgba(255,255,255,.2)); }
        .sa-theme[data-theme="aero"]::before { background: linear-gradient(90deg, #7ec8ff, #1a5aa8 55%, #eaf6ff); }
        .sa-theme[data-theme="musique"]::before { background: linear-gradient(90deg, #ff5474, #8a5cff, #3ec6c9, #f0c36a); }
        .sa-theme[data-theme="galaxy"]::before { background: linear-gradient(90deg, #070513, #382079 40%, #8670ef 70%, #ff9ac8); }


        #sunoapp-settings-overlay[data-sunoapp-theme="glass"] #sunoapp-titlebar,
        #sunoapp-settings-overlay[data-sunoapp-theme="musique"] #sunoapp-titlebar {
            background: var(--sa-titlebar) !important;
            backdrop-filter: blur(28px) saturate(180%) !important;
            border-bottom: 1px solid var(--sa-border) !important;
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="aero"] #sunoapp-titlebar {
            background: linear-gradient(180deg, rgba(220,240,255,.45), rgba(40,110,190,.38)) !important;
            backdrop-filter: blur(16px) saturate(170%) !important;
            border-bottom: 1px solid rgba(255,255,255,.35) !important;
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="galaxy"] #sunoapp-titlebar {
            background: rgba(16, 12, 32, .9) !important;
            backdrop-filter: blur(16px) saturate(150%) !important;
            border-bottom: 1px solid rgba(201, 188, 255, .16) !important;
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="galaxy"] .sa-settings-card {
            background: linear-gradient(160deg, rgba(56, 32, 121, .55), rgba(12, 8, 28, .94)) !important;
            backdrop-filter: blur(28px) saturate(160%) !important;
            border: 1px solid rgba(201, 188, 255, .2) !important;
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="galaxy"] #sunoapp-rail-tools .sa-rail-item:hover,
        #sunoapp-settings-overlay[data-sunoapp-theme="galaxy"] #sunoapp-rail-tools .sa-rail-item.active {
            background: rgba(134, 112, 239, .22);
            border: 1px solid rgba(201, 188, 255, .28);
        }
        #sunoapp-galaxy-sky {
            position: fixed; inset: 0; z-index: 8; pointer-events: none; overflow: hidden;
            background: transparent;
        }
        #sunoapp-galaxy-sky * { pointer-events: none; }
        #sunoapp-galaxy-sky .sa-gb-nebula { transition: background-color 2.4s ease; }
        #sunoapp-galaxy-sky[data-mode] .sa-gb-nebula.n1 { background-color: var(--sky-first, #6b2cff); }
        #sunoapp-galaxy-sky[data-mode] .sa-gb-nebula.n3 { background-color: var(--sky-second, #c43dff); }
        #sunoapp-galaxy-sky[data-mode="musique"] .sa-gb-nebula.n2 { background-color: var(--sky-second, #ff8a5c); }
        #sunoapp-galaxy-sky[data-mode="musique"] .sa-gb-stars i {
            background-color: var(--sky-first, #ff5474) !important;
            box-shadow: 0 0 7px var(--sky-second, #ff8a5c);
            transition: background-color 2.4s ease, box-shadow 2.4s ease;
            animation: none !important;
            width: calc(12px * var(--sunoapp-star-scale, 1)) !important;
            height: calc(14px * var(--sunoapp-star-scale, 1)) !important;
            border-radius: 0;
            mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M50 0C58 36 64 42 100 50C64 58 58 64 50 100C42 64 36 58 0 50C36 42 42 36 50 0Z'/%3E%3C/svg%3E") center / contain no-repeat;
            transform: translate3d(var(--star-x, 0px), var(--star-y, 0px), 0);
        }
        #sunoapp-galaxy-sky[data-mode="musique"] .sa-gb-stars i:nth-child(3n) { animation-duration: 25s !important; }
        #sunoapp-galaxy-sky[data-mode="musique"] .sa-gb-stars i:nth-child(3n + 1) { animation-duration: 12s !important; }
        #sunoapp-galaxy-sky[data-mode="musique"] .sa-gb-stars { opacity: var(--music-star-glow, .55); }
        @keyframes saMusicRain {
            0% { transform: translate3d(-8vw, -100vh, 0) scale(.7); opacity: 0; }
            10%, 85% { opacity: .9; }
            100% { transform: translate3d(8vw, 100vh, 0) scale(1.3); opacity: 0; }
        }
        #sunoapp-galaxy-sky[data-mode="musique"] .sa-gb-petals,
        #sunoapp-galaxy-sky[data-mode="musique"] .sa-gb-shoot { display: none; }
        #sunoapp-galaxy-sky[data-mode="musique"] .sa-gb-nebula { animation: none; }
        html[data-sunoapp-palette="musique"] body,
        html[data-sunoapp-palette="musique"] :is(.bg-background-primary, .bg-background-base, .bg-background-secondary, .bg-background-tertiary) {
            transition: background-color 2.4s ease, border-color 2.4s ease;
        }
        @media (prefers-reduced-motion: reduce) {
            #sunoapp-galaxy-sky * { animation: none !important; transition: none !important; }
            html[data-sunoapp-palette="musique"] body,
            html[data-sunoapp-palette="musique"] :is(.bg-background-primary, .bg-background-base, .bg-background-secondary, .bg-background-tertiary) { transition: none; }
        }
        #sunoapp-galaxy-sky .sa-gb-nebula {
            position: absolute; border-radius: 50%; filter: blur(72px); opacity: .18;
            animation: saGbNebula 28s ease-in-out infinite alternate;
        }
        #sunoapp-galaxy-sky .sa-gb-nebula.n1 { width: 460px; height: 460px; left: -90px; top: 8%; background: #6b2cff; }
        #sunoapp-galaxy-sky .sa-gb-nebula.n2 { width: 540px; height: 380px; right: -130px; top: 38%; background: #2a4dff; animation-duration: 36s; }
        #sunoapp-galaxy-sky .sa-gb-nebula.n3 { width: 400px; height: 400px; left: 32%; bottom: -150px; background: #c43dff; animation-duration: 22s; }
        #sunoapp-galaxy-sky .sa-gb-stars i {
            position: absolute; border-radius: 50%; background: #fff;
            box-shadow: 0 0 6px #fff;
            animation: saGbTwinkle 2.8s ease-in-out infinite;
        }
        #sunoapp-galaxy-sky .sa-gb-shoot {
            position: absolute; top: 16%; left: -12%; width: 120px; height: 1px;
            background: linear-gradient(90deg, transparent, #fff, #c9bcff);
            opacity: 0;
            animation: saGbShoot 8s linear infinite;
        }
        #sunoapp-galaxy-sky .sa-gb-petals i {
            position: absolute; top: -16px; width: 8px; height: 8px;
            background: radial-gradient(circle at 30% 30%, #ffd0e6, #ff7eb0 70%);
            border-radius: 0 70% 0 70%; opacity: .22;
            animation: saGbPetal linear infinite;
        }
        @keyframes saGbNebula {
            from { transform: translate(0, 0) scale(1); }
            to { transform: translate(40px, -28px) scale(1.1); }
        }
        @keyframes saGbTwinkle {
            0%, 100% { opacity: .15; transform: scale(0.6); }
            50% { opacity: 1; transform: scale(1.25); }
        }
        @keyframes saGbShoot {
            0%, 74% { opacity: 0; transform: rotate(18deg) translate(0, 0); }
            80% { opacity: .85; }
            100% { opacity: 0; transform: rotate(18deg) translate(130vw, 38vh); }
        }
        @keyframes saGbPetal {
            0% { transform: translate3d(0, -10px, 0) rotate(0deg); opacity: 0; }
            14% { opacity: .28; }
            100% { transform: translate3d(36px, 110vh, 0) rotate(220deg); opacity: 0; }
        }
        #sunoapp-settings-overlay[data-sunoapp-theme="glass"] .sa-settings-card,
        #sunoapp-settings-overlay[data-sunoapp-theme="aero"] .sa-settings-card,
        #sunoapp-settings-overlay[data-sunoapp-theme="musique"] .sa-settings-card {
            background: var(--sa-card) !important;
            backdrop-filter: blur(32px) saturate(170%) !important;
            border: 1px solid var(--sa-border) !important;
        }
        #sunoapp-top-menu { display: none !important; }
        #sunoapp-settings-overlay[data-sunoapp-theme="glass"] #sunoapp-rail-tools .sa-rail-item:hover,
        #sunoapp-settings-overlay[data-sunoapp-theme="glass"] #sunoapp-rail-tools .sa-rail-item.active,
        #sunoapp-settings-overlay[data-sunoapp-theme="aero"] #sunoapp-rail-tools .sa-rail-item:hover,
        #sunoapp-settings-overlay[data-sunoapp-theme="aero"] #sunoapp-rail-tools .sa-rail-item.active {
            background: rgba(255,255,255,.12);
            border: 1px solid rgba(255,255,255,.16);
            backdrop-filter: blur(18px) saturate(160%);
        }
        body.sunoapp-studio #sunoapp-titlebar {
            background: var(--sa-titlebar, #101217) !important;
            color: var(--sa-text, rgba(255,255,255,.88)) !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            border-bottom: 1px solid var(--sa-border, rgba(255,255,255,.06)) !important;
        }
        body.sunoapp-studio .sa-title-center { color: var(--sa-muted, rgba(255,255,255,.42)); letter-spacing: .12em; text-transform: uppercase; font-size: 10px; font-weight: 650; }
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
            border: 1px solid var(--sa-border, rgba(255,255,255,.08)) !important;
            background: var(--sa-surface, rgba(16,18,23,.96)) !important;
            backdrop-filter: blur(18px) saturate(140%) !important;
        }
        #sunoapp-titlebar {
            position: fixed; inset: 0 0 auto 0; z-index: 2147483647;
            display: grid; grid-template-columns: 220px 1fr 138px; align-items: center; height: 38px;
            border-bottom: 1px solid var(--sa-border, rgba(255,255,255,.08));
            color: var(--sa-text, rgba(255,255,255,.88)); background: var(--sa-titlebar, rgba(15,15,19,.88));
            box-shadow: inset 0 1px rgba(255,255,255,.045); backdrop-filter: blur(24px) saturate(160%);
            -webkit-app-region: drag;
        }
        .sa-title-brand { display: flex; align-items: center; gap: 9px; padding-left: 12px; font-size: 12px; font-weight: 720; }
        .sa-title-brand img { width: 21px; height: 21px; border-radius: 50%; object-fit: cover; }
        .sa-title-center { color: var(--sa-muted, rgba(255,255,255,.28)); font-size: 11px; text-align: center; }
        .sa-window-controls { display: grid; grid-template-columns: repeat(3, 46px); height: 100%; -webkit-app-region: no-drag; }
        .sa-window-button {
            display: grid; place-items: center; width: 46px; height: 38px; padding: 0; border: 0;
            color: var(--sa-text, rgba(255,255,255,.72)); background: transparent; cursor: pointer;
        }
        .sa-window-button:hover { color: var(--sa-text, #fff); background: var(--sa-btn, rgba(255,255,255,.09)); }
        .sa-window-button.close:hover { background: #c42b3b; }
        .sa-window-button svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1.4; }
        #sunoapp-top-menu, #sunoapp-settings-overlay { font-family: Inter, "SF Pro Display", "Segoe UI", sans-serif; }
        #sunoapp-top-menu {
            position: fixed; top: 3px; left: 112px; z-index: 2147483647; -webkit-app-region: no-drag;
        }
        .sa-glass-button {
            display: grid; place-items: center; width: 32px; height: 32px; padding: 0;
            border: 1px solid var(--sa-border, rgba(255,255,255,.11)); border-radius: 10px;
            color: var(--sa-text, rgba(255,255,255,.86)); background: var(--sa-surface, rgba(25,25,30,.72));
            box-shadow: inset 0 1px rgba(255,255,255,.1), 0 8px 24px rgba(0,0,0,.28);
            backdrop-filter: blur(22px) saturate(160%); cursor: pointer;
        }
        .sa-glass-button:hover { color: #fff; background: rgba(42,42,48,.82); }
        .sa-glass-button svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
        #sunoapp-menu-popover {
            position: absolute; top: 38px; left: 0; display: none; width: 214px; padding: 8px;
            border: 1px solid var(--sa-border, rgba(255,255,255,.13)); border-radius: 17px;
            background: var(--sa-surface, rgba(18,18,22,.88)); box-shadow: 0 20px 48px rgba(0,0,0,.48);
            backdrop-filter: blur(30px) saturate(170%);
        }
        #sunoapp-menu-popover.open { display: block; }
        .sa-menu-item {
            display: flex; align-items: center; gap: 11px; width: 100%; padding: 11px 12px;
            border: 0; border-radius: 11px; color: var(--sa-text, #fff); background: transparent;
            font-size: 14px; font-weight: 650; text-align: left; cursor: pointer;
        }
        .sa-menu-item:hover { background: rgba(255,255,255,.09); }
        .sa-menu-item svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; }

        #sunoapp-rail-tools {
            position: fixed; z-index: 2147483645; display: flex; flex-direction: column; gap: 0;
            box-sizing: border-box; padding: 0; overflow: visible;
            color: var(--sa-text, rgba(255,255,255,.86));
            font-family: Inter, "SF Pro Display", "Segoe UI", sans-serif;
            pointer-events: auto;
        }
        #sunoapp-rail-tools .sa-rail-label {
            margin: 8px 8px 3px; color: var(--sa-muted, rgba(255,255,255,.4));
            font-size: 10px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase;
        }
        #sunoapp-rail-tools .sa-rail-item {
            display: flex; align-items: center; gap: 12px; width: 100%; min-height: 40px;
            padding: 8px 16px; border: 0; border-radius: 999px;
            color: inherit; background: transparent; font-size: 14px; font-weight: 620;
            text-align: left; cursor: pointer;
        }
        #sunoapp-rail-tools .sa-rail-item:hover { background: rgba(255,255,255,.10); }
        #sunoapp-rail-tools .sa-rail-item.active { background: rgba(255,255,255,.10); }
        #sunoapp-rail-tools .sa-rail-item svg { width: 18px; height: 18px; flex: 0 0 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
        #sunoapp-rail-tools .sa-rail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
        #sunoapp-rail-tools .sa-rail-grid .sa-rail-item { min-height: 30px; padding: 5px 8px; font-size: 12px; justify-content: center; }
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
