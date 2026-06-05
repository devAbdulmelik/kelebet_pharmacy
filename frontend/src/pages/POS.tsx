import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Search, Plus, Minus, Trash2, Receipt, Printer } from 'lucide-react';
import brandLogo from '../components/assets/logo.png';

interface Medicine {
  id: number;
  name: string;
  selling_price: number | string;
  quantity: number | string;
}

interface CartItem extends Medicine {
  cartQuantity: number;
}

interface Customer {
  id: number;
  name: string;
  phone?: string;
}

interface ReceiptData {
  id?: number;
  invoiceNumber?: string;
  date: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
  cashReceived?: number;
  tax?: number;
  customerId?: number | null;
  customerName?: string;
}

export default function POS() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money'>('cash');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [medicinesLoading, setMedicinesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const fetchMedicines = async () => {
    setMedicinesLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/medicines/');
      console.log('Medicines fetched:', data);
      // Convert string prices to numbers
      const normalized = (Array.isArray(data) ? data : []).map((m: any) => ({
        ...m,
        selling_price: parseFloat(m.selling_price),
        quantity: parseInt(m.quantity, 10)
      }));
      setMedicines(normalized);
    } catch (err: any) {
      console.error('Error fetching medicines:', err);
      const errorMsg = err.response?.data?.detail || err.message || 'Failed to load medicines';
      setError(errorMsg);
      setMedicines([]);
    } finally {
      setMedicinesLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data } = await api.get('/customers/');
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomers([]);
    }
  };

  useEffect(() => {
    fetchMedicines();
    fetchCustomers();
  }, []);

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (medicine: Medicine) => {
    if (Number(medicine.quantity) <= 0) return;

    setCart(prev => {
      const existing = prev.findIndex(item => item.id === medicine.id);
      if (existing !== -1) {
        return prev.map((item, i) =>
          i === existing ? { ...item, cartQuantity: item.cartQuantity + 1 } : item
        );
      } else {
        return [...prev, { ...medicine, cartQuantity: 1 }];
      }
    });
  };

  const updateCartQuantity = (id: number, newQty: number) => {
    if (newQty < 1) return;
    setCart(prev => prev.map(item =>
      item.id === id ? { ...item, cartQuantity: newQty } : item
    ));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => 
    sum + Number(item.selling_price) * item.cartQuantity, 0
  );

  const taxAmount = totalAmount * 0.15; // 15% tax
  const finalTotal = totalAmount + taxAmount;
  const change = cashReceived - finalTotal;
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId) || null;

  const receiptData: ReceiptData | null = cart.length > 0 || receipt
    ? {
        invoiceNumber: receipt?.invoiceNumber || `INV-${Date.now()}`,
        date: receipt?.date || new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        items: receipt?.items || cart,
        total: receipt?.total || totalAmount,
        tax: receipt?.tax || taxAmount,
        paymentMethod: receipt?.paymentMethod || paymentMethod.replace('_', ' ').toUpperCase(),
        cashReceived: receipt?.cashReceived || (paymentMethod === 'cash' ? cashReceived : 0),
        customerId: receipt?.customerId ?? (selectedCustomer?.id || null),
        customerName: receipt?.customerName || selectedCustomer?.name || '',
      }
    : null;

  const printReceipt = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open('', '', 'width=600,height=800');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Kelebet Pharmacy Receipt</title>
            <style>
              body {
                margin: 0;
                padding: 20px 0;
                background: #ffffff;
                font-family: "Arial Narrow", Inter, Arial, sans-serif;
              }
              .receipt-template {
                background: white;
                padding: 18px 14px;
                font-family: "Arial Narrow", Inter, Arial, sans-serif;
                width: 320px;
                margin: 0 auto;
                line-height: 1.15;
                color: #111111;
              }
              img {
                display: block;
                margin: 0 auto 8px;
              }
              @media print {
                @page {
                  size: 80mm auto;
                  margin: 6mm;
                }
                body {
                  padding: 0;
                }
                .receipt-template {
                  width: auto;
                  box-shadow: none !important;
                }
              }
            </style>
          </head>
          <body>
            ${receiptRef.current.outerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => printWindow.print(), 250);
    }
  };

  const completeSale = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    const completedCart = [...cart];
    try {
      const items = cart.map(item => ({
        medicine: item.id,
        quantity: item.cartQuantity
      }));

      const response = await api.post('/sales/create/', {
        payment_method: paymentMethod,
        customer: selectedCustomerId || null,
        items: items
      });

      setSuccess(true);
      setReceipt({
        id: response.data?.id,
        invoiceNumber: response.data?.invoice_number || `INV-${Date.now()}`,
        date: new Date().toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        items: completedCart,
        total: totalAmount,
        tax: taxAmount,
        paymentMethod: paymentMethod.replace('_', ' ').toUpperCase(),
        cashReceived: paymentMethod === 'cash' ? cashReceived : 0,
        customerId: response.data?.customer ?? (selectedCustomerId || null),
        customerName: response.data?.customer_name || selectedCustomer?.name || '',
      });
      setCart([]);
      setSearchTerm('');
      setCashReceived(0);
      setSelectedCustomerId('');

      // Refresh medicine stock
      fetchMedicines();

      // Auto print receipt after 1 second
      setTimeout(() => {
        if (receiptRef.current) {
          printReceipt();
        }
      }, 1000);

      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to complete sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-section">
      <div className="page-hero d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="page-eyebrow">Point of sale</div>
          <h3 className="fw-bold mb-1" style={{ fontSize: 28, color: '#1a1a2e' }}>Sales Desk</h3>
          <p className="text-muted mb-0" style={{ fontSize: 15 }}>Search medicines, build a cart, and print a branded receipt.</p>
        </div>
        <div className="d-flex gap-2 flex-wrap justify-content-end">
          <span className="badge bg-light text-dark">Products: {medicines.length}</span>
          <span className="badge bg-light text-dark">Cart: {cart.length}</span>
        </div>
      </div>

      <div className="row g-4">
      {/* Medicine Search */}
      <div className="col-lg-7">
        <div className="card border-0 soft-panel" style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          <div className="card-header bg-white border-0 py-4" style={{ borderBottom: '1px solid #e5e7eb' }}>
            <div className="d-flex align-items-center gap-3">
              <Search size={20} color="#1a6b3a" />
              <input
                type="text"
                className="form-control"
                placeholder="Search medicine by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: 10 }}
              />
            </div>
          </div>

          <div className="card-body p-4" style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
            {error && (
              <div 
                className="alert mb-4" 
                role="alert"
                style={{
                  background: '#fff0ed',
                  border: '1px solid rgba(204, 51, 0, 0.2)',
                  color: '#cc3300',
                  borderRadius: 12,
                }}
              >
                <strong style={{ fontWeight: 700 }}>Error:</strong> {error}
                <button className="btn btn-sm btn-outline-danger ms-2" onClick={fetchMedicines}>
                  Retry
                </button>
              </div>
            )}
            {medicinesLoading ? (
              <div className="text-center py-5 text-muted">
                <div className="spinner-border spinner-border-sm mb-2" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p style={{ fontSize: 14 }}>Loading medicines...</p>
              </div>
            ) : medicines.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <p style={{ fontSize: 14 }}>No medicines available.</p>
              </div>
            ) : (
              <div className="row g-3">
                {filteredMedicines.map(med => (
                  <div key={med.id} className="col-12 col-md-6">
                    <div 
                      className="card h-100"
                      style={{ 
                        borderRadius: 12, 
                        border: '1px solid #e5e7eb',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div className="card-body">
                        <h6 className="fw-bold mb-2" style={{ color: '#1a1a2e', fontSize: 14 }}>{med.name}</h6>
                        <p className="text-muted small mb-3" style={{ fontSize: 13 }}>ETB {Number(med.selling_price).toFixed(2)}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <span 
                            className="badge"
                            style={{
                              background: Number(med.quantity) > 10 ? '#16a34a' : '#fbbf24',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: 12,
                            }}
                          >
                            Stock: {med.quantity}
                          </span>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => addToCart(med)}
                            disabled={Number(med.quantity) === 0}
                            style={{
                              fontWeight: 600,
                              transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <Plus size={16} /> Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="col-lg-5">
        <div className="card border-0 h-100 soft-panel" style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          <div 
            className="card-header bg-white d-flex justify-content-between align-items-center"
            style={{ borderBottom: '1px solid #e5e7eb', padding: 16 }}
          >
            <h5 className="mb-0 fw-bold" style={{ fontSize: 16, color: '#1a1a2e' }}>Current Sale</h5>
            <span 
              className="badge"
              style={{
                background: '#e6f0ff',
                color: '#0066cc',
                fontWeight: 700,
                fontSize: 12,
              }}
            >
              {cart.length} items
            </span>
          </div>

          <div className="card-body p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {cart.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <p style={{ fontSize: 14 }}>Cart is empty. Add medicines from left.</p>
              </div>
            ) : (
              cart.map(item => (
                <div 
                  key={item.id}
                  className="d-flex justify-content-between align-items-center mb-3 p-3"
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: 10,
                    background: '#f9fafb',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f3f4f6';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f9fafb';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div>
                    <div className="fw-semibold" style={{ color: '#1a1a2e', fontSize: 13 }}>{item.name}</div>
                    <small style={{ color: '#6b7280', fontSize: 12 }}>ETB {Number(item.selling_price).toFixed(2)} × {item.cartQuantity}</small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                      style={{ fontWeight: 600, transition: 'all 0.2s ease' }}
                    >
                      <Minus size={15} />
                    </button>
                    <span className="fw-semibold px-2" style={{ minWidth: '30px', textAlign: 'center' }}>{item.cartQuantity}</span>
                    <button 
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
                      style={{ fontWeight: 600, transition: 'all 0.2s ease' }}
                    >
                      <Plus size={15} />
                    </button>
                    <button 
                      className="btn btn-sm btn-outline-danger ms-2"
                      onClick={() => removeFromCart(item.id)}
                      style={{ fontWeight: 600, transition: 'all 0.2s ease' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="card-footer bg-white border-0 pt-4" style={{ borderTop: '1px solid #e5e7eb', padding: 16 }}>
            <div className="d-flex justify-content-between mb-3">
              <strong style={{ color: '#6b7280', fontSize: 13 }}>Subtotal</strong>
              <span style={{ fontWeight: 600, color: '#1a1a2e', fontSize: 14 }}>ETB {totalAmount.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-4" style={{ paddingBottom: 12, borderBottom: '1px solid #e5e7eb' }}>
              <strong style={{ color: '#6b7280', fontSize: 13 }}>Tax (15%)</strong>
              <span style={{ fontWeight: 600, color: '#cc7700', fontSize: 14 }}>ETB {taxAmount.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between mb-4">
              <strong style={{ color: '#1a1a2e', fontSize: 14 }}>Total Amount</strong>
              <h5 className="fw-bold mb-0" style={{ color: '#1a6b3a', fontSize: 18 }}>ETB {finalTotal.toFixed(2)}</h5>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold" style={{ color: '#1a1a2e', fontSize: 13, marginBottom: 10 }}>Customer</label>
              <select
                className="form-select"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
                style={{ borderRadius: 10 }}
              >
                <option value="">Walk-in customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}{customer.phone ? ` - ${customer.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label fw-bold" style={{ color: '#1a1a2e', fontSize: 13, marginBottom: 10 }}>Payment Method</label>
              <div className="d-flex gap-2">
                {['cash', 'card', 'mobile_money'].map(method => (
                  <button
                    key={method}
                    className="btn flex-grow-1"
                    onClick={() => setPaymentMethod(method as any)}
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      borderRadius: 8,
                      padding: '10px 8px',
                      transition: 'all 0.2s ease',
                      background: paymentMethod === method ? 'linear-gradient(135deg, #1a6b3a, #2d9e58)' : '#e5e7eb',
                      color: paymentMethod === method ? 'white' : '#1a1a2e',
                      border: 'none',
                    }}
                  >
                    {method === 'cash' ? '💵' : method === 'card' ? '💳' : '📱'} {method.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mb-4">
                <label className="form-label fw-bold" style={{ color: '#1a1a2e', fontSize: 13, marginBottom: 10 }}>Cash Received (ETB)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Enter amount received"
                  value={cashReceived || ''}
                  onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="100"
                  style={{ borderRadius: 10 }}
                />
                {cashReceived > 0 && (
                  <div 
                    className="alert mt-2 py-2 px-3 mb-0"
                    style={{
                      background: '#e8f5ec',
                      border: '1px solid rgba(26, 107, 58, 0.2)',
                      color: '#1a6b3a',
                      fontSize: 13,
                      borderRadius: 8,
                    }}
                  >
                    Change: <strong>ETB {change.toFixed(2)}</strong>
                  </div>
                )}
              </div>
            )}

            <button
              className="btn btn-success w-100 py-3 fw-bold"
              onClick={completeSale}
              disabled={cart.length === 0 || loading || (paymentMethod === 'cash' && cashReceived < finalTotal)}
              style={{
                fontSize: 15,
                borderRadius: 10,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  Processing...
                </span>
              ) : (
                `Complete Sale - ETB ${finalTotal.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Receipt Preview / Print */}
      <div className="col-12">
        <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
          <div 
            className="card-header bg-white d-flex align-items-center justify-content-between"
            style={{ borderBottom: '1px solid #e5e7eb', padding: 16 }}
          >
            <div className="d-flex align-items-center gap-3">
              <Receipt color="#0066cc" size={20} />
              <h5 className="mb-0 fw-bold" style={{ fontSize: 16, color: '#1a1a2e' }}>Receipt Preview</h5>
            </div>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={printReceipt}
              disabled={!receipt || receipt.items.length === 0}
              style={{
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (receipt && receipt.items.length > 0) e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                if (receipt && receipt.items.length > 0) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Printer size={16} className="me-1" /> Print Receipt
            </button>
          </div>
          <div 
            className="card-body p-4"
            style={{ 
              minHeight: '450px',
              background: '#f9fafb',
              borderRadius: '0 0 14px 14px',
            }}
          >
            {!receipt || receipt.items.length === 0 ? (
              <div className="text-center text-muted py-5">
                <p style={{ fontSize: 14 }}>No receipt available yet. Complete a sale to generate receipt.</p>
              </div>
            ) : (
              <div ref={receiptRef} className="receipt-template" style={{
                background: 'white',
                padding: '18px 14px',
                fontFamily: '"Arial Narrow", Inter, Arial, sans-serif',
                maxWidth: '320px',
                margin: '0 auto',
                lineHeight: '1.15',
                borderRadius: 0,
                boxShadow: '0 18px 40px rgba(0,0,0,0.08)',
                color: '#151515',
              }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '12px', borderBottom: '1px dashed #444', paddingBottom: '10px' }}>
                  <img
                    src={brandLogo}
                    alt="Kelebet Pharmacy logo"
                    style={{ width: '92px', height: '92px', objectFit: 'contain', marginBottom: '6px' }}
                  />
                  <h2 style={{ color: '#111', margin: '0 0 2px 0', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.2px' }}>
                    KELEBET PHARMACY
                  </h2>
                  <p style={{ margin: '1px 0', color: '#222', fontSize: '11px', fontWeight: 700 }}>
                    ADDIS ABABA, ETHIOPIA
                  </p>
                  <p style={{ margin: '1px 0', color: '#222', fontSize: '11px' }}>
                    TIN: 1234567890-XYZ
                  </p>
                  <p style={{ margin: '1px 0', color: '#222', fontSize: '11px' }}>
                    123456789-992
                  </p>
                </div>

                {/* Transaction Details */}
                <div style={{ marginBottom: '8px', borderBottom: '1px dashed #444', paddingBottom: '8px', fontSize: '11px', fontWeight: 700 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '3px' }}>
                    <span>DATE: {receipt.date}</span>
                    <span>RECEIPT #: {receipt.invoiceNumber}</span>
                  </div>
                  <div style={{ marginBottom: '2px' }}>
                    <span>RECEIPT #: </span>
                    <span style={{ fontWeight: 400 }}>{receipt.invoiceNumber}</span>
                  </div>
                  <div>
                    <span>PAID TO: </span>
                    <span style={{ fontWeight: 400 }}>{receipt.customerName || 'WALK-IN CUSTOMER'}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div style={{ marginBottom: '10px', borderBottom: '1px dashed #444', paddingBottom: '8px' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '30px 1.65fr 1fr 1fr',
                    gap: '4px',
                    marginBottom: '5px',
                    paddingBottom: '5px',
                    borderBottom: '1px dashed #444',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: '#111',
                  }}>
                    <div>QTY</div>
                    <div>ITEM</div>
                    <div style={{ textAlign: 'right' }}>UNIT PRICE</div>
                    <div style={{ textAlign: 'right' }}>AMOUNT</div>
                  </div>
                  {receipt.items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'grid',
                      gridTemplateColumns: '30px 1.65fr 1fr 1fr',
                      gap: '4px',
                      paddingBottom: '3px',
                      fontSize: '11px',
                    }}>
                      <div>{item.cartQuantity}</div>
                      <div style={{ textTransform: 'uppercase' }}>{item.name}</div>
                      <div style={{ textAlign: 'right' }}>ETB {Number(item.selling_price).toFixed(2)}</div>
                      <div style={{ textAlign: 'right' }}>
                        ETB {(Number(item.selling_price) * item.cartQuantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div style={{ marginBottom: '10px', borderBottom: '1px dashed #444', paddingBottom: '8px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span></span>
                    <span><strong>SUBTOTAL:</strong> ETB {receipt.total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span></span>
                    <span><strong>VAT (15%):</strong> ETB {(receipt.tax || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span></span>
                    <span style={{ fontSize: '12px' }}><strong>TOTAL:</strong> ETB {(receipt.total + (receipt.tax || 0)).toFixed(2)}</span>
                  </div>
                  {receipt.cashReceived ? (
                    <div style={{ height: 0 }} />
                  ) : null}
                </div>

                <div style={{ marginBottom: '10px', borderBottom: '1px dashed #444', paddingBottom: '8px', fontSize: '11px', fontWeight: 700 }}>
                  {receipt.cashReceived ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>CASH:</span>
                        <span>ETB {receipt.cashReceived.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>CHANGE:</span>
                        <span>ETB {(receipt.cashReceived - (receipt.total + (receipt.tax || 0))).toFixed(2)}</span>
                      </div>
                    </>
                  ) : null}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>PAYMENT TYPE:</span>
                    <span>{receipt.paymentMethod}</span>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '10px', lineHeight: '1.3' }}>
                  <p style={{ margin: '0 0 8px', borderTop: '1px dashed #444', paddingTop: '8px', fontWeight: 700 }}>
                    KINDLY NOTE: Medicines cannot be returned or exchanged.
                    <br />
                    Please consult a doctor for prescription.
                  </p>
                  <p style={{ margin: 0, fontSize: '11px', fontWeight: 800 }}>
                    THANK YOU FOR CHOOSING KELEBET PHARMACY!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {success && (
        <div 
          className="position-fixed bottom-0 end-0 m-4 alert alert-success shadow"
          style={{ 
            zIndex: 1000,
            background: '#e8f5ec',
            border: '1px solid rgba(26, 107, 58, 0.2)',
            color: '#1a6b3a',
            borderRadius: 12,
            fontWeight: 600,
            animation: 'slideInUp 0.3s ease',
          }}
        >
          <Receipt className="me-2" size={20} style={{ display: 'inline' }} /> Sale completed successfully!
        </div>
      )}
    </div>
  );
}
