function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);
  const status = err.status || 500;
  const code = err.code || (status === 500 ? 'server_error' : 'error');
  const message = err.message || 'Internal error';
  const body = { error: { code, message } };
  if (err.details) body.error.details = err.details;
  res.status(status).json(body);
}

module.exports = errorHandler;
