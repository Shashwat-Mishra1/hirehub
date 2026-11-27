const money = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export const formatSalary = (min, max) => {
  if (!min && !max) return null;
  return min && max ? `${money(min)} - ${money(max)}` : money(min || max);
};

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });