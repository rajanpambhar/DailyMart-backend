import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function makeAdmin() {
  const user = await prisma.user.update({
    where: { email: 'rajanpambhar02@gmail.com' },
    data: { role: 'ADMIN' },
  });

  console.log('✅ User updated successfully!');
  console.log('Email:', user.email);
  console.log('Name:', user.fullname);
  console.log('Role:', user.role);

  await prisma.$disconnect();
}

makeAdmin().catch(console.error);
