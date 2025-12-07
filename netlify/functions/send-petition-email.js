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
  } = JSON.parse(event.body || '{}');

  if (!to) return respond(400, { error: 'Missing recipient email' });
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const from = process.env.FROM_EMAIL || smtpUser;
  if (!smtpHost || !smtpUser || !smtpPass) {
    return respond(500, { error: 'SMTP is not configured' });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass },
  });

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
    await transporter.sendMail({
      from,
      to,
      subject: `[탄원서 제출] ${name || '무명'}`,
      text: `${name || '무명'} 님이 탄원서를 제출했습니다.`,
      attachments,
    });
    return respond(200, { ok: true });
  } catch (err) {
    console.error('Send mail failed', err);
    return respond(500, { error: 'Mail send failed' });
  }
};
