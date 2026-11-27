import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="navbar">
        <div className="container nav-inner">
          <Link to="/jobs" className="brand">HireHub</Link>
          <nav className="nav-links">
            <NavLink to="/jobs">Jobs</NavLink>
            {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          </nav>
          <div className="nav-user">
            {user ? (
              <>
                <span>{user.name} ({user.role})</span>
                <button className="secondary" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />   {/* the current page appears here */}
      </main>
    </>
  );
}