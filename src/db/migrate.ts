import { migrate } from 'drizzle-orm/libsql/migrator';
import { getDatabase } from './connection';
import { join } from 'path';
import { existsSync } from 'fs';
import { logger } from '../utils/logger';

export async function runMigrations(): Promise<void> {
  try {
    const db = await getDatabase();
    
    // Try source location first (development)
    let migrationsFolder = join(__dirname, '..', '..', 'drizzle');
    
    // If not found, try bundled location (production)
    if (!existsSync(migrationsFolder)) {
      migrationsFolder = join(__dirname, 'drizzle');
    }
    
    // Try relative to process.cwd() as fallback
    if (!existsSync(migrationsFolder)) {
      migrationsFolder = join(process.cwd(), 'drizzle');
    }
    
    // Final fallback for edge cases
    if (!existsSync(migrationsFolder)) {
      throw new Error(`Migrations folder not found. Searched paths: ${[join(__dirname, '..', '..', 'drizzle'), join(__dirname, 'drizzle'), join(process.cwd(), 'drizzle')].join(', ')}`);
    }
    
    await migrate(db as any, { migrationsFolder });
    
    logger.log('Database migrations completed successfully');
  } catch (error) {
    logger.error('Database migration failed:', error);
    throw error;
  }
}

// Auto-run migrations when this module is imported
// This ensures the database is always up-to-date
export async function ensureDatabaseReady(): Promise<void> {
  try {
    await runMigrations();
  } catch (error) {
    logger.warn('Failed to run migrations, database may not be initialized:', error instanceof Error ? error.message : String(error));
  }
}