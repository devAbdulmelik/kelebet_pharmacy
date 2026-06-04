import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Pill, Home, ShoppingCart, FileText, LogOut, User, Users } from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/medicines', label: 'Medicines', icon: <Pill size={20} /> },
    { path: '/pos', label: 'POS / Sales', icon: <ShoppingCart size={20} /> },
    { path: '/customers', label: 'Customers', icon: <Users size={20} /> }, // ✅ fixed: now JSX element
    { path: '/reports', label: 'Reports', icon: <FileText size={20} /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="d-flex flex-column vh-100 border-end" style={{ width: 260, background: '#f8f9fa' }}>
      <div className="p-4 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <Pill size={32} color="#1a6b3a" />
          <div>
            <h5 className="mb-0 fw-bold">Kelebet Pharmacy</h5>
            <small className="text-muted">Management System</small>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="d-flex align-items-center gap-3 p-3 mb-3 bg-light rounded-3">
          <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center" 
               style={{ width: 40, height: 40 }}>
            <User size={20} />
          </div>
          <div>
            <div className="fw-semibold">{user?.username}</div>
            <small className="text-capitalize text-muted">{user?.role}</small>
          </div>
        </div>

        <nav>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`d-flex align-items-center gap-3 px-3 py-3 rounded-3 mb-1 text-decoration-none ${
                location.pathname === item.path 
                  ? 'bg-success text-white' 
                  : 'text-dark hover-bg-light'
              }`}
            >
              {item.icon}
              <span className="fw-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-3 border-top">
        <button
          onClick={handleLogout}
          className="btn btn-outline-danger w-100 d-flex align-items-center justify-content-center gap-2"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}