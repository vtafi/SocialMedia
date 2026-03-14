const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8386";

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
  // Backend returns "user" from $lookup aggregation (not "author")
  user?: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
    email?: string;
    verify?: number;
  };
  // Backend returns these as plain numbers from $addFields
  likes?: number;
  bookmarks?: number;
  comment_count?: number;
  retweet_count?: number;
  quote_count?: number;
  // Server trả về từ $addFields (true/false dựa trên user hiện tại)
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

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }

  return response.json();
};

export const tweetService = {
  // GET /tweets?page=&limit= — News feed
  async getTweets(page = 1, limit = 10): Promise<TweetFeedResponse> {
    return fetchWithAuth(`${API_BASE_URL}/tweets?page=${page}&limit=${limit}`);
  },

  // POST /tweets — Tạo tweet mới
  async createTweet(
    data: CreateTweetData,
  ): Promise<{ message: string; result: Tweet }> {
    return fetchWithAuth(`${API_BASE_URL}/tweets`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  // POST /likes — Like tweet
  async likeTweet(tweetId: string): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/likes`, {
      method: "POST",
      body: JSON.stringify({ tweet_id: tweetId }),
    });
  },

  // DELETE /likes/:tweet_id — Unlike tweet
  async unlikeTweet(tweetId: string): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/likes/${tweetId}`, {
      method: "DELETE",
    });
  },

  // POST /bookmarks — Bookmark tweet
  async bookmarkTweet(tweetId: string): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/bookmarks`, {
      method: "POST",
      body: JSON.stringify({ tweet_id: tweetId }),
    });
  },

  // DELETE /bookmarks/:tweet_id — Xoá bookmark
  async removeBookmark(tweetId: string): Promise<void> {
    return fetchWithAuth(`${API_BASE_URL}/bookmarks/${tweetId}`, {
      method: "DELETE",
    });
  },

  // POST /medias/upload-image — Upload ảnh
  async uploadImage(file: File): Promise<Media[]> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/medias/upload-image`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (!response.ok) throw new Error("Upload failed");
    const data = await response.json();
    return data.result;
  },

  // GET /search?query=&page=&limit= — Tìm kiếm
  async search(query: string, page = 1, limit = 10) {
    return fetchWithAuth(
      `${API_BASE_URL}/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
    );
  },
};
