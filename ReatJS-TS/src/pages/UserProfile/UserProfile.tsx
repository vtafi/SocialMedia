import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Loader2,
  UserPlus,
  UserCheck,
  ImageIcon,
  ArrowLeft,
  Mail,
} from "lucide-react";
import Navbar from "../../components/home/Navbar";
import PostCard from "../../components/home/PostCard";
import { authService } from "../../services/auth.service";
import type { UserProfile as UserProfileType } from "../../services/auth.service";
import { tweetService } from "../../services/tweet.service";
import type { Tweet } from "../../services/tweet.service";

const TABS = ["posts", "replies", "media", "likes"] as const;
type Tab = (typeof TABS)[number];

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};
const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const isObjectId = (s: string) => /^[a-f\d]{24}$/i.test(s);

const UserProfilePage = () => {
  const { username, id } = useParams<{ username?: string; id?: string }>();
  const identifier = username ?? id ?? "";
  const navigate = useNavigate();
  const me = authService.getProfile();

  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tweetsLoading, setTweetsLoading] = useState(false);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  // Load profile — tự phân biệt ObjectId hay username
  useEffect(() => {
    if (!identifier) return;
    setLoading(true);
    const fetchFn = isObjectId(identifier)
      ? authService.getUserById(identifier)
      : authService.getUserByUsername(identifier);

    fetchFn
      .then((p) => {
        if (!p) { navigate("/"); return; }
        setProfile(p);
        setFollowing(p.is_following ?? false);
        setLoading(false);
      })
      .catch(() => navigate("/"));
  }, [identifier, navigate]);

  // Load their tweets (from general feed, filter by user_id)
  useEffect(() => {
    if (!profile) return;
    setTweetsLoading(true);
    tweetService
      .getTweets(1, 50)
      .then((res) => {
        const theirs = res.result.tweets.filter(
          (t) => t.user_id === profile._id || t.user?._id === profile._id,
        );
        setTweets(theirs);
      })
      .catch(() => {})
      .finally(() => setTweetsLoading(false));
  }, [profile]);

  const handleFollowToggle = async () => {
    if (!profile?._id) return;
    setFollowLoading(true);
    try {
      if (following) {
        await authService.unfollowUser(profile._id);
        setFollowing(false);
        setProfile((p) =>
          p ? { ...p, follower_count: Math.max(0, (p.follower_count ?? 1) - 1) } : p
        );
      } else {
        await authService.followUser(profile._id);
        setFollowing(true);
        setProfile((p) =>
          p ? { ...p, follower_count: (p.follower_count ?? 0) + 1 } : p
        );
      }
    } catch {
      /* ignore */
    } finally {
      setFollowLoading(false);
    }
  };

  const handleSearch = useCallback(
    (q: string) => {
      if (q.trim()) navigate(`/search?q=${encodeURIComponent(q)}`);
    },
    [navigate],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-500 font-mono">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isMe = me?._id === profile._id;
  const avatarUrl =
    profile.avatar || `https://i.pravatar.cc/150?u=${profile._id}`;
  const displayName =
    profile.name || profile.username || profile.email?.split("@")[0] || "User";
  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-inter text-[#0F172A]">
      <Navbar onSearch={handleSearch} />

      <div className="max-w-7xl mx-auto px-6 pt-8 flex gap-10 pb-20">
        <main className="flex-1 max-w-3xl w-full">
          <motion.div initial="hidden" animate="show" variants={stagger}>
            {/* Back button */}
            <motion.button
              variants={fadeInUp}
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-[#0F172A] mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </motion.button>

            {/* Profile Header */}
            <motion.div
              variants={fadeInUp}
              className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8 overflow-hidden"
            >
              {/* Cover */}
              <div className="h-48 bg-slate-900 relative overflow-hidden">
                {profile.cover_photo ? (
                  <img
                    src={profile.cover_photo}
                    className="w-full h-full object-cover"
                    alt="cover"
                  />
                ) : (
                  <>
                    <div className="absolute top-[-50%] left-[-10%] w-[400px] h-[400px] bg-[#0052FF]/40 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#4D7CFF]/30 rounded-full blur-[100px]" />
                  </>
                )}
              </div>

              <div className="px-8 pb-8">
                {/* Avatar + action button row */}
                <div className="flex justify-between items-end -mt-16 mb-5">
                  <div className="relative">
                    <img
                      src={avatarUrl}
                      className="w-32 h-32 rounded-full border-4 border-white object-cover relative z-10"
                      alt={displayName}
                    />
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full z-20" />
                  </div>

                  {isMe ? (
                    <button
                      onClick={() => navigate("/profile")}
                      className="h-10 px-5 rounded-xl border border-slate-200 text-sm font-semibold text-[#0F172A] hover:bg-slate-50 transition-all"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      {/* Nút nhắn tin — dẫn đến /chat?with=userId */}
                      <button
                        onClick={() => navigate(`/chat?with=${profile._id}`)}
                        className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-[#0052FF] hover:border-[#0052FF] hover:bg-blue-50 transition-all"
                        title="Send message"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      <button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      className={`h-10 px-5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 ${
                        following
                          ? "border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500 bg-white"
                          : "bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white hover:shadow-[0_8px_25px_-6px_rgba(0,82,255,0.5)] hover:-translate-y-0.5"
                      }`}
                    >
                      {followLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : following ? (
                        <span className="flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4" /> Following
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <UserPlus className="w-4 h-4" /> Follow
                        </span>
                      )}
                    </button>
                    </div>
                  )}
                </div>

                {/* Name & handle */}
                <div className="mb-4">
                  <h1 className="font-calistoga text-3xl text-[#0F172A]">
                    {displayName}
                  </h1>
                  {profile.username && (
                    <p className="text-slate-500 font-mono text-sm mt-0.5">
                      @{profile.username}
                    </p>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p className="text-[#0F172A] text-[15px] leading-relaxed max-w-xl mb-4">
                    {profile.bio}
                  </p>
                )}

                {/* Meta */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500 font-medium mb-6">
                  {profile.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 shrink-0" /> {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#0052FF] hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <LinkIcon className="w-4 h-4 shrink-0" />
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {joinedDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 shrink-0" /> Joined{" "}
                      {joinedDate}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-8 pt-5 border-t border-slate-100">
                  <div className="flex gap-2 items-baseline">
                    <span className="font-bold text-[#0F172A] text-xl">
                      {tweets.length}
                    </span>
                    <span className="text-slate-500 text-sm font-medium">
                      Posts
                    </span>
                  </div>
                  <div className="flex gap-2 items-baseline">
                    <span className="font-bold text-[#0F172A] text-xl">
                      {profile.following_count ?? 0}
                    </span>
                    <span className="text-slate-500 text-sm font-medium">
                      Following
                    </span>
                  </div>
                  <div className="flex gap-2 items-baseline">
                    <span className="font-bold text-[#0F172A] text-xl">
                      {profile.follower_count ?? 0}
                    </span>
                    <span className="text-slate-500 text-sm font-medium">
                      Followers
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Tabs */}
            <motion.div
              variants={fadeInUp}
              className="flex gap-8 border-b border-slate-200 mb-6"
            >
              {TABS.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`pb-4 text-sm font-bold capitalize relative transition-colors ${
                    activeTab === t
                      ? "text-[#0F172A]"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t}
                  {activeTab === t && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#0052FF] rounded-t-full" />
                  )}
                </button>
              ))}
            </motion.div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {activeTab === "posts" &&
                  (tweetsLoading ? (
                    <div className="flex justify-center py-12 text-[#0052FF]">
                      <Loader2 className="w-7 h-7 animate-spin" />
                    </div>
                  ) : tweets.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ImageIcon className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-mono text-sm">
                        No posts yet.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {tweets.map((tweet) => (
                        <PostCard key={tweet._id} tweet={tweet} />
                      ))}
                    </div>
                  ))}

                {activeTab !== "posts" && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-mono text-sm capitalize">
                      No {activeTab} yet.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </main>

        {/* Right sidebar */}
        <aside className="hidden lg:block w-[300px] shrink-0 sticky top-28 h-fit">
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              About
            </p>
            <div className="flex items-center gap-3 mb-4">
              <img
                src={avatarUrl}
                className="w-12 h-12 rounded-2xl object-cover"
                alt={displayName}
              />
              <div className="min-w-0">
                <p className="font-calistoga text-base text-[#0F172A] truncate">
                  {displayName}
                </p>
                {profile.username && (
                  <p className="text-[#0052FF] font-mono text-xs">
                    @{profile.username}
                  </p>
                )}
              </div>
            </div>
            {profile.bio && (
              <p className="text-sm text-slate-500 leading-relaxed mb-4">
                {profile.bio}
              </p>
            )}
            {!isMe && (
              <button
                onClick={handleFollowToggle}
                disabled={followLoading}
                className={`w-full h-10 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                  following
                    ? "border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500"
                    : "bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white hover:shadow-[0_6px_20px_-4px_rgba(0,82,255,0.5)]"
                }`}
              >
                {following ? "Unfollow" : "Follow"}
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default UserProfilePage;
