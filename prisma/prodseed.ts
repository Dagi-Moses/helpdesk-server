// prisma/seed.ts
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed the first admin."
    );
  }

  // Check whether an admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: Role.ADMIN,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (existingAdmin) {
    if (existingAdmin.email === adminEmail) {
      console.log(`Admin already exists: ${existingAdmin.email}`);
      console.log("No new admin was created.");
      return;
    }

    throw new Error(
      `An admin already exists (${existingAdmin.email}). ` +
        `The seed will not create another admin.`
    );
  }

  // Make sure the requested email isn't already being used
  const existingUser = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });

  if (existingUser) {
    throw new Error(
      `The email ${adminEmail} already belongs to an existing user ` +
        `with role ${existingUser.role}.`
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.create({
    data: {
      email: adminEmail,
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: Role.ADMIN,
    },
  });

  console.log(`First admin created successfully: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });





//   cd ~/helpdesk-backend
// echo "SEED_ADMIN_EMAIL=you@yourcompany.com" >> .env
// echo "SEED_ADMIN_PASSWORD=$(openssl rand -base64 24)" >> .env
// docker compose exec api npx prisma db seed