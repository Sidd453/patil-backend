import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { hasPermission } from '../config/rbac.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

// Verifies the token and loads the user fresh from the database on every request,
// so a disabled account or a changed role takes effect immediately.
export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Please log in to continue.');
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(401, 'Your session has expired. Please log in again.');
  }
  const user = await User.findById(payload.id);
  if (!user || !user.active) throw new ApiError(401, 'This account is no longer active.');
  req.user = user;
  next();
});

// can('fees:collect') allows the request if the role has ALL listed permissions.
export const can = (...perms) => (req, _res, next) => {
  const ok = perms.every((p) => hasPermission(req.user?.role, p));
  if (!ok) return next(new ApiError(403, 'You do not have permission to do this.'));
  next();
};

// Allows if the role has ANY of the listed permissions.
export const canAny = (...perms) => (req, _res, next) => {
  const ok = perms.some((p) => hasPermission(req.user?.role, p));
  if (!ok) return next(new ApiError(403, 'You do not have permission to do this.'));
  next();
};
