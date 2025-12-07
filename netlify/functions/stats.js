const { Pool } = require('pg');

const respond = (status, body) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

const DB_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || '';
const pool = DB_URL ? new Pool({ connectionString: DB_URL }) : null;

const ensureTable = async () => {
    if (!pool) throw new Error('Database not configured');
    await pool.query(`
        CREATE TABLE IF NOT EXISTS stats (
            id SERIAL PRIMARY KEY,
            timestamp TIMESTAMPTZ DEFAULT now(),
            device TEXT,
            ip TEXT,
            user_agent TEXT
        )
    `);
};

exports.handler = async (event) => {
    if (!pool) return respond(500, { error: 'Database not configured' });

    try {
        await ensureTable();
    } catch (err) {
        console.error('Table ensure failed', err);
        return respond(500, { error: 'Failed to prepare stats storage' });
    }

    if (event.httpMethod === 'POST') {
        let body = {};
        try { body = JSON.parse(event.body || '{}'); }
        catch { return respond(400, { error: 'Invalid JSON' }); }

        const ipHeader = event.headers['x-forwarded-for'] || event.headers['client-ip'] || event.headers['true-client-ip'] || '';
        const clientIp = (ipHeader.split(',')[0] || '').trim() || 'unknown';
        const device = body.device || 'unknown';
        const userAgent = body.userAgent || event.headers['user-agent'] || '';
        const todayKey = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        try {
            // 동일 IP가 오늘 이미 기록되었으면 스킵
            const exists = await pool.query(
                "SELECT 1 FROM stats WHERE ip = $1 AND to_char(timestamp::date, 'YYYY-MM-DD') = $2 LIMIT 1",
                [clientIp, todayKey]
            );
            if (exists.rows.length > 0) {
                return respond(200, { ok: true, skipped: true });
            }

            await pool.query(
                'INSERT INTO stats (timestamp, device, ip, user_agent) VALUES (now(), $1, $2, $3)',
                [device, clientIp, userAgent]
            );
            return respond(200, { ok: true });
        } catch (err) {
            console.error('Stats insert failed', err);
            return respond(500, { error: 'Failed to save stats' });
        }
    }

    if (event.httpMethod === 'GET') {
        try {
            const entriesRes = await pool.query('SELECT id, timestamp, device, ip, user_agent FROM stats ORDER BY timestamp');
            const entries = entriesRes.rows || [];
            const aggQuery = `
                SELECT
                    to_char(timestamp::date, 'YYYY-MM-DD') AS day,
                    date_part('year', timestamp)::int AS year,
                    to_char(date_trunc('week', timestamp), 'IYYY-"W"IW') AS week,
                    to_char(date_trunc('month', timestamp), 'YYYY-MM') AS month
                FROM stats
            `;
            const aggRes = await pool.query(aggQuery);
            const dailyMap = new Map();
            const weeklyMap = new Map();
            const monthlyMap = new Map();
            aggRes.rows.forEach(r => {
                dailyMap.set(r.day, (dailyMap.get(r.day) || 0) + 1);
                weeklyMap.set(r.week, (weeklyMap.get(r.week) || 0) + 1);
                monthlyMap.set(r.month, (monthlyMap.get(r.month) || 0) + 1);
            });
            const mapToArr = (m) => Array.from(m.entries()).map(([key, count]) => ({ key, count })).sort((a,b)=>a.key.localeCompare(b.key));

            return respond(200, {
                entries,
                daily: mapToArr(dailyMap),
                weekly: mapToArr(weeklyMap),
                monthly: mapToArr(monthlyMap)
            });
        } catch (err) {
            console.error('Stats fetch failed', err);
            return respond(500, { error: 'Failed to load stats' });
        }
    }

    return respond(405, { error: 'Method not allowed' });
};
