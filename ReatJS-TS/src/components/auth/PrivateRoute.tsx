import { Navigate, useLocation } from "react-router-dom";
import { authService } from "../../services/auth.service";

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * Bao bọc các trang yêu cầu đăng nhập.
 * Nếu chưa auth → redirect về /login (kèm returnUrl để redirect lại sau khi login).
 */
const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const location = useLocation();
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

export default PrivateRoute;
