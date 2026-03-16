import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:8386";

// autoConnect: false — kết nối thủ công sau khi có profile
const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true, // gửi cookie access_token cùng handshake
});

export default socket;
