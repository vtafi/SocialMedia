import { Navigate } from "react-router-dom";
import { authService } from "../../services/auth.service";

interface GuestRouteProps {
  children: React.ReactNode;
}

/**
 * Bao bọc các trang chỉ dành cho khách (Login, Register).
 * Nếu user đã đăng nhập → redirect về trang chủ.
 */
const GuestRoute = ({ children }: GuestRouteProps) => {
  if (authService.isAuthenticated()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default GuestRoute;
