// Simplified permission checks that trust JWT token instead of querying database
import { AuthenticatedRequest, userCanViewSEPL, userCanCreateSEPL, userCanDeleteSEPL } from '../middleware/auth';
import { Response } from 'express';

// These replace the database-based permission checks
export async function canViewSEPL(req: AuthenticatedRequest): Promise<boolean> {
  return userCanViewSEPL(req);
}

export async function canCreateSEPL(req: AuthenticatedRequest): Promise<boolean> {
  return userCanCreateSEPL(req);
}

export async function canDeleteSEPL(req: AuthenticatedRequest): Promise<boolean> {
  return userCanDeleteSEPL(req);
}

// Helper function
export function getNumericUserId(req: AuthenticatedRequest): number | null {
  const userId = Number(req.user?.id);
  return Number.isNaN(userId) ? null : userId;
}
