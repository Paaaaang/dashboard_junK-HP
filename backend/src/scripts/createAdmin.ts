import bcrypt from 'bcryptjs';
import { query } from '../db';

async function createAdmin() {
  const username = 'admin';
  const password = 'admin1234';
  const name = 'System Administrator';
  const email = 'admin@khp.dashboard';
  const role = 'admin';

  try {
    console.log(`Creating admin user: ${username}...`);
    
    // Check if user exists
    const userExists = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (userExists.rowCount && userExists.rowCount > 0) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await query(
      `INSERT INTO users (username, password, name, email, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [username, hashedPassword, name, email, role]
    );

    console.log('Admin user created successfully.');
    console.log('Username: admin');
    console.log('Password: admin1234');
    process.exit(0);
  } catch (error) {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  }
}

createAdmin();
