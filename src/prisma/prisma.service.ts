// =====================================================
// PRISMA SERVICE
// Database connection and query service
// =====================================================

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' 
        ? ['info', 'warn', 'error']
        : ['warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection closed');
  }

  // =====================================================
  // SOFT DELETE MIDDLEWARE EXTENSION
  // =====================================================
  
  /**
   * Find records excluding soft-deleted ones
   * Use this for all standard queries
   */
  excludeDeleted<T>(query: T): T {
    return {
      ...query,
      where: {
        ...(query as any).where,
        deletedAt: null,
      },
    } as T;
  }

  /**
   * Soft delete a record by setting deletedAt timestamp
   */
  async softDelete<T>(model: any, where: any): Promise<T> {
    return model.update({
      where,
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Restore a soft-deleted record
   */
  async restore<T>(model: any, where: any): Promise<T> {
    return model.update({
      where,
      data: { deletedAt: null },
    });
  }
}
