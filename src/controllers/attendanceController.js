import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { monthRange, todayStr } from '../utils/dates.js';

// Sheet for one batch on one date: every active student with their saved status (or null).
export const getSheet = asyncHandler(async (req, res) => {
  const { batch } = req.query;
  const date = req.query.date || todayStr();
  const students = await Student.find({ batch, status: 'active', admissionDate: { $lte: date } })
    .select('name rollNo phone').sort({ name: 1 }).lean();
  const saved = await Attendance.find({ batch, date }).lean();
  const map = new Map(saved.map((a) => [String(a.student), a.status]));
  res.json({
    date,
    saved: saved.length > 0,
    data: students.map((s) => ({ ...s, status: map.get(String(s._id)) || null })),
  });
});

export const saveBulk = asyncHandler(async (req, res) => {
  const { batch, date, records } = req.body;
  if (date > todayStr()) throw new ApiError(400, 'You cannot mark attendance for a future date.');
  const ids = records.map((r) => r.student);
  const valid = await Student.countDocuments({ _id: { $in: ids }, batch });
  if (valid !== new Set(ids).size) throw new ApiError(400, 'Some students do not belong to this batch.');

  await Attendance.bulkWrite(records.map((r) => ({
    updateOne: {
      filter: { student: r.student, date },
      update: { $set: { batch, status: r.status, markedBy: req.user._id } },
      upsert: true,
    },
  })));
  res.json({ message: `Attendance saved for ${records.length} students.` });
});

// Month report per student for a batch.
export const monthlyReport = asyncHandler(async (req, res) => {
  const { batch, month } = req.query;
  const { from, to } = monthRange(month);
  const [students, rows, days] = await Promise.all([
    Student.find({ batch, status: 'active' }).select('name rollNo phone').sort({ name: 1 }).lean(),
    Attendance.aggregate([
      { $match: { batch: new mongoose.Types.ObjectId(batch), date: { $gte: from, $lte: to } } },
      { $group: { _id: { student: '$student', status: '$status' }, n: { $sum: 1 } } },
    ]),
    Attendance.distinct('date', { batch, date: { $gte: from, $lte: to } }),
  ]);
  const byStudent = new Map();
  rows.forEach((r) => {
    const key = String(r._id.student);
    byStudent.set(key, { ...(byStudent.get(key) || {}), [r._id.status]: r.n });
  });
  const data = students.map((s) => {
    const c = byStudent.get(String(s._id)) || {};
    const present = c.present || 0;
    const late = c.late || 0;
    return {
      ...s, present, late, absent: c.absent || 0, leave: c.leave || 0,
      percentage: days.length ? Math.round(((present + late) / days.length) * 100) : 0,
    };
  });
  res.json({ month, workingDays: days.length, data });
});

export const studentHistory = asyncHandler(async (req, res) => {
  const { month } = req.query;
  const filter = { student: req.params.id };
  if (month) { const { from, to } = monthRange(month); filter.date = { $gte: from, $lte: to }; }
  res.json({ data: await Attendance.find(filter).sort({ date: -1 }).select('date status').lean() });
});
