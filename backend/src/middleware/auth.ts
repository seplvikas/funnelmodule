import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    oid?: string;
    permissions?: {
      can_view_sepl?: boolean;
      can_create_sepl?: boolean;
      can_delete_sepl?: boolean;
      is_admin?: boolean;
    };
  };
}

// Extract JWT token from Authorization header or cookie
function extractToken(req: Request): string | null {
  // Check Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookie
  const cookies = req.headers.cookie?.split('; ') || [];
  for (const cookie of cookies) {
    if (cookie.startsWith('spm_token=')) {
      return cookie.substring('spm_token='.length);
    }
  }

  return null;
}

// Decode JWT without verification (we trust the main portal's token)
function decodeToken(token: string): any {
  try {
    // Decode without verification since we trust the shared cookie from main portal
    const decoded = jwt.decode(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = decodeToken(token);
  
  if (!decoded || !decoded.id) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Populate req.user with decoded token data
  req.user = {
    id: decoded.id,
    email: decoded.email,
    name: decoded.name,
    oid: decoded.oid,
    permissions: decoded.permissions || {}, // Include permissions from token if available
  };

  console.log('✅ Authenticated user:', req.user.email, 'ID:', req.user.id);

  next();
};

// Helper to check SEPL permissions from token (not database)
export function userCanViewSEPL(req: AuthenticatedRequest): boolean {
  if (!req.user) return false;
  
  // Allow if user is admin or has can_view_sepl permission
  const perms = req.user.permissions || {};
  return perms.is_admin === true || perms.can_view_sepl === true;
}

export function userCanCreateSEPL(req: AuthenticatedRequest): boolean {
  if (!req.user) return false;
  
  const perms = req.user.permissions || {};
  return perms.is_admin === true || perms.can_create_sepl === true || perms.can_view_sepl === true;
}

export function userCanDeleteSEPL(req: AuthenticatedRequest): boolean {
  if (!req.user) return false;
  
  const perms = req.user.permissions || {};
  return perms.is_admin === true || perms.can_delete_sepl === true;
}
