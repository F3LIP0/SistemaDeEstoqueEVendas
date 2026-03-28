const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const API_TARGET = process.env.API_TARGET || 'http://localhost:3000';
const filePath = path.join(__dirname, 'sistema.html');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Proxy básico para a API do backend
  if (req.url.startsWith('/api')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const options = {
      method: req.method,
      headers: { ...req.headers, host: new URL(API_TARGET).host },
    };

    const proxyReq = http.request(`${API_TARGET}${url.pathname}${url.search}`, options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ erro: 'Proxy error', mensagem: err.message }));
    });

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
    return;
  }

  // Servir arquivos estáticos locais (ex.: /assets/logo.png)
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname || '/');
  const normalizedPath = path.normalize(pathname).replace(/^\/+/, '');
  const staticPath = path.join(__dirname, normalizedPath);
  if (normalizedPath && staticPath.startsWith(__dirname) && fs.existsSync(staticPath) && fs.statSync(staticPath).isFile()) {
    const ext = path.extname(staticPath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    fs.readFile(staticPath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ erro: 'Erro ao ler arquivo estático' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': mime });
      res.end(data);
    });
    return;
  }

  // Se a rota parece um arquivo estático e não existe, retorna 404 em vez de HTML
  if (normalizedPath && /\.[a-z0-9]+$/i.test(normalizedPath)) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ erro: 'Arquivo não encontrado', caminho: normalizedPath }));
    return;
  }

  // Servir sistema.html para demais rotas
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Arquivo não encontrado: ' + filePath);
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n🚀 Frontend rodando em http://localhost:${PORT}`);
  console.log(`🔁 Proxy de API ativo: /api -> ${API_TARGET}`);
});
