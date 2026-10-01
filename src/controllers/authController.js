import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

import { normalizeRole, permissionsFor, ROLES } from '../config/rbac.js';

const publicUser = (u) => {
  const role = normalizeRole(u.role);
  return { id: u._id, name: u.name, email: u.email, role, roleLabel: ROLES[role]?.label, permissions: permissionsFor(role) };
};

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw new ApiError(401, 'Email or password is incorrect.');
  if (!user.active) throw new ApiError(403, 'This account has been disabled.');
  const token = jwt.sign({ id: user._id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
  res.json({ token, user: publicUser(user) });
});

export const me = (req, res) => res.json({ user: publicUser(req.user) });

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) throw new ApiError(400, 'Current password is incorrect.');
  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: 'Password updated.' });
});
