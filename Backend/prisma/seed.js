// backend/prisma/seed.js

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcryptjs from "bcryptjs";

// Check env
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env file");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // 1️⃣ Seed Roles - Only ADMIN and TRAVELLER
  const roles = [
    { name: "ADMIN", description: "Administrator with full system access" },
    { name: "TRAVELLER", description: "Regular traveller user" },
  ];

  for (const role of roles) {
    const result = await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
    console.log(`✔ Role: ${result.name}`);
  }

  // 2️⃣ Create Default Admin User
  const hashedPassword = await bcryptjs.hash("Admin@123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@tripmate.com" },
    update: {},
    create: {
      email: "admin@tripmate.com",
      password: hashedPassword,
      firstName: "Tripmate",
      lastName: "Admin",
      phone: "9800000000",
      isVerified: true,
      isActive: true,
      tokenVersion: 0,
      language: "ENGLISH",
      role: {
        connect: { name: "ADMIN" },
      },
    },
    include: { role: true },
  });

  console.log(`✔ Admin User: ${adminUser.email} (Role: ${adminUser.role.name})`);

  // 3️⃣ Create Admin Profile
  await prisma.userProfile.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
    },
  });

  console.log(`✔ Admin Profile created`);

  // 4️⃣ Create Sample Traveller User
  const travellerPassword = await bcryptjs.hash("Traveller@123", 10);

  const travellerUser = await prisma.user.upsert({
    where: { email: "traveller@tripmate.com" },
    update: {},
    create: {
      email: "traveller@tripmate.com",
      password: travellerPassword,
      firstName: "Sample",
      lastName: "Traveller",
      phone: "9800000001",
      isVerified: true,
      isActive: true,
      tokenVersion: 0,
      language: "ENGLISH",
      role: {
        connect: { name: "TRAVELLER" },
      },
    },
    include: { role: true },
  });

  console.log(`✔ Traveller User: ${travellerUser.email} (Role: ${travellerUser.role.name})`);

  // 5️⃣ Create Traveller Profile
  await prisma.userProfile.upsert({
    where: { userId: travellerUser.id },
    update: {},
    create: {
      userId: travellerUser.id,
    },
  });

  console.log(`✔ Traveller Profile created`);

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
