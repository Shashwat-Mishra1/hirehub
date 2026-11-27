import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="card">
      <h1>Welcome, {user.name}</h1>
      <p>You are logged in as <b>{user.role}</b> ({user.email}).</p>
      <button onClick={handleLogout}>Log out</button>
    </div>
  );
}