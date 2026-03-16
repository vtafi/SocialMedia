const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8386";

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  date_of_birth: string;
}

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  cover_photo?: string;
  bio?: string;
  location?: string;
  website?: string;
  date_of_birth?: string;
  verify: number;
  created_at?: string;
  updated_at?: string;
  follower_count?: number;
  following_count?: number;
  /** Trả về từ GET /users/:username — viewer đang follow user này không */
  is_following?: boolean;
}

export interface UpdateMeData {
  name?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar?: string;
  cover_photo?: string;
  date_of_birth?: string;
}

interface AuthResponse {
  message: string;
  result: {
    user: UserProfile;
  };
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.errors) {
        const firstFieldKey = Object.keys(error.errors)[0];
        if (firstFieldKey && error.errors[firstFieldKey]?.msg) {
          throw new Error(error.errors[firstFieldKey].msg);
        }
      }
      throw new Error(error.message || "Login failed");
    }

    return response.json();
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }

    return response.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/users/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    sessionStorage.removeItem("profile");
  },

  async getMe(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to get profile");

    const data = await response.json();
    return data.result;
  },

  async updateMe(data: UpdateMeData): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Update failed");
    }

    const res = await response.json();
    return res.result;
  },

  saveAuthData(data: AuthResponse["result"] | UserProfile): void {
    const user = "user" in data ? data.user : data;
    sessionStorage.setItem("profile", JSON.stringify(user));
  },

  getProfile(): UserProfile | null {
    const profile = sessionStorage.getItem("profile");
    return profile ? JSON.parse(profile) : null;
  },

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem("profile");
  },

  async followUser(followed_user_id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/follow`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ followed_user_id }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Follow failed");
    }
  },

  async unfollowUser(followed_user_id: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/users/unfollow/${followed_user_id}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
    if (!response.ok) throw new Error("Unfollow failed");
  },

  async getUserByUsername(username: string): Promise<UserProfile | null> {
    const response = await fetch(`${API_BASE_URL}/users/${username}`, {
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.result;
  },

  async getUserById(id: string): Promise<UserProfile | null> {
    const response = await fetch(`${API_BASE_URL}/users/id/${id}`, {
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.result;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to send reset email");
    return data;
  },

  async resetPassword(
    forgot_password_token: string,
    new_password: string,
    confirm_new_password: string,
  ): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forgot_password_token, new_password, confirm_new_password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to reset password");
    return data;
  },

  async searchUsers(
    q: string,
    page = 1,
    limit = 10,
  ): Promise<{ users: UserProfile[]; total: number }> {
    const response = await fetch(
      `${API_BASE_URL}/users/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`,
      { credentials: "include" },
    );
    if (!response.ok) return { users: [], total: 0 };
    const data = await response.json();
    return data.result;
  },
};
