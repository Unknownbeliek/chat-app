export function errorHandler(err, req, res, next) {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: err.message || 'An unexpected server error occurred.'
  });
}
