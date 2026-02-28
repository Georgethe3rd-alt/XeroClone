const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8090;
const API_BASE = 'http://187.77.217.138:3001';

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
    // Proxy /api/* to the backend
    if (req.url.startsWith('/api/')) {
        const apiPath = req.url.replace('/api/', '/');
        const apiUrl = API_BASE + apiPath;

        http.get(apiUrl, (apiRes) => {
            res.writeHead(apiRes.statusCode, {
                'Content-Type': apiRes.headers['content-type'] || 'application/json',
                'Access-Control-Allow-Origin': '*',
            });
            apiRes.pipe(res);
        }).on('error', (err) => {
            res.writeHead(502);
            res.end(JSON.stringify({ error: 'API unreachable' }));
        });
        return;
    }

    // Serve static files
    let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
    const ext = path.extname(filePath);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, () => console.log(`LOOPVYBZ landing on :${PORT}`));
