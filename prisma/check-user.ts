import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  // Find user without deletedAt filter
  const user = await prisma.user.findFirst({
    where: { email: 'rajanpambhar02@gmail.com' },
  });
  
  if (!user) {
    console.log('❌ User not found!');
    await prisma.$disconnect();
    return;
  }
  
  console.log('User found:');
  console.log('ID:', user.id);
  console.log('Email:', user.email);
  console.log('Fullname:', user.fullname);
  console.log('Role:', user.role);
  console.log('DeletedAt:', user.deletedAt);
  console.log('Password hash:', user.password.substring(0, 30) + '...');
  
  await prisma.$disconnect();
}

checkUser().catch(console.error);
