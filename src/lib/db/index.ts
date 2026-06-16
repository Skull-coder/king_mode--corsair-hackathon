// src/lib/db/index.ts
import 'dotenv/config';
import { Pool } from 'pg';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * pg.Pool — kept for Corsair which needs a traditional pg-compatible client.
 * Do NOT use this directly in app code.
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Drizzle ORM client using Neon's HTTP adapter.
 * Serverless-safe — each query is an HTTP call, no persistent TCP connections.
 * Use this for all app queries.
 */
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });