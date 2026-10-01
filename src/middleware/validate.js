import { ApiError } from '../utils/asyncHandler.js';

export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return next(new ApiError(422, details[0]?.message || 'Invalid data.', details));
  }
  req[source] = result.data;
  next();
};
