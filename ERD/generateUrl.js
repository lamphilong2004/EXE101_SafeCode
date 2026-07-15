const fs = require('fs');
const zlib = require('zlib');
const code = fs.readFileSync('schema.mmd', 'utf8');
const state = JSON.stringify({ code, mermaid: '{"theme": "default"}' });
const deflated = zlib.deflateSync(state).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
console.log('https://mermaid.live/edit#pako:' + deflated);
