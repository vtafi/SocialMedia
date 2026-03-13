import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./components/home/Navbar";
import PostComposer from "./components/home/PostComposer";
import FeedTabs from "./components/home/FeedTabs";
import PostFeed from "./components/home/PostFeed";
import RightSidebar from "./components/home/RightSidebar";
import { authService } from "./services/auth.service";

const Home = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"for_you" | "following">(
    "for_you",
  );
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-emerald-100">
      <Navbar onSearch={handleSearch} />

      <div className="max-w-6xl mx-auto pt-6 px-4 flex justify-center gap-8 pb-20">
        {/* Center feed */}
        <main className="flex-1 max-w-[650px] w-full">
          <PostComposer onPostCreated={handlePostCreated} />
          <FeedTabs activeTab={activeTab} onChange={setActiveTab} />
          <PostFeed tab={activeTab} refreshKey={refreshKey} />
        </main>

        {/* Right sidebar */}
        <RightSidebar searchQuery={searchQuery} />
      </div>
    </div>
  );
};

export default Home;
