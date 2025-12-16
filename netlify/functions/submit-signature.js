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
        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now()
        )
    `);
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });
    if (!pool) return respond(500, { error: 'Database not configured' });

    try {
        await ensureTable();
    } catch (err) {
        console.error('Ensure signatures table failed', err);
        return respond(500, { error: 'Failed to prepare storage', detail: err.message || String(err) });
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return respond(400, { error: 'Invalid JSON' });
    }

    const { name, phone, ssn, signData } = body;
    if (!name || !phone || !ssn || !signData) {
        return respond(400, { error: 'Missing fields' });
    }

    try {
        const { rows } = await pool.query('SELECT data FROM settings WHERE id=$1', ['main']);
        const base = rows[0]?.data || {};
        const signs = Array.isArray(base.signatures) ? base.signatures : [];
        signs.push({ name, phone, ssn, signData, timestamp: new Date().toISOString() });
        base.signatures = signs;
        await pool.query(
            `INSERT INTO settings (id, data, updated_at)
             VALUES ($1, $2, now())
             ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
            ['main', base]
        );
        return respond(200, { ok: true });
    } catch (err) {
        console.error('Insert signature failed', err);
        return respond(500, { error: 'Failed to save signature', detail: err.message || String(err) });
    }
};
