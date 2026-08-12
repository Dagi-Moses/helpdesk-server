import { PrismaClient, Role, Priority, TicketStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123", 12);

  const department = await prisma.department.upsert({
    where: { name: "IT Operations" },
    update: {},
    create: { name: "IT Operations" },
  });

  await prisma.user.upsert({
    where: { email: "admin@helpdesk.local" },
    update: {},
    create: {
      email: "admin@helpdesk.local",
      passwordHash,
      firstName: "Ada",
      lastName: "Admin",
      role: Role.ADMIN,
      departmentId: department.id,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@helpdesk.local" },
    update: {},
    create: {
      email: "agent@helpdesk.local",
      passwordHash,
      firstName: "Sam",
      lastName: "Agent",
      role: Role.SUPPORT_AGENT,
      departmentId: department.id,
    },
  });

  const employee = await prisma.user.upsert({
    where: { email: "employee@helpdesk.local" },
    update: {},
    create: {
      email: "employee@helpdesk.local",
      passwordHash,
      firstName: "Emma",
      lastName: "Employee",
      role: Role.EMPLOYEE,
      departmentId: department.id,
    },
  });

  const categories = await Promise.all(
    ["Hardware", "Software", "Network", "Email", "Access Request"].map((name) =>
      prisma.category.upsert({ where: { name }, update: {}, create: { name } })
    )
  );

  await prisma.ticket.create({
    data: {
      title: "Laptop won't turn on",
      description: "My laptop screen stays black even after holding the power button.",
      status: TicketStatus.ASSIGNED,
      priority: Priority.HIGH,
      categoryId: categories[0].id,
      createdById: employee.id,
      assignedToId: agent.id,
    },
  });

  await prisma.ticket.create({
    data: {
      title: "Need access to shared drive",
      description: "Requesting read/write access to the Finance shared drive.",
      status: TicketStatus.OPEN,
      priority: Priority.MEDIUM,
      categoryId: categories[4].id,
      createdById: employee.id,
    },
  });

  console.log("Seed complete. Login with:");
  console.log("  admin@helpdesk.local / Password123");
  console.log("  agent@helpdesk.local / Password123");
  console.log("  employee@helpdesk.local / Password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
