import { useState, useEffect } from "react";
import { Search, Bell, Mail, Menu, Leaf, LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";

interface NavbarProps {
  onSearch: (q: string) => void;
}

const Navbar = ({ onSearch }: NavbarProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profile = authService.getProfile();

  useEffect(() => {
    const timer = setTimeout(() => onSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      navigate("/login");
    }
  };

  const displayName = profile?.name || profile?.username || profile?.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar || `https://i.pravatar.cc/150?u=${profile?._id}`;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">

        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer shrink-0"
          onClick={() => navigate("/")}
        >
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="font-calistoga text-2xl tracking-tight text-[#0F172A] hidden sm:block">
            NatureTech
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-2xl relative hidden md:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search the network..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 h-12 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-[#0052FF]/50 focus:bg-white focus:ring-2 focus:ring-[#0052FF]/20 rounded-xl text-sm text-[#0F172A] placeholder:text-slate-400 outline-none transition-all"
          />
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
          <button
            onClick={() => { navigate("/profile"); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-700 text-sm"
          >
            <User className="w-4 h-4" /> Profile
          </button>
          <button
            onClick={() => { navigate("/chat"); setMobileMenuOpen(false); }}
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
