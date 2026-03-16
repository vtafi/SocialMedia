import { useState, useEffect, useRef } from "react";
import { Search, Bell, Mail, Menu, Leaf, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { authService } from "../../services/auth.service";
import type { UserProfile } from "../../services/auth.service";

interface NavbarProps {
  onSearch?: (q: string) => void;
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profile = authService.getProfile();

  // Notify parent for sidebar search (debounced) — chỉ khi query có nội dung
  useEffect(() => {
    if (!onSearch || !query.trim()) return;
    const t = setTimeout(() => onSearch(query), 400);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  // Live user suggestions (debounced 300ms)
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      authService
        .searchUsers(query, 1, 5)
        .then((res) => setSuggestions(res.users))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate("/login");
    }
  };

  const goToSearch = (q = query) => {
    if (!q.trim()) return;
    setDropdownOpen(false);
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const displayName =
    profile?.name ||
    profile?.username ||
    profile?.email?.split("@")[0] ||
    "User";
  const avatarUrl = profile?.avatar;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer shrink-0"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center hover:bg-[#0052FF] transition-colors">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-calistoga text-2xl tracking-tight text-[#0F172A] hidden sm:block hover:text-[#0052FF] transition-colors">
            NatureTech
          </span>
        </div>

        {/* Search with dropdown */}
        <div
          ref={searchRef}
          className="flex-1 max-w-2xl relative hidden md:block"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="Search people, posts, hashtags…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => query && setDropdownOpen(true)}
            onKeyDown={(e) => e.key === "Enter" && goToSearch()}
            className="w-full pl-12 h-12 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-[#0052FF]/50 focus:bg-white focus:ring-2 focus:ring-[#0052FF]/20 rounded-xl text-sm text-[#0F172A] placeholder:text-slate-400 outline-none transition-all"
          />

          <AnimatePresence>
            {dropdownOpen && query.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 overflow-hidden z-50"
              >
                {/* User suggestions */}
                {suggestions.length > 0 && (
                  <div className="py-1">
                    {suggestions.map((u) => {
                      const name = u.name || u.username || "User";
                      const av =
                        u.avatar || `https://i.pravatar.cc/150?u=${u._id}`;
                      return (
                        <div
                          key={u._id}
                          onClick={() => {
                            setDropdownOpen(false);
                            setQuery("");
                            navigate(`/users/${u.username}`);
                          }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                        >
                          <img
                            src={av}
                            className="w-9 h-9 rounded-full object-cover shrink-0"
                            alt={name}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[#0F172A] truncate">
                              {name}
                            </p>
                            {u.username && (
                              <p className="text-xs text-slate-500 font-mono">
                                @{u.username}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="border-t border-slate-100" />
                  </div>
                )}

                {/* Search all */}
                <div
                  onClick={() => goToSearch()}
                  className="flex items-center gap-3 px-4 py-3 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-[#0052FF]/10 flex items-center justify-center shrink-0">
                    <Search className="w-4 h-4 text-[#0052FF]" />
                  </div>
                  <p className="text-sm font-medium text-[#0052FF]">
                    Search everything for "
                    <span className="font-bold">{query}</span>"
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button className="w-12 h-12 p-0 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate("/chat")}
            className="w-12 h-12 p-0 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
          >
            <Mail className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block" />

          <button
            onClick={() => navigate("/profile")}
            className="hidden sm:flex items-center gap-2 hover:bg-slate-100 p-1 pr-3 rounded-full transition-colors"
          >
            <img
              src={avatarUrl}
              alt="User"
              className="w-10 h-10 rounded-full object-cover border-2 border-slate-200 hover:border-[#0052FF] transition-colors"
            />
            <span className="text-sm font-semibold text-[#0F172A]">
              {displayName}
            </span>
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2.5 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors hidden sm:flex"
          >
            <LogOut className="w-4 h-4" />
          </button>

          <button
            className="sm:hidden p-2 text-slate-500"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="bg-white border-t border-slate-100 p-2 flex flex-col gap-1 sm:hidden">
          {/* Mobile search */}
          <div className="px-2 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setMobileMenuOpen(false);
                    goToSearch();
                  }
                }}
                className="w-full pl-9 h-10 bg-slate-50 rounded-xl text-sm text-[#0F172A] placeholder:text-slate-400 border border-slate-200 outline-none"
              />
            </div>
          </div>
          <button
            onClick={() => {
              navigate("/profile");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 text-sm"
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <button
            onClick={() => {
              navigate("/chat");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 text-sm"
          >
            <Mail className="w-4 h-4" /> Messages
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 text-red-600 text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
