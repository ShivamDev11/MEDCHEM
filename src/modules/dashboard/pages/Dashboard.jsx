import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiLogOut, FiBox, FiDollarSign, FiClock, FiBell } from "react-icons/fi";
import { logoutUser } from "../../auth/services/authService";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const modules = [
    {
      title: "Inventory Management",
      description: "Manage pharmacy stock, add new medicines, and track details.",
      path: "/inventory",
      icon: <FiBox size={32} className="text-primary mb-3" />,
      btnClass: "btn-outline-primary",
    },
    {
      title: "Sales & Billing",
      description: "Record daily sales transactions and view billing reports.",
      path: "/sales",
      icon: <FiDollarSign size={32} className="text-success mb-3" />,
      btnClass: "btn-outline-success",
    },
    {
      title: "Expiry Tracker",
      description: "Monitor expiring drugs and receive alerts on time.",
      path: "/expiry",
      icon: <FiClock size={32} className="text-warning mb-3" />,
      btnClass: "btn-outline-warning",
    },
    {
      title: "Notifications Center",
      description: "Check system notifications, stock alerts, and expiry warnings.",
      path: "/notifications",
      icon: <FiBell size={32} className="text-danger mb-3" />,
      btnClass: "btn-outline-danger",
    },
  ];

  return (
    <div className="min-vh-100 bg-light">
      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container">
          <span className="navbar-brand fw-bold d-flex align-items-center gap-2">
            <span>💊</span> MedChem
          </span>
          <button
            type="button"
            className="btn btn-danger d-flex align-items-center gap-2"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* ── Dashboard Content ──────────────────────────────────────────── */}
      <main className="container py-5">
        <div className="bg-white rounded-3 shadow-sm p-4 mb-5 border-0">
          <h1 className="h3 fw-bold text-dark">Welcome to MedChem Dashboard</h1>
          <p className="text-muted mb-0">
            Smart Pharmacy Inventory System. Select a module below to get started.
          </p>
        </div>

        {/* ── Grid of Modules ───────────────────────────────────────────── */}
        <div className="row g-4">
          {modules.map((mod, idx) => (
            <div key={idx} className="col-12 col-md-6 col-lg-3">
              <div className="card h-100 shadow-sm border-0 rounded-3 text-center p-3">
                <div className="card-body d-flex flex-column align-items-center">
                  {mod.icon}
                  <h5 className="card-title fw-bold">{mod.title}</h5>
                  <p className="card-text text-muted small flex-grow-1">
                    {mod.description}
                  </p>
                  <button
                    onClick={() => navigate(mod.path)}
                    className={`btn ${mod.btnClass} w-100 mt-3`}
                  >
                    Open Module
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
