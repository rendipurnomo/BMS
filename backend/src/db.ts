import { Sequelize } from 'sequelize';
import crypto from 'crypto';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '3306', 10);
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || 'static';
const DB_NAME = process.env.DB_NAME || 'bms_db';

export const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: false, // Set to console.log to debug queries if needed
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
    console.log('Successfully connected to MySQL database.');

    // Automatically synchronize models with the database
    await sequelize.sync({ alter: true });
    console.log('Database schema synchronized successfully.');

    // Seed database with mock data if tables are empty
    const { seedDatabase } = require('./seed');
    await seedDatabase();

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
