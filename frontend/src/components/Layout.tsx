import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Pill,
  ShoppingCart,
  BarChart2,
  Users,
  UserCog,
  LogOut,
  ChevronRight,
  Building2,
  CalendarDays,
  ShieldCheck,
} from 'lucide-react';
import { hasRoleAccess, NAV_PERMISSIONS, ROLE_LABELS } from '../auth/permissions';
import brandLogo from './assets/logo.png';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, allowedRoles: NAV_PERMISSIONS.dashboard },
  { path: '/medicines', label: 'Medicines', icon: Pill, allowedRoles: NAV_PERMISSIONS.medicines },
  { path: '/pos', label: 'Point of Sale', icon: ShoppingCart, allowedRoles: NAV_PERMISSIONS.pos },
  { path: '/customers', label: 'Customers', icon: Users, allowedRoles: NAV_PERMISSIONS.customers },
  { path: '/suppliers', label: 'Suppliers', icon: Building2, allowedRoles: NAV_PERMISSIONS.suppliers },
  { path: '/users', label: 'User Management', icon: UserCog, allowedRoles: NAV_PERMISSIONS.users },
  { path: '/reports', label: 'Reports', icon: BarChart2, allowedRoles: NAV_PERMISSIONS.reports },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [, setSidebarOpen] = useState(false);

  const visibleNavItems = navItems.filter((item) => hasRoleAccess(user, item.allowedRoles));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell d-flex">
      {/* Sidebar */}
      <aside
        className="app-sidebar d-flex flex-column position-fixed top-0 start-0 h-100"
      >
        {/* Logo */}
        <div className="p-4 border-bottom" style={{ borderColor: 'rgba(255,255,255,0.12)' }}>
          <div className="d-flex align-items-center gap-3">
            <img
              src={brandLogo}
              alt="Kelebet Pharmacy" 
              className="app-brand-logo"
            />
            <div>
              <div className="fw-bold text-white" style={{ fontSize: 20 }}>Kelebet Pharmacy</div>
              <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13 }}>Operations Console</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 py-3 px-2">
          {visibleNavItems.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `d-flex align-items-center gap-3 px-3 py-3 rounded-3 mb-1 text-decoration-none ${
                  isActive ? 'bg-white text-success fw-semibold shadow-sm' : 'text-white-50 hover-nav'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} color={isActive ? '#1a6b3a' : 'rgba(255,255,255,0.8)'} />
                  <span style={{ color: isActive ? '#1a6b3a' : 'rgba(255,255,255,0.9)' }}>{label}</span>
                  {isActive && <ChevronRight size={16} className="ms-auto" color="#1a6b3a" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-top" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
          <div className="d-flex align-items-center gap-3 mb-4 app-sidebar-user">
            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white app-sidebar-avatar">
              {user?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="text-white fw-semibold">{user?.username}</div>
              <span className="badge bg-light text-dark" style={{ fontSize: 11, padding: '7px 10px' }}>
                {user ? ROLE_LABELS[user.role] : ''}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn w-100 d-flex align-items-center justify-content-center gap-2"
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '10px'
            }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="app-main flex-grow-1">
        <div className="app-topbar d-flex align-items-center justify-content-between">
          <div>
            <div className="app-topbar-label">Kelebet Pharmacy</div>
            <div className="app-topbar-subtitle">Secure pharmacy inventory, sales, and reporting workspace</div>
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
            <div className="app-topbar-chip">
              <CalendarDays size={15} />
              <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <div className="app-topbar-chip">
              <ShieldCheck size={15} />
              <span>{user ? ROLE_LABELS[user.role] : 'User'} access</span>
            </div>
          </div>
        </div>
        <main className="app-content">
          <div className="app-content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
