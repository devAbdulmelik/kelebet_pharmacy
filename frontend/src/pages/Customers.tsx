import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Search, Plus, Edit2, Trash2, History, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasRoleAccess, NAV_PERMISSIONS } from '../auth/permissions';

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  created_at?: string;
  purchase_history?: Sale[];
}

interface SaleItem {
  id: number;
  medicine_name: string;
  quantity: number;
  unit_price: string | number;
  subtotal: string | number;
}

interface Sale {
  id: number;
  invoice_number: string;
  customer_name?: string;
  payment_method: string;
  total_amount: string | number;
  sale_date: string;
  items: SaleItem[];
}

export default function Customers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const canManageCustomers = hasRoleAccess(user, NAV_PERMISSIONS.customers);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/customers/');
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    });
    setShowModal(true);
  };

  const openHistoryModal = (customer: Customer) => {
    setHistoryCustomer(customer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}/`, formData);
      } else {
        await api.post('/customers/', formData);
      }
      setShowModal(false);
      fetchCustomers();
      alert(editingCustomer ? 'Customer updated!' : 'Customer added successfully!');
    } catch (err) {
      alert("Failed to save customer");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this customer?")) return;
    try {
      await api.delete(`/customers/${id}/`);
      fetchCustomers();
    } catch (err) {
      alert("Failed to delete customer");
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-section">
      <div className="page-hero d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="page-eyebrow">Customer directory</div>
          <h4 className="fw-bold mb-1">Customers</h4>
          <p className="text-muted mb-0">{customers.length} registered customers</p>
        </div>
        <div className="d-flex gap-3 flex-wrap justify-content-end">
          <div className="input-group page-search" style={{ width: 320 }}>
            <span className="input-group-text"><Search size={18} /></span>
            <input
              type="text"
              className="form-control"
              placeholder="Search customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canManageCustomers && (
            <button className="btn btn-success d-flex align-items-center gap-2" onClick={openAddModal}>
              <Plus size={18} /> Add Customer
            </button>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm soft-panel" style={{ borderRadius: 16 }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{ background: '#f8f9fa' }}>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Address</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="fw-medium">{customer.name}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>{customer.email || '-'}</td>
                  <td className="text-muted small">{customer.address || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => openHistoryModal(customer)}>
                      <History size={16} />
                    </button>
                    {canManageCustomers && (
                      <>
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openEditModal(customer)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(customer.id)}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
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
                <h5>{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Full Name *</label>
                    <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input type="text" className="form-control" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows={3} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success">
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {historyCustomer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content" style={{ borderRadius: 16 }}>
              <div className="modal-header">
                <div>
                  <h5 className="mb-1">Purchase History</h5>
                  <div className="text-muted" style={{ fontSize: 14 }}>{historyCustomer.name}</div>
                </div>
                <button type="button" className="btn-close" onClick={() => setHistoryCustomer(null)}></button>
              </div>
              <div className="modal-body">
                {!historyCustomer.purchase_history || historyCustomer.purchase_history.length === 0 ? (
                  <div className="text-center py-4 text-muted">No sales tied to this customer yet.</div>
                ) : (
                  <div className="d-grid gap-3">
                    {historyCustomer.purchase_history.map((sale) => (
                      <div key={sale.id} className="border rounded-3 p-3" style={{ borderColor: '#e5e7eb' }}>
                        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                          <div>
                            <div className="fw-bold" style={{ color: '#1a1a2e' }}>{sale.invoice_number}</div>
                            <div className="text-muted" style={{ fontSize: 13 }}>
                              {new Date(sale.sale_date).toLocaleString()}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="fw-bold" style={{ color: '#1a6b3a' }}>ETB {Number(sale.total_amount).toFixed(2)}</div>
                            <div className="text-muted text-uppercase" style={{ fontSize: 12 }}>
                              {sale.payment_method.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                        <div className="table-responsive">
                          <table className="table table-sm mb-0">
                            <thead>
                              <tr>
                                <th>Medicine</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.items.map((item) => (
                                <tr key={item.id}>
                                  <td>{item.medicine_name}</td>
                                  <td>{item.quantity}</td>
                                  <td>ETB {Number(item.unit_price).toFixed(2)}</td>
                                  <td>ETB {Number(item.subtotal).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary d-flex align-items-center gap-2" onClick={() => setHistoryCustomer(null)}>
                  <X size={16} /> Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
