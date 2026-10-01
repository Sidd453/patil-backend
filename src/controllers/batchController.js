import Batch from '../models/Batch.js';
import Student from '../models/Student.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

export const listBatches = asyncHandler(async (req, res) => {
  const filter = req.query.active === 'true' ? { active: true } : {};
  const [batches, counts] = await Promise.all([
    Batch.find(filter).sort({ name: 1 }).lean(),
    Student.aggregate([{ $match: { status: 'active' } }, { $group: { _id: '$batch', count: { $sum: 1 } } }]),
  ]);
  const map = new Map(counts.map((c) => [String(c._id), c.count]));
  res.json({ data: batches.map((b) => ({ ...b, students: map.get(String(b._id)) || 0 })) });
});

export const createBatch = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await Batch.create(req.body) });
});

export const updateBatch = asyncHandler(async (req, res) => {
  const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!batch) throw new ApiError(404, 'Batch not found.');
  res.json({ data: batch });
});

export const deleteBatch = asyncHandler(async (req, res) => {
  if (await Student.exists({ batch: req.params.id })) {
    throw new ApiError(409, 'This batch has students. Move them first, or mark the batch inactive.');
  }
  await Batch.findByIdAndDelete(req.params.id);
  res.json({ message: 'Batch deleted.' });
});
