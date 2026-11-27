import { useEffect, useState } from 'react';
import api from '../api/axios';
import useDebounce from '../hooks/useDebounce';
import JobCard from '../components/JobCard';
import Pagination from '../components/Pagination';
import { getErrorMessage } from '../utils/errors';

export default function Jobs() {
  const [filters, setFilters] = useState({ search: '', location: '', type: '', sort: '-createdAt' });
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // wait until the user stops typing before calling the API
  const search = useDebounce(filters.search);
  const location = useDebounce(filters.location);

  useEffect(() => {
    let cancelled = false;                       // ignore answers that arrive too late
    const params = { page, limit: 6, sort: filters.sort };
    if (search) params.search = search;
    if (location) params.location = location;
    if (filters.type) params.type = filters.type;

    setLoading(true);
    setError('');
    api.get('/jobs', { params })
      .then((res) => {
        if (cancelled) return;
        setJobs(res.data.data);
        setPagination(res.data.pagination);
      })
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [search, location, filters.type, filters.sort, page]);

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);                                  // a new filter always starts at page 1
  };

  const clearFilters = () => {
    setFilters({ search: '', location: '', type: '', sort: '-createdAt' });
    setPage(1);
  };

  return (
    <div>
      <h1>Find your next job</h1>

      <div className="filters">
        <input name="search" placeholder="Search title, company or skill" value={filters.search} onChange={handleChange} />
        <input name="location" placeholder="Location" value={filters.location} onChange={handleChange} />
        <select name="type" value={filters.type} onChange={handleChange}>
          <option value="">All types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="contract">Contract</option>
          <option value="remote">Remote</option>
        </select>
        <select name="sort" value={filters.sort} onChange={handleChange}>
          <option value="-createdAt">Newest first</option>
          <option value="title">Title A to Z</option>
          <option value="-salaryMax">Highest salary</option>
        </select>
        <button className="secondary" onClick={clearFilters}>Clear</button>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Loading jobs...</p>}

      {!loading && !error && jobs.length === 0 && (
        <p className="empty">No jobs match your search. Try different words or clear the filters.</p>
      )}

      {!loading && jobs.length > 0 && (
        <>
          <p className="muted">{pagination.total} jobs found</p>
          <div className="job-grid">
            {jobs.map((job) => <JobCard key={job._id} job={job} />)}
          </div>
          <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}