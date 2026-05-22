import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const users = [
    {
      email: "admin@kreston.al",
      name: "Admin User",
      password: "admin123",
      role: "ADMIN" as const,
      department: null,
    },
    {
      email: "partner@kreston.al",
      name: "Partner User",
      password: "partner123",
      role: "PARTNER" as const,
      department: null,
    },
    {
      email: "hr.manager@kreston.al",
      name: "HR Manager",
      password: "hr123",
      role: "MANAGER" as const,
      department: "HR" as const,
    },
    {
      email: "hr.associate@kreston.al",
      name: "HR Associate",
      password: "hr123",
      role: "ASSOCIATE" as const,
      department: "HR" as const,
    },
    {
      email: "client@alpha.com",
      name: "Alpha Corp Client",
      password: "client123",
      role: "CLIENT" as const,
      department: null,
    },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: userData.role,
        department: userData.department,
      },
    });

    console.log(`  Created/updated user: ${userData.email}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
