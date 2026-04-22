import { Logger } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';

export const DATABASE_POOL = 'DATABASE_POOL';

const logger = new Logger('DatabaseProvider');

export async function createDatabasePool(): Promise<Pool> {
  const pool = new Pool({
    connectionString: process.env['DATABASE_URL'],
  });

  const migrationSql = await readFile(
    join(__dirname, 'migrations', '001_init.sql'),
    'utf-8',
  );

  const client = await pool.connect();
  try {
    await client.query(migrationSql);
    logger.log('Database migrations applied successfully');
  } finally {
    client.release();
  }

  return pool;
}
