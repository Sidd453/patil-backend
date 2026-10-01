import { z } from 'zod';

const dateStr = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date in YYYY-MM-DD format.');
const monthStr = z.string().regex(/^\d{4}-\d{2}$/, 'Use a month in YYYY-MM format.');
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id.');
const phone = z.string().trim().regex(/^[0-9+\-\s]{7,15}$/, 'Enter a valid phone number.');
const optionalEmail = z.union([z.literal(''), z.string().trim().email('Enter a valid email.')]).optional();

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.'),
});

const roleEnum = z.enum(['admin', 'manager', 'accountant', 'teacher', 'receptionist']);
export const userSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name.'),
  email: z.string().trim().email('Enter a valid email.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  role: roleEnum.default('receptionist'),
});
export const userUpdateSchema = z.object({
  name: z.string().trim().min(2, 'Enter a name.').optional(),
  role: roleEnum.optional(),
});
export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters.'),
});

export const batchSchema = z.object({
  name: z.string().trim().min(2, 'Enter a batch name.'),
  className: z.string().trim().min(1, 'Enter the class.'),
  subjects: z.array(z.string().trim().min(1)).default([]),
  timing: z.string().trim().default(''),
  fee: z.coerce.number().min(0).default(0),
  capacity: z.coerce.number().int().min(1).default(30),
  active: z.boolean().default(true),
});

export const studentSchema = z.object({
  name: z.string().trim().min(2, 'Enter the student name.'),
  parentName: z.string().trim().default(''),
  phone,
  email: optionalEmail,
  school: z.string().trim().default(''),
  address: z.string().trim().default(''),
  batch: objectId,
  admissionDate: dateStr,
  totalFee: z.coerce.number().min(0, 'Fee cannot be negative.'),
  discount: z.coerce.number().min(0).default(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const attendanceBulkSchema = z.object({
  batch: objectId,
  date: dateStr,
  records: z.array(z.object({
    student: objectId,
    status: z.enum(['present', 'absent', 'late', 'leave']),
  })).min(1, 'Mark at least one student.'),
});

export const paymentSchema = z.object({
  student: objectId,
  amount: z.coerce.number().min(1, 'Enter an amount of at least 1.'),
  mode: z.enum(['cash', 'upi', 'card', 'bank']).default('cash'),
  paidOn: dateStr,
  forPeriod: z.string().trim().default(''),
  remarks: z.string().trim().default(''),
});

export const enquirySchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name.').max(80),
  phone,
  email: optionalEmail,
  course: z.string().trim().max(80).default(''),
  message: z.string().trim().max(1000).default(''),
});

export const enquiryStatusSchema = z.object({ status: z.enum(['new', 'contacted', 'joined', 'closed']) });
export { dateStr, monthStr, objectId };
