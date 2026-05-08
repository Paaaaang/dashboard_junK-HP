import imaps from 'imap-simple';
import { query } from '../db';

/**
 * Scans Naver Inbox for emails containing the specified keyword.
 */
export async function importEmails() {
  // 1. Fetch settings
  const settingsRes = await query('SELECT value FROM system_settings WHERE key = ANY($1)', [['naver_smtp', 'mail_import']]);
  const settings: any = {};
  settingsRes.rows.forEach(row => {
    if (row.key === 'naver_smtp') settings.smtp = row.value;
    if (row.key === 'mail_import') settings.import = row.value;
  });

  if (!settings.smtp?.email || !settings.smtp?.password) {
    throw new Error('Naver SMTP account not configured');
  }

  const config = {
    imap: {
      user: settings.smtp.email,
      password: settings.smtp.password,
      host: settings.smtp.host ? settings.smtp.host.replace('smtp', 'imap') : 'imap.naver.com',
      port: 993,
      tls: true,
      authTimeout: 3000
    }
  };

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN', ['SUBJECT', settings.import.keyword]];
    const fetchOptions = {
      bodies: ['HEADER', 'TEXT'],
      markSeen: false
    };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(`Found ${messages.length} new matching emails`);

    // In a real implementation, we would parse bodies and save to a 'received_emails' table.
    // For now, we update the last_scan timestamp.
    await query(
      "UPDATE system_settings SET value = value || jsonb_build_object('last_scan', CURRENT_TIMESTAMP) WHERE key = 'mail_import'"
    );

    connection.end();
    return { count: messages.length };
  } catch (err: any) {
    console.error('Mail import failed:', err.message);
    throw err;
  }
}
