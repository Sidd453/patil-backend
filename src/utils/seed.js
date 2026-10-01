import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Batch from '../models/Batch.js';

const batches = [
  { name: 'Foundation 6-8', className: 'Class 6-8', subjects: ['Maths', 'Science', 'English'], timing: '4:00 PM - 6:00 PM', fee: 12000, capacity: 30 },
  { name: 'SSC Board 10th', className: 'Class 10', subjects: ['Maths', 'Science', 'English'], timing: '7:00 AM - 9:00 AM', fee: 18000, capacity: 30 },
  { name: 'HSC 11-12 Science', className: 'Class 11-12', subjects: ['Physics', 'Chemistry', 'Maths', 'Biology'], timing: '5:00 PM - 8:00 PM', fee: 30000, capacity: 40 },
];

const run = async () => {
  await connectDB();
  if (!(await User.exists({ email: env.admin.email.toLowerCase() }))) {
    await User.create({ ...env.admin, role: 'admin' });
    console.log(`Admin created: ${env.admin.email} / ${env.admin.password}`);
  } else {
    console.log('Admin already exists, skipped.');
  }
  const migrated = await User.updateMany({ role: 'staff' }, { role: 'receptionist' });
  if (migrated.modifiedCount) console.log(`Moved ${migrated.modifiedCount} old staff account(s) to the receptionist role.`);
  if (process.argv.includes('--demo') && !(await Batch.countDocuments())) {
    await Batch.insertMany(batches);
    console.log('Demo batches added.');
  }
  await mongoose.disconnect();
};

run().catch((e) => { console.error(e); process.exit(1); });
