import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { authAPI } from "../services/api";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "", // Not pre-filled
    password: "", // Not pre-filled
    confirmPassword: "",
    showPassword: false,
    showConfirmPassword: false,
    rememberMe: false,
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Hardcoded credentials - only these will work
  const HARDCODED_EMAIL = "haroonaulakh57@gmail.com";
  const HARDCODED_PASSWORD = "haroon102103";

  useEffect(() => {
    // Check if already logged in (check localStorage)
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user types
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError("Please fill in all fields");
        return;
      }

      // Check hardcoded credentials
      if (formData.email !== HARDCODED_EMAIL || formData.password !== HARDCODED_PASSWORD) {
        setError("Invalid email or password");
        return;
      }

      setIsLoading(true);
      try {
        // Use backend API, not Supabase
        const response = await authAPI.login(formData.email, formData.password);
        if (response.success) {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', formData.email);
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Login error:', error);
        setError(error.message || 'Login failed. Make sure the backend server is running on http://localhost:8000');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
        setError("Please fill in all fields");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (!formData.agreeToTerms) {
        setError("Please agree to the terms and conditions");
        return;
      }
      // Sign up functionality not implemented
      setError("Sign up functionality not available");
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setError("");
    // Reset form when switching
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      showConfirmPassword: false,
      rememberMe: false,
      agreeToTerms: false,
    });
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2 className="login-title">The Creative School</h2>
        <p className="login-subtitle">
          {isLogin ? "Welcome back! Please login to continue" : "Create your account to get started"}
        </p>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Form Toggle */}
        <div className={`form-toggle ${!isLogin ? "signup-active" : ""}`}>
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`toggle-btn ${isLogin ? "active" : ""}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`toggle-btn ${!isLogin ? "active" : ""}`}
          >
            Sign Up
          </button>
        </div>

        {/* Animated Form Content */}
        <div className="form-content-wrapper">
          {isLogin ? (
            <div key="login" className="form-content">
              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-container">
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    disabled={isLoading}
                  />
                  <div className="input-glow"></div>
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-container">
                  <div className="input-wrapper">
                    <input
                      type={formData.showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-input"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      className="password-toggle"
                      disabled={isLoading}
                      title={formData.showPassword ? "Hide password" : "Show password"}
                    >
                      {formData.showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <div className="input-glow"></div>
                </div>
              </div>

              {/* Remember Me */}
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="rememberMe"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <label htmlFor="rememberMe" className="checkbox-label">
                  Remember me
                </label>
              </div>
            </div>
          ) : (
            <div key="signup" className="form-content">
              {/* First Name & Last Name */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <div className="input-container">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="form-input"
                      disabled={isLoading}
                    />
                    <div className="input-glow"></div>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <div className="input-container">
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="form-input"
                      disabled={isLoading}
                    />
                    <div className="input-glow"></div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-container">
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    disabled={isLoading}
                  />
                  <div className="input-glow"></div>
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-container">
                  <div className="input-wrapper">
                    <input
                      type={formData.showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="form-input"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      className="password-toggle"
                      disabled={isLoading}
                      title={formData.showPassword ? "Hide password" : "Show password"}
                    >
                      {formData.showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <div className="input-glow"></div>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="input-container">
                  <div className="input-wrapper">
                    <input
                      type={formData.showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="form-input"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                      className="password-toggle"
                      disabled={isLoading}
                      title={formData.showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {formData.showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                  <div className="input-glow"></div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <label htmlFor="agreeToTerms" className="checkbox-label">
                  I agree to the{" "}
                  <span className="terms-link">Terms & Conditions</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="spinner"></div>
              <span>{isLogin ? "Logging in..." : "Creating account..."}</span>
            </div>
          ) : (
            isLogin ? "Login" : "Create Account"
          )}
        </button>

        {/* Footer */}
        <p className="login-footer">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <span className="login-footer-link" onClick={toggleForm}>
                Sign up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span className="login-footer-link" onClick={toggleForm}>
                Login
              </span>
            </>
          )}
        </p>
      </form>
    </div>
  );
}
