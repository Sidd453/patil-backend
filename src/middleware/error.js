import { env } from '../config/env.js';

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Something went wrong.';

  if (err.name === 'CastError') { status = 400; message = 'Invalid id.'; }
  if (err.code === 11000) {
    status = 409;
    message = `${Object.keys(err.keyPattern || {})[0] || 'Value'} already exists.`;
  }
  if (err.name === 'ValidationError') { status = 422; message = Object.values(err.errors)[0].message; }
  if (status === 500) console.error(err);

  res.status(status).json({
    message: status === 500 && env.nodeEnv === 'production' ? 'Something went wrong.' : message,
    ...(err.details && { details: err.details }),
  });
};
