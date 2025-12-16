const { Pool } = require('pg');

const respond = (status, body) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

const DB_URL = process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '';
const pool = DB_URL
    ? new Pool({
        connectionString: DB_URL,
        ssl: { rejectUnauthorized: false }
    })
    : null;

const ensureTable = async () => {
    if (!pool) throw new Error('Database not configured');
    await pool.query(`
        CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            text TEXT NOT NULL,
            author TEXT NOT NULL,
            real_name TEXT,
            ip TEXT,
            device TEXT,
            is_private BOOLEAN DEFAULT FALSE,
            approved BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT now()
        )
    `);
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
    if (!pool) return respond(500, { error: 'Database not configured' });

    try {
        await ensureTable();
    } catch (err) {
        console.error('Ensure comments table failed', err);
        return respond(500, { error: 'Failed to prepare storage', detail: err.message || String(err) });
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return respond(400, { error: 'Invalid JSON' });
    }

    const { text, author, realName, ip, device, isPrivate } = body;
    if (!text || !author) {
        return respond(400, { error: 'Missing fields' });
    }

    try {
        await pool.query(
            'INSERT INTO comments (text, author, real_name, ip, device, is_private, approved, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7, now())',
            [text, author, realName || null, ip || null, device || null, !!isPrivate, false]
        );
        return respond(200, { ok: true });
    } catch (err) {
        console.error('Insert comment failed', err);
        return respond(500, { error: 'Failed to save comment', detail: err.message || String(err) });
    }
};
