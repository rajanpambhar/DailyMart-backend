// =====================================================
// ROLES DECORATOR
// Used with RolesGuard for role-based access
// =====================================================

import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
