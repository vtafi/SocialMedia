import React, { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Github } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "../../hooks/useForm";
import { emailRule, passwordRule } from "../../utils/validation";
import { authService } from "../../services/auth.service";
import getOauthGoogleUrl from "../../components/auth/Login";

interface LoginFormValues {
  email: string;
  password: string;
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
    initialValues: { email: "", password: "" },
    validationRules: { email: emailRule, password: passwordRule },
    onSubmit: async (formValues) => {
      try {
        setApiError("");
        await authService.login(formValues);
        // Profile sẽ được load bởi getMe() trong Home
        navigate("/");
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : "Login failed. Please try again.";
        setApiError(msg);
        if (msg.toLowerCase().includes("email")) setFieldError("email", msg);
        else if (msg.toLowerCase().includes("password")) setFieldError("password", msg);
      }
    },
  });

  return (
    <div className="min-h-screen flex bg-[#FAFAFA] font-inter overflow-hidden">

      {/* ── LEFT PANEL (dark) ── */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 relative items-center justify-center overflow-hidden p-12">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#0052FF]/30 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#4D7CFF]/20 rounded-full blur-[150px]" />

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
            <Leaf className="w-8 h-8 text-[#4D7CFF]" />
            <span className="font-calistoga text-2xl text-white">NatureTech</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-calistoga text-5xl text-white mb-6 leading-tight"
          >
            Connect with the
            <br />
            <span className="gradient-text">Future of Ecology</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-slate-300 leading-relaxed max-w-md"
          >
            The minimal workspace for eco-innovators, researchers, and tech
            enthusiasts building a sustainable tomorrow.
          </motion.p>

          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="mt-16 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-w-sm"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#0052FF] to-[#4D7CFF] p-[2px]">
                <img
                  src="https://i.pravatar.cc/150?u=cyber"
                  className="w-full h-full rounded-full border-2 border-slate-900"
                  alt="Avatar"
                />
              </div>
              <div>
                <p className="text-white font-medium text-sm">System Live</p>
                <p className="text-[#4D7CFF] font-mono text-xs">@network_node</p>
              </div>
            </div>
            <div className="w-3/4 h-2 bg-white/20 rounded-full mb-2" />
            <div className="w-1/2 h-2 bg-white/20 rounded-full" />
          </motion.div>
        </motion.div>
      </div>

      {/* ── RIGHT PANEL (form) ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <Leaf className="w-8 h-8 text-[#0052FF]" />
            <span className="font-calistoga text-2xl text-[#0F172A]">NatureTech</span>
          </div>

          <div className="mb-10">
            <h2 className="font-calistoga text-4xl text-[#0F172A] mb-3">Welcome back.</h2>
            <p className="text-slate-500">Enter your credentials to access your workspace.</p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0F172A]">Email address</label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@company.com"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF]/50 transition-colors ${
                  touched.email && errors.email ? "border-red-400" : "border-slate-200"
                }`}
              />
              {touched.email && errors.email && (
                <span className="text-xs text-red-500">{errors.email}</span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-[#0F172A]">Password</label>
                <Link to="/forgot-password" className="text-sm font-medium text-[#0052FF] hover:underline">
                  Forgot?
                </Link>
              </div>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={values.password}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF]/50 transition-colors ${
                  touched.password && errors.password ? "border-red-400" : "border-slate-200"
                }`}
              />
              {touched.password && errors.password && (
                <span className="text-xs text-red-500">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 h-12 px-6 inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white hover:shadow-[0_8px_25px_-6px_rgba(0,82,255,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Signing In..." : "Sign In to Workspace"}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
              Or continue with
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => { window.location.href = getOauthGoogleUrl(); }}
              className="h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-transparent hover:bg-slate-100 text-[#0F172A] text-sm font-medium transition-all"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-transparent hover:bg-slate-100 text-[#0F172A] text-sm font-medium transition-all"
            >
              <Github className="w-5 h-5" />
              GitHub
            </button>
          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="font-medium text-[#0052FF] hover:underline">
              Sign Up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
