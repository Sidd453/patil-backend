import mongoose from 'mongoose';
import { nextSeq } from './Counter.js';

const paymentSchema = new mongoose.Schema(
  {
    receiptNo: { type: String, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    amount: { type: Number, required: true, min: 1 },
    mode: { type: String, enum: ['cash', 'upi', 'card', 'bank'], default: 'cash' },
    paidOn: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    forPeriod: { type: String, trim: true, default: '' },
    remarks: { type: String, trim: true, default: '' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

paymentSchema.index({ student: 1, paidOn: -1 });
paymentSchema.index({ paidOn: -1 });

paymentSchema.pre('validate', async function assignReceipt(next) {
  if (this.isNew && !this.receiptNo) {
    const seq = await nextSeq('receipt');
    this.receiptNo = `RC-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Payment', paymentSchema);
