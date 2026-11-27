import { useState } from 'react';
import api from '../api/axios';
import { getErrorMessage } from '../utils/errors';

const MAX_MB = 5;

export default function ApplyForm({ jobId }) {
  const [coverLetter, setCoverLetter] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // client-side checks (the server checks again)
    if (!file) return setError('Please choose your resume');
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) return setError('Resume must be a PDF, DOC or DOCX file');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Resume must be smaller than ${MAX_MB} MB`);

    const formData = new FormData();            // text + file, like an HTML form
    formData.append('coverLetter', coverLetter);
    formData.append('resume', file);            // the field name must be "resume"

    setSubmitting(true);
    try {
      await api.post(`/jobs/${jobId}/apply`, formData);   // axios sets the multipart header for us
      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) return <p className="success">Application sent! You can track it later in your applications.</p>;

  return (
    <form onSubmit={handleSubmit} className="apply-form" noValidate>
      <h2>Apply for this job</h2>
      {error && <p className="error">{error}</p>}
      <label>Cover letter (optional)
        <textarea rows="4" maxLength="3000" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
      </label>
      <label>Resume (PDF, DOC or DOCX, max {MAX_MB} MB)
        <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files[0] || null)} />
      </label>
      <button type="submit" disabled={submitting}>{submitting ? 'Sending...' : 'Submit application'}</button>
    </form>
  );
}