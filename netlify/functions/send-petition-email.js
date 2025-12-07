const nodemailer = require('nodemailer');

const respond = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return respond(405, { error: 'Method not allowed' });

  const {
    to,
    name,
    file = {},
    smtp = {}
  } = JSON.parse(event.body || '{}');

  if (!to) return respond(400, { error: 'Missing recipient email' });
  const smtpHost = smtp.host || process.env.SMTP_HOST;
  const smtpUser = smtp.user || process.env.SMTP_USER;
  const smtpPass = smtp.pass || process.env.SMTP_PASS;
  const from = smtp.from || process.env.FROM_EMAIL || smtpUser;
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn('SMTP not configured, skipping email send');
    return respond(200, { ok: false, skipped: true, reason: 'smtp_not_configured' });
  }

  const primaryPort = Number(smtp.port || process.env.SMTP_PORT || 465);
  const fallbackPort = 587;

  const trySend = async (port) => {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure: port === 465, // 465: SSL, 587: STARTTLS
      auth: { user: smtpUser, pass: smtpPass },
    });
    return transporter.sendMail({
      from,
      to,
      subject: `[탄원서 제출] ${name || '무명'}`,
      text: `${name || '무명'} 님이 탄원서를 제출했습니다.`,
      attachments,
    });
  };

  const attachments = [];
  if (file?.content) {
    const base64 = file.content.includes('base64,') ? file.content.split('base64,').pop() : file.content;
    attachments.push({
      filename: file.name || 'attachment',
      content: Buffer.from(base64, 'base64'),
      contentType: file.type || 'application/octet-stream',
    });
  }

  try {
    await trySend(primaryPort);
    return respond(200, { ok: true, port: primaryPort });
  } catch (err1) {
    console.warn(`Send mail failed on port ${primaryPort}, retrying with ${fallbackPort}`, err1);
    try {
      await trySend(fallbackPort);
      return respond(200, { ok: true, port: fallbackPort });
    } catch (err2) {
      console.error('Send mail failed (both ports)', err2);
      return respond(200, { ok: false, error: 'Mail send failed', detail: err2?.message });
    }
  }
};
