// Native locales published by suno.com (checked 2026-10-06).
// This changes Suno's own preference; it does not translate or rewrite page text.
(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (typeof window !== 'undefined') root.__SUNO_SITE_LANGUAGE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const languages = Object.freeze({
        en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', hi: 'हिन्दी',
        id: 'Bahasa Indonesia', ja: '日本語', ko: '한국어', 'pt-BR': 'Português (Brasil)',
        'pt-PT': 'Português (Portugal)', ru: 'Русский', tr: 'Türkçe', vi: 'Tiếng Việt', th: 'ไทย'
    });
    const marketingPaths = new Set(['/', '/studio-welcome', '/voices', '/stem-separation', '/remix-welcome', '/custom-models', '/v6']);
    const supported = locale => typeof locale === 'string' && Object.hasOwn(languages, locale);
    const readPreference = cookie => {
        for (const part of String(cookie || '').split(';')) {
            const [name, ...rest] = part.trim().split('=');
            if (name !== 'i18next') continue;
            try { const locale = decodeURIComponent(rest.join('=')); if (supported(locale)) return locale; } catch {}
        }
        return 'auto';
    };
    const targetUrl = (current, locale) => {
        if (locale !== 'auto' && !supported(locale)) throw new Error('Unsupported Suno locale');
        const url = new URL(current);
        if (url.protocol !== 'https:' || !['suno.com', 'www.suno.com'].includes(url.hostname)
            || url.port || url.username || url.password) throw new Error('Not a Suno page');
        const segments = url.pathname.split('/').filter(Boolean);
        const prefix = Object.keys(languages).find(code => code.toLowerCase() === segments[0]?.toLowerCase());
        const unprefixed = prefix ? '/' + segments.slice(1).join('/') : url.pathname.replace(/\/$/, '') || '/';
        // Only marketing routes are prefixed by Suno. Preserve song IDs, Studio,
        // creation drafts, library routes, query strings and fragments verbatim.
        if (marketingPaths.has(unprefixed)) {
            url.pathname = (locale !== 'auto' && locale !== 'en' ? '/' + locale.toLowerCase() : '')
                + (unprefixed === '/' ? '' : unprefixed) || '/';
        }
        return url.href;
    };
    const labels = {
        en: { appLanguage: 'SunoApp language', sunoLanguage: 'Suno language', sunoLanguageAuto: 'Suno default', sunoLanguageHelp: 'Uses the languages provided by Suno. Some pages may remain in English. Your page will reload when you apply.', sunoLanguageApply: 'Apply and reload Suno', sunoLanguageError: 'Unable to save the language. Please try again.' },
        fr: { appLanguage: 'Langue de SunoApp', sunoLanguage: 'Langue de Suno', sunoLanguageAuto: 'Par défaut de Suno', sunoLanguageHelp: 'Utilise les langues proposées par Suno. Certaines pages peuvent rester en anglais. La page sera rechargée à l’application du choix.', sunoLanguageApply: 'Appliquer et recharger Suno', sunoLanguageError: 'Impossible d’enregistrer la langue. Réessaie.' }
    };
    const mount = (document, location, i18n) => {
        for (const [locale, values] of Object.entries(labels)) Object.assign(i18n.dict[locale] || (i18n.dict[locale] = {}), values);
        const select = document.getElementById('sunoapp-site-lang');
        const button = document.getElementById('sunoapp-site-lang-apply');
        const error = document.getElementById('sunoapp-site-lang-error');
        if (!select || !button) return;
        const add = (value, label, key) => {
            const option = document.createElement('option'); option.value = value; option.textContent = label;
            if (key) option.setAttribute('data-i18n', key);
            select.appendChild(option);
        };
        add('auto', i18n.t('sunoLanguageAuto'), 'sunoLanguageAuto');
        Object.entries(languages).forEach(([code, name]) => add(code, name));
        select.value = readPreference(document.cookie);
        button.addEventListener('click', () => {
            try {
                const locale = select.value;
                const destination = targetUrl(location.href, locale);
                const suffix = '; Path=/; SameSite=Lax; Secure';
                // Clear both normal cookie scopes to avoid conflicting old preferences.
                document.cookie = 'i18next=; Max-Age=0' + suffix;
                document.cookie = 'i18next=; Max-Age=0; Domain=suno.com' + suffix;
                if (locale !== 'auto') document.cookie = 'i18next=' + encodeURIComponent(locale) + '; Max-Age=31536000' + suffix;
                if (readPreference(document.cookie) !== locale) throw new Error('Cookie not saved');
                if (destination === location.href) location.reload();
                else location.assign(destination);
            } catch { error.textContent = i18n.t('sunoLanguageError'); }
        });
    };
    return { languages, supported, readPreference, targetUrl, mount };
});
