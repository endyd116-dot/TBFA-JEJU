const respond = (status, body) => ({
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
});

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

    const RECOVERY_PHONE = (process.env.ADMIN_RECOVERY_PHONE || '').replace(/\D/g, '');
    const ADMIN_PW = process.env.ADMIN_PW || '';

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return respond(400, { error: 'Invalid JSON' });
    }

    const phone = (body.phone || '').replace(/\D/g, '');
    if (!phone) return respond(400, { error: 'Missing phone' });

    if (!RECOVERY_PHONE || phone !== RECOVERY_PHONE) return respond(403, { error: 'Unauthorized' });

    return respond(200, { password: ADMIN_PW });
};
