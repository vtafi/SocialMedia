import { useState } from "react";
import {
  MessageCircle,
  Repeat2,
  Heart,
  Bookmark,
  Share2,
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
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const highlightContent = (text: string) =>
  text.replace(
    /(#\w+|@\w+)/g,
    '<span class="text-emerald-600 hover:underline cursor-pointer">$1</span>',
  );

const ActionBtn = ({
  icon,
  count,
  hoverClass,
  textHoverClass,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  count?: number;
  hoverClass: string;
  textHoverClass: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 group transition-colors ${active ? textHoverClass : ""}`}
  >
    <div className={`p-2 rounded-full transition-colors ${hoverClass}`}>
      {icon}
    </div>
    {count !== undefined && count > 0 && (
      <span
        className={`text-sm font-medium transition-colors ${textHoverClass}`}
      >
        {count}
      </span>
    )}
  </button>
);

const PostCard = ({ tweet }: PostCardProps) => {
  const [liked, setLiked] = useState(tweet.is_liked ?? false);
  const [likeCount, setLikeCount] = useState(tweet.like_count ?? 0);
  const [bookmarked, setBookmarked] = useState(tweet.is_bookmarked ?? false);

  const authorName = tweet.author?.name ?? "Unknown";
  const authorHandle = tweet.author?.username
    ? `@${tweet.author.username}`
    : "@user";
  const avatarUrl =
    tweet.author?.avatar ||
    `https://i.pravatar.cc/150?u=${tweet.author?._id ?? tweet.user_id}`;

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
    <article className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <img
            src={avatarUrl}
            alt={authorName}
            className="w-10 h-10 rounded-full object-cover border border-slate-100"
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[15px] text-slate-900 hover:underline cursor-pointer">
                {authorName}
              </span>
              <span className="text-slate-500 text-sm hidden sm:block">
                {authorHandle}
              </span>
              <span className="text-slate-400 text-sm">
                · {formatTime(tweet.created_at)}
              </span>
            </div>
          </div>
        </div>
        <button className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-full transition-colors shrink-0">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div
        className="text-slate-800 text-[15px] leading-relaxed break-words mb-3"
        dangerouslySetInnerHTML={{ __html: highlightContent(tweet.content) }}
      />

      {/* Media */}
      {tweet.medias && tweet.medias.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-slate-100 mb-3">
          {tweet.medias.map((m, i) =>
            m.type === 0 ? (
              <img
                key={i}
                src={m.url}
                alt="media"
                className="w-full object-cover max-h-[400px]"
                loading="lazy"
              />
            ) : null,
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 text-slate-500">
        <div className="flex gap-2 sm:gap-4">
          <ActionBtn
            icon={<MessageCircle className="w-5 h-5" />}
            count={tweet.comment_count}
            hoverClass="hover:bg-emerald-50 hover:text-emerald-600"
            textHoverClass="group-hover:text-emerald-600"
          />
          <ActionBtn
            icon={<Repeat2 className="w-5 h-5" />}
            count={tweet.retweet_count}
            hoverClass="hover:bg-green-50 hover:text-green-500"
            textHoverClass="group-hover:text-green-500"
          />
          <ActionBtn
            icon={
              <Heart
                className="w-5 h-5"
                fill={liked ? "currentColor" : "none"}
              />
            }
            count={likeCount}
            hoverClass="hover:bg-pink-50 hover:text-pink-600"
            textHoverClass="group-hover:text-pink-600"
            active={liked}
            onClick={handleLike}
          />
          <ActionBtn
            icon={
              <Bookmark
                className="w-5 h-5"
                fill={bookmarked ? "currentColor" : "none"}
              />
            }
            hoverClass="hover:bg-sky-50 hover:text-sky-500"
            textHoverClass="group-hover:text-sky-500"
            active={bookmarked}
            onClick={handleBookmark}
          />
        </div>
        <ActionBtn
          icon={<Share2 className="w-5 h-5" />}
          hoverClass="hover:bg-emerald-50 hover:text-emerald-600"
          textHoverClass="group-hover:text-emerald-600"
        />
      </div>
    </article>
  );
};

export default PostCard;
