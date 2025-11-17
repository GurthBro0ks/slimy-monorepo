/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * This module provides middleware for enforcing role-based permissions.
 *
 * Role Hierarchy (lowest to highest):
 * - user (rank 1): Basic authenticated user
 * - mod (rank 2): Moderator with elevated permissions
 * - admin (rank 3): Administrator with full access
 *
 * This is v1 of the RBAC system and can be extended with:
 * - Granular permission-based access control
 * - Resource-specific permissions
 * - Dynamic role assignment
 * - Custom permission checks
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../lib/session';

/**
 * Role hierarchy mapping
 * Higher numbers indicate higher privilege levels
 */
const roleRank: { [key: string]: number } = {
  user: 1,
  mod: 2,
  admin: 3,
};

/**
 * Supported role types
 */
export type Role = 'user' | 'mod' | 'admin';

/**
 * Middleware factory that creates role-based access control middleware
 *
 * @param required - Minimum required role (user, mod, or admin)
 * @returns Express middleware function that checks user role
 *
 * @example
 * router.get('/admin/users', requireRole('admin'), (req, res) => { ... });
 * router.patch('/guilds/:id', requireRole('mod'), (req, res) => { ... });
 */
export function requireRole(required: Role) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;

    // Check if user is authenticated
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Get role ranks
    const userRoleRank = roleRank[user.role] || 0;
    const requiredRoleRank = roleRank[required] || 0;

    // Check if user has sufficient permissions
    if (userRoleRank >= requiredRoleRank) {
      next();
      return;
    }

    // User does not have sufficient permissions
    res.status(403).json({
      error: 'Forbidden',
      message: `This action requires ${required} role or higher`,
      userRole: user.role,
      requiredRole: required,
    });
  };
}

/**
 * Helper function to check if a user has a specific role or higher
 *
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if user has sufficient permissions, false otherwise
 */
export function hasRole(userRole: string, requiredRole: Role): boolean {
  const userRank = roleRank[userRole] || 0;
  const requiredRank = roleRank[requiredRole] || 0;
  return userRank >= requiredRank;
}

/**
 * Get the numeric rank of a role
 *
 * @param role - The role to get the rank for
 * @returns The numeric rank, or 0 if role is unknown
 */
export function getRoleRank(role: string): number {
  return roleRank[role] || 0;
}
