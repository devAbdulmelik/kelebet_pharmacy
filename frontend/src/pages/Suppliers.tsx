import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, Plus, Edit2, Trash2, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasRoleAccess, NAV_PERMISSIONS } from '../auth/permissions';

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
}

export default function Suppliers() {
  const { user } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });
  const canManageSuppliers = hasRoleAccess(user, NAV_PERMISSIONS.suppliers);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/suppliers/');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError('Failed to load suppliers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setFormData({ name: '', contact_person: '', phone: '', email: '', address: '' });
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      contact_person: supplier.contact_person || '',
      phone: supplier.phone,
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this supplier?")) return;

    try {
      await api.delete(`/suppliers/${id}/`);
      fetchSuppliers();
      alert("Supplier deleted successfully");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to delete supplier");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await api.put(`/suppliers/${editingSupplier.id}/`, formData);
        alert("Supplier updated successfully!");
      } else {
        await api.post('/suppliers/', formData);
        alert("Supplier added successfully!");
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to save supplier");
    }
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_person || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.phone || '').includes(search) ||
    (s.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-section">
      <div className="page-hero d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="page-eyebrow">Vendor management</div>
          <h4 className="fw-bold mb-1">Suppliers</h4>
          <p className="text-muted mb-0">{suppliers.length} registered suppliers</p>
        </div>

        <div className="d-flex gap-3 flex-wrap justify-content-end">
          <div className="input-group page-search" style={{ width: 380 }}>
            <span className="input-group-text"><Search size={18} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search supplier, contact person or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManageSuppliers && (
            <button className="btn btn-success d-flex align-items-center gap-2" onClick={openAddModal}>
              <Plus size={18} /> Add Supplier
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card border-0 shadow-sm soft-panel" style={{ borderRadius: 16 }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th>Supplier Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="fw-semibold">{supplier.name}</td>
                  <td>{supplier.contact_person || '—'}</td>
                  <td>{supplier.phone}</td>
                  <td>{supplier.email || '—'}</td>
                  <td className="text-muted small">{supplier.address || '—'}</td>
                  <td>
                    {canManageSuppliers && (
                      <>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditModal(supplier)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(supplier.id)}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    No suppliers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog">
            <div className="modal-content" style={{ borderRadius: 16 }}>
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body row g-3">
                  <div className="col-12">
                    <label className="form-label">Supplier Name *</label>
                    <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Contact Person</label>
                    <input type="text" className="form-control" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Phone Number *</label>
                    <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows={3} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success">
                    {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
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
