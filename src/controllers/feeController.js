import mongoose from 'mongoose';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';
import { feeFields, paidMap } from '../utils/feeSummary.js';

export const createPayment = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.body.student);
  if (!student) throw new ApiError(404, 'Student not found.');
  const paid = (await paidMap([student._id])).get(String(student._id)) || 0;
  const { due } = feeFields(student, paid);
  if (req.body.amount > due) {
    throw new ApiError(400, `Amount is more than the pending fee (Rs ${due}).`);
  }
  const payment = await Payment.create({ ...req.body, receivedBy: req.user._id });
  res.status(201).json({ data: payment, balance: due - payment.amount });
});

export const listPayments = asyncHandler(async (req, res) => {
  const { student, from, to, mode } = req.query;
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const filter = {};
  if (student) filter.student = new mongoose.Types.ObjectId(student);
  if (mode) filter.mode = mode;
  if (from || to) filter.paidOn = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  const [data, total, sum] = await Promise.all([
    Payment.find(filter).populate({ path: 'student', select: 'name rollNo batch', populate: { path: 'batch', select: 'name' } })
      .sort({ paidOn: -1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Payment.countDocuments(filter),
    Payment.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  res.json({ data, total, page, pages: Math.ceil(total / limit) || 1, collected: sum[0]?.total || 0 });
});

export const getReceipt = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate({ path: 'student', populate: { path: 'batch', select: 'name className' } })
    .populate('receivedBy', 'name').lean();
  if (!payment) throw new ApiError(404, 'Receipt not found.');
  const all = await Payment.find({ student: payment.student._id }).lean();
  const paidTillNow = all.filter((p) => p.paidOn < payment.paidOn || (p.paidOn === payment.paidOn && p.createdAt <= payment.createdAt))
    .reduce((s, p) => s + p.amount, 0);
  res.json({ data: { ...payment, ...feeFields(payment.student, paidTillNow) } });
});

export const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found.');
  res.json({ message: `Receipt ${payment.receiptNo} deleted.` });
});

// Students who still owe fees, largest balance first.
export const dues = asyncHandler(async (req, res) => {
  const filter = { status: 'active' };
  if (req.query.batch) filter.batch = req.query.batch;
  const students = await Student.find(filter).populate('batch', 'name').select('name rollNo phone parentName batch totalFee discount').lean();
  const paid = await paidMap();
  const data = students
    .map((s) => ({ ...s, ...feeFields(s, paid.get(String(s._id)) || 0) }))
    .filter((s) => s.due > 0)
    .sort((a, b) => b.due - a.due);
  res.json({ data, totalDue: data.reduce((sum, s) => sum + s.due, 0) });
});
