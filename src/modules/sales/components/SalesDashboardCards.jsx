import React from 'react';
import { FaRupeeSign, FaShoppingCart, FaBoxOpen, FaExclamationTriangle, FaTimesCircle } from 'react-icons/fa';

const SalesDashboardCards = ({ stats, isLoading, filterLabel = "Today's" }) => {
  if (isLoading) {
    return (
      <div className="row mb-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="col-md-2 col-sm-6 mb-3 flex-grow-1">
            <div className="card shadow-sm h-100 border-0 bg-light">
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
      value: todaySales,
      icon: <FaShoppingCart className="fs-1 text-primary opacity-50" />,
      bg: "border-primary",
      text: "text-primary"
    },
    {
      title: `${filterLabel} Revenue`,
      value: `₹${todayRevenue.toFixed(2)}`,
      icon: <FaRupeeSign className="fs-1 text-success opacity-50" />,
      bg: "border-success",
      text: "text-success"
    },
    {
      title: "Items Sold",
      value: totalItemsSold,
      icon: <FaBoxOpen className="fs-1 text-info opacity-50" />,
      bg: "border-info",
      text: "text-info"
    },
    {
      title: "Low Stock",
      value: lowStockCount,
      icon: <FaExclamationTriangle className="fs-1 text-warning opacity-50" />,
      bg: "border-warning",
      text: "text-warning"
    },
    {
      title: "Expired",
      value: expiredCount,
      icon: <FaTimesCircle className="fs-1 text-danger opacity-50" />,
      bg: "border-danger",
      text: "text-danger"
    }
  ];

  return (
    <div className="row mb-4">
      {cards.map((card, index) => (
        <div key={index} className="col-md-2 col-sm-6 mb-3 flex-grow-1">
          <div className={`card shadow-sm h-100 border-start border-4 ${card.bg}`}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1 text-uppercase small fw-bold">{card.title}</h6>
                  <h3 className={`mb-0 fw-bold ${card.text}`}>{card.value}</h3>
                </div>
                <div>{card.icon}</div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SalesDashboardCards;
