import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin() {
  const email = 'rajanpambhar02@gmail.com';
  const password = 'Rajan123';
  
  // Find user
  const user = await prisma.user.findFirst({
    where: { email },
  });
  
  if (!user) {
    console.log('❌ User not found!');
    await prisma.$disconnect();
    return;
  }
  
  console.log('User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Role:', user.role);
  console.log('  DeletedAt:', user.deletedAt);
  
  // Test password comparison
  console.log('\nTesting password...');
  const isValid = await bcrypt.compare(password, user.password);
  console.log('  Password valid:', isValid);
  
  if (!isValid) {
    // Create correct hash and update
    console.log('\n❌ Password mismatch! Updating password...');
    const newHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash },
    });
    console.log('✅ Password updated!');
    
    // Test again
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    const isValidNow = await bcrypt.compare(password, updatedUser!.password);
    console.log('  Password valid now:', isValidNow);
  }
  
  await prisma.$disconnect();
}

testLogin().catch(console.error);
