import Enquiry from '../models/Enquiry.js';
import { ApiError, asyncHandler } from '../utils/asyncHandler.js';

export const createEnquiry = asyncHandler(async (req, res) => {
  await Enquiry.create(req.body);
  res.status(201).json({ message: 'Enquiry received. We will contact you shortly.' });
});

export const listEnquiries = asyncHandler(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json({ data: await Enquiry.find(filter).sort({ createdAt: -1 }).limit(200).lean() });
});

export const updateEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!enquiry) throw new ApiError(404, 'Enquiry not found.');
  res.json({ data: enquiry });
});

export const deleteEnquiry = asyncHandler(async (req, res) => {
  await Enquiry.findByIdAndDelete(req.params.id);
  res.json({ message: 'Enquiry deleted.' });
});
