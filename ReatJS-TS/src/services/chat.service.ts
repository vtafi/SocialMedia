const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8386";

export interface ChatUser {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: ChatUser | string;
  content: string;
  messageType: "text" | "image" | "file" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface IConversation {
  _id: string;
  participants: { userId: ChatUser; name: string; avatar?: string }[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  unreadCount?: Record<string, number>;
  updatedAt: string;
}

const authFetch = (url: string, options?: RequestInit) =>
  fetch(url, { credentials: "include", ...options });

export const chatService = {
  async getConversations(): Promise<IConversation[]> {
    const res = await authFetch(`${API_BASE_URL}/chat/conversations`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  },

  async getOrCreateConversation(targetUserId: string): Promise<IConversation | null> {
    const res = await authFetch(`${API_BASE_URL}/chat/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  },

  async getMessages(conversationId: string, limit = 50, skip = 0): Promise<IMessage[]> {
    const res = await authFetch(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages?limit=${limit}&skip=${skip}`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  },

  async markAsRead(conversationId: string): Promise<void> {
    await authFetch(`${API_BASE_URL}/chat/conversations/${conversationId}/read`, {
      method: "PATCH",
    });
  },

  async searchUsers(q: string): Promise<ChatUser[]> {
    const res = await authFetch(
      `${API_BASE_URL}/chat/users/search?search=${encodeURIComponent(q)}`,
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data ?? [];
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await authFetch(`${API_BASE_URL}/chat/conversations/${conversationId}`, {
      method: "DELETE",
    });
  },
};
