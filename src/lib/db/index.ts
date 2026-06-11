// src/lib/db/index.ts
import 'dotenv/config';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

// Create exactly ONE connection pool for the entire application lifetime
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                 // Safe limit for serverless/Next.js environments
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle with your combined schemas
export const db = drizzle({ 
  client: pool, 
  schema 
});