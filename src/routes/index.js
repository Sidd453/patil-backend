import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, can, canAny } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as v from '../utils/validators.js';
import * as auth from '../controllers/authController.js';
import * as users from '../controllers/userController.js';
import * as batches from '../controllers/batchController.js';
import * as students from '../controllers/studentController.js';
import * as attendance from '../controllers/attendanceController.js';
import * as fees from '../controllers/feeController.js';
import * as enquiries from '../controllers/enquiryController.js';
import { stats } from '../controllers/dashboardController.js';
import { z } from 'zod';

const router = Router();
const limiter = (max, windowMin) => rateLimit({
  windowMs: windowMin * 60 * 1000, max, standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

// Public
router.get('/health', (_req, res) => res.json({ ok: true }));
router.post('/auth/login', limiter(10, 15), validate(v.loginSchema), auth.login);
router.post('/enquiries', limiter(5, 60), validate(v.enquirySchema), enquiries.createEnquiry);

// Everything below needs a logged-in user. `can(...)` then checks the role's permissions (see config/rbac.js).
router.use(protect);
router.get('/auth/me', auth.me);
router.post('/auth/change-password', validate(v.changePasswordSchema), auth.changePassword);
router.get('/dashboard', can('dashboard:view'), stats);

router.route('/batches')
  .get(canAny('batches:view', 'attendance:view', 'students:view'), batches.listBatches)
  .post(can('batches:manage'), validate(v.batchSchema), batches.createBatch);
router.route('/batches/:id')
  .put(can('batches:manage'), validate(v.batchSchema), batches.updateBatch)
  .delete(can('batches:delete'), batches.deleteBatch);

router.route('/students')
  .get(can('students:view'), students.listStudents)
  .post(can('students:create'), validate(v.studentSchema), students.createStudent);
router.route('/students/:id')
  .get(can('students:view'), students.getStudent)
  .put(can('students:update'), validate(v.studentSchema), students.updateStudent)
  .delete(can('students:delete'), students.deleteStudent);

const sheetQuery = z.object({ batch: v.objectId, date: v.dateStr.optional() });
const reportQuery = z.object({ batch: v.objectId, month: v.monthStr });
router.get('/attendance/sheet', can('attendance:view'), validate(sheetQuery, 'query'), attendance.getSheet);
router.get('/attendance/report', can('attendance:view'), validate(reportQuery, 'query'), attendance.monthlyReport);
router.get('/attendance/student/:id', can('attendance:view'), attendance.studentHistory);
router.post('/attendance/bulk', can('attendance:mark'), validate(v.attendanceBulkSchema), attendance.saveBulk);

router.route('/fees/payments')
  .get(can('fees:view'), fees.listPayments)
  .post(can('fees:collect'), validate(v.paymentSchema), fees.createPayment);
router.get('/fees/payments/:id/receipt', can('fees:receipt'), fees.getReceipt);
router.delete('/fees/payments/:id', can('fees:delete'), fees.deletePayment);
router.get('/fees/dues', can('fees:dues'), fees.dues);

router.get('/enquiries', can('enquiries:view'), enquiries.listEnquiries);
router.patch('/enquiries/:id', can('enquiries:update'), validate(v.enquiryStatusSchema), enquiries.updateEnquiry);
router.delete('/enquiries/:id', can('enquiries:delete'), enquiries.deleteEnquiry);

router.get('/roles', can('users:view'), users.listRoles);
router.route('/users')
  .get(can('users:view'), users.listUsers)
  .post(can('users:manage'), validate(v.userSchema), users.createUser);
router.patch('/users/:id', can('users:manage'), validate(v.userUpdateSchema), users.updateUser);
router.patch('/users/:id/toggle', can('users:manage'), users.toggleUser);
router.post('/users/:id/reset-password', can('users:manage'), validate(v.resetPasswordSchema), users.resetPassword);

export default router;
