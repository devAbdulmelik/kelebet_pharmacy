import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Medicines from './pages/Medicines';
import POS from './pages/POS';
import Reports from './pages/Reports';
import Layout from './components/Layout';     // ← Import Layout
import Customers from './pages/Customers';
import Suppliers from './pages/Suppliers';
import Users from './pages/Users';
import ProtectedRoute from './components/ProtectedRoute';
import { NAV_PERMISSIONS } from './auth/permissions';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login Page (Public) */}
          <Route path="/" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            {/* All Protected Pages use the Layout */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route element={<ProtectedRoute allowedRoles={NAV_PERMISSIONS.medicines} />}>
                <Route path="/medicines" element={<Medicines />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={NAV_PERMISSIONS.pos} />}>
                <Route path="/pos" element={<POS />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={NAV_PERMISSIONS.reports} />}>
                <Route path="/reports" element={<Reports />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={NAV_PERMISSIONS.customers} />}>
                <Route path="/customers" element={<Customers />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={NAV_PERMISSIONS.suppliers} />}>
                <Route path="/suppliers" element={<Suppliers />} />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={NAV_PERMISSIONS.users} />}>
                <Route path="/users" element={<Users />} />
              </Route>
            </Route>
          </Route>

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
