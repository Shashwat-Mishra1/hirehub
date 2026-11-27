import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card">
      <h1>404</h1>
      <p>We could not find that page.</p>
      <Link to="/dashboard">Go to the dashboard</Link>
    </div>
  );
}