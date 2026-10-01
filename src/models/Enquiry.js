import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    course: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
    status: { type: String, enum: ['new', 'contacted', 'joined', 'closed'], default: 'new' },
  },
  { timestamps: true }
);

export default mongoose.model('Enquiry', enquirySchema);
