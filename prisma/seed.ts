import 'dotenv/config';
import { hash } from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not defined');

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const password = await hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@fooddelivery.local' },
    update: { password, role: 'ADMIN', fullname: 'System Admin', isActive: true },
    create: {
      email: 'admin@fooddelivery.local',
      password,
      fullname: 'System Admin',
      role: 'ADMIN',
      isActive: true,
    },
    select: { id: true, email: true, role: true },
  });
  console.log('Admin ready:', admin);

  const driverPassword = await hash('driver123', 10);
  const drivers = [
    {
      email: 'driver1@fooddelivery.local', fullname: 'Test Driver 1', phone: '0810000001',
      licenseNumber: 'DL-DRIVER-001', vehiclePlate: 'กก-1001', latitude: 13.7510, longitude: 100.5090,
    },
    {
      email: 'driver2@fooddelivery.local', fullname: 'Test Driver 2', phone: '0810000002',
      licenseNumber: 'DL-DRIVER-002', vehiclePlate: 'กก-1002', latitude: 13.7800, longitude: 100.5400,
    },
  ];

  for (const data of drivers) {
    const driver = await prisma.user.upsert({
      where: { email: data.email },
      update: { password: driverPassword, role: 'DRIVER', fullname: data.fullname, isActive: true, phone: data.phone },
      create: { email: data.email, password: driverPassword, role: 'DRIVER', fullname: data.fullname, phone: data.phone },
    });
    await prisma.driverProfile.upsert({
      where: { userId: driver.id },
      update: { licenseNumber: data.licenseNumber, vehicleType: 'MOTORCYCLE', vehiclePlate: data.vehiclePlate, isVerified: true, isOnline: true, isBusy: false },
      create: { userId: driver.id, licenseNumber: data.licenseNumber, vehicleType: 'MOTORCYCLE', vehiclePlate: data.vehiclePlate, isVerified: true, isOnline: true, isBusy: false },
    });
    await prisma.driverLocation.upsert({
      where: { driverId: driver.id },
      update: { latitude: data.latitude, longitude: data.longitude },
      create: { driverId: driver.id, latitude: data.latitude, longitude: data.longitude },
    });
    console.log('Driver ready:', { id: driver.id, email: driver.email, latitude: data.latitude, longitude: data.longitude });
  }
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
