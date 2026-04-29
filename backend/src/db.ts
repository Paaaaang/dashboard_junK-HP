import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// When running in Docker, the connection string will typically be:
// postgres://user:password@postgres:5432/dbname
// For Supabase, it will be the provided connection string.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('supabase.co') 
    ? { rejectUnauthorized: false } 
    : false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;
