import { query } from '../db';

async function setup() {
  try {
    console.log('--- Email System Database Setup ---');

    // 1. Expand email_templates
    console.log('Updating email_templates table...');
    await query(`
      ALTER TABLE email_templates 
      ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    `);

    // 2. Create email_jobs table
    console.log('Creating email_jobs table...');
    await query(`
      CREATE TABLE IF NOT EXISTS email_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
        total_count INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'queued', -- queued, running, completed, failed
        created_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // 3. Create email_logs table
    console.log('Creating email_logs table...');
    await query(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID REFERENCES email_jobs(id) ON DELETE SET NULL,
        template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
        sender_email TEXT NOT NULL,
        recipient_email TEXT NOT NULL,
        recipient_name TEXT,
        subject TEXT NOT NULL,
        body_rendered TEXT,
        status TEXT NOT NULL, -- pending, sent, failed
        error_message TEXT,
        attachments_meta JSONB DEFAULT '[]'::jsonb,
        sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
