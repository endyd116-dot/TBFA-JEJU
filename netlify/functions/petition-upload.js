const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const respond = (status, body) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

const sanitizeName = (name) => {
    const base = path.basename(name || 'file');
    const cleaned = base.replace(/[\\/#?%*:|"<>]/g, '_').trim();
    return cleaned || 'file';
};

const STORE_NAME = process.env.DATA_STORE_NAME || 'tbfa-data';
const FALLBACK_DIR = path.join(__dirname, 'uploads');
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return respond(400, { error: 'Invalid JSON' });
    }

    const { fileName, contentType, data, ownerName } = body || {};
    if (!data || typeof data !== 'string') return respond(400, { error: 'Missing file data' });

    // data may be pure base64 or data URL
    const base64 = data.includes('base64,') ? data.split('base64,').pop() : data.split(',').pop();
    if (!base64) return respond(400, { error: 'Invalid file data' });

    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length > MAX_BYTES) return respond(413, { error: 'File too large (max 5MB)' });

    const nameTag = sanitizeName(ownerName || 'anonymous');
    const safeName = sanitizeName(fileName || 'petition_upload');
    const downloadName = `${nameTag}_${safeName}`;
    const safeType = (contentType || 'application/octet-stream').replace(/[\r\n]/g, '').slice(0, 150);
    const key = `petitions/${nameTag}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${downloadName}`;

    const store = (() => {
        try { return getStore({ name: STORE_NAME }); }
        catch { return null; }
    })();

    try {
        if (store) {
            await store.set(key, buffer, { contentType: safeType });
        } else {
            const targetPath = path.join(FALLBACK_DIR, key);
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, buffer);
        }
        const url = `/.netlify/functions/file?key=${encodeURIComponent(key)}&name=${encodeURIComponent(downloadName)}&type=${encodeURIComponent(safeType)}`;
        return respond(200, { ok: true, url, fileName: downloadName, contentType: safeType, key });
    } catch (err) {
        console.error('Petition upload failed', err);
        return respond(500, { error: 'Upload failed' });
    }
};
