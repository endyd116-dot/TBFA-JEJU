const fs = require('fs');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const respond = (status, body) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

const STORE_NAME = process.env.DATA_STORE_NAME || 'tbfa-data';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';

exports.handler = async (event) => {
    let store;
    try {
        store = getStore({ name: STORE_NAME });
    } catch (err) {
        // In local dev without Netlify context, fallback to file storage
        store = null;
    }
    const fallbackPath = path.join(__dirname, 'data.local.json');

    // GET -> return current data or {} if not set
    if (event.httpMethod === 'GET') {
        try {
            if (store) {
                const blob = await store.get('data.json', { type: 'json' });
                return respond(200, blob || {});
            }
            if (fs.existsSync(fallbackPath)) {
                const raw = fs.readFileSync(fallbackPath, 'utf-8');
                return respond(200, JSON.parse(raw));
            }
            return respond(200, {});
        } catch (err) {
            console.error('GET failed', err);
            return respond(500, { error: 'Failed to load data' });
        }
    }

    // POST -> save data (admin only)
    if (event.httpMethod === 'POST') {
        if (!ADMIN_SECRET) return respond(500, { error: 'ADMIN_SECRET not set' });
        const auth = event.headers.authorization || '';
        const token = auth.replace(/^Bearer\s+/i, '');
        if (token !== ADMIN_SECRET) return respond(401, { error: 'Unauthorized' });

        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch {
            return respond(400, { error: 'Invalid JSON' });
        }

        try {
            if (store) {
                await store.set('data.json', JSON.stringify(body), { contentType: 'application/json' });
            } else {
                fs.writeFileSync(fallbackPath, JSON.stringify(body, null, 2), 'utf-8');
            }
            return respond(200, { ok: true });
        } catch (err) {
            console.error('POST failed', err);
            return respond(500, { error: 'Failed to save data' });
        }
    }

    return respond(405, { error: 'Method not allowed' });
};
