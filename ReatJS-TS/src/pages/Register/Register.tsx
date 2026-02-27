import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "../../hooks/useForm";
import { emailRule, passwordRule } from "../../utils/validation";
import { authService } from "../../services/auth.service";
import "./Register.css";

interface RegisterFormValues {
  name: string;
  email: string;
  date_of_birth: string;
  password: string;
  confirmPassword: string;
  [key: string]: string;
}

const Register: React.FC = () => {
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
  } = useForm<RegisterFormValues>({
    initialValues: {
      name: "",
      email: "",
      date_of_birth: "",
      password: "",
      confirmPassword: "",
    },
    validationRules: {
      name: {
        required: true,
        minLength: 2,
        message: "Name must be at least 2 characters",
      },
      email: emailRule,
      date_of_birth: {
        required: true,
        message: "Date of birth is required",
      },
      password: passwordRule,
      confirmPassword: {
        required: true,
        message: "Please confirm your password",
      },
    },
    onSubmit: async (formValues) => {
      try {
        setApiError("");

        // Validate passwords match
        if (formValues.password !== formValues.confirmPassword) {
          setFieldError("confirmPassword", "Passwords do not match");
          return;
        }

        await authService.register({
          name: formValues.name,
          email: formValues.email,
          password: formValues.password,
          confirmPassword: formValues.confirmPassword,
          date_of_birth: new Date(formValues.date_of_birth).toISOString(),
        });

        // Redirect to login after successful registration
        navigate("/login");
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Registration failed. Please try again.";
        setApiError(errorMessage);

        if (errorMessage.toLowerCase().includes("email")) {
          setFieldError("email", errorMessage);
        }
      }
    },
  });

  const handleGoogleLogin = () => {
    const googleOAuthUrl = `${import.meta.env.VITE_API_URL || "http://localhost:8386"}/users/oauth/google`;
    window.location.href = googleOAuthUrl;
  };

  return (
    <div className="register-container">
      <div className="register-content">
        {/* Left Panel - Branding */}
        <div className="register-left-panel">
          <div className="register-gradient-bg"></div>
          <div className="register-line-art-overlay"></div>

          <div className="register-branding">
            <div className="register-brand-icon">
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

            <h1 className="register-brand-title">
              Join the Collective.
              <br />
              <span className="register-brand-title-italic">
                Expand your Network.
              </span>
            </h1>

            <p className="register-brand-subtitle">
              Connect with visionary leaders and access exclusive opportunities
              in a curated environment.
            </p>

            <div className="register-features">
              <div className="register-feature-item">
                <div className="register-feature-line"></div>
                <span className="register-feature-text">
                  Curated Connections
                </span>
              </div>
              <div className="register-feature-item">
                <div className="register-feature-line"></div>
                <span className="register-feature-text">
                  Professional Growth
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Register Form */}
        <div className="register-right-panel">
          <div className="register-form-container">
            <div className="register-form-header">
              <h2>Create Account</h2>
              <p>Apply to join our exclusive network.</p>
            </div>

            {apiError && (
              <div className="register-error-banner">
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

            <form onSubmit={handleSubmit} className="register-form">
              <div className="register-form-fields">
                {/* Full Name */}
                <div className="register-input-group">
                  <label htmlFor="name" className="register-label">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="John Doe"
                    value={values.name}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`register-input ${touched.name && errors.name ? "register-input-error" : ""}`}
                  />
                  {touched.name && errors.name && (
                    <span className="register-input-error-text">
                      {errors.name}
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="register-input-group">
                  <label htmlFor="email" className="register-label">
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
                    className={`register-input ${touched.email && errors.email ? "register-input-error" : ""}`}
                  />
                  {touched.email && errors.email && (
                    <span className="register-input-error-text">
                      {errors.email}
                    </span>
                  )}
                </div>

                {/* Date of Birth */}
                <div className="register-input-group">
                  <label htmlFor="date_of_birth" className="register-label">
                    Date of Birth
                  </label>
                  <input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    required
                    value={values.date_of_birth}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`register-input ${touched.date_of_birth && errors.date_of_birth ? "register-input-error" : ""}`}
                  />
                  {touched.date_of_birth && errors.date_of_birth && (
                    <span className="register-input-error-text">
                      {errors.date_of_birth}
                    </span>
                  )}
                </div>

                {/* Password */}
                <div className="register-input-group">
                  <label htmlFor="password" className="register-label">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`register-input ${touched.password && errors.password ? "register-input-error" : ""}`}
                  />
                  {touched.password && errors.password && (
                    <span className="register-input-error-text">
                      {errors.password}
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="register-input-group">
                  <label htmlFor="confirmPassword" className="register-label">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    placeholder="••••••••"
                    value={values.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`register-input ${touched.confirmPassword && errors.confirmPassword ? "register-input-error" : ""}`}
                  />
                  {touched.confirmPassword && errors.confirmPassword && (
                    <span className="register-input-error-text">
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="register-submit-btn"
              >
                {isSubmitting ? "Creating Account..." : "Join Now"}
                <svg
                  className="register-submit-arrow"
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
              <div className="register-divider">
                <span>Or join with</span>
              </div>

              {/* Social Login Buttons */}
              <div className="register-social-buttons">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="register-social-btn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    />
                  </svg>
                </button>

                <button type="button" className="register-social-btn">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>

                <button type="button" className="register-social-btn">
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

              {/* Sign In Link */}
              <p className="register-signin-text">
                Already have an account?{" "}
                <a href="/login" className="register-signin-link">
                  Sign In
                </a>
              </p>
            </form>
          </div>

          {/* Footer */}
          <div className="register-footer">
            <span>© 2024 Curated Collective</span>
            <div className="register-footer-links">
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

export default Register;
