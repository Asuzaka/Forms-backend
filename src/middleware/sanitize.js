const forbiddenKeys = ["__proto__", "$", "$gt", "$ne", "$or", "$and"];

function sanitizeObject(obj = {}) {
  for (const key in obj) {
    if (forbiddenKeys.some((badKey) => key.includes(badKey))) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      sanitizeObject(obj[key]);
    }
  }
}

module.exports = function sanitize(req, res, next) {
  sanitizeObject(req.body);
  sanitizeObject(req.params);
  sanitizeObject(req.query);
  next();
};
