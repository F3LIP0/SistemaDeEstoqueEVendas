const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const API_TARGET = process.env.API_TARGET || 'http://localhost:3000';
const filePath = path.join(__dirname, 'sistema.html');

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
