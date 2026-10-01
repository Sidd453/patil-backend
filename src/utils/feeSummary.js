import mongoose from 'mongoose';
import Payment from '../models/Payment.js';

// Returns Map<studentId, paidAmount> for the given student ids (or all when omitted).
export const paidMap = async (studentIds) => {
  const match = studentIds ? { student: { $in: studentIds.map((id) => new mongoose.Types.ObjectId(id)) } } : {};
  const rows = await Payment.aggregate([{ $match: match }, { $group: { _id: '$student', paid: { $sum: '$amount' } } }]);
  return new Map(rows.map((r) => [String(r._id), r.paid]));
};

export const feeFields = (student, paid = 0) => {
  const payable = Math.max(student.totalFee - (student.discount || 0), 0);
  return { payable, paid, due: Math.max(payable - paid, 0) };
};
