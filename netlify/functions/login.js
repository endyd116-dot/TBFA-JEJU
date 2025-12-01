const crypto = require('crypto');

const respond = (status, body) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

const createToken = (payload, secret) => {
    const header = { alg: 'HS256', typ: 'JWT' };
    const base64url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const unsigned = `${base64url(header)}.${base64url(payload)}`;
    const signature = crypto.createHmac('sha256', secret).update(unsigned).digest('base64url');
    return `${unsigned}.${signature}`;
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

    const ADMIN_ID = process.env.ADMIN_ID;
    const ADMIN_PW = process.env.ADMIN_PW;
    const ADMIN_SECRET = process.env.ADMIN_SECRET || 'change-me';

    if (!ADMIN_ID || !ADMIN_PW) {
        return respond(500, { error: 'Admin credentials not configured' });
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return respond(400, { error: 'Invalid JSON' });
    }

    const { id, pw } = body;
    if (!id || !pw) return respond(400, { error: 'Missing id/pw' });

    if (id !== ADMIN_ID || pw !== ADMIN_PW) return respond(401, { error: 'Unauthorized' });

    const token = createToken(
        { sub: 'admin', iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 },
        ADMIN_SECRET
    );

    return respond(200, { token });
};
