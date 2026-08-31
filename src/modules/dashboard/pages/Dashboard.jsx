import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiDollarSign, FiShoppingCart, FiBox, FiAlertTriangle,
  FiXCircle, FiClock, FiBell, FiPlus, FiFileText,
  FiCalendar, FiRefreshCw, FiChevronRight,
} from "react-icons/fi";

import { playDashboard } from "../../../shared/services/audioService";
import { getDashboardInventoryData } from "../../inventory/services/inventoryService";
import { getSalesHistory } from "../../sales/services/salesService";
import { getNotifications } from "../../notifications/services/notificationService";
import "../dashboard.css";

// ── Helpers ───────────────────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().split("T")[0];

const fmtCurrency = (n) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return "—";
  const date = d instanceof Date ? d : (d.toDate ? d.toDate() : new Date(d));
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const relTime = (d) => {
  if (!d) return "";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return "Just now";
  if (sec < 3600) return Math.floor(sec / 60) + "m ago";
  if (sec < 86400) return Math.floor(sec / 3600) + "h ago";
  return Math.floor(sec / 86400) + "d ago";
};

const daysUntilExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate); exp.setHours(0, 0, 0, 0);
  return Math.ceil((exp - today) / 86400000);
};

const notifIcon = (type) => {
  if (type === "LOW_STOCK") return "⚠️";
  if (type === "EXPIRY")    return "🕐";
  if (type === "SALE")      return "💰";
  return "🔔";
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, colorClass, onClick }) {
  return (
    <div
      className={`dash-kpi-card ${colorClass || ""} ${onClick ? "dash-kpi-clickable" : ""}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="dash-kpi-icon">{icon}</div>
      <div className="dash-kpi-body">
        <div className="dash-kpi-value">{value}</div>
        <div className="dash-kpi-label">{label}</div>
        {sub && <div className="dash-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, action, onAction }) {
  return (
    <div className="d-flex align-items-center justify-content-between mb-3">
      <h6 className="dash-section-title mb-0">{title}</h6>
      {action && (
        <button className="btn btn-link btn-sm dash-view-all p-0" onClick={onAction}>
          {action} <FiChevronRight size={13} />
        </button>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [inv, setInv]         = useState(null);   // getDashboardInventoryData result
  const [sales, setSales]     = useState([]);
  const [notifs, setNotifs]   = useState([]);

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(new Date());

  // Single parallel load — 3 Firestore reads total
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invData, salesData, notifsData] = await Promise.all([
        getDashboardInventoryData(),
        getSalesHistory(20),
        getNotifications(),
      ]);
      setInv(invData);
      setSales(salesData);
      setNotifs(notifsData);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Could not load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    playDashboard();
    loadData();
  }, [loadData]);

  // ── Derived values ───────────────────────────────────────────────────────
  const today = todayStr();
  const todaySales = sales.filter((s) => {
    const d = s.date instanceof Date ? s.date : (s.date?.toDate ? s.date.toDate() : null);
    return d && d.toISOString().split("T")[0] === today;
  });
  const todayRevenue  = todaySales.reduce((sum, s) => sum + Number(s.netAmount || 0), 0);
  const recentSales   = sales.slice(0, 5);
  const unreadCount   = notifs.filter((n) => !n.isRead).length;
  const recentNotifs  = notifs.slice(0, 5);

  const lowStockList    = inv?.lowStockList    || [];
  const outOfStockList  = inv?.outOfStockList  || [];
  const expiringSoonList = inv?.expiringSoonList || [];

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-page-container d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: "2.5rem", height: "2.5rem" }} />
          <p className="text-muted">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="dash-page-container d-flex align-items-center justify-content-center">
        <div className="text-center">
          <FiAlertTriangle size={40} className="text-danger mb-3" />
          <p className="text-danger mb-3">{error}</p>
          <button className="btn btn-primary btn-sm" onClick={loadData}>
            <FiRefreshCw size={14} className="me-1" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dash-page-container py-4">
      <div className="container-lg">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="dash-welcome-card card mb-4 border-0 shadow-sm">
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-8">
              <h1 className="dash-welcome-title mb-1">Pharmacy Dashboard</h1>
              <p className="dash-welcome-text mb-0">Overview of your pharmacy operations</p>
            </div>
            <div className="col-12 col-md-4 text-md-end">
              <div className="d-flex gap-2 justify-content-md-end align-items-center">
                <div className="dash-date-badge">
                  <FiCalendar size={13} />
                  <span>{formattedDate}</span>
                </div>
                <button
                  className="btn btn-sm btn-outline-light dash-refresh-btn"
                  onClick={loadData}
                  title="Refresh"
                >
                  <FiRefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ───────────────────────────────────────────────── */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-4 col-lg-2">
            <KpiCard
              icon={<FiDollarSign size={20} />}
              label="Today's Revenue"
              value={fmtCurrency(todayRevenue)}
              colorClass="dash-kpi-green"
              onClick={() => navigate("/sales")}
            />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <KpiCard
              icon={<FiShoppingCart size={20} />}
              label="Today's Sales"
              value={todaySales.length}
              sub={todaySales.length === 1 ? "transaction" : "transactions"}
              colorClass="dash-kpi-blue"
              onClick={() => navigate("/sales")}
            />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <KpiCard
              icon={<FiBox size={20} />}
              label="Total Medicines"
              value={inv?.totalMedicines ?? "—"}
              colorClass="dash-kpi-indigo"
              onClick={() => navigate("/inventory")}
            />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <KpiCard
              icon={<FiAlertTriangle size={20} />}
              label="Low Stock"
              value={lowStockList.length}
              colorClass={lowStockList.length > 0 ? "dash-kpi-warning" : "dash-kpi-muted"}
              onClick={() => navigate("/inventory")}
            />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <KpiCard
              icon={<FiXCircle size={20} />}
              label="Out of Stock"
              value={outOfStockList.length}
              colorClass={outOfStockList.length > 0 ? "dash-kpi-danger" : "dash-kpi-muted"}
              onClick={() => navigate("/inventory")}
            />
          </div>
          <div className="col-6 col-md-4 col-lg-2">
            <KpiCard
              icon={<FiClock size={20} />}
              label="Expiring Soon"
              value={expiringSoonList.length}
              sub="within 30 days"
              colorClass={expiringSoonList.length > 0 ? "dash-kpi-orange" : "dash-kpi-muted"}
              onClick={() => navigate("/expiry")}
            />
          </div>
        </div>

        {/* ── Attention Required ──────────────────────────────────────── */}
        <div className="dash-section-card card border-0 shadow-sm mb-4">
          <div className="card-body">
            <SectionHeader title="⚠️ Attention Required" />
            <div className="row g-3">

              {/* Low Stock */}
              <div className="col-12 col-md-4">
                <div className="dash-alert-panel dash-alert-warning">
                  <div className="dash-alert-header">
                    <FiAlertTriangle size={13} />
                    <span>Low Stock ({lowStockList.length})</span>
                  </div>
                  {lowStockList.length === 0 ? (
                    <p className="dash-alert-empty">All stock levels are healthy</p>
                  ) : (
                    <>
                      {lowStockList.slice(0, 4).map((m) => (
                        <div key={m.id} className="dash-alert-item">
                          <span className="dash-alert-name">{m.medicineName}</span>
                          <span className="dash-alert-sub">Only {m.quantity} units left</span>
                        </div>
                      ))}
                      {lowStockList.length > 4 && (
                        <button className="dash-alert-more" onClick={() => navigate("/inventory")}>
                          +{lowStockList.length - 4} more →
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Expiring Soon */}
              <div className="col-12 col-md-4">
                <div className="dash-alert-panel dash-alert-orange">
                  <div className="dash-alert-header">
                    <FiClock size={13} />
                    <span>Expiring Soon ({expiringSoonList.length})</span>
                  </div>
                  {expiringSoonList.length === 0 ? (
                    <p className="dash-alert-empty">No medicines expiring in 30 days</p>
                  ) : (
                    <>
                      {expiringSoonList.slice(0, 4).map((m) => {
                        const days = daysUntilExpiry(m.expiryDate);
                        return (
                          <div key={m.id} className="dash-alert-item">
                            <span className="dash-alert-name">{m.medicineName}</span>
                            <span className="dash-alert-sub">
                              {days === 0
                                ? "Expires today"
                                : days === 1
                                ? "Expires tomorrow"
                                : `Expires in ${days} days`}
                            </span>
                          </div>
                        );
                      })}
                      {expiringSoonList.length > 4 && (
                        <button className="dash-alert-more" onClick={() => navigate("/expiry")}>
                          +{expiringSoonList.length - 4} more →
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Out of Stock */}
              <div className="col-12 col-md-4">
                <div className="dash-alert-panel dash-alert-danger">
                  <div className="dash-alert-header">
                    <FiXCircle size={13} />
                    <span>Out of Stock ({outOfStockList.length})</span>
                  </div>
                  {outOfStockList.length === 0 ? (
                    <p className="dash-alert-empty">No medicines are out of stock</p>
                  ) : (
                    <>
                      {outOfStockList.slice(0, 4).map((m) => (
                        <div key={m.id} className="dash-alert-item">
                          <span className="dash-alert-name">{m.medicineName}</span>
                          <span className="dash-alert-sub">Restock required</span>
                        </div>
                      ))}
                      {outOfStockList.length > 4 && (
                        <button className="dash-alert-more" onClick={() => navigate("/inventory")}>
                          +{outOfStockList.length - 4} more →
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Recent Sales + Notifications ────────────────────────────── */}
        <div className="row g-4 mb-4">

          {/* Recent Sales */}
          <div className="col-12 col-lg-7">
            <div className="dash-section-card card border-0 shadow-sm h-100">
              <div className="card-body">
                <SectionHeader
                  title="Recent Sales"
                  action="View Sales"
                  onAction={() => navigate("/sales")}
                />
                {recentSales.length === 0 ? (
                  <div className="dash-empty-state">
                    <FiShoppingCart size={28} />
                    <p>No sales recorded yet</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm dash-table mb-0">
                      <thead>
                        <tr>
                          <th>Invoice</th>
                          <th>Customer</th>
                          <th className="text-center">Items</th>
                          <th className="text-end">Amount</th>
                          <th>Payment</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map((s) => (
                          <tr key={s.id}>
                            <td>
                              <span className="dash-invoice-badge">{s.invoiceNumber || "—"}</span>
                            </td>
                            <td className="dash-td-truncate">{s.customerName || "Walk-in"}</td>
                            <td className="text-center">{s.totalItems ?? "—"}</td>
                            <td className="text-end fw-semibold">{fmtCurrency(s.netAmount)}</td>
                            <td>
                              <span className={`badge dash-payment-badge ${
                                s.paymentMethod === "Cash"
                                  ? "dash-pay-cash"
                                  : s.paymentMethod === "UPI"
                                  ? "dash-pay-upi"
                                  : "dash-pay-card"
                              }`}>
                                {s.paymentMethod || "—"}
                              </span>
                            </td>
                            <td className="text-muted" style={{ fontSize: "0.78rem" }}>
                              {fmtDate(s.date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notifications Preview */}
          <div className="col-12 col-lg-5">
            <div className="dash-section-card card border-0 shadow-sm h-100">
              <div className="card-body">
                <SectionHeader
                  title={
                    <span>
                      <FiBell size={14} className="me-1" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="badge bg-danger ms-2" style={{ fontSize: "0.68rem", verticalAlign: "middle" }}>
                          {unreadCount} new
                        </span>
                      )}
                    </span>
                  }
                  action="View All"
                  onAction={() => navigate("/notifications")}
                />
                {recentNotifs.length === 0 ? (
                  <div className="dash-empty-state">
                    <FiBell size={28} />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="dash-notif-list">
                    {recentNotifs.map((n) => {
                      const ts = n.timestamp instanceof Date
                        ? n.timestamp
                        : (n.timestamp?.toDate ? n.timestamp.toDate() : new Date());
                      return (
                        <div
                          key={n.id}
                          className={`dash-notif-item ${!n.isRead ? "dash-notif-unread" : ""}`}
                          onClick={() => navigate("/notifications")}
                        >
                          <span className="dash-notif-icon">{notifIcon(n.type)}</span>
                          <div className="dash-notif-body">
                            <p className="dash-notif-msg">{n.message}</p>
                            <span className="dash-notif-time">{relTime(ts)}</span>
                          </div>
                          {!n.isRead && <span className="dash-notif-dot" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ── Quick Actions ────────────────────────────────────────────── */}
        <div className="dash-section-card card border-0 shadow-sm">
          <div className="card-body">
            <SectionHeader title="Quick Actions" />
            <div className="d-flex flex-wrap gap-2">
              <button
                className="btn dash-quick-btn dash-quick-blue"
                onClick={() => navigate("/inventory/add")}
              >
                <FiPlus size={14} /> Add Medicine
              </button>
              <button
                className="btn dash-quick-btn dash-quick-green"
                onClick={() => navigate("/sales")}
              >
                <FiShoppingCart size={14} /> New Sale
              </button>
              <button
                className="btn dash-quick-btn dash-quick-purple"
                onClick={() => navigate("/reports")}
              >
                <FiFileText size={14} /> View Reports
              </button>
              <button
                className="btn dash-quick-btn dash-quick-orange"
                onClick={() => navigate("/expiry")}
              >
                <FiClock size={14} /> Expiry Tracker
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
