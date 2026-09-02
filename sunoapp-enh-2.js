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

    const fitStudioPane = () => {
        const pane = document.querySelector('body.sunoapp-studio > .sunoapp-studio-root');
        if (!pane) return;
        const height = Math.max(0, Math.round(pane.getBoundingClientRect().height));
        if (!height) return;
        const child = pane.firstElementChild;
        if (child) {
            child.style.boxSizing = 'border-box';
            child.style.height = height + 'px';
            child.style.maxHeight = height + 'px';
            child.style.minHeight = '0';
            child.style.overflow = 'auto';
        }
    };

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
        if (isStudio) requestAnimationFrame(fitStudioPane);
    };

    refreshPageMode();
    window.__sunoAppPageModeTimer = setInterval(refreshPageMode, 700);
    window.addEventListener('resize', fitStudioPane);

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
                <div class="sa-option-copy"><strong>Lecteur personnalisé</strong><span>Carte overlay sur le morceau en cours, sans modifier la liste virtualisée de Suno.</span></div>
                <label class="sa-switch" title="Afficher le lecteur personnalisé"><input id="sunoapp-custom-player-toggle" type="checkbox" ${state.customPlayerEnabled ? 'checked' : ''}><span></span></label>
            </div>
            <div class="sa-section-title">Thème de l'interface</div>
            <div class="sa-themes">
                <button class="sa-theme" type="button" data-theme="nuit">Nuit</button>
                <button class="sa-theme" type="button" data-theme="clair">Clair</button>
                <button class="sa-theme" type="button" data-theme="cherry">Cherry</button>
