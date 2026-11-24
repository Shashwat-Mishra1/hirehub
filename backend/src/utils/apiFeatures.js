// ?page=2&limit=10  ->  { page, limit, skip }
exports.parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);  // never more than 100
  return { page, limit, skip: (page - 1) * limit };
};

// ?sort=-createdAt,title  -> only allowed field names get through
exports.parseSort = (sort, allowed, fallback = '-createdAt') => {
  if (!sort || typeof sort !== 'string') return fallback;
  const fields = sort
    .split(',')
    .filter((f) => allowed.includes(f.replace(/^-/, '')))
    .join(' ');
  return fields || fallback;
};

// make user text safe to put inside a regular expression
exports.escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');