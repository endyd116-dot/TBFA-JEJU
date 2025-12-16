const { Pool } = require('pg');

exports.handler = async () => {
    const DB_URL = process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || '';
    if (!DB_URL) return { statusCode: 500, body: JSON.stringify({ error: 'DB url missing' }) };

    const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
    try {
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
        await pool.query(`ALTER TABLE signatures ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`);
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
        await pool.query(`ALTER TABLE comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()`);
        return { statusCode: 200, body: JSON.stringify({ ok: true }) };
    } catch (err) {
        console.error('Migration failed', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    } finally {
        await pool.end();
    }
};
