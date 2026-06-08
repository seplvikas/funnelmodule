import mysql from 'mysql2/promise';
import { Pool } from 'mysql2/promise';

let funnelPool: Pool | null = null;
let funnelConnected = false;

export async function initializeFunnelDatabase() {
  try {
    funnelPool = mysql.createPool({
      host: process.env.FUNNEL_DB_HOST || process.env.DB_HOST || 'localhost',
      user: process.env.FUNNEL_DB_USER || process.env.DB_USER || 'root',
      password: process.env.FUNNEL_DB_PASSWORD || process.env.DB_PASSWORD || 'password',
      database: process.env.FUNNEL_DB_NAME || 'funnel',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Test connection
    const connection = await funnelPool.getConnection();
    console.log('✓ Funnel database connected successfully');
    funnelConnected = true;
    connection.release();

    return funnelPool;
  } catch (error: any) {
    console.warn('⚠ Funnel database connection warning:', error.message);
    console.warn('⚠ SEPL data features will be unavailable. To enable, set up the funnel database.');
    funnelConnected = false;
    // Don't exit - allow application to continue without funnel database
    return null;
  }
}

export function getFunnelPool(): Pool | null {
  return funnelPool;
}

export function isFunnelConnected(): boolean {
  return funnelConnected;
}

export async function executeFunnelQuery<T>(query: string, values?: any[]): Promise<T> {
  if (!funnelPool) {
    throw new Error('Funnel database is not connected');
  }
  const connection = await funnelPool.getConnection();
  try {
    const [results] = await connection.execute(query, values);
    return results as T;
  } finally {
    connection.release();
  }
}
