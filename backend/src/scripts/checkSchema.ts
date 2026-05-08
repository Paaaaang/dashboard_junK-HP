import { query } from '../db';

async function checkSchema() {
  try {
    console.log('--- Checking email_logs schema ---');
    const res = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'email_logs'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Schema check failed:', error);
    process.exit(1);
  }
}

checkSchema();
