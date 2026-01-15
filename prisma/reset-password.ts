import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function resetPassword() {
  const newPassword = 'Rajan123';
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  const user = await prisma.user.update({
    where: { email: 'rajanpambhar02@gmail.com' },
    data: { password: hashedPassword },
  });
  
  console.log('✅ Password reset successfully!');
  console.log('Email:', user.email);
  console.log('New Password:', newPassword);
  console.log('Role:', user.role);
  
  await prisma.$disconnect();
}

resetPassword().catch(console.error);
