import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import LoginForm from "../components/LoginForm";
import useAuth from "../hooks/useAuth";
import { AUTH_ROUTES } from "../constants/authConstants";
import "../auth.css";

const Login = () => {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate(AUTH_ROUTES.DASHBOARD, { replace: true });
    }
  }, [currentUser, navigate]);

  return (
    <div className="auth-wrapper">
      <div className="auth-card card shadow-lg border-0">

        {/* Header */}
        <div className="auth-header text-center">
          <div className="auth-logo mb-3">
            <span className="auth-logo-icon">💊</span>
          </div>
          <h1 className="auth-title">MedChem</h1>
          <p className="auth-subtitle">Smart Pharmacy Inventory System</p>
        </div>

        {/* Body */}
        <div className="card-body px-4 py-4">
          <h2 className="fs-5 fw-bold text-center mb-4 text-dark">
            Sign in to your account
          </h2>
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="card-footer text-center text-muted small py-3">
          &copy; {new Date().getFullYear()} MedChem. All rights reserved.
        </div>

      </div>
    </div>
  );
};

export default Login;
