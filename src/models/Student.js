import mongoose from 'mongoose';
import { nextSeq } from './Counter.js';

const studentSchema = new mongoose.Schema(
  {
    rollNo: { type: String, unique: true },
    name: { type: String, required: true, trim: true },
    parentName: { type: String, trim: true, default: '' },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    school: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    batch: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', required: true },
    admissionDate: { type: String, required: true },
    totalFee: { type: Number, required: true, min: 0 },
    discount: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

studentSchema.index({ batch: 1, status: 1 });

studentSchema.pre('validate', async function assignRoll(next) {
  if (this.isNew && !this.rollNo) {
    const seq = await nextSeq('student');
    this.rollNo = `PU-${String(seq).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model('Student', studentSchema);
