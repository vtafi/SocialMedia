import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, ShieldCheck, CheckCircle } from "lucide-react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";

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

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (newPassword.length < 6) e.newPassword = "Password must be at least 6 characters";
    if (newPassword !== confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setIsLoading(true);
    setApiError("");
    try {
      await authService.resetPassword(token, newPassword, confirmPassword);
      setIsDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] font-inter">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="text-[#0052FF] font-medium hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

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
            <ShieldCheck className="w-8 h-8 text-[#4D7CFF]" />
            <span className="font-calistoga text-2xl text-white">Set New Password</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-calistoga text-5xl text-white mb-6 leading-tight"
          >
            Almost back <br />
            <span className="gradient-text">in the Network</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-slate-300 leading-relaxed max-w-md"
          >
            Choose a strong new password to secure your workspace and get back to
            exploring the ecosystem.
          </motion.p>
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
            <h2 className="font-calistoga text-4xl text-[#0F172A] mb-3">New Password.</h2>
            <p className="text-slate-500">Enter and confirm your new password below.</p>
          </div>

          {isDone ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 text-emerald-700 p-5 rounded-2xl border border-emerald-100"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="font-bold text-sm">Password changed successfully!</p>
              </div>
              <p className="text-sm mt-2 ml-11 opacity-90">
                Redirecting you to login in a moment…
              </p>
            </motion.div>
          ) : (
            <>
              {apiError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, newPassword: undefined }));
                    }}
                    className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 transition-colors ${
                      errors.newPassword
                        ? "border-red-400 focus-visible:ring-red-500/50"
                        : "border-slate-200 focus-visible:ring-[#0052FF]/50"
                    }`}
                  />
                  {errors.newPassword && (
                    <span className="text-xs text-red-500">{errors.newPassword}</span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    className={`flex h-12 w-full rounded-xl border bg-white px-4 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 transition-colors ${
                      errors.confirmPassword
                        ? "border-red-400 focus-visible:ring-red-500/50"
                        : "border-slate-200 focus-visible:ring-[#0052FF]/50"
                    }`}
                  />
                  {errors.confirmPassword && (
                    <span className="text-xs text-red-500">{errors.confirmPassword}</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 h-12 px-6 inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white hover:shadow-[0_8px_25px_-6px_rgba(0,82,255,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isLoading ? "Saving..." : "Set New Password"}
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-[#0052FF] hover:underline">
              Back to Sign In
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
