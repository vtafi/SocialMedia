import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { tweetService } from "../../services/tweet.service";
import type { Tweet } from "../../services/tweet.service";
import PostCard from "./PostCard";

interface PostFeedProps {
  tab: "for_you" | "following";
  refreshKey: number;
}

const PostFeed = ({ refreshKey }: PostFeedProps) => {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 10;
  const hasMore = tweets.length < total;

  const fetchTweets = useCallback(async (pageNum = 1, replace = true) => {
    try {
      if (replace) setLoading(true);
      else setLoadingMore(true);
      const res = await tweetService.getTweets(pageNum, LIMIT);
      setTotal(res.result.total);
      setTweets((prev) =>
        replace ? res.result.tweets : [...prev, ...res.result.tweets],
      );
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch tweets:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchTweets(1, true);
  }, [fetchTweets, refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center py-12 text-emerald-600">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
    );
  }

  if (tweets.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 text-sm">
        <p>No posts yet. Follow some people or publish your first thought!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {tweets.map((tweet) => (
        <PostCard key={tweet._id} tweet={tweet} />
      ))}

      {hasMore && (
        <button
          onClick={() => !loadingMore && fetchTweets(page + 1, false)}
          disabled={loadingMore}
          className="w-full py-3 border border-slate-200 rounded-2xl bg-white text-emerald-600 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors disabled:opacity-60"
        >
          {loadingMore ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Load more"
          )}
        </button>
      )}
    </div>
  );
};

export default PostFeed;
