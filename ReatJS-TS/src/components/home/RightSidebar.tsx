import { useEffect, useState } from "react";
import { TrendingUp, Sparkles, UserPlus } from "lucide-react";
import { tweetService } from "../../services/tweet.service";

interface TrendItem {
  category: string;
  tag: string;
  posts: string;
}

const DEFAULT_TRENDS: TrendItem[] = [
  { category: "Technology", tag: "#BioLuminescence", posts: "12.5K" },
  { category: "Environment", tag: "#MyceliumNetwork", posts: "8,240" },
  { category: "Science", tag: "Synthetic Photosynthesis", posts: "5,102" },
];

interface RightSidebarProps {
  searchQuery: string;
}

const RightSidebar = ({ searchQuery }: RightSidebarProps) => {
  const [searchResults, setSearchResults] = useState<
    { name: string; username: string; avatar?: string }[]
  >([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    tweetService
      .search(searchQuery)
      .then((data) => {
        if (data?.result?.users)
          setSearchResults(data.result.users.slice(0, 3));
      })
      .catch(() => {});
  }, [searchQuery]);

  return (
    <aside className="hidden lg:block w-[320px] shrink-0 sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pb-4">
      {/* Premium Banner */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 mb-6 text-white shadow-sm">
        <h2 className="font-bold text-lg flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-emerald-200" /> Go Premium
        </h2>
        <p className="text-emerald-50 text-sm mb-4 leading-relaxed">
          Unlock advanced analytics, custom badges, and exclusive nature-tech
          webinars.
        </p>
        <button className="w-full bg-white text-emerald-700 font-bold py-2 rounded-full hover:bg-emerald-50 transition-colors text-sm">
          Upgrade Now
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
          <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-600" /> Search Results
          </h2>
          <div className="flex flex-col gap-4">
            {searchResults.map((u, i) => (
              <div key={i} className="flex items-center gap-3">
                <img
                  src={u.avatar || `https://i.pravatar.cc/150?u=${u.username}`}
                  alt={u.name}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 truncate">
                    {u.name}
                  </p>
                  <p className="text-xs text-slate-500">@{u.username}</p>
                </div>
                <button className="text-xs font-bold text-emerald-600 border border-emerald-500 px-3 py-1 rounded-full hover:bg-emerald-600 hover:text-white transition-colors shrink-0">
                  Follow
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 shadow-sm">
        <h2 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-600" /> Trending Topics
        </h2>
        <div className="flex flex-col gap-4">
          {DEFAULT_TRENDS.map((t, i) => (
            <div key={i} className="cursor-pointer group">
              <p className="text-[12px] text-slate-500 font-medium mb-0.5">
                {t.category}
              </p>
              <p className="font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">
                {t.tag}
              </p>
              <p className="text-[12px] text-slate-400 mt-0.5">
                {t.posts} posts
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <nav className="flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] text-slate-400 px-2">
        <a href="#" className="hover:text-slate-600 hover:underline">
          Terms of Service
        </a>
        <a href="#" className="hover:text-slate-600 hover:underline">
          Privacy Policy
        </a>
        <a href="#" className="hover:text-slate-600 hover:underline">
          Cookie Policy
        </a>
        <span>© 2025 NatureTech</span>
      </nav>
    </aside>
  );
};

export default RightSidebar;
