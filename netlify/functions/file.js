const fs = require('fs');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const respond = (status, body, headers = {}) => ({
    statusCode: status,
    headers,
    body
});

const FALLBACK_DIR = path.join(__dirname, 'uploads');
const STORE_NAME = process.env.DATA_STORE_NAME || 'tbfa-data';

const detectType = (type, key) => {
    if (type) return type;
    const ext = path.extname(key || '').toLowerCase();
    const map = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg'
    };
    return map[ext] || 'application/octet-stream';
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return respond(405, JSON.stringify({ error: 'Method not allowed' }), { 'Content-Type': 'application/json' });
    }
    const key = event.queryStringParameters?.key ? decodeURIComponent(event.queryStringParameters.key) : '';
    if (!key) {
        return respond(400, JSON.stringify({ error: 'Missing key' }), { 'Content-Type': 'application/json' });
    }
    const fileNameParam = event.queryStringParameters?.name ? decodeURIComponent(event.queryStringParameters.name) : '';
    const downloadName = path.basename(fileNameParam) || path.basename(key) || 'download';
    const typeParam = event.queryStringParameters?.type
        ? decodeURIComponent(event.queryStringParameters.type).replace(/[\r\n]/g, '')
        : '';
    const contentType = detectType(typeParam, key);

    const store = (() => {
        try {
            return getStore({ name: STORE_NAME });
        } catch {
            return null;
        }
    })();

    let buffer;
    try {
        if (store) {
            const arr = await store.get(key, { type: 'arrayBuffer' });
            if (!arr) throw new Error('Not found');
            buffer = Buffer.from(arr);
        } else {
            const filePath = path.join(FALLBACK_DIR, key);
            if (!fs.existsSync(filePath)) throw new Error('Not found');
            buffer = fs.readFileSync(filePath);
        }
    } catch (err) {
        console.error('Download failed', err);
        return respond(404, JSON.stringify({ error: 'File not found' }), { 'Content-Type': 'application/json' });
    }

    return {
        statusCode: 200,
        headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
    };
};
