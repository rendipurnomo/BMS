"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = require("./models/user.model");
const unit_model_1 = require("./models/unit.model");
async function seedDatabase() {
    try {
        // Check if users already exist
        const userCount = await user_model_1.User.count();
        if (userCount === 0) {
            console.log('Seeding default users...');
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash('secretpassword', salt);
            const adminPasswordHash = await bcryptjs_1.default.hash('admin123', salt);
            await user_model_1.User.bulkCreate([
                {
                    _id: '6667f1f77bcf86cd79943001',
                    nrp: 'MK1122',
                    name: 'Mekanik Udin',
                    passwordHash: passwordHash,
                    role: 'MEKANIK',
                    site: 'TAA',
                    section: 'TRACK',
                    isActive: true,
                },
                {
                    _id: '6667f1f77bcf86cd79943002',
                    nrp: 'GL3344',
                    name: 'GL Budi',
                    passwordHash: passwordHash,
                    role: 'GL',
                    site: 'TAA',
                    section: 'TRACK',
                    isActive: true,
                },
                {
                    _id: '6667f1f77bcf86cd79943003',
                    nrp: 'PL5566',
                    name: 'Planner Cici',
                    passwordHash: passwordHash,
                    role: 'PLANNER',
                    site: 'TAA',
                    section: 'TRACK',
                    isActive: true,
                },
                {
                    _id: '6667f1f77bcf86cd79943009',
                    nrp: 'ADMIN01',
                    name: 'Administrator',
                    passwordHash: adminPasswordHash,
                    role: 'ADMIN',
                    site: 'TAA',
                    section: 'SUPPORT',
                    isActive: true,
                },
            ]);
            console.log('Default users seeded successfully.');
        }
        // Check if units already exist
        const unitCount = await unit_model_1.Unit.count();
        if (unitCount === 0) {
            console.log('Seeding default units...');
            await unit_model_1.Unit.bulkCreate([
                {
                    _id: '6667f1f77bcf86cd79943004',
                    unitCode: 'DZ85-21',
                    unitModel: 'D85ESS',
                    site: 'TAA',
                    section: 'TRACK',
                    isActive: true,
                },
                {
                    _id: '6667f1f77bcf86cd79943005',
                    unitCode: 'EX3600-6',
                    unitModel: 'EX3600',
                    site: 'TAA',
                    section: 'TRACK',
                    isActive: true,
                },
                {
                    _id: '6667f1f77bcf86cd79943006',
                    unitCode: 'PC200-8',
                    unitModel: 'PC200',
                    site: 'TAA',
                    section: 'WHEEL',
                    isActive: true,
                },
            ]);
            console.log('Default units seeded successfully.');
        }
    }
    catch (error) {
        console.error('Failed to seed database:', error);
    }
}
