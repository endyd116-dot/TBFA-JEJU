const { Pool } = require('pg');

const respond = (status, body) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
        console.error('Ensure settings table failed', err);
        return respond(500, { error: 'Failed to prepare storage', detail: err.message || String(err) });
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return respond(400, { error: 'Invalid JSON' });
    }

    const { form, fieldsSnapshot } = body;
    if (!form || typeof form !== 'object') {
        return respond(400, { error: 'Missing form data' });
    }

    try {
        const { rows } = await pool.query('SELECT data FROM settings WHERE id=$1', ['main']);
        const base = rows[0]?.data || {};
        base.settings = base.settings || {};
        const submissions = Array.isArray(base.settings.donateSubmissions) ? base.settings.donateSubmissions : [];
        submissions.unshift({
            form,
            fieldsSnapshot: Array.isArray(fieldsSnapshot) ? fieldsSnapshot : [],
            timestamp: new Date().toISOString()
        });
        base.settings.donateSubmissions = submissions;

        await pool.query(
            `INSERT INTO settings (id, data, updated_at)
             VALUES ($1, $2, now())
             ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
            ['main', base]
        );
        return respond(200, { ok: true });
    } catch (err) {
        console.error('Insert donate submission failed', err);
        return respond(500, { error: 'Failed to save submission', detail: err.message || String(err) });
    }
};
