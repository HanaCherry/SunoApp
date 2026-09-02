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
        customPlayerEnabled: localStorage.getItem('sunoapp-custom-player-enabled') !== 'false',
        uiTheme: localStorage.getItem('sunoapp-ui-theme') || 'nuit'
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
        :root, body.sunoapp-frameless {
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
        body[data-sunoapp-theme="clair"] {
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
        body[data-sunoapp-theme="cherry"] {
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
        body[data-sunoapp-theme="aurore"] {
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
        .sa-themes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
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

        body.sunoapp-frameless { box-sizing: border-box !important; padding-top: 38px !important; }
        body.sunoapp-frameless.sunoapp-studio {
            padding-top: 0 !important;
            overflow: hidden !important;
            height: 100dvh !important;
            max-height: 100dvh !important;
            background: var(--sa-bg, #0b0c10) !important;
        }
        body.sunoapp-studio > .sunoapp-studio-root {
            position: fixed !important;
            top: 38px !important;
            right: 0 !important;
            bottom: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: none !important;
            min-height: 0 !important;
            overflow: hidden !important;
            transform: none !important;
        }
        body.sunoapp-studio > .sunoapp-studio-root > * {
            box-sizing: border-box !important;
            height: 100% !important;
            max-height: 100% !important;
            min-height: 100% !important;
        }
        body.sunoapp-studio .h-screen,
        body.sunoapp-studio .min-h-screen,
        body.sunoapp-studio [class*="h-[100vh]"],
        body.sunoapp-studio [class*="h-[100dvh]"],
        body.sunoapp-studio [class*="min-h-[100vh]"],
        body.sunoapp-studio [class*="min-h-[100dvh]"] {
            height: 100% !important;
            min-height: 100% !important;
            max-height: 100% !important;
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
            border: 1px solid var(--sa-border, rgba(255,255,255,.14)); border-radius: 26px;
            color: var(--sa-text, #fff); background: var(--sa-card, linear-gradient(145deg, rgba(34,34,40,.94), rgba(11,11,15,.93)));
            box-shadow: inset 0 1px rgba(255,255,255,.12), 0 28px 80px rgba(0,0,0,.6);
        }
        .sa-settings-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
        .sa-settings-head h2 { margin: 0; font-size: 24px; letter-spacing: -.025em; }
        .sa-close { width: 36px; height: 36px; border: 0; border-radius: 50%; color: var(--sa-text, #fff); background: var(--sa-btn, rgba(255,255,255,.08)); font-size: 22px; cursor: pointer; }
        .sa-section-title { margin: 22px 0 12px; color: var(--sa-muted, rgba(255,255,255,.55)); font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
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
