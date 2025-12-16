const crypto = require('crypto');
const { Pool } = require('pg');

const respond = (status, body) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

const verifyToken = (authHeader, secret) => {
    const token = (authHeader || '').replace(/^Bearer\s+/i, '').trim();
    if (!token || !secret) return false;
    if (token === secret) return true; // legacy direct secret support

    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [headerPart, payloadPart, signature] = parts;
    const unsigned = `${headerPart}.${payloadPart}`;
    const expected = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url');
    if (signature !== expected) return false;

    try {
        const payload = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8'));
        if (payload.exp && Date.now() > payload.exp) return false;
    } catch (err) {
        return false;
    }
    return true;
};

const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const DB_URL = process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '';
const pool = DB_URL
    ? new Pool({
        connectionString: DB_URL,
        // Neon/Netlify DB는 SSL 요구. sslmode=require가 있어도 node-postgres는 명시 설정이 필요.
        ssl: { rejectUnauthorized: false }
      })
    : null;

const ensureTables = async () => {
    if (!pool) throw new Error('Database not configured');
    await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMPTZ DEFAULT now()
        )
    `);
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
    if (!pool) return respond(500, { error: 'Database not configured', detail: 'NETLIFY_DATABASE_URL not set in this environment' });

    try {
        await ensureTables();
    } catch (err) {
        console.error('Table ensure failed', err);
        return respond(500, { error: 'Failed to prepare storage', detail: err.message || String(err) });
    }

    if (event.httpMethod === 'GET') {
        try {
            const { rows } = await pool.query('SELECT data FROM settings WHERE id = $1', ['main']);
            const row = rows[0];
            // signatures, comments 별도 테이블에서 가져와 병합
            const { rows: signRows } = await pool.query('SELECT name, phone, ssn, sign_data as "signData", created_at as timestamp FROM signatures ORDER BY created_at DESC');
            const { rows: commentRows } = await pool.query(`
                SELECT text, author, real_name as "realName", ip, device, is_private as "isPrivate", approved, created_at 
                FROM comments
                ORDER BY created_at DESC
            `);
            const base = row ? row.data : {};
            base.signatures = signRows || [];
            base.comments = commentRows || [];
            return respond(200, base);
        } catch (err) {
            console.error('GET failed', err);
            return respond(500, { error: 'Failed to load data' });
        }
    }

    if (event.httpMethod === 'POST') {
        if (!ADMIN_SECRET) return respond(500, { error: 'ADMIN_SECRET not set' });
        if (!verifyToken(event.headers.authorization, ADMIN_SECRET)) {
            return respond(401, { error: 'Unauthorized' });
        }

        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch {
            return respond(400, { error: 'Invalid JSON' });
        }

        try {
            await pool.query(
                `INSERT INTO settings (id, data, updated_at)
                 VALUES ($1, $2, now())
                 ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
                ['main', body]
            );
            return respond(200, { ok: true });
        } catch (err) {
            console.error('POST failed', err);
            return respond(500, { error: 'Failed to save data' });
        }
    }

    return respond(405, { error: 'Method not allowed' });
};
