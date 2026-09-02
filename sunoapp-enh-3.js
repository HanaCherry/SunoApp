        </button>
        <div id="sunoapp-menu-popover">
            <button class="sa-menu-item" id="sunoapp-open-settings" data-i18n="settings">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>
                Paramètres
            </button>
            <button class="sa-menu-item" id="sunoapp-open-mini" data-i18n="miniPlayer">
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
            <header class="sa-settings-head"><h2 data-i18n="settingsTitle">Paramètres SunoApp</h2><button class="sa-close" id="sunoapp-close-settings" data-i18n="close" data-i18n-attr="aria-label">×</button></header>
            <div class="sa-about">
                <div class="sa-about-studio" data-i18n="studioName">GalaxyBunny Studio</div>
                <p class="sa-about-unofficial" data-i18n="unofficial">Ceci n’est pas l’application officielle de Suno.</p>
                <p data-i18n="unaffiliated">GalaxyBunny Studio n’est pas affilié à Suno, ne travaille pas avec Suno et n’est pas approuvé par Suno.</p>
                <p data-i18n="madeBy">Créé de façon indépendante par GalaxyBunny Studio.</p>
            </div>
            <div class="sa-section-title" data-i18n="language">Langue</div>
            <select id="sunoapp-lang" aria-label="Language"></select>
            <div class="sa-section-title" data-i18n="soundQuality">Qualité et mode sonore</div>
            <div class="sa-modes">
                <button class="sa-mode" data-mode="flat" data-i18n="modeFlat">Neutre</button>
                <button class="sa-mode" data-mode="bass" data-i18n="modeBass">Basses</button>
                <button class="sa-mode" data-mode="vocal" data-i18n="modeVocal">Voix</button>
                <button class="sa-mode" data-mode="clarity" data-i18n="modeClarity">Clarté</button>
                <button class="sa-mode" data-mode="immersive" data-i18n="modeImmersive">Immersif</button>
                <button class="sa-mode" data-mode="cinema51" data-i18n="modeCinema">Scène large</button>
                <button class="sa-mode" data-mode="surround71" data-i18n="modeSurround">Scène 3D</button>
                <button class="sa-mode" data-mode="atmos" data-i18n="modeAtmos">Spatial casque</button>
            </div>
            <div class="sa-section-title" data-i18n="mixStyles">Styles de mix</div>
            <div class="sa-modes">
                <button class="sa-mode" data-mode="studio" data-i18n="modeStudio">Studio</button>
                <button class="sa-mode" data-mode="warm" data-i18n="modeWarm">Chaleureux</button>
                <button class="sa-mode" data-mode="punch" data-i18n="modePunch">Punch</button>
                <button class="sa-mode" data-mode="air" data-i18n="modeAir">Air</button>
                <button class="sa-mode" data-mode="presence" data-i18n="modePresence">Présence</button>
                <button class="sa-mode" data-mode="lofi" data-i18n="modeLofi">Lo-fi</button>
                <button class="sa-mode" data-mode="vinyl" data-i18n="modeVinyl">Vinyl</button>
                <button class="sa-mode" data-mode="club" data-i18n="modeClub">Club</button>
                <button class="sa-mode" data-mode="acoustic" data-i18n="modeAcoustic">Acoustique</button>
                <button class="sa-mode" data-mode="electronic" data-i18n="modeElectronic">Électro</button>
                <button class="sa-mode" data-mode="orchestral" data-i18n="modeOrchestral">Orchestre</button>
                <button class="sa-mode" data-mode="night" data-i18n="modeNight">Nuit douce</button>
                <button class="sa-mode" data-mode="wide" data-i18n="modeWide">Largeur</button>
                <button class="sa-mode" data-mode="radio" data-i18n="modeRadio">Radio</button>
            </div>
            <p class="sa-eq-note" data-i18n="eqNote">Les modes Spatial / Scène / Largeur sont une simulation stéréo pour casque. Ce n’est pas du Dolby Atmos officiel.</p>
            <div class="sa-section-title" data-i18n="eq10">Égaliseur 10 bandes</div>
            <div class="sa-eq">
                ${frequencies.map((frequency, index) => `
                    <div class="sa-band">
                        <output id="sa-gain-${index}">0 dB</output>
                        <input type="range" min="-15" max="15" step="0.5" value="0" data-band="${index}" aria-label="${frequency} Hz">
                        <label>${frequency >= 1000 ? (frequency / 1000) + 'k' : frequency}</label>
                    </div>
                `).join('')}
            </div>
            <div class="sa-preamp">
                <strong data-i18n="preamp">Préampli</strong>
                <input id="sunoapp-preamp" type="range" min="-12" max="12" step="0.5" value="0" aria-label="Préampli" data-i18n="preamp" data-i18n-attr="aria-label">
                <output id="sunoapp-preamp-out">0 dB</output>
            </div>
            <div class="sa-tools">
                <button type="button" class="sa-ab" id="sunoapp-ab" data-i18n="abProcess">A/B — traiter</button>
            </div>
            <div class="sa-option-row" style="margin-top:10px">
                <div class="sa-option-copy"><strong data-i18n="panTitle">Voix L ↔ R</strong><span data-i18n="panHelp">La voix passe d’une oreille à l’autre, comme si quelqu’un se déplaçait.</span></div>
                <label class="sa-switch" title="Auto-pan" data-i18n="autoPanAria" data-i18n-attr="title"><input id="sunoapp-autopan" type="checkbox"><span></span></label>
            </div>
            <div class="sa-preamp">
                <strong data-i18n="panSpeed">Vitesse L ↔ R</strong>
                <input id="sunoapp-autopan-rate" type="range" min="0.08" max="1.2" step="0.02" value="0.28" aria-label="Vitesse auto-pan" data-i18n="autoPanAria" data-i18n-attr="aria-label">
                <output id="sunoapp-autopan-rate-out">lent</output>
            </div>
            <div class="sa-section-title" data-i18n="space">Espace</div>
            <div class="sa-preamp">
                <strong data-i18n="reverb">Réverbe</strong>
                <input id="sunoapp-reverb" type="range" min="0" max="0.45" step="0.01" value="0" aria-label="Réverbe" data-i18n="reverb" data-i18n-attr="aria-label">
                <output id="sunoapp-reverb-out">off</output>
            </div>
            <div class="sa-preamp">
                <strong data-i18n="echo">Écho</strong>
                <input id="sunoapp-echo" type="range" min="0" max="0.45" step="0.01" value="0" aria-label="Écho" data-i18n="echo" data-i18n-attr="aria-label">
                <output id="sunoapp-echo-out">off</output>
            </div>
            <div class="sa-preamp">
                <strong data-i18n="echoTime">Temps écho</strong>
                <input id="sunoapp-echo-time" type="range" min="0.12" max="0.7" step="0.01" value="0.32" aria-label="Temps écho" data-i18n="echoTimeAria" data-i18n-attr="aria-label">
                <output id="sunoapp-echo-time-out">1/4</output>
            </div>
            <canvas id="sunoapp-spectrum" width="760" height="76" aria-label="Analyseur de spectre" data-i18n="spectrumAria" data-i18n-attr="aria-label"></canvas>
            <div class="sa-section-title" data-i18n="myPresets">Mes presets</div>
            <div class="sa-preset-row">
                <input id="sunoapp-preset-name" type="text" maxlength="32" placeholder="Nom du preset, ex. Flora punch" data-i18n="presetPlaceholder" data-i18n-attr="placeholder">
                <button type="button" id="sunoapp-preset-save" data-i18n="save">Enregistrer</button>
            </div>
            <div id="sunoapp-user-presets"></div>
            <div class="sa-section-title" data-i18n="playerDisplay">Affichage du lecteur</div>
            <div class="sa-tools" style="margin-bottom:10px">
                <button type="button" class="sa-ab" id="sunoapp-settings-mini" data-i18n="miniPlayer">Mini-lecteur</button>
                <button type="button" class="sa-ab" id="sunoapp-settings-spectrum" data-i18n="spectrum">Spectre</button>
            </div>
            <div class="sa-option-row">
                <div class="sa-option-copy"><strong data-i18n="waveformTitle">Forme d'onde audio</strong><span data-i18n="waveformHelp">Affiche la musique et sa progression sous le morceau.</span></div>
                <label class="sa-switch" title="Afficher la forme d'onde"><input id="sunoapp-waveform-toggle" type="checkbox" ${state.waveformEnabled ? 'checked' : ''}><span></span></label>
            </div>
            <div class="sa-option-row" style="margin-top:8px">
                <div class="sa-option-copy"><strong data-i18n="customPlayerTitle">Lecteur personnalisé</strong><span data-i18n="customPlayerHelp">Carte overlay sur le morceau en cours, sans modifier la liste virtualisée de Suno.</span></div>
                <label class="sa-switch" title="Afficher le lecteur personnalisé"><input id="sunoapp-custom-player-toggle" type="checkbox" ${state.customPlayerEnabled ? 'checked' : ''}><span></span></label>
            </div>
            <div class="sa-section-title" data-i18n="uiTheme">Thème de l'interface</div>
            <div class="sa-themes">
                <button class="sa-theme" type="button" data-theme="nuit" data-i18n="themeNuit">Nuit</button>
                <button class="sa-theme" type="button" data-theme="clair" data-i18n="themeClair">Clair</button>
                <button class="sa-theme" type="button" data-theme="cherry" data-i18n="themeCherry">Cherry</button>
                <button class="sa-theme" type="button" data-theme="aurore" data-i18n="themeAurore">Aurore</button>
                <button class="sa-theme" type="button" data-theme="glass" data-i18n="themeGlass">Glass Apple</button>
                <button class="sa-theme" type="button" data-theme="aero" data-i18n="themeAero">Aero</button>
                <button class="sa-theme" type="button" data-theme="musique" data-i18n="themeMusique">Musique</button>
            </div>
            <div id="sunoapp-audio-status" data-i18n="statusPickMode">Sélectionnez un mode pour activer le traitement audio.</div>
        </section>
    `;
    document.body.appendChild(overlay);

    const applyI18n = () => {
        const loc = i18n.resolve();
        document.documentElement.setAttribute('lang', loc);
        overlay.dir = (loc === 'ar' || loc === 'he') ? 'rtl' : 'ltr';
        const fill = (root) => {
            root.querySelectorAll('[data-i18n]').forEach((el) => {
                const attr = el.getAttribute('data-i18n-attr');
                const value = t(el.getAttribute('data-i18n'));
                if (attr) el.setAttribute(attr, value);
                else {
                    const keep = el.querySelector('svg');
                    if (keep) {
                        el.innerHTML = '';
                        el.appendChild(keep);
                        el.appendChild(document.createTextNode(' ' + value));
                    } else el.textContent = value;
                }
            });
        };
        fill(overlay);
