import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, UserPlus } from "lucide-react";
import { authService } from "../../services/auth.service";

interface TrendItem {
  category: string;
  tag: string;
  posts: string;
}

const DEFAULT_TRENDS: TrendItem[] = [
  { category: "Technology", tag: "BioLuminescence", posts: "12.5K" },
  { category: "Environment", tag: "MyceliumNetwork", posts: "8,240" },
  { category: "Science", tag: "SyntheticPhotosynthesis", posts: "5,102" },
];

interface RightSidebarProps {
  searchQuery: string;
}

const RightSidebar = ({ searchQuery }: RightSidebarProps) => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState<
    { _id: string; name: string; username: string; avatar?: string }[]
  >([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    authService
      .searchUsers(searchQuery, 1, 3)
      .then((data) => {
        setSearchResults(
          data.users.map((u) => ({
            _id: u._id,
            name: u.name || u.username || "User",
            username: u.username || "",
            avatar: u.avatar,
          }))
        );
      })
      .catch(() => {});
  }, [searchQuery]);

  return (
    <aside className="hidden lg:block w-[350px] shrink-0 sticky top-28 h-[calc(100vh-7rem)] overflow-y-auto pb-4">

      {/* Network Status */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#0052FF]/30 blur-[50px] rounded-full" />

        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0052FF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0052FF]" />
          </span>
          Network Status
        </div>

        <h2 className="font-calistoga text-2xl mb-2">Systems Online</h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-6">
          12,450 nodes currently connected. Ecological data streams are nominal.
        </p>
        <button className="w-full h-10 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors">
          View Metrics
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-6">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
            <UserPlus className="w-4 h-4" /> Search Results
          </div>
          <div className="flex flex-col gap-4">
            {searchResults.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => u.username && navigate(`/users/${u.username}`)}
              >
                <img
                  src={u.avatar || `https://i.pravatar.cc/150?u=${u._id}`}
                  alt={u.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#0F172A] group-hover:text-[#0052FF] transition-colors truncate">{u.name}</p>
                  {u.username && <p className="text-xs text-slate-500 font-mono">@{u.username}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Signals */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          <TrendingUp className="w-4 h-4" /> Trending Signals
        </div>
        <div className="flex flex-col gap-5 mt-2">
          {DEFAULT_TRENDS.map((t, i) => (
            <div key={i} className="group cursor-pointer">
              <p className="text-[11px] text-slate-400 font-mono uppercase tracking-wider mb-0.5">
                {t.category}
              </p>
              <p className="font-bold text-[#0F172A] group-hover:text-[#0052FF] transition-colors">
                #{t.tag}
              </p>
              <p className="text-slate-500 font-mono text-xs mt-1">{t.posts} updates</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <nav className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-slate-400 px-2 mt-6">
        <a href="#" className="hover:text-slate-600 hover:underline">Terms</a>
        <a href="#" className="hover:text-slate-600 hover:underline">Privacy</a>
        <a href="#" className="hover:text-slate-600 hover:underline">Cookies</a>
        <span>© 2025 NatureTech</span>
      </nav>
    </aside>
  );
};

export default RightSidebar;
