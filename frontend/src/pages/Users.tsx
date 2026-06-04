import { useEffect, useState } from 'react';
import { Plus, Search, Shield, UserCog } from 'lucide-react';
import api from '../api/axios';

interface StaffUser {
  id: number;
  username: string;
  email?: string;
  role: 'admin' | 'pharmacist' | 'cashier';
  first_name?: string;
  last_name?: string;
  phone?: string;
}

const roleTone = {
  admin: { bg: '#fff0ed', color: '#cc3300', label: 'Admin' },
  pharmacist: { bg: '#e8f5ec', color: '#1a6b3a', label: 'Pharmacist' },
  cashier: { bg: '#e6f0ff', color: '#0066cc', label: 'Cashier' },
} as const;

export default function Users() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'pharmacist',
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/users/');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load user accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      role: 'pharmacist',
    });
  };

  const openModal = () => {
    resetForm();
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/users/', formData);
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      const data = err.response?.data;
      const firstError = typeof data === 'object' && data
        ? Object.values(data)[0]
        : null;
      setError(
        Array.isArray(firstError) ? String(firstError[0]) : data?.detail || 'Failed to create user account.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    const name = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
    return (
      user.username.toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term) ||
      (user.phone || '').includes(term) ||
      user.role.toLowerCase().includes(term) ||
      name.includes(term)
    );
  });

  return (
    <div className="page-section">
      <div className="page-hero d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="page-eyebrow">Staff administration</div>
          <h3 className="fw-bold mb-1" style={{ fontSize: 28, color: '#1a1a2e' }}>User Management</h3>
          <p className="text-muted mb-0" style={{ fontSize: 15 }}>Create pharmacist and cashier accounts for pharmacy staff.</p>
        </div>
        <button className="btn btn-success d-flex align-items-center gap-2" onClick={openModal}>
          <Plus size={18} /> Create Staff Account
        </button>
      </div>

      {error && !showModal && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        <div className="col-12 col-xl-4">
          <div className="card border-0 soft-panel h-100">
            <div className="card-body">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="d-flex align-items-center justify-content-center rounded-4"
                  style={{ width: 52, height: 52, background: '#e8f5ec', color: '#1a6b3a' }}
                >
                  <Shield size={24} />
                </div>
                <div>
                  <div className="fw-bold" style={{ color: '#1a1a2e' }}>Access Policy</div>
                  <div className="text-muted" style={{ fontSize: 14 }}>Admins can provision staff accounts directly from the app.</div>
                </div>
              </div>

              <div className="d-grid gap-3">
                <div className="p-3 rounded-4" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div className="fw-semibold mb-1" style={{ color: '#1a6b3a' }}>Pharmacist</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>Can manage medicines, inventory, and pharmacy reports.</div>
                </div>
                <div className="p-3 rounded-4" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <div className="fw-semibold mb-1" style={{ color: '#0066cc' }}>Cashier</div>
                  <div className="text-muted" style={{ fontSize: 13 }}>Can handle POS, customer records, and daily sales workflows.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-8">
          <div className="card border-0 soft-panel">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4">
                <div>
                  <h5 className="fw-bold mb-1" style={{ color: '#1a1a2e' }}>Staff Accounts</h5>
                  <p className="text-muted mb-0" style={{ fontSize: 14 }}>{users.length} total accounts</p>
                </div>
                <div className="input-group page-search" style={{ width: 320 }}>
                  <span className="input-group-text"><Search size={18} /></span>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search username, role, email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-success" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Email</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-5 text-muted">No staff accounts found.</td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => {
                          const tone = roleTone[user.role];
                          return (
                            <tr key={user.id}>
                              <td className="fw-semibold">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || '—'}</td>
                              <td>{user.username}</td>
                              <td>
                                <span className="badge" style={{ background: tone.bg, color: tone.color }}>
                                  {tone.label}
                                </span>
                              </td>
                              <td>{user.email || '—'}</td>
                              <td>{user.phone || '—'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1050 }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content" style={{ borderRadius: 18 }}>
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <UserCog size={18} /> Create Staff Account
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger mb-4">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">First Name</label>
                      <input className="form-control" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Last Name</label>
                      <input className="form-control" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Username *</label>
                      <input className="form-control" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Role *</label>
                      <select className="form-select" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as 'pharmacist' | 'cashier' })}>
                        <option value="pharmacist">Pharmacist</option>
                        <option value="cashier">Cashier</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Phone</label>
                      <input className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Password *</label>
                      <input type="password" className="form-control" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} minLength={8} required />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
