import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import Payment from '../models/Payment.js';
import Attendance from '../models/Attendance.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { feeFields, paidMap } from '../utils/feeSummary.js';
import { hasPermission } from '../config/rbac.js';

// Roles without fees:view (e.g. teacher) never receive money fields.
const FEE_KEYS = ['totalFee', 'discount', 'payable', 'paid', 'due', 'payments'];
const maskFees = (user, obj) => {
  if (hasPermission(user.role, 'fees:view')) return obj;
  const copy = { ...obj };
  FEE_KEYS.forEach((k) => delete copy[k]);
  return copy;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listStudents = asyncHandler(async (req, res) => {
  const { q, batch, status } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const filter = {};
  if (batch) filter.batch = batch;
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(escapeRegex(String(q).trim()), 'i');
    filter.$or = [{ name: rx }, { rollNo: rx }, { phone: rx }, { parentName: rx }];
  }
  const [rows, total] = await Promise.all([
    Student.find(filter).populate('batch', 'name className').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Student.countDocuments(filter),
  ]);
  const paid = await paidMap(rows.map((r) => r._id));
  const data = rows.map((s) => maskFees(req.user, { ...s, ...feeFields(s, paid.get(String(s._id)) || 0) }));
  res.json({ data, total, page, pages: Math.ceil(total / limit) || 1 });
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('batch', 'name className timing').lean();
  if (!student) throw new ApiError(404, 'Student not found.');
  const [payments, att] = await Promise.all([
    Payment.find({ student: student._id }).sort({ paidOn: -1, createdAt: -1 }).lean(),
    Attendance.aggregate([{ $match: { student: student._id } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
  ]);
  const paid = payments.reduce((sum, p) => sum + p.amount, 0);
  const attendance = { present: 0, absent: 0, late: 0, leave: 0 };
  att.forEach((a) => { attendance[a._id] = a.n; });
  const total = Object.values(attendance).reduce((a, b) => a + b, 0);
  attendance.total = total;
  attendance.percentage = total ? Math.round(((attendance.present + attendance.late) / total) * 100) : null;
  res.json({ data: maskFees(req.user, { ...student, ...feeFields(student, paid), payments, attendance }) });
});

export const createStudent = asyncHandler(async (req, res) => {
  if (!(await Batch.exists({ _id: req.body.batch }))) throw new ApiError(400, 'Selected batch does not exist.');
  res.status(201).json({ data: await Student.create(req.body) });
});

export const updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!student) throw new ApiError(404, 'Student not found.');
  res.json({ data: student });
});

export const deleteStudent = asyncHandler(async (req, res) => {
  if (await Payment.exists({ student: req.params.id })) {
    throw new ApiError(409, 'This student has fee records. Mark the student inactive instead of deleting.');
  }
  await Attendance.deleteMany({ student: req.params.id });
  await Student.findByIdAndDelete(req.params.id);
  res.json({ message: 'Student deleted.' });
});
