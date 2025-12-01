const http = require('http');
const { createReadStream, statSync, existsSync } = require('fs');
const path = require('path');

// Listen on all interfaces by default so 포트포워딩/외부 접근이 가능
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
    try {
        const urlPath = req.url.split('?')[0];
        const safePath = urlPath === '/' ? '/index.html' : urlPath;
        const filePath = path.join(process.cwd(), decodeURIComponent(safePath));

        if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const mime = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': mime });
        createReadStream(filePath).pipe(res);
    } catch (err) {
        console.error(err);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal server error');
    }
});

server.listen(PORT, HOST, () => {
    const addr = HOST === '0.0.0.0' ? '모든 인터페이스' : HOST;
    console.log(`TBFA-JEJU dev server running on ${addr}:${PORT}`);
});
