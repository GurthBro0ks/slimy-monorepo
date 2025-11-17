import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create a user
  const user = await prisma.user.upsert({
    where: { email: 'admin@slimy.ai' },
    update: {},
    create: {
      email: 'admin@slimy.ai',
      username: 'admin',
      name: 'Admin User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    },
  });
  console.log('Created user:', user);

  // Create a guild
  const guild = await prisma.guild.upsert({
    where: { discordId: '1234567890123456789' },
    update: {},
    create: {
      discordId: '1234567890123456789',
      name: 'Slimy AI Community',
      description: 'The official Slimy AI community server',
      ownerId: user.id,
      icon: 'https://cdn.discordapp.com/icons/1234567890123456789/example.png',
      isActive: true,
    },
  });
  console.log('Created guild:', guild);

  // Create a session for the user
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: `seed_token_${Date.now()}`,
      expiresAt,
      ipAddress: '127.0.0.1',
      userAgent: 'Seed Script',
    },
  });
  console.log('Created session:', session);

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
