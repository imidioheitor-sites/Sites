// Adaptador de email (Fase 3) — envia o relatório HTML.
//
// Provider default: Gmail via API (OAuth2). Import dinâmico para o demo rodar
// sem instalar nada. Qualquer SMTP/serviço serve — o pipeline só precisa de
// sendEmail({ to, subject, html }).

/**
 * @param {{ to: string, subject: string, html: string, from?: string }} msg
 * @param {{ auth?: object }} [opts]
 */
export async function sendEmail(msg, opts = {}) {
  const { google } = await import('googleapis').catch(() => {
    throw new Error('Pacote "googleapis" não instalado — rode `npm i googleapis` para enviar email.');
  });

  const auth = opts.auth || new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
  });
  const gmail = google.gmail({ version: 'v1', auth: await (auth.getClient?.() ?? auth) });

  const from = msg.from || process.env.REPORT_FROM || 'me';
  const raw = buildRawMessage({ ...msg, from });
  await gmail.users.messages.send({ userId: 'me', requestBody: { raw } });
}

/** Monta a mensagem MIME e codifica em base64url (formato que a Gmail API espera). */
function buildRawMessage({ to, from, subject, html }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
  ].join('\r\n');
  const body = Buffer.from(html).toString('base64');
  const mime = `${headers}\r\n\r\n${body}`;
  return Buffer.from(mime).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
