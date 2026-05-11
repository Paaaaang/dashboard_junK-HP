import fs from 'fs';
import path from 'path';
import { query } from '../db';

async function backup() {
  const tables = [
    'companies',
    'participants',
    'course_groups',
    'sub_courses',
    'sub_course_sessions',
    'enrollments',
    'email_templates',
    'email_logs',
    'email_jobs',
    'system_logs',
    'users'
  ];

  const backupDir = path.join(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionDir = path.join(backupDir, `backup-${timestamp}`);
  fs.mkdirSync(sessionDir);

  console.log(`Starting backup to ${sessionDir}...`);

  try {
    for (const table of tables) {
      console.log(`Backing up table: ${table}...`);
      const result = await query(`SELECT * FROM ${table}`);
      const filePath = path.join(sessionDir, `${table}.json`);
      fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2));
    }

    // Create a summary file
    const summary = {
      timestamp: new Date().toISOString(),
      tables: tables,
      totalRows: {} as Record<string, number>
    };

    for (const table of tables) {
      const res = await query(`SELECT COUNT(*) FROM ${table}`);
      summary.totalRows[table] = parseInt(res.rows[0].count);
    }

    fs.writeFileSync(path.join(sessionDir, 'summary.json'), JSON.stringify(summary, null, 2));

    console.log('Backup completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Backup failed:', error);
    process.exit(1);
  }
}

backup();
