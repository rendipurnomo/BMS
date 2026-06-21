import { Sequelize } from 'sequelize';
import crypto from 'crypto';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'postgres';

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: false, // Set to console.log to debug queries if needed
  dialectOptions: {
    ssl: (DB_HOST.includes('supabase.com') || DB_HOST.includes('neon.tech')) ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  define: {
    timestamps: true,
  },
});

let cachedSequelize: Sequelize | null = null;

export function generateObjectId(): string {
  return crypto.randomBytes(12).toString('hex');
}

export async function connectDatabase(uri?: string): Promise<Sequelize> {
  if (cachedSequelize) {
    return cachedSequelize;
  }

  try {
    await sequelize.authenticate();
    console.log('Successfully connected to PostgreSQL database.');

    // Automatically synchronize models with the database
    // Avoid expensive 'alter: true' on every Vercel cold-start to prevent Gateway Timeouts.
    if (process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Database schema synchronized with alter:true successfully.');
      
      // Seed database with mock data if tables are empty
      const { seedDatabase } = require('./seed');
      await seedDatabase();
    } else {
      await sequelize.sync(); // Creates tables if they don't exist, very fast
      console.log('Database schema synchronized successfully (fast-path).');
    }

    cachedSequelize = sequelize;
    return sequelize;
  } catch (error) {
    console.error('Failed to establish database connection:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await sequelize.close();
  console.log('Database connection closed.');
}
