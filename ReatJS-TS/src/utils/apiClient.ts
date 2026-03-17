/**
 * apiClient — Wrapper quanh fetch với cơ chế tự động refresh access token.
 *
 * Luồng:
 *  1. Gọi API bình thường (cookie access_token gửi tự động nhờ credentials: 'include')
 *  2. Nếu nhận 401 → gọi POST /users/refresh-token (server đọc cookie refresh_token)
 *     → server set lại 2 cookies mới
 *  3. Retry request gốc một lần với cookies mới
 *  4. Nếu refresh cũng fail → xóa profile trong sessionStorage → redirect về /login
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8386";

// Đảm bảo chỉ có 1 lần refresh đang chạy (tránh race condition nhiều request 401 cùng lúc)
let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

const notifySubscribers = (success: boolean) => {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
};

const subscribeToRefresh = (): Promise<boolean> =>
  new Promise((resolve) => {
    refreshSubscribers.push(resolve);
  });

/** Gọi endpoint refresh token, trả về true nếu thành công */
const doRefresh = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/users/refresh-token`, {
      method: "POST",
      credentials: "include", // gửi cookie refresh_token
    });
    return res.ok;
  } catch {
    return false;
  }
};

/**
 * Fetch wrapper với auto-retry khi 401.
 * Dùng thay thế cho fetch() trong toàn bộ ứng dụng.
 */
export const apiClient = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const opts: RequestInit = {
    credentials: "include",
    ...options,
  };

  const res = await fetch(url, opts);

  // Không phải 401 → trả về bình thường
  if (res.status !== 401) return res;

  // ── 401: cần refresh token ──────────────────────────────────────────────

  if (isRefreshing) {
    // Có request khác đang refresh → chờ kết quả
    const success = await subscribeToRefresh();
    if (success) return fetch(url, opts); // retry sau khi có token mới
    // Refresh thất bại → trả nguyên 401 để component xử lý
    return res;
  }

  // Mình là request đầu tiên bị 401 → tiến hành refresh
  isRefreshing = true;
  const refreshed = await doRefresh();
  isRefreshing = false;
  notifySubscribers(refreshed);

  if (refreshed) {
    // Retry với cookie mới (server đã set cookie mới vào response của /refresh-token)
    return fetch(url, opts);
  }

  // Refresh thất bại → session hết hạn hẳn → đẩy về /login
  sessionStorage.removeItem("profile");
  window.location.href = "/login";
  return res;
};

/**
 * Helper: apiClient với BASE_URL tự động ghép.
 * Dùng thay cho authFetch / fetch(API_BASE_URL + ...) ở các service.
 */
export const authFetch = (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  return apiClient(url, options);
};
