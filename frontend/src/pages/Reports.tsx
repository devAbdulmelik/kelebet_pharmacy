import { useEffect, useState } from 'react';
import api from '../api/axios';
import { AlertTriangle, Clock, Download, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { hasRoleAccess, REPORT_TAB_PERMISSIONS, type ReportTabId } from '../auth/permissions';

interface Medicine {
  id: number;
  name: string;
  batch_number?: string;
  generic_name?: string;
  expiry_date: string;
  quantity: number;
  selling_price: number;
  reorder_level?: number;
}

interface Sale {
  id: number;
  invoice_number: string;
  sale_date: string;
  total_amount: number;
  payment_method: string;
  items: SaleItem[];
}

interface SaleItem {
  id: number;
  medicine: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

interface DailySalesData {
  date: string;
  totalSales: number;
  transactionCount: number;
  averageSale: number;
}

export default function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTabId>('low-stock');
  const [lowStock, setLowStock] = useState<Medicine[]>([]);
  const [nearExpiry, setNearExpiry] = useState<Medicine[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [dailySalesData, setDailySalesData] = useState<DailySalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const availableTabs = (Object.entries(REPORT_TAB_PERMISSIONS) as [ReportTabId, typeof REPORT_TAB_PERMISSIONS[ReportTabId]][])
    .filter(([, roles]) => hasRoleAccess(user, roles))
    .map(([id]) => id);

  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0] ?? 'daily-sales');
    }
  }, [activeTab, availableTabs]);

  const calculateDaysRemaining = (expiryDate: string): number => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const processSalesData = (salesList: Sale[]) => {
    const groupedByDate: { [key: string]: { amount: number; count: number } } = {};

    salesList.forEach(sale => {
      const date = new Date(sale.sale_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      if (!groupedByDate[date]) {
        groupedByDate[date] = { amount: 0, count: 0 };
      }

      groupedByDate[date].amount += parseFloat(sale.total_amount.toString());
      groupedByDate[date].count += 1;
    });

    const processed = Object.entries(groupedByDate).map(([date, data]) => ({
      date,
      totalSales: data.amount,
      transactionCount: data.count,
      averageSale: data.amount / data.count
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setDailySalesData(processed);
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const requests: Promise<any>[] = [];

      if (availableTabs.includes('low-stock')) {
        requests.push(api.get('/reports/low-stock/'));
      }

      if (availableTabs.includes('near-expiry')) {
        requests.push(api.get('/reports/near-expiry/'));
      }

      requests.push(api.get('/sales/'));

      const responses = await Promise.all(requests);
      let responseIndex = 0;

      if (availableTabs.includes('low-stock')) {
        const lowRes = responses[responseIndex++];
        setLowStock(Array.isArray(lowRes.data) ? lowRes.data : []);
      } else {
        setLowStock([]);
      }

      if (availableTabs.includes('near-expiry')) {
        const expiryRes = responses[responseIndex++];
        setNearExpiry(Array.isArray(expiryRes.data) ? expiryRes.data : []);
      } else {
        setNearExpiry([]);
      }

      const salesRes = responses[responseIndex];
      const salesList = Array.isArray(salesRes.data) ? salesRes.data : [];
      setSales(salesList);
      processSalesData(salesList);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const exportToCSV = (data: any[], filename: string, headers: string[]) => {
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const value = row[h];
        const stringValue = String(value || '');
        return `"${stringValue.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const exportLowStock = () => {
    const data = lowStock.map(m => ({
      'Medicine Name': m.name,
      'Current Stock': m.quantity,
      'Reorder Level': m.reorder_level || 10,
      'Status': m.quantity <= (m.reorder_level || 10) ? 'Critical' : 'Low'
    }));
    exportToCSV(data, 'low-stock-report.csv', ['Medicine Name', 'Current Stock', 'Reorder Level', 'Status']);
  };

  const exportNearExpiry = () => {
    const data = nearExpiry.map(m => ({
      'Medicine Name': m.name,
      'Batch Number': m.batch_number || 'N/A',
      'Expiry Date': m.expiry_date,
      'Days Remaining': calculateDaysRemaining(m.expiry_date),
      'Stock': m.quantity
    }));
    exportToCSV(data, 'near-expiry-report.csv', ['Medicine Name', 'Batch Number', 'Expiry Date', 'Days Remaining', 'Stock']);
  };

  const exportDailySales = () => {
    const data = dailySalesData.map(d => ({
      'Date': d.date,
      'Total Sales': d.totalSales.toFixed(2),
      'Transactions': d.transactionCount,
      'Average Sale': d.averageSale.toFixed(2)
    }));
    exportToCSV(data, 'daily-sales-report.csv', ['Date', 'Total Sales', 'Transactions', 'Average Sale']);
  };

  const totalSalesAmount = dailySalesData.reduce((sum, d) => sum + d.totalSales, 0);
  const totalTransactions = dailySalesData.reduce((sum, d) => sum + d.transactionCount, 0);
  const averageTransaction = totalTransactions > 0 ? totalSalesAmount / totalTransactions : 0;

  return (
    <div className="page-section">
      {/* Header */}
      <div className="page-hero d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="page-eyebrow">Reporting center</div>
          <h3 className="fw-bold mb-1" style={{ fontSize: 28, color: '#1a1a2e' }}>Reports</h3>
          <p className="text-muted mb-0" style={{ fontSize: 15 }}>Manage and monitor pharmacy operations</p>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="btn btn-sm d-flex align-items-center gap-2 transition-all"
          style={{ 
            background: '#1a6b3a', 
            color: 'white',
            fontWeight: 700,
            borderRadius: 8,
            border: 'none',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Download size={16} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="card border-0 mb-4 soft-panel" style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
        <div className="d-flex overflow-auto" style={{ borderBottom: '2px solid #e5e7eb' }}>
          {[
            { id: 'low-stock' as ReportTabId, label: 'Low Stock Report', icon: '⚠️' },
            { id: 'near-expiry' as ReportTabId, label: 'Near Expiry Report', icon: '⏱️' },
            { id: 'daily-sales' as ReportTabId, label: 'Daily Sales Report', icon: '📈' }
          ].filter((tab) => availableTabs.includes(tab.id)).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn border-0"
              style={{
                padding: '16px 24px',
                fontWeight: activeTab === tab.id ? 700 : 600,
                color: activeTab === tab.id ? '#1a6b3a' : '#6b7280',
                background: 'transparent',
                fontSize: 14,
                borderBottom: activeTab === tab.id ? '3px solid #1a6b3a' : 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#1a1a2e';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = '#6b7280';
                }
              }}
            >
              <span style={{ marginRight: 8 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Low Stock Report */}
          {activeTab === 'low-stock' && (
            <div style={{ animation: 'slideInUp 0.3s ease' }}>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="fw-bold mb-0" style={{ fontSize: 18, color: '#1a1a2e' }}>Low Stock Items</h5>
                <div className="d-flex gap-2 align-items-center">
                  <span
                    className="badge"
                    style={{
                      background: '#fff8e6',
                      color: '#cc7700',
                      fontWeight: 700,
                      fontSize: 12,
                      padding: '8px 12px',
                    }}
                  >
                    {lowStock.length} items
                  </span>
                  <button
                    onClick={exportLowStock}
                    className="btn btn-sm"
                    style={{
                      background: '#1a6b3a',
                      color: 'white',
                      fontWeight: 600,
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 13,
                    }}
                  >
                    <Download size={14} className="me-1" /> Export CSV
                  </button>
                </div>
              </div>

              {lowStock.length === 0 ? (
                <div className="card border-0 text-center p-5" style={{ borderRadius: 14, background: '#e8f5ec', border: '1px solid rgba(26, 107, 58, 0.2)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <h6 className="fw-bold mb-1" style={{ color: '#1a6b3a', fontSize: 16 }}>All items well stocked</h6>
                  <p className="text-muted mb-0" style={{ fontSize: 14 }}>No medicines are currently below their reorder levels.</p>
                </div>
              ) : (
                <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <tr>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Medicine Name</th>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Current Stock</th>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Reorder Level</th>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowStock.map(m => (
                          <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'all 0.2s ease' }}>
                            <td className="fw-semibold" style={{ color: '#1a1a2e', padding: '14px 16px', fontSize: 14 }}>{m.name}</td>
                            <td className="fw-bold" style={{ color: '#cc3300', padding: '14px 16px', fontSize: 14 }}>{m.quantity}</td>
                            <td style={{ color: '#6b7280', padding: '14px 16px', fontSize: 14 }}>{m.reorder_level || 10}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span
                                className="badge"
                                style={{
                                  background: m.quantity === 0 ? '#ef4444' : m.quantity <= (m.reorder_level || 10) / 2 ? '#ef4444' : '#fbbf24',
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: 11,
                                }}
                              >
                                {m.quantity === 0 ? 'Out of Stock' : m.quantity <= (m.reorder_level || 10) / 2 ? 'Critical' : 'Low'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Near Expiry Report */}
          {activeTab === 'near-expiry' && (
            <div style={{ animation: 'slideInUp 0.3s ease' }}>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="fw-bold mb-0" style={{ fontSize: 18, color: '#1a1a2e' }}>Near Expiry Medicines</h5>
                <div className="d-flex gap-2 align-items-center">
                  <span
                    className="badge"
                    style={{
                      background: '#fff0ed',
                      color: '#cc3300',
                      fontWeight: 700,
                      fontSize: 12,
                      padding: '8px 12px',
                    }}
                  >
                    {nearExpiry.length} items
                  </span>
                  <button
                    onClick={exportNearExpiry}
                    className="btn btn-sm"
                    style={{
                      background: '#1a6b3a',
                      color: 'white',
                      fontWeight: 600,
                      borderRadius: 8,
                      border: 'none',
                      fontSize: 13,
                    }}
                  >
                    <Download size={14} className="me-1" /> Export CSV
                  </button>
                </div>
              </div>

              {nearExpiry.length === 0 ? (
                <div className="card border-0 text-center p-5" style={{ borderRadius: 14, background: '#e8f5ec', border: '1px solid rgba(26, 107, 58, 0.2)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <h6 className="fw-bold mb-1" style={{ color: '#1a6b3a', fontSize: 16 }}>All medicines fresh</h6>
                  <p className="text-muted mb-0" style={{ fontSize: 14 }}>No medicines expiring within the next 30 days.</p>
                </div>
              ) : (
                <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <tr>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Medicine Name</th>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Batch Number</th>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Expiry Date</th>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Days Remaining</th>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nearExpiry.map(m => {
                          const daysRemaining = calculateDaysRemaining(m.expiry_date);
                          return (
                            <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'all 0.2s ease' }}>
                              <td className="fw-semibold" style={{ color: '#1a1a2e', padding: '14px 16px', fontSize: 14 }}>{m.name}</td>
                              <td style={{ color: '#6b7280', padding: '14px 16px', fontSize: 14 }}>{m.batch_number || 'N/A'}</td>
                              <td className="fw-bold" style={{ color: '#cc3300', padding: '14px 16px', fontSize: 14 }}>{m.expiry_date}</td>
                              <td className="fw-bold" style={{
                                color: daysRemaining <= 7 ? '#cc3300' : daysRemaining <= 15 ? '#cc7700' : '#1a6b3a',
                                padding: '14px 16px',
                                fontSize: 14
                              }}>
                                {daysRemaining} days
                              </td>
                              <td style={{ color: '#6b7280', padding: '14px 16px', fontSize: 14 }}>{m.quantity} units</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Daily Sales Report */}
          {activeTab === 'daily-sales' && (
            <div style={{ animation: 'slideInUp 0.3s ease' }}>
              {/* Summary Cards */}
              <div className="row g-4 mb-4">
                {[
                  { label: 'Total Sales', value: `ETB ${totalSalesAmount.toFixed(2)}`, icon: '💰', color: '#0066cc' },
                  { label: 'Transactions', value: totalTransactions.toString(), icon: '📊', color: '#16a34a' },
                  { label: 'Avg Transaction', value: `ETB ${averageTransaction.toFixed(2)}`, icon: '📈', color: '#7c3aed' },
                  { label: 'Date Range', value: `${dailySalesData.length} days`, icon: '📅', color: '#cc7700' },
                ].map((card, idx) => (
                  <div key={idx} className="col-12 col-sm-6 col-xl-3">
                    <div
                      className="card border-0 h-100 transition-all"
                      style={{
                        borderRadius: 14,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        border: '1px solid #e5e7eb',
                        borderLeft: `4px solid ${card.color}`,
                      }}
                    >
                      <div className="card-body d-flex align-items-center justify-content-between">
                        <div>
                          <p className="text-muted mb-2" style={{ fontSize: 13 }}>{card.label}</p>
                          <p className="fw-bold mb-0" style={{ fontSize: 20, color: '#1a1a2e' }}>{card.value}</p>
                        </div>
                        <div style={{ fontSize: 32 }}>{card.icon}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sales Table */}
              <div className="d-flex align-items-center justify-content-between mb-4">
                <h5 className="fw-bold mb-0" style={{ fontSize: 18, color: '#1a1a2e' }}>Daily Breakdown</h5>
                <button
                  onClick={exportDailySales}
                  className="btn btn-sm"
                  style={{
                    background: '#1a6b3a',
                    color: 'white',
                    fontWeight: 600,
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 13,
                  }}
                >
                  <Download size={14} className="me-1" /> Export CSV
                </button>
              </div>

              {dailySalesData.length === 0 ? (
                <div className="card border-0 text-center p-5" style={{ borderRadius: 14, background: '#e8f5ec', border: '1px solid rgba(26, 107, 58, 0.2)' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
                  <h6 className="fw-bold mb-1" style={{ color: '#1a6b3a', fontSize: 16 }}>No sales data</h6>
                  <p className="text-muted mb-0" style={{ fontSize: 14 }}>No sales transactions recorded yet.</p>
                </div>
              ) : (
                <div className="card border-0" style={{ borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                        <tr>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Date</th>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Total Sales</th>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Transactions</th>
                          <th style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '14px 16px' }}>Average Sale</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dailySalesData.map((day, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', transition: 'all 0.2s ease' }}>
                            <td className="fw-semibold" style={{ color: '#1a1a2e', padding: '14px 16px', fontSize: 14 }}>{day.date}</td>
                            <td className="fw-bold" style={{ color: '#0066cc', padding: '14px 16px', fontSize: 14 }}>ETB {day.totalSales.toFixed(2)}</td>
                            <td style={{ color: '#6b7280', padding: '14px 16px', fontSize: 14 }}>{day.transactionCount}</td>
                            <td style={{ color: '#6b7280', padding: '14px 16px', fontSize: 14 }}>ETB {day.averageSale.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
