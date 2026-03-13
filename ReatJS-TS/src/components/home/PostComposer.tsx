import { useState, useRef } from "react";
import { Image as ImageIcon, MapPin, Smile, X } from "lucide-react";
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
    setPreviewUrls((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
    try {
      const uploaded = await Promise.all(
        files.map((f) => tweetService.uploadImage(f)),
      );
      setMediaFiles((prev) => [...prev, ...uploaded.flat()]);
    } catch {
      // preview still shown; will handle on submit
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

  const avatarUrl =
    profile?.avatar || `https://i.pravatar.cc/150?u=${profile?._id}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-6">
      <div className="flex gap-4">
        <img
          src={avatarUrl}
          alt="You"
          className="w-10 h-10 rounded-full object-cover shrink-0"
        />
        <div className="flex-1 pt-1">
          <textarea
            placeholder="Share a new finding or thought..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none resize-none text-lg min-h-[50px]"
          />

          {/* Image previews */}
          {previewUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {previewUrls.map((url, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img
                    src={url}
                    alt="preview"
                    className="w-full h-full object-cover rounded-lg border border-slate-200"
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

          <div className="flex justify-between items-center mt-2">
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
                className="p-2 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Add image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                <MapPin className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                <Smile className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting || (!content.trim() && mediaFiles.length === 0)
              }
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full font-bold text-sm transition-colors shadow-sm"
            >
              {isSubmitting ? "Posting..." : "Publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostComposer;
