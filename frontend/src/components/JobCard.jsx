import { Link } from 'react-router-dom';
import { formatSalary } from '../utils/format';

export default function JobCard({ job }) {
  const salary = formatSalary(job.salaryMin, job.salaryMax);
  return (
    <article className="job-card">
      <h2><Link to={`/jobs/${job._id}`}>{job.title}</Link></h2>
      <p className="muted">{job.company} · {job.location}</p>
      <p>
        <span className="badge">{job.type}</span>
        {salary && <span className="salary">{salary}</span>}
      </p>
      <div className="chips">
        {job.skills.map((skill) => <span key={skill} className="chip">{skill}</span>)}
      </div>
    </article>
  );
}