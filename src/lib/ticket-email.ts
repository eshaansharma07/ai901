import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

type TicketEmail = {
  email: string;
  name: string;
  title: string;
  location: string;
  startsAt: Date;
  ticket: string;
  demo: boolean;
};
export type TicketEmailStatus = 'sent' | 'unavailable' | 'failed';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!);
}

export async function sendTicketEmail(details: TicketEmail): Promise<TicketEmailStatus> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.TICKET_EMAIL_FROM;
  const gmailAddress = process.env.TICKET_GMAIL_ADDRESS?.trim();
  const gmailPassword = process.env.TICKET_GMAIL_APP_PASSWORD?.replace(/\s/g, '');
  const useResend = !!apiKey && !!from;
  if (!useResend && (!gmailAddress || !gmailPassword)) return 'unavailable';

  try {
    const when = new Intl.DateTimeFormat('en-GB', {
      dateStyle: 'full', timeStyle: 'short', timeZone: 'UTC',
    }).format(details.startsAt) + ' UTC';
    const [name, title, location, date, ticket] = [details.name, details.title, details.location, when, details.ticket].map(escapeHtml);
    const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f0ecf8;font-family:Arial,sans-serif;color:#241535">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0ecf8"><tr><td align="center" style="padding:26px 12px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;border-collapse:separate">
      <tr><td style="background:#291846;color:#ffffff;padding:25px 28px 30px;border-radius:18px 18px 0 0">
        <p style="margin:0 0 18px;color:#b4f5e9;font-size:14px;font-weight:bold">EventIQ AI &nbsp; / &nbsp; ${details.demo ? 'DEMO PASS' : 'ADMISSION PASS'}</p>
        <h1 style="margin:0;font-size:29px;line-height:1.15">${title}</h1>
        <p style="margin:13px 0 0;color:#e9dbff;font-size:15px">Registration confirmed for ${name}.</p>
      </td></tr>
      <tr><td style="background:#ffffff;padding:23px 28px;border-bottom:2px dashed #d1c1e6">
        <p style="margin:0 0 10px"><strong>When</strong><br>${date}</p>
        <p style="margin:0"><strong>Where</strong><br>${location}</p>
      </td></tr>
      <tr><td align="center" style="background:#ffffff;padding:24px 15px;border-radius:0 0 18px 18px">
        <img src="cid:eventiq-ticket-qr" width="184" height="184" alt="Ticket QR code" style="display:block;border:1px solid #e7dced;border-radius:10px">
        <p style="margin:15px 0 5px;font-size:13px;color:#54456b">Ticket code</p>
        <p style="margin:0;word-break:break-all;font-family:monospace;color:#291846">${ticket}</p>
        <p style="margin:14px 0 0;color:#54456b;font-size:13px">${details.demo ? 'This is a fictional demo listing.' : 'Show your QR code or ticket code at check-in.'}</p>
      </td></tr>
  </table></td></tr></table></body></html>`;
    const plain = [
      'EventIQ AI · Registration confirmed', details.title, 'Attendee: ' + details.name,
      'When: ' + when, 'Where: ' + details.location, 'Ticket code: ' + details.ticket,
      details.demo ? 'This is a fictional demo listing.' : 'Show this code at check-in.',
    ].join('\n');

    const qr = await QRCode.toBuffer(details.ticket, { width: 368, margin: 3, errorCorrectionLevel: 'M' });
    if (!useResend) {
      const transport = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 465, secure: true,
        auth: { user: gmailAddress, pass: gmailPassword },
        connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000,
      });
      const result = await transport.sendMail({
        from: { name: 'EventIQ AI', address: gmailAddress! },
        to: details.email,
        subject: ('Your EventIQ ticket · ' + details.title).replace(/[\r\n]+/g, ' '),
        html, text: plain,
        attachments: [{ filename: 'eventiq-ticket-qr.png', content: qr, cid: 'eventiq-ticket-qr', contentType: 'image/png' }],
      });
      return result.accepted.length ? 'sent' : 'failed';
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'Idempotency-Key': 'eventiq-ticket/' + details.ticket },
      body: JSON.stringify({
        from, to: [details.email], subject: ('Your EventIQ ticket · ' + details.title).replace(/[\r\n]+/g, ' '),
        html, text: plain,
        attachments: [{ filename: 'eventiq-ticket-qr.png', content: qr.toString('base64'), content_type: 'image/png', content_id: 'eventiq-ticket-qr' }],
      }),
      signal: AbortSignal.timeout(7000),
    });
    return response.ok ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
}
