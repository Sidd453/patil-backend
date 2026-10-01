import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    className: { type: String, required: true, trim: true },
    subjects: [{ type: String, trim: true }],
    timing: { type: String, trim: true, default: '' },
    fee: { type: Number, min: 0, default: 0 },
    capacity: { type: Number, min: 1, default: 30 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Batch', batchSchema);
