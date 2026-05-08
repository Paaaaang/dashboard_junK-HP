import { query } from '../db';

async function migrate() {
  try {
    console.log('--- Fixing Email System Schema ---');

    // 1. Ensure email_jobs table exists correctly
    console.log('Ensuring email_jobs table...');
    await query(`
      CREATE TABLE IF NOT EXISTS email_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
        total_count INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'queued',
        created_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE
      )
    `);

    // 2. Fix email_logs table (Add missing columns)
    console.log('Migrating email_logs table columns...');
    
    // Using individual ALTER TABLE statements for maximum safety if some columns already exist
    const columns = [
      { name: 'job_id', type: 'UUID REFERENCES email_jobs(id) ON DELETE SET NULL' },
      { name: 'sender_email', type: 'TEXT DEFAULT \'\'' },
      { name: 'body_rendered', type: 'TEXT' },
      { name: 'attachments_meta', type: 'JSONB DEFAULT \'[]\'::jsonb' },
      { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' }
    ];

    for (const col of columns) {
      try {
        await query(`ALTER TABLE email_logs ADD COLUMN ${col.name} ${col.type}`);
        console.log(`  - Added column: ${col.name}`);
      } catch (e: any) {
        if (e.code === '42701') { // Duplicate column
          console.log(`  - Column already exists: ${col.name}`);
        } else {
          throw e;
        }
      }
    }

    // 3. One more check for sender_email (it should not be NULL in future inserts)
    // We already added a default above, so existing rows will be handled.

    console.log('Schema migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
