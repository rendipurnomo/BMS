"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.generateObjectId = generateObjectId;
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const sequelize_1 = require("sequelize");
const crypto_1 = __importDefault(require("crypto"));
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_NAME = process.env.DB_NAME || 'postgres';
exports.sequelize = new sequelize_1.Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
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
let cachedSequelize = null;
function generateObjectId() {
    return crypto_1.default.randomBytes(12).toString('hex');
}
async function connectDatabase(uri) {
    if (cachedSequelize) {
        return cachedSequelize;
    }
    try {
        await exports.sequelize.authenticate();
        console.log('Successfully connected to PostgreSQL database.');
        // Automatically synchronize models with the database
        // Avoid expensive 'alter: true' on every Vercel cold-start to prevent Gateway Timeouts.
        if (process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'true') {
            await exports.sequelize.sync({ alter: true });
            console.log('Database schema synchronized with alter:true successfully.');
            // Seed database with mock data if tables are empty
            const { seedDatabase } = require('./seed');
            await seedDatabase();
        }
        else {
            await exports.sequelize.sync(); // Creates tables if they don't exist, very fast
            console.log('Database schema synchronized successfully (fast-path).');
        }
        cachedSequelize = exports.sequelize;
        return exports.sequelize;
    }
    catch (error) {
        console.error('Failed to establish database connection:', error);
        throw error;
    }
}
async function disconnectDatabase() {
    await exports.sequelize.close();
    console.log('Database connection closed.');
}
