import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, CircleDot, Mail } from "lucide-react";
import { Link } from "react-router-dom";
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

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setApiError("");
    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            <CircleDot className="w-8 h-8 text-[#4D7CFF]" />
            <span className="font-calistoga text-2xl text-white">Account Recovery</span>
          </motion.div>

          <motion.h1
            variants={fadeInUp}
            className="font-calistoga text-5xl text-white mb-6 leading-tight"
          >
            Secure your <br />
            <span className="gradient-text">Workspace</span>
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="text-lg text-slate-300 leading-relaxed max-w-md"
          >
            Don't worry if you've lost your access. We'll help you get back to
            mapping the ecosystem securely.
          </motion.p>

          <motion.div
            variants={fadeInUp}
            className="mt-16 p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-w-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-[#0052FF]/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-[#4D7CFF]" />
              </div>
              <div>
                <p className="text-white font-medium text-sm">Recovery email</p>
                <p className="text-slate-400 font-mono text-xs">Sent within seconds</p>
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
            <h2 className="font-calistoga text-4xl text-[#0F172A] mb-3">Reset Password.</h2>
            <p className="text-slate-500">
              {isSubmitted
                ? "Check your email for instructions."
                : "Enter your email to receive a reset link."}
            </p>
          </div>

          {!isSubmitted ? (
            <>
              {apiError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#0F172A]">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-[#0F172A] placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0052FF]/50 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 h-12 px-6 inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white hover:shadow-[0_8px_25px_-6px_rgba(0,82,255,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 text-emerald-700 p-5 rounded-2xl border border-emerald-100 mb-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="font-bold text-sm">Reset link sent to {email}</p>
              </div>
              <p className="text-sm mt-2 ml-11 opacity-90">
                Please check your inbox and follow the instructions to securely
                reset your password.
              </p>
            </motion.div>
          )}

          <p className="mt-8 text-center text-sm text-slate-500">
            Remembered your password?{" "}
            <Link to="/login" className="font-medium text-[#0052FF] hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
