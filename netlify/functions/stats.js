const fs = require('fs');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const respond = (status, body) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

const STORE_NAME = process.env.DATA_STORE_NAME || 'tbfa-data';
const FALLBACK = path.join(__dirname, 'stats.local.json');
const MAX_RECORDS = 3000;

const loadStats = async () => {
    const store = (() => {
        try { return getStore({ name: STORE_NAME }); }
        catch { return null; }
    })();
    if (store) {
        const data = await store.get('stats.json', { type: 'json' });
        return Array.isArray(data) ? data : [];
    }
    if (fs.existsSync(FALLBACK)) {
        try {
            const raw = fs.readFileSync(FALLBACK, 'utf8');
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            console.error('Fallback stats parse fail', err);
        }
    }
    return [];
};

const saveStats = async (list) => {
    const store = (() => {
        try { return getStore({ name: STORE_NAME }); }
        catch { return null; }
    })();
    if (store) {
        await store.set('stats.json', JSON.stringify(list), { contentType: 'application/json' });
    } else {
        fs.writeFileSync(FALLBACK, JSON.stringify(list, null, 2), 'utf8');
    }
};

const aggregate = (entries) => {
    const daily = new Map();
    const weekly = new Map();
    const monthly = new Map();

    const toDateKey = (ts) => new Date(ts).toISOString().slice(0, 10); // yyyy-mm-dd
    const toMonthKey = (ts) => new Date(ts).toISOString().slice(0, 7); // yyyy-mm
    const toWeekKey = (ts) => {
        const d = new Date(ts);
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
        const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
        return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
    };

    entries.forEach(e => {
        const ts = e.timestamp || e.ts || e.date || Date.now();
        const day = toDateKey(ts);
        const week = toWeekKey(ts);
        const month = toMonthKey(ts);
        daily.set(day, (daily.get(day) || 0) + 1);
        weekly.set(week, (weekly.get(week) || 0) + 1);
        monthly.set(month, (monthly.get(month) || 0) + 1);
    });

    const mapToArr = (m) => Array.from(m.entries()).map(([key, count]) => ({ key, count })).sort((a,b)=>a.key.localeCompare(b.key));

    return {
        daily: mapToArr(daily),
        weekly: mapToArr(weekly),
        monthly: mapToArr(monthly)
    };
};

exports.handler = async (event) => {
    if (event.httpMethod === 'POST') {
        let body = {};
        try { body = JSON.parse(event.body || '{}'); }
        catch { return respond(400, { error: 'Invalid JSON' }); }

        const ipHeader = event.headers['x-forwarded-for'] || event.headers['client-ip'] || event.headers['true-client-ip'] || '';
        const clientIp = (ipHeader.split(',')[0] || '').trim() || 'unknown';
        const device = body.device || 'unknown';
        const userAgent = body.userAgent || event.headers['user-agent'] || '';
        const ts = Date.now();

        const list = await loadStats();
        list.push({ timestamp: ts, device, ip: clientIp, userAgent });
        while (list.length > MAX_RECORDS) list.shift();
        await saveStats(list);

        return respond(200, { ok: true });
    }

    if (event.httpMethod === 'GET') {
        const list = await loadStats();
        const agg = aggregate(list);
        return respond(200, { entries: list, ...agg });
    }

    return respond(405, { error: 'Method not allowed' });
};
