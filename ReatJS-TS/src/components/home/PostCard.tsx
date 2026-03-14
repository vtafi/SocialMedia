import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  MoreHorizontal,
} from "lucide-react";
import { tweetService } from "../../services/tweet.service";
import type { Tweet } from "../../services/tweet.service";

interface PostCardProps {
  tweet: Tweet;
}

const formatTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const highlightContent = (text: string) =>
  text.replace(
    /(#\w+|@\w+)/g,
    '<span class="text-[#0052FF] font-medium hover:underline cursor-pointer">$1</span>',
  );

const PostCard = ({ tweet }: PostCardProps) => {
  const [liked, setLiked] = useState(tweet.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(tweet.likes ?? 0);
  const [bookmarked, setBookmarked] = useState(tweet.is_bookmarked ?? false);

  // Backend trả về field "user" (từ $lookup aggregation), không phải "author"
  const author = tweet.user;
  const authorName = author?.name || author?.username || author?.email?.split("@")[0] || "Unknown";
  const authorHandle = author?.username ? `@${author.username}` : "@user";
  const avatarUrl =
    author?.avatar ||
    `https://i.pravatar.cc/150?u=${author?._id ?? tweet.user_id}`;

  const handleLike = async () => {
    const was = liked;
    setLiked(!was);
    setLikeCount((c) => (was ? c - 1 : c + 1));
    try {
      was
        ? await tweetService.unlikeTweet(tweet._id)
        : await tweetService.likeTweet(tweet._id);
    } catch {
      setLiked(was);
      setLikeCount((c) => (was ? c + 1 : c - 1));
    }
  };

  const handleBookmark = async () => {
    const was = bookmarked;
    setBookmarked(!was);
    try {
      was
        ? await tweetService.removeBookmark(tweet._id)
        : await tweetService.bookmarkTweet(tweet._id);
    } catch {
      setBookmarked(was);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <img
            src={avatarUrl}
            alt={authorName}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h3 className="font-bold text-[#0F172A] text-base hover:underline cursor-pointer">
              {authorName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-500 font-mono mt-0.5">
              <span>{authorHandle}</span>
              <span>•</span>
              <span>{formatTime(tweet.created_at)}</span>
            </div>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div
        className="text-[#0F172A] text-[16px] leading-relaxed mb-4 break-words"
        dangerouslySetInnerHTML={{ __html: highlightContent(tweet.content) }}
      />

      {/* Media */}
      {tweet.medias && tweet.medias.length > 0 && (
        <div className="rounded-2xl overflow-hidden mb-5 border border-slate-100">
          {tweet.medias.map((m, i) =>
            m.type === 0 ? (
              <img
                key={i}
                src={m.url}
                alt="media"
                className="w-full object-cover max-h-[400px] hover:scale-105 transition-transform duration-700"
                loading="lazy"
              />
            ) : null,
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
        {/* Comment */}
        <button className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-slate-500 hover:text-[#0052FF] hover:bg-blue-50 transition-colors text-sm font-mono">
          <MessageCircle className="w-5 h-5" />
          {(tweet.comment_count ?? 0) > 0 && <span>{tweet.comment_count}</span>}
        </button>

        {/* Repost */}
        <button className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors text-sm font-mono">
          <Repeat2 className="w-5 h-5" />
          {(tweet.retweet_count ?? 0) > 0 && <span>{tweet.retweet_count}</span>}
        </button>


        {/* Like */}
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl transition-colors text-sm font-mono ${
            liked
              ? "text-rose-500 bg-rose-50"
              : "text-slate-500 hover:text-rose-500 hover:bg-rose-50"
          }`}
        >
          <Heart className="w-5 h-5" fill={liked ? "currentColor" : "none"} />
          {likeCount > 0 && <span>{likeCount}</span>}
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl transition-colors text-sm font-mono ${
            bookmarked
              ? "text-sky-500 bg-sky-50"
              : "text-slate-500 hover:text-sky-500 hover:bg-sky-50"
          }`}
        >
          <Bookmark className="w-5 h-5" fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </div>
    </motion.article>
  );
};

export default PostCard;
