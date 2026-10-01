import User from '../models/User.js';
import { ROLES, normalizeRole } from '../config/rbac.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

const view = (u) => ({
  _id: u._id, name: u.name, email: u.email, role: normalizeRole(u.role) || u.role,
  active: u.active, createdAt: u.createdAt,
});

const activeAdmins = () => User.countDocuments({ role: 'admin', active: true });
const isSelf = (req) => String(req.user._id) === req.params.id;

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json({ data: users.map(view) });
});

// Read-only role catalogue for the "Roles & access" screen.
export const listRoles = (_req, res) => {
  res.json({ data: Object.entries(ROLES).map(([key, r]) => ({ key, ...r })) });
};

export const createUser = asyncHandler(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ data: view(user) });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (req.body.role && req.body.role !== user.role) {
    if (isSelf(req)) throw new ApiError(400, 'You cannot change your own role.');
    if (user.role === 'admin' && (await activeAdmins()) <= 1) throw new ApiError(400, 'There must be at least one active admin.');
    user.role = req.body.role;
  }
  if (req.body.name) user.name = req.body.name;
  await user.save();
  res.json({ data: view(user) });
});

export const toggleUser = asyncHandler(async (req, res) => {
  if (isSelf(req)) throw new ApiError(400, 'You cannot disable your own account.');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.active && user.role === 'admin' && (await activeAdmins()) <= 1) {
    throw new ApiError(400, 'There must be at least one active admin.');
  }
  user.active = !user.active;
  await user.save();
  res.json({ data: view(user) });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  user.password = req.body.password;
  await user.save();
  res.json({ message: `Password reset for ${user.name}.` });
});
