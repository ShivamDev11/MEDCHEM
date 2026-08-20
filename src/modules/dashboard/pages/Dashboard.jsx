import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiBox, FiDollarSign, FiClock, FiBell, FiCalendar } from "react-icons/fi";
import { playDashboard } from "../../../shared/services/audioService";
import "../dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    playDashboard();
  }, []);

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const modules = [
    {
      title: "Inventory Management",
      description: "Manage pharmacy stock, add new medicines, and track details.",
      path: "/inventory",
      icon: <FiBox size={24} />,
      cardClass: "dash-card-blue",
    },
    {
      title: "Sales & Billing",
      description: "Record daily sales transactions and view billing reports.",
      path: "/sales",
      icon: <FiDollarSign size={24} />,
      cardClass: "dash-card-green",
    },
    {
      title: "Expiry Tracker",
      description: "Monitor expiring drugs and receive alerts on time.",
      path: "/expiry",
      icon: <FiClock size={24} />,
      cardClass: "dash-card-orange",
    },
    {
      title: "Notifications Center",
      description: "Check system notifications, stock alerts, and expiry warnings.",
      path: "/notifications",
      icon: <FiBell size={24} />,
      cardClass: "dash-card-red",
    },
  ];

  return (
    <div className="dash-page-container py-5">
      <div className="container">
        
        {/* ── Welcome Banner ── */}
        <div className="dash-welcome-card card mb-5 border-0 p-4 shadow-sm">
          <div className="row align-items-center g-3">
            <div className="col-12 col-md-8">
              <h1 className="dash-welcome-title mb-2">Welcome to MedChem Dashboard</h1>
              <p className="dash-welcome-text mb-0">
                Smart Pharmacy Inventory & Billing Management. Choose a module below to get started.
              </p>
            </div>
            <div className="col-12 col-md-4 text-md-end">
              <div className="dash-date-badge">
                <FiCalendar size={14} />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Grid of Modules ── */}
        <div className="row g-4 dash-grid-row">
          {modules.map((mod, idx) => (
            <div key={idx} className="col-12 col-md-6 col-lg-3">
              <div className={`card h-100 border-0 text-center dash-module-card ${mod.cardClass}`}>
                <div className="card-body d-flex flex-column align-items-center p-2">
                  
                  {/* Styled Icon wrapper */}
                  <div className="dash-card-icon-wrap" aria-hidden="true">
                    {mod.icon}
                  </div>

                  <h5 className="dash-card-title">{mod.title}</h5>
                  <p className="dash-card-text text-muted flex-grow-1 mb-4">
                    {mod.description}
                  </p>
                  
                  <button
                    onClick={() => navigate(mod.path)}
                    className="btn dash-card-btn mt-auto"
                    aria-label={`Open ${mod.title} module`}
                  >
                    Open Module
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
