import React, { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Compass } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "../../hooks/useForm";
import { emailRule, passwordRule } from "../../utils/validation";
import { authService } from "../../services/auth.service";

interface RegisterFormValues {
  name: string;
  email: string;
  date_of_birth: string;
  password: string;
  confirmPassword: string;
  [key: string]: string;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

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
      name: { required: true, minLength: 2, message: "Name must be at least 2 characters" },
      email: emailRule,
      date_of_birth: { required: true, message: "Date of birth is required" },
      password: passwordRule,
      confirmPassword: { required: true, message: "Please confirm your password" },
    },
    onSubmit: async (formValues) => {
      try {
        setApiError("");
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
        navigate("/login");
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Registration failed. Please try again.";
        setApiError(msg);
        if (msg.toLowerCase().includes("email")) setFieldError("email", msg);
      }
    },
  });

  const inputClass = (field: string) =>
    `flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 transition-colors ${
      touched[field] && errors[field]
        ? "border-red-400 focus-visible:ring-red-400/50"
        : "border-slate-200 focus-visible:ring-[#0052FF]/50"
    }`;

  return (
    <div className="min-h-screen flex flex-row-reverse bg-[#FAFAFA] font-inter overflow-hidden">

      {/* ── RIGHT PANEL (dark) — rendered first in DOM for flex-row-reverse ── */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden p-12">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#4D7CFF]/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#0052FF]/20 rounded-full blur-[150px]" />

        <motion.div
          className="relative z-10 max-w-xl"
          initial="hidden"
          animate="show"
          variants={staggerContainer}
        >
          <motion.div
            variants={fadeInUp}
            className="mb-8 inline-flex items-center gap-3 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10"
          >
            <Compass className="w-8 h-8 text-[#4D7CFF]" />
            <span className="font-calistoga text-2xl text-white">Join the Network</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-calistoga text-5xl text-white mb-6 leading-tight"
          >
            Start mapping
            <br />
            <span className="gradient-text">the Ecosystem</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-slate-300 leading-relaxed max-w-md"
          >
            Create your profile to collaborate with leading scientists, share your findings,
            and stay updated on the latest in nature tech.
          </motion.p>

          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="mt-16 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-w-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#4D7CFF] to-[#0052FF] p-[2px]">
                <img
                  src="https://i.pravatar.cc/150?u=eco"
                  className="w-full h-full rounded-full border-2 border-slate-900"
                  alt="Avatar"
                />
              </div>
              <div>
                <p className="text-white font-medium text-sm">New Member</p>
                <p className="text-[#4D7CFF] font-mono text-xs">@eco_pioneer</p>
              </div>
            </div>
            <div className="w-3/4 h-2 bg-white/20 rounded-full mb-2" />
            <div className="w-1/2 h-2 bg-white/20 rounded-full" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── LEFT PANEL (form) ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto">
        <motion.div
          className="w-full max-w-md py-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Leaf className="w-8 h-8 text-[#0052FF]" />
            <span className="font-calistoga text-2xl text-[#0F172A]">NatureTech</span>
          </div>

          <div className="mb-10">
            <h2 className="font-calistoga text-4xl text-[#0F172A] mb-3">Create an account.</h2>
            <p className="text-slate-500">Fill in your details to establish your workspace.</p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="shrink-0">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="John Doe"
                value={values.name}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass("name")}
              />
              {touched.name && errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@company.com"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass("email")}
              />
              {touched.email && errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Date of Birth
              </label>
              <input
                name="date_of_birth"
                type="date"
                required
                value={values.date_of_birth}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`${inputClass("date_of_birth")} ${!values.date_of_birth ? "text-slate-400" : ""}`}
              />
              {touched.date_of_birth && errors.date_of_birth && (
                <p className="text-red-500 text-xs mt-1">{errors.date_of_birth}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass("password")}
              />
              {touched.password && errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                value={values.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
                className={inputClass("confirmPassword")}
              />
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-12 px-6 inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white hover:shadow-[0_8px_25px_-6px_rgba(0,82,255,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Creating Account..." : "Initialize Workspace"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-[#0052FF] hover:underline">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
