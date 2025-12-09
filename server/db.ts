import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;
neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection pool with conservative settings for Neon
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 5, // Reduced max connections to prevent exhaustion
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds
  connectionTimeoutMillis: 10000,
});

// Handle pool errors to prevent crashes
pool.on('error', (err: any) => {
  console.error('Unexpected error on idle database client', err);
});

export const db = drizzle({ client: pool, schema });