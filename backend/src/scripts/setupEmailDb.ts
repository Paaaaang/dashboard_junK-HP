import { query } from '../db';

async function setup() {
  try {
    console.log('Updating email_templates table...');
    await query("ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb");
    
    console.log('Creating email_logs table...');
    await query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
        recipient_email TEXT NOT NULL,
        subject TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Database setup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

setup();
