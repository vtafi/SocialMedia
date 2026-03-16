import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Camera,
  X,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { authService } from "../../services/auth.service";
import type { UserProfile, UpdateMeData } from "../../services/auth.service";
import { tweetService } from "../../services/tweet.service";
import type { Tweet } from "../../services/tweet.service";
import Navbar from "../../components/home/Navbar";
import PostCard from "../../components/home/PostCard";

const TABS = ["posts", "replies", "media", "likes"] as const;
type ProfileTab = (typeof TABS)[number];

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};
const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

// ── Edit Profile Modal ────────────────────────────────────────────────────────
interface EditModalProps {
  profile: UserProfile;
  onClose: () => void;
  onSaved: (updated: UserProfile) => void;
}

const EditProfileModal = ({ profile, onClose, onSaved }: EditModalProps) => {
  const [form, setForm] = useState<UpdateMeData>({
    name: profile.name || "",
    username: profile.username || "",
    bio: profile.bio || "",
    location: profile.location || "",
    website: profile.website || "",
    avatar: profile.avatar || "",
    cover_photo: profile.cover_photo || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (
    file: File,
    field: "avatar" | "cover_photo",
    setUploading: (v: boolean) => void,
  ) => {
    setUploading(true);
    try {
      const medias = await tweetService.uploadImage(file);
      if (medias[0]?.url) setForm((f) => ({ ...f, [field]: medias[0].url }));
    } catch {
      setError("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await authService.updateMe(form);
      authService.saveAuthData(updated);
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/50 focus:bg-white transition-colors";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-calistoga text-xl text-[#0F172A]">Edit Profile</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Cover Photo */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              Cover Photo
            </label>
            <div
              className="h-28 rounded-2xl bg-slate-900 relative overflow-hidden cursor-pointer group"
              onClick={() => coverInputRef.current?.click()}
            >
              {form.cover_photo ? (
                <img src={form.cover_photo} className="w-full h-full object-cover" alt="cover" />
              ) : (
                <>
                  <div className="absolute top-[-30%] left-[-10%] w-60 h-60 bg-[#0052FF]/30 rounded-full blur-[80px]" />
                  <div className="absolute bottom-[-30%] right-[-10%] w-40 h-40 bg-[#4D7CFF]/20 rounded-full blur-[60px]" />
                </>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                {uploadingCover ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] &&
                handleUpload(e.target.files[0], "cover_photo", setUploadingCover)
              }
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              Avatar
            </label>
            <div
              className="w-20 h-20 rounded-full relative cursor-pointer group"
              onClick={() => avatarInputRef.current?.click()}
            >
              <img
                src={form.avatar || `https://i.pravatar.cc/150?u=${profile._id}`}
                className="w-full h-full rounded-full object-cover border-2 border-slate-200"
                alt="avatar"
              />
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                {uploadingAvatar ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] &&
                handleUpload(e.target.files[0], "avatar", setUploadingAvatar)
              }
            />
          </div>

          {/* Text fields */}
          {(
            [
              { key: "name", label: "Display Name", placeholder: "John Doe" },
              { key: "username", label: "Username", placeholder: "johndoe" },
              { key: "bio", label: "Bio", placeholder: "Tell the world about yourself..." },
              { key: "location", label: "Location", placeholder: "Geneva, CH" },
              { key: "website", label: "Website", placeholder: "https://yoursite.com" },
            ] as { key: keyof UpdateMeData; label: string; placeholder: string }[]
          ).map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                {label}
              </label>
              {key === "bio" ? (
                <textarea
                  value={(form[key] as string) || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/50 focus:bg-white transition-colors resize-none"
                />
              ) : (
                <input
                  type="text"
                  value={(form[key] as string) || ""}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className={inputCls}
                />
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-medium text-[#0F172A] hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 h-11 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white text-sm font-medium hover:shadow-[0_8px_25px_-6px_rgba(0,82,255,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Main Profile Page ─────────────────────────────────────────────────────────
const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [tweetsLoading, setTweetsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");
  const [editOpen, setEditOpen] = useState(false);

  // Auth guard + load profile
  useEffect(() => {
    authService
      .getMe()
      .then((p) => {
        authService.saveAuthData(p);
        setProfile(p);
        setLoading(false);
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  // Load tweets and filter by current user
  useEffect(() => {
    if (!profile) return;
    setTweetsLoading(true);
    tweetService
      .getTweets(1, 20)
      .then((res) => {
        const mine = res.result.tweets.filter(
          (t) =>
            t.user_id === profile._id ||
            (t.user && t.user._id === profile._id),
        );
        setTweets(mine);
      })
      .catch(() => {})
      .finally(() => setTweetsLoading(false));
  }, [profile]);

  const handleSearch = useCallback(() => {}, []);

  const handleProfileSaved = (updated: UserProfile) => {
    setProfile(updated);
    setEditOpen(false);
  };

  if (loading || !profile) {
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

  const avatarUrl = profile.avatar || `https://i.pravatar.cc/150?u=${profile._id}`;
  const displayName = profile.name || profile.username || profile.email?.split("@")[0] || "User";
  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-inter text-[#0F172A]">
      <Navbar onSearch={handleSearch} />

      <div className="max-w-7xl mx-auto px-6 pt-8 flex gap-10 pb-20">
        {/* ── MAIN COLUMN ── */}
        <main className="flex-1 max-w-3xl w-full">
          <motion.div initial="hidden" animate="show" variants={stagger}>

            {/* ── Profile Header Card ── */}
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

              {/* Info Section */}
              <div className="px-8 pb-8">
                {/* Avatar + Edit button row */}
                <div className="flex justify-between items-end -mt-16 mb-5">
                  <div className="relative">
                    <img
                      src={avatarUrl}
                      className="w-32 h-32 rounded-full border-4 border-white object-cover relative z-10"
                      alt={displayName}
                    />
                    <div className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full z-20" />
                  </div>
                  <button
                    onClick={() => setEditOpen(true)}
                    className="h-10 px-5 rounded-xl border border-slate-200 text-sm font-semibold text-[#0F172A] hover:bg-slate-50 hover:border-[#0052FF] transition-all"
                  >
                    Edit Profile
                  </button>
                </div>

                {/* Name & handle */}
                <div className="mb-4">
                  <h1 className="font-calistoga text-3xl text-[#0F172A]">{displayName}</h1>
                  {profile.username && (
                    <p className="text-slate-500 font-mono text-sm mt-0.5">@{profile.username}</p>
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
                      <MapPin className="w-4 h-4 shrink-0" />
                      {profile.location}
                    </div>
                  )}
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-[#0052FF] hover:underline"
                    >
                      <LinkIcon className="w-4 h-4 shrink-0" />
                      {profile.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {joinedDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 shrink-0" />
                      Joined {joinedDate}
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-8 pt-5 border-t border-slate-100">
                  <div className="flex gap-2 items-baseline cursor-pointer group">
                    <span className="font-bold text-[#0F172A] text-xl group-hover:text-[#0052FF] transition-colors">
                      {tweets.length}
                    </span>
                    <span className="text-slate-500 text-sm font-medium">Posts</span>
                  </div>
                  <div className="flex gap-2 items-baseline cursor-pointer group">
                    <span className="font-bold text-[#0F172A] text-xl group-hover:text-[#0052FF] transition-colors">
                      {profile.following_count ?? 0}
                    </span>
                    <span className="text-slate-500 text-sm font-medium">Following</span>
                  </div>
                  <div className="flex gap-2 items-baseline cursor-pointer group">
                    <span className="font-bold text-[#0F172A] text-xl group-hover:text-[#0052FF] transition-colors">
                      {profile.follower_count ?? 0}
                    </span>
                    <span className="text-slate-500 text-sm font-medium">Followers</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Tabs ── */}
            <motion.div variants={fadeInUp} className="flex gap-8 border-b border-slate-200 mb-6">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-4 text-sm font-bold capitalize relative transition-colors ${
                    activeTab === tab
                      ? "text-[#0F172A]"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-[#0052FF] rounded-t-full" />
                  )}
                </button>
              ))}
            </motion.div>

            {/* ── Tab Content ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "posts" && (
                  <>
                    {tweetsLoading ? (
                      <div className="flex justify-center py-12 text-[#0052FF]">
                        <Loader2 className="w-7 h-7 animate-spin" />
                      </div>
                    ) : tweets.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500 font-mono text-sm">No posts yet.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {tweets.map((tweet) => (
                          <PostCard key={tweet._id} tweet={tweet} />
                        ))}
                      </div>
                    )}
                  </>
                )}

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

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="hidden lg:block w-[350px] shrink-0 sticky top-28 h-[calc(100vh-7rem)] overflow-y-auto">
          {/* Quick stats card */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-2xl relative overflow-hidden mb-6">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#0052FF]/30 blur-[50px] rounded-full" />
            <div className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0052FF] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0052FF]" />
              </span>
              Your Account
            </div>
            <div className="flex items-center gap-4 mb-4">
              <img src={avatarUrl} className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20" alt={displayName} />
              <div className="min-w-0">
                <p className="font-calistoga text-lg text-white truncate">{displayName}</p>
                {profile.username && (
                  <p className="text-[#4D7CFF] font-mono text-xs truncate">@{profile.username}</p>
                )}
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              {profile.bio || "No bio yet. Click Edit Profile to add one."}
            </p>
            <button
              onClick={() => setEditOpen(true)}
              className="w-full h-10 rounded-xl border border-white/10 bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              Edit Profile
            </button>
          </div>

          {/* Account info */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Account Info
            </p>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-[#0F172A] truncate max-w-[160px]">
                  {profile.email}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Status</span>
                <span
                  className={`font-mono text-xs px-2 py-0.5 rounded-full ${
                    profile.verify === 1
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {profile.verify === 1 ? "Verified" : "Unverified"}
                </span>
              </div>
              {joinedDate && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Joined</span>
                  <span className="font-medium text-[#0F172A]">{joinedDate}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Edit Profile Modal ── */}
      <AnimatePresence>
        {editOpen && (
          <EditProfileModal
            profile={profile}
            onClose={() => setEditOpen(false)}
            onSaved={handleProfileSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
