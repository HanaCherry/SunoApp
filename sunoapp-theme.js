// Use Suno's semantic color tokens. Never move, resize, invert or hide its DOM.
(() => {
    const palettes = {
        nuit: ['#0b0c10', '#14161d', '#222530', '#f4f4f8', '#bdc1cf', '#454b60', '#ff7892'],
        clair: ['#f3f1ec', '#ffffff', '#e7e3dd', '#211e25', '#57515e', '#aaa2af', '#a4234c'],
        cherry: ['#1a0d14', '#301020', '#482039', '#ffe8f0', '#e5b7ca', '#835068', '#ff91b6'],
        aurore: ['#07141a', '#0a242c', '#123a43', '#e6f8fa', '#aed7db', '#42767b', '#72dce0'],
        glass: ['#12141a', '#232936', '#333d4e', '#f0f5ff', '#c0cbdf', '#62748b', '#a0caff'],
        aero: ['#09182b', '#102b47', '#1d4267', '#eef8ff', '#b9d6ed', '#52799d', '#88ccff'],
        musique: ['#171019', '#2b1725', '#412337', '#fff0f8', '#dec0d2', '#855871', '#ff9ac2'],
        galaxy: ['#10091f', '#201339', '#332050', '#f4f1ff', '#c5b8df', '#755998', '#d1b8ff']
    };
    const apply = (requested, accents) => {
        const theme = Object.hasOwn(palettes, requested) ? requested : 'nuit';
        const [base, secondary, tertiary, text, muted, border, accent] = palettes[theme];
        const light = theme === 'clair';
        const tokens = {
            'background-base': base, 'background-primary': base,
            'background-secondary': secondary, 'background-tertiary': tertiary,
            'background-button-primary': accent, 'foreground-button-primary': light ? '#ffffff' : '#15111d',
            'background-button-secondary': tertiary, 'foreground-button-secondary': text,
            'background-button-tertiary': secondary, 'foreground-button-tertiary': text,
            'background-button-inactive': tertiary, 'foreground-button-inactive': muted,
            'foreground-primary': text, 'foreground-secondary': muted, 'foreground-tertiary': muted,
            'foreground-inactive': muted, 'border-primary': border, 'border-secondary': border,
            'border-focus': accent, 'accent-primary': accent, 'accent-primary-contrast': light ? '#ffffff' : '#15111d',
            'accent-brand': accent, 'accent-brand-on-primary': accent,
            'accent-brand-contrast': light ? '#ffffff' : '#15111d'
        };
        for (const level of ['primary', 'secondary', 'tertiary']) {
            tokens[`background-${level}-glass`] = tokens[`background-${level}`];
            tokens[`foreground-${level}-glass`] = tokens[`foreground-${level}`];
            tokens[`foreground-${level}-translucent`] = tokens[`foreground-${level}`];
        }
        if (theme === 'musique' && accents && accents.every(color => CSS.supports('color', color))) {
            tokens['background-base'] = tokens['background-primary'] = `color-mix(in srgb, ${accents[0]} 12%, #100b14)`;
            tokens['background-secondary'] = `color-mix(in srgb, ${accents[0]} 20%, #100b14)`;
            tokens['background-tertiary'] = `color-mix(in srgb, ${accents[1]} 25%, #100b14)`;
            tokens['border-primary'] = tokens['border-secondary'] = `color-mix(in srgb, ${accents[1]} 55%, #100b14)`;
        }
        let style = document.getElementById('sunoapp-native-theme');
        if (!style) { style = document.createElement('style'); style.id = 'sunoapp-native-theme'; document.head.appendChild(style); }
        const scope = 'html[data-sunoapp-palette]';
        const background = theme === 'galaxy'
            ? 'radial-gradient(circle at 15% 20%, #d1b8ff88 0 1px, transparent 2px), radial-gradient(circle at 72% 64%, #ffffff66 0 1px, transparent 2px), radial-gradient(ellipse at 12% 0%, #44217266, transparent 65%)'
            : theme === 'glass' || theme === 'aero' ? 'linear-gradient(135deg, #96cfff16, transparent 60%)' : 'none';
        style.textContent = `${scope}, ${scope} body, ${scope} [data-theme] {
            ${Object.entries(tokens).map(([key, value]) => `--color-${key}: ${value};`).join('\n')}
        }
        ${scope}, ${scope} body { color-scheme: ${light ? 'light' : 'dark'}; color: ${text}; background-color: ${tokens['background-base']}; }
        ${scope} body, ${scope} .bg-background-primary, ${scope} .bg-background-base {
            background-image: ${background}; background-size: ${theme === 'galaxy' ? '173px 137px, 251px 199px, 100% 100%' : 'auto'};
        }`;
        document.documentElement.dataset.sunoappPalette = theme;
        const sky = document.getElementById('sunoapp-galaxy-sky');
        if (sky) {
            sky.dataset.mode = theme;
            const colors = theme === 'musique' && accents?.length === 2 && accents.every(color => CSS.supports('color', color))
                ? accents : ['#6b2cff', '#c43dff'];
            sky.style.setProperty('--sky-first', colors[0]);
            sky.style.setProperty('--sky-second', colors[1]);
        }
    };
    window.__SUNO_APP_THEME = { apply };
})();
