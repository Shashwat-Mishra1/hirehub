// Turns any error into a clean { status, message } pair
const formatError = (err) => {
  let status = err.statusCode || err.status || 500;
  let message = err.message || 'Server error';
  let errors;

  if (err.type === 'entity.parse.failed') {            // broken JSON in the request body
    status = 400;
    message = 'Invalid JSON in request body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body is too large';
  } else if (err.name === 'ValidationError') {         // Mongoose validation
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'CastError') {               // bad id format
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {                     // duplicate key
    status = 409;
    message = 'This value already exists';
  } else if (status >= 500) {
    message = 'Server error';                          // never leak internal details
  }
  return { status, message, errors };
};

exports.sendError = (res, err) => {
  const { status, message, errors } = formatError(err);
  if (status >= 500) console.error(err);               // log real problems on the server
  res.status(status).json({ success: false, message, ...(errors && { errors }) });
};

// for URLs that do not exist
exports.notFound = (req, res) =>
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });

// Express recognises an error handler by its 4 parameters
exports.errorHandler = (err, req, res, next) => exports.sendError(res, err);