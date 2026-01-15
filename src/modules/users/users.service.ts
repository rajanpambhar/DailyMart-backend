// =====================================================
// USERS SERVICE
// Business logic for user management
// =====================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // GET ALL USERS (Admin only)
  // =====================================================
  async findAll() {
    // MongoDB Prisma fix: fetch all and filter manually
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Filter soft deleted and remove deletedAt from result items
    return users.filter(user => !user.deletedAt).map(({ deletedAt, ...u }) => u);
  }

  // =====================================================
  // GET USER BY ID
  // =====================================================
  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const { deletedAt, ...userWithoutDeletedAt } = user;
    return userWithoutDeletedAt;
  }

  // =====================================================
  // GET USER STATISTICS (Admin only)
  // =====================================================
  async getStatistics() {
    // Fetch all users to filter in memory for accurate stats
    const users = await this.prisma.user.findMany({
      select: { deletedAt: true, role: true, createdAt: true },
    });
    
    // Filter active users
    const activeUsers = users.filter(u => !u.deletedAt);
    
    const totalUsers = activeUsers.length;
    const totalAdmins = activeUsers.filter(u => u.role === UserRole.ADMIN).length;
    
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentUsers = activeUsers.filter(u => new Date(u.createdAt) >= oneMonthAgo).length;

    return {
      totalUsers,
      totalAdmins,
      totalRegularUsers: totalUsers - totalAdmins,
      recentUsers,
    };
  }

  // =====================================================
  // UPDATE USER PROFILE
  // =====================================================
  async updateProfile(id: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.findById(id);

    return this.prisma.user.update({
      where: { id: user.id },
      data: updateProfileDto,
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // =====================================================
  // CHANGE PASSWORD
  // =====================================================
  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmNewPassword } = changePasswordDto;

    // Validate new password confirmation
    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('New passwords do not match');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user || user.deletedAt) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password changed for user: ${id}`);

    return { message: 'Password changed successfully' };
  }

  // =====================================================
  // TOGGLE USER ROLE (Admin only)
  // =====================================================
  async toggleRole(id: string, adminId: string) {
    if (id === adminId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const user = await this.findById(id);

    const newRole = user.role === UserRole.ADMIN ? UserRole.USER : UserRole.ADMIN;

    return this.prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        fullname: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // =====================================================
  // DELETE USER (Soft delete, Admin only)
  // =====================================================
  async deleteUser(id: string, adminId: string) {
    if (id === adminId) {
      throw new ForbiddenException('You cannot delete your own account');
    }

    await this.findById(id);

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`User soft deleted: ${id}`);

    return { message: 'User deleted successfully' };
  }
}
