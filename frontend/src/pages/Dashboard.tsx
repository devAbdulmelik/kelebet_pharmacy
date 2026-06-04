import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Pill,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../auth/permissions';

interface Stats {
  today_sales_amount: number;
  today_transactions: number;
  low_stock_count: number;
  near_expiry_count: number;
  total_medicines: number;
  date: string;
}

function StatCard({ title, value, icon, color, bg, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  subtitle?: string;
}) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div 
        className="card border-0 h-100 transition-all" 
        style={{ 
          borderRadius: 14, 
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          border: '1px solid #e5e7eb',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
        }}
      >
        <div className="card-body p-5">
          <div className="d-flex align-items-start justify-content-between mb-4">
            <div 
              className="rounded-lg d-flex align-items-center justify-content-center" 
              style={{ 
                width: 56, 
                height: 56, 
                background: bg,
                border: `1px solid ${color}20`,
              }}
            >
              {icon}
            </div>
          </div>
          <div className="fw-bold" style={{ fontSize: 32, color: '#1a1a2e', lineHeight: 1, marginBottom: 8 }}>
            {value}
          </div>
          <div className="fw-semibold" style={{ color, fontSize: 14, marginBottom: 8 }}>
            {title}
          </div>
          {subtitle && <div className="text-muted" style={{ fontSize: 12 }}>{subtitle}</div>}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/dashboard/stats/');
      setStats(data);
      console.log("Dashboard stats loaded:", data); // For debugging
    } catch (err: any) {
      console.error("Failed to load stats:", err);
      setError("Could not load dashboard data");
      // Optional: Keep showing demo data only if you want
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return `ETB ${amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const dashboardCardsByRole: Record<Role, Array<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    bg: string;
    subtitle: string;
  }>> = {
    admin: [
      {
        title: "Today's Sales",
        value: formatCurrency(stats?.today_sales_amount ?? 0),
        icon: <TrendingUp size={24} color="#1a6b3a" strokeWidth={2} />,
        color: '#1a6b3a',
        bg: '#e8f5ec',
        subtitle: 'Total revenue today',
      },
      {
        title: 'Transactions',
        value: stats?.today_transactions ?? 0,
        icon: <Receipt size={24} color="#0066cc" strokeWidth={2} />,
        color: '#0066cc',
        bg: '#e6f0ff',
        subtitle: 'Sales completed today',
      },
      {
        title: 'Low Stock Items',
        value: stats?.low_stock_count ?? 0,
        icon: <AlertTriangle size={24} color="#cc7700" strokeWidth={2} />,
        color: '#cc7700',
        bg: '#fff8e6',
        subtitle: 'Need restocking',
      },
      {
        title: 'Near Expiry',
        value: stats?.near_expiry_count ?? 0,
        icon: <Calendar size={24} color="#cc3300" strokeWidth={2} />,
        color: '#cc3300',
        bg: '#fff0ed',
        subtitle: 'Expiring within 30 days',
      },
    ],
    pharmacist: [
      {
        title: 'Total Medicines',
        value: stats?.total_medicines ?? 0,
        icon: <Pill size={24} color="#1a6b3a" strokeWidth={2} />,
        color: '#1a6b3a',
        bg: '#e8f5ec',
        subtitle: 'Tracked inventory items',
      },
      {
        title: 'Low Stock Items',
        value: stats?.low_stock_count ?? 0,
        icon: <AlertTriangle size={24} color="#cc7700" strokeWidth={2} />,
        color: '#cc7700',
        bg: '#fff8e6',
        subtitle: 'Need restocking',
      },
      {
        title: 'Near Expiry',
        value: stats?.near_expiry_count ?? 0,
        icon: <Calendar size={24} color="#cc3300" strokeWidth={2} />,
        color: '#cc3300',
        bg: '#fff0ed',
        subtitle: 'Expiring within 30 days',
      },
    ],
    cashier: [
      {
        title: "Today's Sales",
        value: formatCurrency(stats?.today_sales_amount ?? 0),
        icon: <TrendingUp size={24} color="#1a6b3a" strokeWidth={2} />,
        color: '#1a6b3a',
        bg: '#e8f5ec',
        subtitle: 'Total revenue today',
      },
      {
        title: 'Transactions',
        value: stats?.today_transactions ?? 0,
        icon: <Receipt size={24} color="#0066cc" strokeWidth={2} />,
        color: '#0066cc',
        bg: '#e6f0ff',
        subtitle: 'Sales completed today',
      },
    ],
  };

  const dashboardCards = user ? dashboardCardsByRole[user.role] : [];
  const dashboardDescription =
    user?.role === 'pharmacist'
      ? "Overview of today's inventory activity"
      : user?.role === 'cashier'
        ? "Overview of today's sales activity"
        : "Overview of today's pharmacy activity";

  return (
    <div className="page-section">
      <div className="page-hero d-flex align-items-center justify-content-between mb-4">
        <div>
          <div className="page-eyebrow">Operations snapshot</div>
          <h3 className="fw-bold mb-1" style={{ fontSize: 28, color: '#1a1a2e' }}>Dashboard</h3>
          <p className="text-muted mb-0" style={{ fontSize: 15 }}>{dashboardDescription}</p>
        </div>
        <button 
          className="btn btn-sm d-flex align-items-center gap-2 transition-all" 
          onClick={fetchStats} 
          disabled={loading}
          style={{ 
            background: '#e8f5ec', 
            color: '#1a6b3a', 
            borderRadius: 8,
            fontWeight: 600,
            border: 'none',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div 
          className="alert alert-warning mb-4"
          style={{
            background: '#fff8e6',
            border: '1px solid rgba(204, 119, 0, 0.2)',
            color: '#cc7700',
            borderRadius: 12,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="soft-panel text-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4 mb-4" style={{ animation: 'slideInUp 0.4s ease' }}>
          {dashboardCards.map((card) => (
            <StatCard
              key={card.title}
              title={card.title}
              value={card.value}
              icon={card.icon}
              color={card.color}
              bg={card.bg}
              subtitle={card.subtitle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
