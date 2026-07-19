import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash, FaSignInAlt } from "react-icons/fa";

import { loginWithEmail } from "../services/authService";
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
      toast.success(AUTH_MESSAGES.LOGIN_SUCCESS);
      navigate(AUTH_ROUTES.DASHBOARD);
    } catch (error) {
      const message = AUTH_ERRORS[error.code] || AUTH_ERRORS.DEFAULT;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>

      {/* Email */}
      <div className="mb-3">
        <label htmlFor="email" className="form-label fw-semibold">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          className={`form-control form-control-lg ${errors.email ? "is-invalid" : ""}`}
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoComplete="email"
        />
        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>

      {/* Password */}
      <div className="mb-4">
        <label htmlFor="password" className="form-label fw-semibold">
          Password
        </label>
        <div className="input-group">
          <input
            id="password"
            type={showPass ? "text" : "password"}
            className={`form-control form-control-lg ${errors.password ? "is-invalid" : ""}`}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => setShowPass((prev) => !prev)}
            disabled={loading}
            tabIndex={-1}
            aria-label={showPass ? "Hide password" : "Show password"}
          >
            {showPass ? <FaEyeSlash /> : <FaEye />}
          </button>
          {errors.password && <div className="invalid-feedback">{errors.password}</div>}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="btn btn-primary btn-lg w-100"
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
            Signing in...
          </>
        ) : (
          <>
            <FaSignInAlt className="me-2" />
            Sign In
          </>
        )}
      </button>

    </form>
  );
};

export default LoginForm;
