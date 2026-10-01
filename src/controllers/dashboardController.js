import Attendance from '../models/Attendance.js';
import Enquiry from '../models/Enquiry.js';
import Payment from '../models/Payment.js';
import Student from '../models/Student.js';
import Batch from '../models/Batch.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { todayStr } from '../utils/dates.js';
import { feeFields, paidMap } from '../utils/feeSummary.js';
import { hasPermission } from '../config/rbac.js';

export const stats = asyncHandler(async (req, res) => {
  const finance = hasPermission(req.user.role, 'dashboard:finance');
  const today = todayStr();
  const month = today.slice(0, 7);
  const sixAgo = new Date(); sixAgo.setMonth(sixAgo.getMonth() - 5);
  const fromMonth = `${sixAgo.getFullYear()}-${String(sixAgo.getMonth() + 1).padStart(2, '0')}-01`;

  const [students, batches, newEnquiries, todayAtt, monthPay, trend, studentRows, paid, recent] = await Promise.all([
    Student.countDocuments({ status: 'active' }),
    Batch.countDocuments({ active: true }),
    Enquiry.countDocuments({ status: 'new' }),
    Attendance.aggregate([{ $match: { date: today } }, { $group: { _id: '$status', n: { $sum: 1 } } }]),
    Payment.aggregate([{ $match: { paidOn: { $gte: `${month}-01`, $lte: `${month}-31` } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.aggregate([
      { $match: { paidOn: { $gte: fromMonth } } },
      { $group: { _id: { $substr: ['$paidOn', 0, 7] }, total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
    Student.find({ status: 'active' }).select('totalFee discount').lean(),
    paidMap(),
    Payment.find().populate('student', 'name rollNo').sort({ createdAt: -1 }).limit(6).lean(),
  ]);

  const att = { present: 0, absent: 0, late: 0, leave: 0 };
  todayAtt.forEach((a) => { att[a._id] = a.n; });
  const totalDue = studentRows.reduce((s, st) => s + feeFields(st, paid.get(String(st._id)) || 0).due, 0);

  res.json({
    students, batches,
    newEnquiries: hasPermission(req.user.role, 'enquiries:view') ? newEnquiries : null,
    today: { date: today, ...att, marked: Object.values(att).reduce((a, b) => a + b, 0) },
    // Money figures are only sent to roles with dashboard:finance.
    finance: finance ? {
      totalDue,
      monthCollection: monthPay[0]?.total || 0,
      trend: trend.map((t) => ({ month: t._id, total: t.total })),
      recentPayments: recent,
    } : null,
  });
});
