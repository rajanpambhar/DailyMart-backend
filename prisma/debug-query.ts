import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugUser() {
  const email = 'rajanpambhar02@gmail.com';
  
  // Try different query approaches
  console.log('=== Query 1: findFirst with just email ===');
  const user1 = await prisma.user.findFirst({
    where: { email },
  });
  console.log('Result:', user1 ? `Found: ${user1.email}, deletedAt: ${user1.deletedAt}` : 'NOT FOUND');
  
  console.log('\n=== Query 2: findFirst with email AND deletedAt: null ===');
  const user2 = await prisma.user.findFirst({
    where: { email, deletedAt: null },
  });
  console.log('Result:', user2 ? `Found: ${user2.email}` : 'NOT FOUND');
  
  console.log('\n=== Query 3: findFirst with email AND deletedAt: undefined ===');
  const user3 = await prisma.user.findFirst({
    where: { email, deletedAt: undefined },
  });
  console.log('Result:', user3 ? `Found: ${user3.email}` : 'NOT FOUND');
  
  console.log('\n=== Query 4: findFirst with just email, then check deletedAt ===');
  const user4 = await prisma.user.findFirst({
    where: { email },
  });
  if (user4) {
    console.log('User deletedAt value:', JSON.stringify(user4.deletedAt));
    console.log('Is null?:', user4.deletedAt === null);
    console.log('Is undefined?:', user4.deletedAt === undefined);
    console.log('Type:', typeof user4.deletedAt);
  }
  
  await prisma.$disconnect();
}

debugUser().catch(console.error);
