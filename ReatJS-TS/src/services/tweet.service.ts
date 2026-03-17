import { authFetch } from "../utils/apiClient";

export interface Media {
  url: string;
  type: 0 | 1 | 2; // 0: Image, 1: Video, 2: VideoHLS
}

export interface Tweet {
  _id: string;
  user_id: string;
  type: 0 | 1 | 2 | 3; // 0: Tweet, 1: ReTweet, 2: Comment, 3: QuoteTweet
  audience: 0 | 1 | 2;
  content: string;
  parent_id: string | null;
  hashtags: string[];
  mentions: string[];
  medias: Media[];
  guest_views: number;
  user_views: number;
  created_at: string;
  updated_at: string;
  user?: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
    email?: string;
    verify?: number;
  };
  likes?: number;
  bookmarks?: number;
  comment_count?: number;
  retweet_count?: number;
  quote_count?: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface TweetFeedResponse {
  message: string;
  result: {
    tweets: Tweet[];
    limit: number;
    page: number;
    total: number;
  };
}

export interface CreateTweetData {
  type: 0 | 1 | 2 | 3;
  audience: 0 | 1 | 2;
  content: string;
  parent_id?: string | null;
  hashtags?: string[];
  mentions?: string[];
  medias?: Media[];
}

const fetchJSON = async (path: string, options: RequestInit = {}) => {
  const response = await authFetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }
  return response.json();
};

export const tweetService = {
  async getTweets(page = 1, limit = 10): Promise<TweetFeedResponse> {
    return fetchJSON(`/tweets?page=${page}&limit=${limit}`);
  },

  async createTweet(data: CreateTweetData): Promise<{ message: string; result: Tweet }> {
    return fetchJSON(`/tweets`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async likeTweet(tweetId: string): Promise<void> {
    return fetchJSON(`/likes`, {
      method: "POST",
      body: JSON.stringify({ tweet_id: tweetId }),
    });
  },

  async unlikeTweet(tweetId: string): Promise<void> {
    return fetchJSON(`/likes/${tweetId}`, { method: "DELETE" });
  },

  async bookmarkTweet(tweetId: string): Promise<void> {
    return fetchJSON(`/bookmarks`, {
      method: "POST",
      body: JSON.stringify({ tweet_id: tweetId }),
    });
  },

  async removeBookmark(tweetId: string): Promise<void> {
    return fetchJSON(`/bookmarks/${tweetId}`, { method: "DELETE" });
  },

  // Upload ảnh — dùng authFetch trực tiếp (FormData, không set Content-Type)
  async uploadImage(file: File): Promise<Media[]> {
    const formData = new FormData();
    formData.append("image", file);
    const response = await authFetch(`/medias/upload-image`, {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.result;
  },

  async searchTweets(content: string, page = 1, limit = 10): Promise<TweetFeedResponse> {
    return fetchJSON(
      `/search?content=${encodeURIComponent(content)}&page=${page}&limit=${limit}`,
    );
  },
};
