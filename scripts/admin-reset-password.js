import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetUserPassword() {
  try {
    // Get user input
    const userEmail = process.argv[2];
    const newPassword = process.argv[3];

    if (!userEmail || !newPassword) {
      console.log(
        '❌ Usage: node scripts/admin-reset-password.js <email> <new-password>'
      );
      console.log(
        '📝 Example: node scripts/admin-reset-password.js student@university.edu newPassword123'
      );
      process.exit(1);
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true, name: true, role: true, email: true },
    });

    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    // Hash the new password
    console.log('🔐 Hashing password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    console.log('✅ Password successfully updated!');
    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`🔑 Role: ${user.role}`);
    console.log(`🕐 Updated: ${new Date().toISOString()}`);
    console.log('');
    console.log('⚠️  Security Note: User should change password on next login');
  } catch (error) {
    console.error('❌ Error updating password:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

resetUserPassword();
