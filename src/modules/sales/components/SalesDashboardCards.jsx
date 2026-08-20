import React from 'react';
import { 
  FiShoppingCart, 
  FiDollarSign, 
  FiPackage, 
  FiAlertTriangle, 
  FiXCircle 
} from 'react-icons/fi';

const SalesDashboardCards = ({ stats, isLoading, filterLabel = "Today's" }) => {
  if (isLoading) {
    return (
      <div className="row g-3 mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="col-6 col-md col-lg">
            <div className="card border-0 shadow-sm bg-light" style={{ height: "96px" }}>
              <div className="card-body d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const {
    todaySales = 0,
    todayRevenue = 0,
    totalItemsSold = 0,
    lowStockCount = 0,
    expiredCount = 0
  } = stats || {};

  const cards = [
    {
      title: `${filterLabel} Sales`,
      value: todaySales.toLocaleString(),
      icon: <FiShoppingCart size={20} />,
      kpiClass: "sales-kpi-blue"
    },
    {
      title: `${filterLabel} Revenue`,
      value: `₹${todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: <FiDollarSign size={20} />,
      kpiClass: "sales-kpi-green"
    },
    {
      title: "Items Sold",
      value: totalItemsSold.toLocaleString(),
      icon: <FiPackage size={20} />,
      kpiClass: "sales-kpi-info"
    },
    {
      title: "Low Stock",
      value: lowStockCount.toLocaleString(),
      icon: <FiAlertTriangle size={20} />,
      kpiClass: "sales-kpi-orange"
    },
    {
      title: "Expired",
      value: expiredCount.toLocaleString(),
      icon: <FiXCircle size={20} />,
      kpiClass: "sales-kpi-red"
    }
  ];

  return (
    <div className="row g-3 mb-4">
      {cards.map((card, index) => (
        <div key={index} className="col-6 col-md col-lg">
          <div className={`sales-kpi-card ${card.kpiClass}`}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="text-muted mb-1 text-uppercase small fw-bold" style={{ fontSize: "0.7rem", letterSpacing: "0.05em" }}>
                  {card.title}
                </h6>
                <h4 className="mb-0 fw-bold text-dark" style={{ letterSpacing: "-0.03em" }}>
                  {card.value}
                </h4>
              </div>
              <div className="sales-kpi-icon-wrap">
                {card.icon}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesDashboardCards;
