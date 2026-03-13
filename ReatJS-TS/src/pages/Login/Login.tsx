import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "../../hooks/useForm";
import { emailRule, passwordRule } from "../../utils/validation";
import { authService } from "../../services/auth.service";
import "./Login.css";
import getOauthGoogleUrl from "../../components/auth/Login";

interface LoginFormValues {
  email: string;
  password: string;
  [key: string]: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string>("");

  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldError,
  } = useForm<LoginFormValues>({
    initialValues: {
      email: "",
      password: "",
    },
    validationRules: {
      email: emailRule,
      password: passwordRule,
    },
    onSubmit: async (formValues) => {
      try {
        setApiError("");
        const response = await authService.login(formValues);

        // Save auth data (profile user - token đã được set vào cookie bởi backend)
        authService.saveAuthData(response.result);

        // Redirect to home
        navigate("/");
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.";
        setApiError(errorMessage);

        // Set field errors if specific
        if (errorMessage.toLowerCase().includes("email")) {
          setFieldError("email", errorMessage);
        } else if (errorMessage.toLowerCase().includes("password")) {
          setFieldError("password", errorMessage);
        }
      }
    },
  });

  const handleGoogleLogin = () => {
    const oauthURL = getOauthGoogleUrl();
    window.location.href = oauthURL;
  };

  return (
    <div className="login-container">
      <div className="login-content">
        {/* Left Panel - Branding */}
        <div className="login-left-panel">
          <div className="login-gradient-bg"></div>
          <div className="login-line-art-overlay"></div>

          <div className="login-branding">
            <div className="login-brand-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path
                  d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="login-brand-title">
              Curated Growth.
              <br />
              <span className="login-brand-title-italic">
                Purposeful Networking.
              </span>
            </h1>

            <p className="login-brand-subtitle">
              A refined space for industry leaders to connect, collaborate, and
              evolve together.
            </p>

            <div className="login-features">
              <div className="login-feature-item">
                <div className="login-feature-line"></div>
                <span className="login-feature-text">Exclusive Membership</span>
              </div>
              <div className="login-feature-item">
                <div className="login-feature-line"></div>
                <span className="login-feature-text">Industry Insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-right-panel">
          <div className="login-form-container">
            <div className="login-form-header">
              <h2>Sign In</h2>
              <p>Welcome back. Please enter your details.</p>
            </div>

            {apiError && (
              <div className="login-error-banner">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                {apiError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-form-fields">
                {/* Email Input */}
                <div className="login-input-group">
                  <label htmlFor="email" className="login-label">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@company.com"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`login-input ${touched.email && errors.email ? "login-input-error" : ""}`}
                  />
                  {touched.email && errors.email && (
                    <span className="login-input-error-text">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Password Input */}
                <div className="login-input-group">
                  <div className="login-label-row">
                    <label htmlFor="password" className="login-label">
                      Password
                    </label>
                    <a href="#" className="login-forgot-link">
                      Forgot Password?
                    </a>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`login-input ${touched.password && errors.password ? "login-input-error" : ""}`}
                  />
                  {touched.password && errors.password && (
                    <span className="login-input-error-text">
                      {errors.password}
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="login-submit-btn"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
                <svg
                  className="login-submit-arrow"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {/* Divider */}
              <div className="login-divider">
                <span>Or continue with</span>
              </div>

              {/* Social Login Buttons */}
              <div className="login-social-buttons">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="login-social-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    />
                  </svg>
                </button>

                <button type="button" className="login-social-btn">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>

                <button type="button" className="login-social-btn">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </button>
              </div>

              {/* Sign Up Link */}
              <p className="login-signup-text">
                Don't have an account?{" "}
                <a href="/register" className="login-signup-link">
                  Sign Up
                </a>
              </p>
            </form>
          </div>

          {/* Footer */}
          <div className="login-footer">
            <span>© 2024 Curated Collective</span>
            <div className="login-footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Help</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
