const test = require('node:test');
const assert = require('node:assert/strict');
const language = require('../sunoapp-site-language');

test('all 14 native languages have a localized Suno home URL', () => {
    assert.equal(Object.keys(language.languages).length, 14);
    for (const locale of Object.keys(language.languages)) {
        const expected = locale === 'en' ? 'https://suno.com/' : 'https://suno.com/' + locale.toLowerCase();
        assert.equal(language.targetUrl('https://suno.com/', locale), expected);
    }
});

test('changing native language preserves private app routes and parameters', () => {
    for (const route of ['/home', '/create?draft=123#lyrics', '/studio/project-123?track=4', '/library', '/song/a-song']) {
        const current = 'https://suno.com' + route;
        assert.equal(language.targetUrl(current, 'fr'), current);
    }
    assert.equal(language.targetUrl('https://suno.com/ja/voices?ref=x#demo', 'pt-BR'), 'https://suno.com/pt-br/voices?ref=x#demo');
    assert.equal(language.targetUrl('https://suno.com/fr?ref=x', 'auto'), 'https://suno.com/?ref=x');
});

test('unsupported locales and external destinations are rejected', () => {
    for (const locale of ['zh', 'xx', 'fr;Path=/secret', '__proto__']) assert.throws(() => language.targetUrl('https://suno.com/', locale));
    for (const url of ['https://suno.com.evil.test/', 'http://suno.com/', 'https://user@suno.com/', 'file:///test']) assert.throws(() => language.targetUrl(url, 'fr'));
});

test('only the native language cookie selects a language', () => {
    assert.equal(language.readPreference('session=secret; i18next=pt-BR; other=value'), 'pt-BR');
    assert.equal(language.readPreference('i18next=%XX'), 'auto');
    assert.equal(language.readPreference('i18next=xx'), 'auto');
    assert.equal(language.readPreference('sunoapp-lang=fr'), 'auto');
});
