// config/database.js
// Hybrid Database Configuration (SQLite for local, PostgreSQL for Production/Supabase)

const knex = require('knex');
const path = require('path');
const fs   = require('fs');
const { URL } = require('url');

const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

let db;

if (isProduction) {
  console.log('[DB] Connecting to Cloud PostgreSQL (Supabase)...');
  
  // Extract hostname from DATABASE_URL to pass as SNI servername
  let hostname = '';
  try {
    const parsedUrl = new URL(process.env.DATABASE_URL);
    hostname = parsedUrl.hostname;
  } catch (err) {
    console.error('[DB] Failed to parse DATABASE_URL hostname:', err.message);
  }

  db = knex({
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
        servername: hostname // Forces SNI to be sent, fixing the (ENOIDENTIFIER) error
      }
    },
    pool: { min: 2, max: 10 }
  });
} else {
  // Local Development: Connect to SQLite
  console.log('[DB] Connecting to local SQLite...');
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const DB_PATH = path.join(dataDir, 'power_plant.db');

  db = knex({
    client: 'sqlite3',
    connection: { filename: DB_PATH },
    useNullAsDefault: true,
    pool: { min: 1, max: 1 }
  });
}

/**
 * Initializes the database schema. Works for both SQLite and PostgreSQL.
 */
async function initializeSchema() {
  const exists = await db.schema.hasTable('equipment');

  if (!exists) {
    await db.schema.createTable('equipment', (table) => {
      table.increments('id').primary();
      table.text('asset_number').notNullable().unique();
      table.text('name').notNullable();
      table.text('model').notNullable();
      table.text('specs').nullable();
      table.text('description').nullable();
      table.text('status').notNullable().defaultTo('Working');
      table.timestamp('created_at').defaultTo(db.fn.now());
    });

    await db.schema.table('equipment', (table) => {
      table.index(['asset_number'], 'idx_equipment_asset_number');
    });

    console.log('[DB] Schema initialized successfully.');
  } else {
    console.log('[DB] Schema already exists. Skipping initialization.');
  }
}

module.exports = { db, initializeSchema };
