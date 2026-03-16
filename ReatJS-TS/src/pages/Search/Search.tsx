import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Users, FileText, Loader2, UserPlus, UserCheck } from "lucide-react";
import Navbar from "../../components/home/Navbar";
import PostCard from "../../components/home/PostCard";
import { tweetService } from "../../services/tweet.service";
import { authService } from "../../services/auth.service";
import type { Tweet } from "../../services/tweet.service";
import type { UserProfile } from "../../services/auth.service";

type Tab = "all" | "people" | "posts";

const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };

// ── UserCard ─────────────────────────────────────────────────────────────────
const UserCard = ({
  user,
  onNavigate,
}: {
  user: UserProfile;
  onNavigate: (identifier: string) => void;
}) => {
  const me = authService.getProfile();
  const isMe = me?._id === user._id;
  // Dùng is_following từ API nếu có, mặc định false
  const [following, setFollowing] = useState(user.is_following ?? false);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user._id) return;
    setLoading(true);
    try {
      if (following) {
        await authService.unfollowUser(user._id);
        setFollowing(false);
      } else {
        await authService.followUser(user._id);
        setFollowing(true);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const displayName = user.name || user.username || user.email?.split("@")[0] || "User";
  const avatarUrl = user.avatar || `https://i.pravatar.cc/150?u=${user._id}`;

  return (
    <motion.div
      variants={fadeInUp}
      onClick={() => onNavigate(user.username || user._id)}
      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:shadow-[0_4px_15px_rgb(0,0,0,0.05)] transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-4">
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-12 h-12 rounded-full object-cover border border-slate-100"
        />
        <div>
          <p className="font-bold text-[#0F172A] group-hover:text-[#0052FF] transition-colors text-sm">
            {displayName}
          </p>
          {user.username && (
            <p className="text-xs text-slate-500 font-mono">@{user.username}</p>
          )}
          {user.bio && (
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-xs">{user.bio}</p>
          )}
        </div>
      </div>
      {!isMe && (
        <button
          onClick={toggleFollow}
          disabled={loading}
          className={`h-9 px-4 rounded-xl text-xs font-semibold border transition-all shrink-0 ${
            following
              ? "border-slate-200 bg-white text-slate-600 hover:border-red-300 hover:text-red-500"
              : "border-[#0052FF] bg-[#0052FF] text-white hover:bg-[#0041cc]"
          } disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : following ? (
            <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Following</span>
          ) : (
            <span className="flex items-center gap-1"><UserPlus className="w-3.5 h-3.5" /> Follow</span>
          )}
        </button>
      )}
    </motion.div>
  );
};

// ── Main Search Page ──────────────────────────────────────────────────────────
const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get("q") || "";

  const [tab, setTab] = useState<Tab>("all");
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tweetsLoading, setTweetsLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);

  // Run both searches when query changes
  useEffect(() => {
    if (!q.trim()) return;

    setTweetsLoading(true);
    tweetService
      .searchTweets(q)
      .then((res) => setTweets(res.result.tweets))
      .catch(() => setTweets([]))
      .finally(() => setTweetsLoading(false));

    setUsersLoading(true);
    authService
      .searchUsers(q, 1, 20)
      .then((res) => setUsers(res.users))
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
  }, [q]);

  const handleSearch = useCallback(
    (newQ: string) => {
      if (newQ.trim()) navigate(`/search?q=${encodeURIComponent(newQ)}`);
    },
    [navigate],
  );

  // Nếu là ObjectId → /users/id/:id, ngược lại → /users/:username
  const handleNavigateToUser = useCallback(
    (identifier: string) => {
      const isId = /^[a-f\d]{24}$/i.test(identifier);
      navigate(isId ? `/users/id/${identifier}` : `/users/${identifier}`);
    },
    [navigate],
  );

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: "all", label: "All", icon: <SearchIcon className="w-4 h-4" />, count: tweets.length + users.length },
    { id: "people", label: "People", icon: <Users className="w-4 h-4" />, count: users.length },
    { id: "posts", label: "Posts", icon: <FileText className="w-4 h-4" />, count: tweets.length },
  ];

  const isLoading = tweetsLoading || usersLoading;
  const noResults = !isLoading && tweets.length === 0 && users.length === 0 && q.trim();

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-inter text-[#0F172A]">
      <Navbar onSearch={handleSearch} />

      <div className="max-w-7xl mx-auto px-6 pt-8 flex gap-10 pb-20">
        <main className="flex-1 max-w-3xl w-full">
          {/* Header */}
          <div className="mb-6">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-calistoga text-4xl text-[#0F172A] mb-1"
            >
              Search Results
            </motion.h1>
            {q && (
              <p className="text-slate-500 text-sm">
                Showing results for{" "}
                <span className="font-semibold text-[#0F172A]">"{q}"</span>
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-slate-200 mb-6">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 pb-4 px-4 text-sm font-bold relative transition-colors ${
                  tab === t.id ? "text-[#0F172A]" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t.icon}
                {t.label}
                {t.count > 0 && (
                  <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-mono">
                    {t.count}
                  </span>
                )}
                {tab === t.id && (
                  <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#0052FF] rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-center py-16 text-[#0052FF]">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="font-calistoga text-xl text-[#0F172A] mb-2">No results found</h3>
              <p className="text-slate-500 text-sm">
                Try searching for different keywords or check your spelling.
              </p>
            </div>
          )}

          {/* Empty query */}
          {!q.trim() && !isLoading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SearchIcon className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-mono text-sm">Type something to search...</p>
            </div>
          )}

          {/* Results */}
          {!isLoading && q.trim() && (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-8"
              >
                {/* People Section */}
                {(tab === "all" || tab === "people") && users.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                      <Users className="w-4 h-4" /> People · {users.length}
                    </div>
                    <motion.div
                      variants={stagger}
                      initial="hidden"
                      animate="show"
                      className="flex flex-col gap-3"
                    >
                      {(tab === "all" ? users.slice(0, 3) : users).map((u) => (
                        <UserCard key={u._id} user={u} onNavigate={handleNavigateToUser} />
                      ))}
                    </motion.div>
                    {tab === "all" && users.length > 3 && (
                      <button
                        onClick={() => setTab("people")}
                        className="mt-3 text-sm font-medium text-[#0052FF] hover:underline"
                      >
                        View all {users.length} people →
                      </button>
                    )}
                  </section>
                )}

                {/* Posts Section */}
                {(tab === "all" || tab === "posts") && tweets.length > 0 && (
                  <section>
                    <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                      <FileText className="w-4 h-4" /> Posts · {tweets.length}
                    </div>
                    <motion.div
                      variants={stagger}
                      initial="hidden"
                      animate="show"
                      className="flex flex-col gap-6"
                    >
                      {tweets.map((tweet) => (
                        <PostCard key={tweet._id} tweet={tweet} />
                      ))}
                    </motion.div>
                  </section>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>

        {/* Right sidebar */}
        <aside className="hidden lg:block w-[320px] shrink-0 sticky top-28 h-fit">
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#0052FF]/30 blur-[50px] rounded-full" />
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0052FF] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0052FF]" />
              </span>
              Search Tips
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p>• Use <span className="text-white font-mono">#hashtag</span> to find posts by topic</p>
              <p>• Type a name or <span className="text-white font-mono">@username</span> to find people</p>
              <p>• Combine keywords for more specific results</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default SearchPage;
