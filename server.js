'use strict';
// Zero-dependency server: Node's built-in http module only.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { policies } = require('./engine/policies');
const { validate } = require('./engine/validator');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, { 'Content-Type': type + '; charset=utf-8' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'GET' && url.pathname === '/api/policies') return send(res, 200, policies);

  if (req.method === 'POST' && url.pathname === '/api/validate') {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 100000) req.destroy(); });
    req.on('end', () => {
      let plan;
      try { plan = JSON.parse(raw); } catch { return send(res, 400, { ok: false, problems: ['Body is not valid JSON.'] }); }
      const result = validate(plan);
      send(res, result.ok ? 200 : 400, result);
    });
    return;
  }

  if (req.method === 'GET') { // static files, blocked from leaving /public
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const file = path.join(PUBLIC, path.normalize(rel));
    if (!file.startsWith(PUBLIC)) return send(res, 403, 'Forbidden', 'text/plain');
    return fs.readFile(file, (err, data) =>
      err ? send(res, 404, 'Not found', 'text/plain') : send(res, 200, data, TYPES[path.extname(file)] || 'text/plain'));
  }
  send(res, 405, { ok: false, problems: ['Method not allowed.'] });
});

if (require.main === module) server.listen(PORT, () => console.log(`Diet policy engine: http://localhost:${PORT}`));
module.exports = server;
