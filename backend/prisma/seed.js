const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@smartinventory.com' },
  });

  if (existing) {
    console.log('Admin user already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 12);

  const user = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@smartinventory.com',
      password: hashedPassword,
      role: 'owner',
    },
  });

  const business = await prisma.business.create({
    data: {
      name: "Admin's Business",
      ownerId: user.id,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { businessId: business.id },
  });

  console.log('Default admin user created with business');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
