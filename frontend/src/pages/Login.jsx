import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email');
    if (!form.password) return setError('Password is required');

    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h1>Log in</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <label>Email
          <input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" />
        </label>
        <label>Password
          <div className="password-row">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            <button type="button" className="secondary" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'Logging in...' : 'Log in'}</button>
      </form>
      <p>New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}