// Removes keys that start with "$" or contain "." from the request body.
// This stops NoSQL injection such as { "email": { "$gt": "" } }
const clean = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) delete obj[key];
      else clean(obj[key]);
    }
  }
  return obj;
};

module.exports = (req, res, next) => {
  if (req.body) clean(req.body);
  next();
};