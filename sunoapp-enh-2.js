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

        .sunoapp-bounded-fullscreen { top: 38px !important; right: 0 !important; bottom: 0 !important; left: 0 !important; height: auto !important; max-height: none !important; }
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

    let mountSidebarTools = () => {};

    const refreshPageMode = () => {
        const isStudio = /^\/(studio|create)(?:\/|$)/i.test(location.pathname);
        document.body.classList.toggle('sunoapp-studio', isStudio);
        document.documentElement.classList.toggle('sunoapp-studio', isStudio);
        const candidates = Array.from(document.body.children)
            .filter((element) => !element.id?.startsWith('sunoapp-') && element.tagName !== 'SCRIPT' && element.tagName !== 'STYLE');
        candidates.forEach((element) => {
            element.classList.toggle('sunoapp-studio-root', isStudio);
            element.style.removeProperty('--sunoapp-studio-scale-y');
            if (!isStudio) {
                element.style.removeProperty('height');
                element.style.removeProperty('max-height');
                element.style.removeProperty('min-height');
                element.style.removeProperty('overflow');
            }
        });
        const title = document.querySelector('.sa-title-center');
        if (title) title.textContent = isStudio ? 'Suno • Création' : 'Suno • Lecteur musical';
        mountSidebarTools();
    };

    refreshPageMode();
    window.__sunoAppPageModeTimer = setInterval(refreshPageMode, 700);

    const menu = document.createElement('div');
    menu.id = 'sunoapp-top-menu';
    menu.innerHTML = `
        <button class="sa-glass-button" id="sunoapp-menu-button" aria-label="Menu SunoApp" title="Menu SunoApp">
            <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>
