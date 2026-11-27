import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ApplyForm from '../components/ApplyForm';
import { formatSalary, formatDate } from '../utils/format';
import { getErrorMessage } from '../utils/errors';

export default function JobDetail() {
  const { id } = useParams();                      // the :id part of /jobs/:id
  const { user } = useAuth();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/jobs/${id}`)
      .then((res) => setJob(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="muted">Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  const salary = formatSalary(job.salaryMin, job.salaryMax);
  const isOpen = job.status === 'open';

  return (
    <div className="detail">
      <Link to="/jobs">&larr; Back to jobs</Link>
      <h1>{job.title}</h1>
      <p className="muted">{job.company} · {job.location}</p>
      <p>
        <span className="badge">{job.type}</span>
        {salary && <span className="salary">{salary}</span>}
        {job.deadline && <span className="muted"> · Apply by {formatDate(job.deadline)}</span>}
      </p>
      <div className="chips">
        {job.skills.map((skill) => <span key={skill} className="chip">{skill}</span>)}
      </div>
      <h2>About the role</h2>
      <p className="description">{job.description}</p>

      <div className="apply-box">
        {!isOpen && <p className="error">This job is no longer accepting applications.</p>}
        {isOpen && !user && (
          <p>Please <Link to="/login">log in</Link> or <Link to="/register">register</Link> as a candidate to apply.</p>
        )}
        {isOpen && user && user.role === 'candidate' && <ApplyForm jobId={job._id} />}
        {isOpen && user && user.role !== 'candidate' && (
          <p className="muted">Only candidates can apply for jobs.</p>
        )}
      </div>
    </div>
  );
}