// turns any Axios error into a message a user can read
export const getErrorMessage = (err) => {
  if (err.response) {
    const { errors, message } = err.response.data || {};
    if (errors && errors.length) return errors.map((e) => e.message).join('. ');
    return message || 'Something went wrong';
  }
  return 'Cannot reach the server. Is the backend running?';
};