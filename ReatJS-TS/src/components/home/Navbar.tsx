import { useState, useEffect } from "react";
import {
  Search,
  Home,
  Hash,
  Bell,
  Mail,
  Menu,
  Leaf,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/auth.service";

interface NavbarProps {
  onSearch: (q: string) => void;
}

const TopNavIcon = ({
  icon,
  active,
  badge,
  onClick,
  title,
}: {
  icon: React.ReactNode;
  active?: boolean;
  badge?: number;
  onClick?: () => void;
  title?: string;
}) => (
  <button
    title={title}
    onClick={onClick}
    className={`relative p-2.5 rounded-full transition-colors ${
      active
        ? "text-emerald-600 bg-emerald-50"
        : "text-slate-500 hover:bg-slate-100"
    }`}
  >
    {icon}
    {badge && badge > 0 ? (
      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full" />
    ) : null}
  </button>
);

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

  const avatarUrl =
    profile?.avatar || `https://i.pravatar.cc/150?u=${profile?._id}`;

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer group shrink-0"
          onClick={() => navigate("/")}
        >
          <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-xl tracking-tight hidden sm:block text-slate-900">
            NatureTech
          </span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xl relative hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search NatureTech..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-100 border border-transparent text-slate-900 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
          />
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <TopNavIcon icon={<Home className="w-5 h-5" />} active title="Home" />
          <TopNavIcon icon={<Hash className="w-5 h-5" />} title="Explore" />
          <TopNavIcon
            icon={<Bell className="w-5 h-5" />}
            badge={3}
            title="Notifications"
          />
          <TopNavIcon
            icon={<Mail className="w-5 h-5" />}
            title="Messages"
            onClick={() => navigate("/chat")}
          />

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          <button className="hidden sm:flex items-center gap-2 hover:bg-slate-100 p-1 pr-3 rounded-full transition-colors">
            <img
              src={avatarUrl}
              alt="User"
              className="w-8 h-8 rounded-full object-cover border border-slate-200"
            />
            <span className="text-sm font-semibold">
              {profile?.name ?? "User"}
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
            onClick={() => navigate("/chat")}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-50 text-slate-700 text-sm"
          >
            <Mail className="w-4 h-4" /> Messages
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-sm"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
