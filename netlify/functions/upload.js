const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const respond = (status, body) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

const verifyToken = (authHeader, secret) => {
    const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
    if (!token || !secret) return false;
    if (token === secret) return true;

    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [headerPart, payloadPart, signature] = parts;
    const unsigned = `${headerPart}.${payloadPart}`;
    const expected = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url');
    if (signature !== expected) return false;
    try {
        const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
        if (payload.exp && Date.now() > payload.exp) return false;
    } catch {
        return false;
    }
    return true;
};

const sanitizeName = (name) => {
    // Keep non-ASCII names (e.g. Korean) but strip path separators and risky chars
    const base = path.basename(name || 'file');
    const cleaned = base.replace(/[\\/#?%*:|"<>]/g, '_').trim();
    return cleaned || 'file';
};

const STORE_NAME = process.env.DATA_STORE_NAME || 'tbfa-data';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const FALLBACK_DIR = path.join(__dirname, 'uploads');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
    if (!ADMIN_SECRET) return respond(500, { error: 'ADMIN_SECRET not set' });
    if (!verifyToken(event.headers.authorization, ADMIN_SECRET)) return respond(401, { error: 'Unauthorized' });

    const store = (() => {
        try {
            return getStore({ name: STORE_NAME });
        } catch {
            return null;
        }
    })();

    const contentType = (event.headers['content-type'] || event.headers['Content-Type'] || 'application/octet-stream')
        .replace(/[\r\n]/g, '')
        .slice(0, 150);
    const originalName = sanitizeName(decodeURIComponent(event.headers['x-file-name'] || event.headers['X-File-Name'] || 'upload.bin'));
    const folder = sanitizeName(decodeURIComponent(event.headers['x-upload-folder'] || event.headers['X-Upload-Folder'] || 'uploads'));

    if (!event.body) return respond(400, { error: 'Missing file body' });
    const buffer = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : Buffer.from(event.body, 'utf8');

    const key = `${folder}/${Date.now()}_${crypto.randomBytes(4).toString('hex')}_${originalName}`;

    try {
        if (store) {
            await store.set(key, buffer, { contentType });
        } else {
            const targetPath = path.join(FALLBACK_DIR, key);
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, buffer);
        }
        const url = `/.netlify/functions/file?key=${encodeURIComponent(key)}&name=${encodeURIComponent(originalName)}&type=${encodeURIComponent(contentType)}`;
        return respond(200, { ok: true, url, key, fileName: originalName, contentType });
    } catch (err) {
        console.error('Upload failed', err);
        return respond(500, { error: 'Upload failed' });
    }
};
