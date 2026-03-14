import { useState, useRef } from "react";
import { Image as ImageIcon, MapPin, Smile, X } from "lucide-react";
import { motion } from "framer-motion";
import { tweetService } from "../../services/tweet.service";
import type { Media } from "../../services/tweet.service";
import { authService } from "../../services/auth.service";

interface PostComposerProps {
  onPostCreated: () => void;
}

const PostComposer = ({ onPostCreated }: PostComposerProps) => {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState<Media[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profile = authService.getProfile();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    try {
      const uploaded = await Promise.all(files.map((f) => tweetService.uploadImage(f)));
      setMediaFiles((prev) => [...prev, ...uploaded.flat()]);
    } catch {
      // previews remain shown
    }
  };

  const removePreview = (i: number) => {
    setPreviewUrls((prev) => prev.filter((_, idx) => idx !== i));
    setMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed && mediaFiles.length === 0) return;
    setIsSubmitting(true);
    try {
      await tweetService.createTweet({
        type: 0,
        audience: 0,
        content: trimmed,
        medias: mediaFiles,
        hashtags: [],
        mentions: [],
        parent_id: null,
      });
      setContent("");
      setMediaFiles([]);
      setPreviewUrls([]);
      onPostCreated();
    } catch (err) {
      console.error("Failed to post:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const avatarUrl = profile?.avatar || `https://i.pravatar.cc/150?u=${profile?._id}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 mb-8"
    >
      <div className="flex gap-4">
        <img
          src={avatarUrl}
          alt="You"
          className="w-12 h-12 rounded-full object-cover shrink-0"
        />
        <div className="flex-1">
          <textarea
            placeholder="Share a new insight..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent text-lg text-[#0F172A] placeholder-slate-400 outline-none resize-none min-h-[60px] font-inter pt-2"
          />

          {previewUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {previewUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img
                    src={url}
                    alt="preview"
                    className="w-full h-full object-cover rounded-xl border border-slate-200"
                  />
                  <button
                    onClick={() => removePreview(i)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            <div className="flex gap-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 transition-colors"
                title="Add image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 transition-colors">
                <MapPin className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 transition-colors">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || (!content.trim() && mediaFiles.length === 0)}
              className="h-10 px-6 inline-flex items-center justify-center rounded-xl text-sm font-medium bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] text-white hover:shadow-[0_8px_25px_-6px_rgba(0,82,255,0.5)] hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Posting..." : "Post Update"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PostComposer;
