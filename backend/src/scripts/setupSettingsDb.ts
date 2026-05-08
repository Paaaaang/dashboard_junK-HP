import { query } from '../db';

async function setupSettings() {
  try {
    console.log('--- Setting up System Settings Table ---');
    await query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert default settings if not exists
    await query(`
      INSERT INTO system_settings (key, value)
      VALUES 
        ('naver_smtp', '{"email": "", "password": ""}'::jsonb),
        ('mail_import', '{"keyword": "[교육신청]", "last_scan": null}'::jsonb)
      ON CONFLICT (key) DO NOTHING
    `);

    console.log('System settings setup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupSettings();
