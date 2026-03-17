import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Search,
  MoreHorizontal,
  MessageCircle,
  ArrowLeft,
  Loader2,
  X,
  Check,
  CheckCheck,
} from "lucide-react";
import Navbar from "../../components/home/Navbar";
import { authService } from "../../services/auth.service";
import { chatService } from "../../services/chat.service";
import type {
  IConversation,
  IMessage,
  ChatUser,
} from "../../services/chat.service";
import socket from "../../utils/socket";

const formatTime = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
};

const getAvatarUrl = (user: ChatUser | null | undefined) => {
  if (!user)
    return `https://ui-avatars.com/api/?name=U&background=0052FF&color=fff`;
  if (user.avatar) return user.avatar;
  const initials = encodeURIComponent((user.name || "U").slice(0, 2));
  return `https://ui-avatars.com/api/?name=${initials}&background=0052FF&color=fff`;
};

const Chat: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const me = authService.getProfile();

  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [activeConv, setActiveConv] = useState<IConversation | null>(null);
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [searchQ, setSearchQ] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeConvRef = useRef<IConversation | null>(null);
  activeConvRef.current = activeConv;

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // ── Effect 1: connect socket một lần duy nhất khi mount, disconnect khi unmount ──
  useEffect(() => {
    if (!me) return;
    if (!socket.connected) {
      socket.auth = { name: me.name || me.username || "User" };
      socket.connect();
    }
    return () => {
      // Chỉ disconnect khi rời hẳn trang Chat
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Effect 2: đăng ký / hủy event listeners (an toàn khi re-render) ──
  useEffect(() => {
    const onUserOnline = ({ userId }: { userId: string }) =>
      setOnlineUsers((prev) => new Set(prev).add(userId));

    const onUserOffline = ({ userId }: { userId: string }) =>
      setOnlineUsers((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });

    const onNewMessage = (msg: IMessage) => {
      if (msg.conversationId === activeConvRef.current?._id) {
        setMessages((prev) => {
          // Thay thế temp message bằng real message (tránh duplicate)
          const hasTempMatch = prev.some(
            (m) => m._id.startsWith("temp-") && m.content === msg.content
          );
          if (hasTempMatch) {
            return prev.map((m) =>
              m._id.startsWith("temp-") && m.content === msg.content ? msg : m
            );
          }
          return [...prev, msg];
        });
        chatService.markAsRead(msg.conversationId);
      }
      setConversations((prev) =>
        prev
          .map((c) =>
            c._id === msg.conversationId
              ? {
                  ...c,
                  lastMessage: {
                    content: msg.content,
                    senderId:
                      typeof msg.senderId === "string"
                        ? msg.senderId
                        : (msg.senderId as ChatUser)._id,
                    createdAt: msg.createdAt,
                  },
                  updatedAt: msg.createdAt,
                }
              : c,
          )
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          ),
      );
    };

    const onTyping = ({ userId }: { userId: string }) =>
      setTypingUsers((prev) => new Set(prev).add(userId));

    const onStopTyping = ({ userId }: { userId: string }) =>
      setTypingUsers((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });

    socket.on("user-online", onUserOnline);
    socket.on("user-offline", onUserOffline);
    socket.on("new-message", onNewMessage);
    socket.on("user-typing", onTyping);
    socket.on("user-stop-typing", onStopTyping);

    return () => {
      socket.off("user-online", onUserOnline);
      socket.off("user-offline", onUserOffline);
      socket.off("new-message", onNewMessage);
      socket.off("user-typing", onTyping);
      socket.off("user-stop-typing", onStopTyping);
      // KHÔNG gọi socket.disconnect() ở đây
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load conversations — sau khi xong tự mở conversation ?with=userId nếu có
  useEffect(() => {
    const targetId = searchParams.get("with");

    const openConv = async (conv: IConversation) => {
      setActiveConv(conv);
      setMsgLoading(true);
      socket.emit("join-conversation", conv._id);
      const msgs = await chatService.getMessages(conv._id);
      setMessages(msgs);
      setMsgLoading(false);
      chatService.markAsRead(conv._id);
    };

    chatService.getConversations().then(async (data) => {
      setConversations(data);
      setLoading(false);

      if (!targetId) return;

      // Tìm conversation đã có — so sánh linh hoạt cả object lẫn string
      const existing = data.find((c) =>
        c.participants.some((p) => {
          const uid = p.userId?._id ?? (p.userId as unknown as string);
          return String(uid) === targetId;
        }),
      );

      if (existing) {
        await openConv(existing);
      } else {
        // Tạo conversation mới
        const conv = await chatService.getOrCreateConversation(targetId);
        if (!conv) return;
        setConversations((prev) =>
          prev.find((c) => c._id === conv._id) ? prev : [conv, ...prev],
        );
        await openConv(conv);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openConversation = useCallback(
    async (conv: IConversation) => {
      if (activeConv?._id === conv._id) return;

      if (activeConv) socket.emit("leave-conversation", activeConv._id);

      setActiveConv(conv);
      setMessages([]);
      setMsgLoading(true);

      socket.emit("join-conversation", conv._id);
      const msgs = await chatService.getMessages(conv._id);
      setMessages(msgs);
      setMsgLoading(false);
      chatService.markAsRead(conv._id);
    },
    [activeConv],
  );

  const openConversationWith = useCallback(
    async (targetUserId: string) => {
      // Tìm conversation đã có
      const existing = conversations.find((c) =>
        c.participants.some((p) => p.userId._id === targetUserId),
      );
      if (existing) {
        openConversation(existing);
        return;
      }

      // Tạo mới
      const conv = await chatService.getOrCreateConversation(targetUserId);
      if (!conv) return;
      setConversations((prev) => {
        if (prev.find((c) => c._id === conv._id)) return prev;
        return [conv, ...prev];
      });
      openConversation(conv);
    },
    [conversations, openConversation],
  );

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConv || sending) return;

    const content = input.trim();
    setSending(true);
    setInput("");

    // Optimistic update: hiện ngay tin nhắn cho người gửi
    const tempMsg: IMessage = {
      _id: `temp-${Date.now()}`,
      conversationId: activeConv._id,
      senderId: me?._id ?? "",
      content,
      messageType: "text",
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    socket.emit("typing-stop", activeConv._id);
    socket.emit("send-message", {
      conversationId: activeConv._id,
      content,
      messageType: "text",
    });
    setSending(false);
  };

  const handleTyping = (val: string) => {
    setInput(val);
    if (!activeConv) return;
    socket.emit("typing-start", activeConv._id);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing-stop", activeConv._id);
    }, 1500);
  };

  // Search users để bắt đầu chat mới
  useEffect(() => {
    if (!searchQ.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const res = await chatService.searchUsers(searchQ);
      setSearchResults(res.filter((u) => u._id !== me?._id));
      setSearching(false);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQ, me?._id]);

  // Lấy thông tin người kia trong conversation
  const getOtherParticipant = (conv: IConversation): ChatUser | null => {
    const other = conv.participants.find((p) => {
      const uid = p.userId?._id ?? (p.userId as unknown as string);
      return String(uid) !== me?._id;
    });
    if (!other) return null;
    // Nếu userId đã populate → trả về object, nếu chưa → tạo object từ name/avatar
    if (
      other.userId &&
      typeof other.userId === "object" &&
      "_id" in other.userId
    ) {
      return other.userId;
    }
    return {
      _id: String(other.userId),
      name: other.name,
      avatar: other.avatar,
    };
  };

  const isOnline = (userId: string) => onlineUsers.has(userId);

  return (
    <div className="min-h-screen bg-[#FAFAFA] font-inter">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">
        <div
          className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex overflow-hidden"
          style={{ height: "calc(100vh - 8rem)" }}
        >
          {/* ── LEFT: Conversations list ── */}
          <div className="w-80 shrink-0 border-r border-slate-100 flex flex-col">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-calistoga text-2xl text-[#0F172A]">
                Messages
              </h2>
              <button
                onClick={() => setNewChatOpen(true)}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] flex items-center justify-center text-white hover:shadow-[0_4px_15px_-3px_rgba(0,82,255,0.5)] transition-all"
                title="New message"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            {/* New chat search overlay */}
            <AnimatePresence>
              {newChatOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="px-4 py-3 border-b border-slate-100 bg-slate-50"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        autoFocus
                        value={searchQ}
                        onChange={(e) => setSearchQ(e.target.value)}
                        placeholder="Search users..."
                        className="w-full h-9 pl-9 pr-3 rounded-xl border border-slate-200 bg-white text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/50"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setNewChatOpen(false);
                        setSearchQ("");
                      }}
                      className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {searching && (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    </div>
                  )}
                  {searchResults.map((u) => (
                    <div
                      key={u._id}
                      onClick={async () => {
                        setNewChatOpen(false);
                        setSearchQ("");
                        await openConversationWith(u._id);
                      }}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white cursor-pointer transition-colors"
                    >
                      <img
                        src={getAvatarUrl(u)}
                        className="w-9 h-9 rounded-full object-cover"
                        alt={u.name}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[#0F172A]">
                          {u.name}
                        </p>
                        {u.username && (
                          <p className="text-xs text-slate-400 font-mono">
                            @{u.username}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 px-4 text-center">
                  <MessageCircle className="w-10 h-10 mb-3 text-slate-200" />
                  <p className="text-sm font-medium text-[#0F172A]">
                    No conversations yet
                  </p>
                  <p className="text-xs mt-1">
                    Click the icon above to start chatting
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const other = getOtherParticipant(conv);
                  const isActive = activeConv?._id === conv._id;
                  const online = other ? isOnline(other._id) : false;
                  return (
                    <div
                      key={conv._id}
                      onClick={() => openConversation(conv)}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-l-[3px] ${
                        isActive
                          ? "bg-blue-50 border-l-[#0052FF]"
                          : "border-l-transparent hover:bg-slate-50"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <img
                          src={getAvatarUrl(other)}
                          className="w-11 h-11 rounded-full object-cover"
                          alt=""
                        />
                        {online && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <p
                            className={`text-sm font-semibold truncate ${isActive ? "text-[#0052FF]" : "text-[#0F172A]"}`}
                          >
                            {other?.name ?? "Unknown"}
                          </p>
                          {conv.lastMessage?.createdAt && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {conv.lastMessage?.content ??
                            "Tap to start chatting…"}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── RIGHT: Chat area ── */}
          <div className="flex-1 flex flex-col bg-[#FAFAFA] min-w-0">
            {activeConv ? (
              <>
                {/* Chat header */}
                {(() => {
                  const other = getOtherParticipant(activeConv);
                  const online = other ? isOnline(other._id) : false;
                  return (
                    <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <button
                          className="md:hidden mr-1 text-slate-500"
                          onClick={() => setActiveConv(null)}
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div
                          className="relative cursor-pointer"
                          onClick={() =>
                            other?.username
                              ? navigate(`/users/${other.username}`)
                              : other?._id && navigate(`/users/id/${other._id}`)
                          }
                        >
                          <img
                            src={getAvatarUrl(other)}
                            className="w-10 h-10 rounded-full object-cover"
                            alt=""
                          />
                          {online && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div>
                          <p
                            className="font-semibold text-[#0F172A] cursor-pointer hover:text-[#0052FF] transition-colors"
                            onClick={() =>
                              other?.username
                                ? navigate(`/users/${other.username}`)
                                : other?._id &&
                                  navigate(`/users/id/${other._id}`)
                            }
                          >
                            {other?.name ?? "Unknown"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {online ? (
                              <span className="text-emerald-500 font-medium">
                                ● Online
                              </span>
                            ) : (
                              "Offline"
                            )}
                          </p>
                        </div>
                      </div>
                      <button className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-[#0052FF] hover:bg-blue-50 transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })()}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
                  {msgLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <MessageCircle className="w-10 h-10 mb-3 text-slate-200" />
                      <p className="text-sm">No messages yet. Say hi! 👋</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const senderId =
                        typeof msg.senderId === "string"
                          ? msg.senderId
                          : msg.senderId?._id;
                      const isMe = senderId === me?._id;
                      const senderInfo =
                        typeof msg.senderId === "object"
                          ? (msg.senderId as ChatUser)
                          : null;
                      const showAvatar =
                        !isMe &&
                        (i === 0 ||
                          (typeof messages[i - 1].senderId === "string"
                            ? messages[i - 1].senderId
                            : (messages[i - 1].senderId as ChatUser)?._id) !==
                            senderId);

                      return (
                        <motion.div
                          key={msg._id ?? i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {!isMe && (
                            <div className="w-8 shrink-0">
                              {showAvatar && (
                                <img
                                  src={getAvatarUrl(senderInfo)}
                                  className="w-8 h-8 rounded-full object-cover"
                                  alt=""
                                />
                              )}
                            </div>
                          )}
                          <div
                            className={`max-w-[65%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`px-4 py-2.5 text-[15px] leading-relaxed rounded-2xl shadow-sm ${
                                isMe
                                  ? "bg-gradient-to-br from-[#0052FF] to-[#4D7CFF] text-white rounded-tr-sm"
                                  : "bg-white border border-slate-200 text-[#0F172A] rounded-tl-sm"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <div
                              className={`flex items-center gap-1 mt-1 text-[10px] text-slate-400 ${isMe ? "flex-row-reverse" : ""}`}
                            >
                              <span>{formatTime(msg.createdAt)}</span>
                              {isMe &&
                                (msg.isRead ? (
                                  <CheckCheck className="w-3 h-3 text-[#0052FF]" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                ))}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}

                  {/* Typing indicator */}
                  {typingUsers.size > 0 && (
                    <div className="flex items-end gap-2">
                      <div className="w-8 shrink-0" />
                      <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm">
                        <div className="flex gap-1 items-center">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="w-1.5 h-1.5 bg-slate-400 rounded-full"
                              animate={{ y: [0, -4, 0] }}
                              transition={{
                                delay: i * 0.15,
                                repeat: Infinity,
                                duration: 0.8,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 bg-white border-t border-slate-100 shrink-0">
                  <form
                    onSubmit={handleSend}
                    className="flex items-center gap-2"
                  >
                    <input
                      value={input}
                      onChange={(e) => handleTyping(e.target.value)}
                      placeholder="Type a message…"
                      className="flex-1 h-11 px-4 rounded-full bg-slate-50 border border-transparent text-sm text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/50 focus:bg-white transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || sending}
                      className="w-11 h-11 rounded-full bg-gradient-to-r from-[#0052FF] to-[#4D7CFF] flex items-center justify-center text-white hover:shadow-[0_4px_15px_-3px_rgba(0,82,255,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-10 h-10 text-slate-300" />
                </div>
                <p className="font-semibold text-[#0F172A] mb-1">
                  Your Messages
                </p>
                <p className="text-sm">
                  Select a conversation or start a new one
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
