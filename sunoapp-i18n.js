const fs = require('fs');
const path = require('path');
const parts = ['sunoapp-i18n-1.js', 'sunoapp-i18n-2.js', 'sunoapp-i18n-3.js', 'sunoapp-i18n-4.js', 'sunoapp-i18n-5.js', 'sunoapp-i18n-6.js', 'sunoapp-i18n-7.js', 'sunoapp-i18n-8.js', 'sunoapp-i18n-9.js', 'sunoapp-i18n-10.js', 'sunoapp-i18n-11.js', 'sunoapp-i18n-12.js', 'sunoapp-i18n-13.js'];
const source = parts.map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('');
const m = { exports: {} };
new Function('module', 'exports', source)(m, m.exports);
module.exports = m.exports;
