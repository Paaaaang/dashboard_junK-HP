import { query } from '../db';

async function clearDb() {
  const tables = [
    'enrollments',
    'company_courses',
    'sub_course_sessions',
    'participants',
    'sub_courses',
    'companies',
    'course_groups',
    'email_logs',
    'email_templates',
    'system_logs'
  ];

  try {
    console.log('Clearing database dummy data...');
    // We use a single query to handle CASCADE correctly in one go if possible, 
    // but truncating one by one with CASCADE is also fine.
    // Order matters if not using CASCADE, but with CASCADE it's safer.
    
    // Truncate all tables in reverse order of dependency if possible, or just all at once.
    const truncateQuery = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`;
    
    await query(truncateQuery);
    
    console.log('Successfully cleared all dummy data from the following tables:');
    console.log(tables.join(', '));
    process.exit(0);
  } catch (err) {
    console.error('Error clearing database:', err);
    process.exit(1);
  }
}

clearDb();
