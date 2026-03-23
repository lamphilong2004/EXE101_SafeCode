export function notFoundHandler(req, res, next) {
  res.status(404).json({ error: "Not found" });
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || err.status || 500;
  const message = err.expose ? err.message : "Internal server error";

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ error: message });
}

export function httpError(statusCode, message, expose = true) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.expose = expose;
  return err;
}
