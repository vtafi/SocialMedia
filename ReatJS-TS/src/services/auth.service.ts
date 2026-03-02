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

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string;
  verify: number;
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
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Quan trọng: cho phép gửi/nhận cookies
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();

      // Extract specific error message from errors object
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
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Backend sẽ đọc refresh_token từ cookie
    });

    // Xoá profile khỏi sessionStorage
    sessionStorage.removeItem("profile");
  },

  async getMe(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to get profile");
    }

    const data = await response.json();
    return data.result;
  },

  // Lưu thông tin user vào sessionStorage (KHÔNG lưu token - đã có trong cookie)
  saveAuthData(data: AuthResponse["result"] | UserProfile): void {
    const user = "user" in data ? data.user : data;
    sessionStorage.setItem("profile", JSON.stringify(user));
  },

  getProfile(): UserProfile | null {
    const profile = sessionStorage.getItem("profile");
    return profile ? JSON.parse(profile) : null;
  },

  // Không thể đọc httpOnly cookie từ JS, dùng sessionStorage để track trạng thái login
  isAuthenticated(): boolean {
    return !!sessionStorage.getItem("profile");
  },
};
