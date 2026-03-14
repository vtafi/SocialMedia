import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/home/Navbar";
import PostComposer from "../../components/home/PostComposer";
import FeedTabs from "../../components/home/FeedTabs";
import PostFeed from "../../components/home/PostFeed";
import RightSidebar from "../../components/home/RightSidebar";
import { authService } from "../../services/auth.service";

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"for_you" | "following">("for_you");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getMe()
      .then((profile) => {
        authService.saveAuthData(profile);
        setLoading(false);
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  const handlePostCreated = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-sm text-slate-500 font-mono">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-inter text-[#0F172A]">
      <Navbar onSearch={handleSearch} />

      <div className="max-w-7xl mx-auto px-6 pt-8 flex gap-10 pb-20">

        {/* Center feed */}
        <main className="flex-1 max-w-3xl w-full">
          <div className="flex items-center justify-between mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-calistoga text-4xl text-[#0F172A]"
            >
              Your Feed
            </motion.h1>
            <FeedTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <PostComposer onPostCreated={handlePostCreated} />
          <PostFeed tab={activeTab} refreshKey={refreshKey} />
        </main>

        {/* Right sidebar */}
        <RightSidebar searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default Home;
