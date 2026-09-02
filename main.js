const fs = require('fs');
const path = require('path');
const parts = ['sunoapp-main-a.js', 'sunoapp-main-b.js'];
const source = parts.map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('');
module._compile(source, path.join(__dirname, 'sunoapp-main.js'));
