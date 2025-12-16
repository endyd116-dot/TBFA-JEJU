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
        CREATE TABLE IF NOT EXISTS signatures (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            ssn TEXT NOT NULL,
            sign_data TEXT NOT NULL,
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
        await pool.query(
            'INSERT INTO signatures (name, phone, ssn, sign_data, created_at) VALUES ($1,$2,$3,$4, now())',
            [name, phone, ssn, signData]
        );
        return respond(200, { ok: true });
    } catch (err) {
        console.error('Insert signature failed', err);
        return respond(500, { error: 'Failed to save signature', detail: err.message || String(err) });
    }
};
