import bcrypt from 'bcryptjs';
import { User } from './models/user.model';
import { Unit } from './models/unit.model';

export async function seedDatabase() {
  try {
    // Check if users already exist
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Seeding default users...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('secretpassword', salt);
      const adminPasswordHash = await bcrypt.hash('admin123', salt);

      await User.bulkCreate([
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
    const unitCount = await Unit.count();
    if (unitCount === 0) {
      console.log('Seeding default units...');
      await Unit.bulkCreate([
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
  } catch (error) {
    console.error('Failed to seed database:', error);
  }
}
