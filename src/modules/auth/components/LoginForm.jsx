import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaSignInAlt } from "react-icons/fa";

import { loginWithEmail } from "../services/authService";
import { playLogin, playError } from "../../../shared/services/audioService";
import { AUTH_ROUTES, AUTH_ERRORS, AUTH_MESSAGES, AUTH_VALIDATION } from "../constants/authConstants";

const LoginForm = () => {
  const navigate = useNavigate();

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState({});

  const validate = () => {
    const newErrors = {};
    if (!email.trim())                                      newErrors.email    = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email))                  newErrors.email    = "Enter a valid email address.";
    if (!password)                                          newErrors.password = "Password is required.";
    else if (password.length < AUTH_VALIDATION.PASSWORD_MIN_LENGTH)
                                                            newErrors.password = `Password must be at least ${AUTH_VALIDATION.PASSWORD_MIN_LENGTH} characters.`;
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      
      // Play sound on successful login
      playLogin();
      
      toast.success(AUTH_MESSAGES.LOGIN_SUCCESS);
      navigate(AUTH_ROUTES.DASHBOARD);
    } catch (error) {
      playError();
      const message = AUTH_ERRORS[error.code] || AUTH_ERRORS.DEFAULT;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="auth-form">

      {/* Email */}
      <div className="mb-3">
        <label htmlFor="email" className="form-label fw-semibold text-secondary" style={{ fontSize: "0.85rem" }}>
          Email Address
        </label>
        <input
          id="email"
          type="email"
          className={`form-control auth-input ${errors.email ? "is-invalid" : ""}`}
          placeholder="name@pharmacy.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
        />
        {errors.email && <div className="invalid-feedback small fw-medium mt-1">{errors.email}</div>}
      </div>

      {/* Password */}
      <div className="mb-4">
        <label htmlFor="password" className="form-label fw-semibold text-secondary" style={{ fontSize: "0.85rem" }}>
          Password
        </label>
        <div className="input-group auth-input-group">
          <input
            id="password"
            type={showPass ? "text" : "password"}
            className={`form-control auth-input border-end-0 ${errors.password ? "is-invalid" : ""}`}
            placeholder="Enter secure password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            className={`btn auth-toggle-pass-btn ${errors.password ? "border-danger text-danger" : "border-start-0 text-muted"}`}
            onClick={() => setShowPass((prev) => !prev)}
            disabled={loading}
            tabIndex={-1}
            aria-label={showPass ? "Hide password" : "Show password"}
          >
            {showPass ? <FaEyeSlash /> : <FaEye />}
          </button>
          {errors.password && <div className="invalid-feedback small fw-medium mt-1">{errors.password}</div>}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn auth-btn-submit w-100 d-flex align-items-center justify-content-center"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
            <span>Verifying Credentials...</span>
          </>
        ) : (
          <>
            <FaSignInAlt className="me-2" />
            <span>Sign In to MedChem</span>
          </>
        )}
      </button>

    </form>
  );
};

export default LoginForm;
