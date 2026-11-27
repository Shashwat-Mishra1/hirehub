import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'candidate' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return setError('Name is required');
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError('Enter a valid email');
    if (form.password.length < 8) return setError('Password must be at least 8 characters');
    if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      return setError('Password must contain a letter and a number');
    }

    setSubmitting(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card">
      <h1>Create account</h1>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit} noValidate>
        <label>Name
          <input name="name" value={form.name} onChange={handleChange} autoComplete="name" />
        </label>
        <label>Email
          <input type="email" name="email" value={form.email} onChange={handleChange} autoComplete="email" />
        </label>
        <label>Password
          <input type="password" name="password" value={form.password} onChange={handleChange} autoComplete="new-password" />
        </label>
        <label>I am a
          <select name="role" value={form.role} onChange={handleChange}>
            <option value="candidate">Candidate (looking for jobs)</option>
            <option value="recruiter">Recruiter (hiring)</option>
          </select>
        </label>
        <button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create account'}</button>
      </form>
      <p>Already registered? <Link to="/login">Log in</Link></p>
    </div>
  );
}