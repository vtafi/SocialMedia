import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

import getOauthGoogleUrl from "./components/auth/Login/SocialLogin";
import { authService } from "./services/auth.service";

function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    authService.isAuthenticated(),
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Luôn thử fetch /users/me khi vào trang để kiểm tra session cookie bằng backend
    // Điều này để phục hồi trạng thái sau khi Redirect từ OAuth Google
    authService
      .getMe()
      .then((profile) => {
        authService.saveAuthData(profile);
        setIsAuthenticated(true);
      })
      .catch(() => {
        setIsAuthenticated(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const oauthURL = getOauthGoogleUrl();

  const logout = () => {
    authService
      .logout()
      .catch(console.error) // Log lỗi nếu có
      .finally(() => {
        setIsAuthenticated(false);
        window.location.reload();
      });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div>
        <div>
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </div>
        <div>
          <img src={reactLogo} className="logo react" alt="React logo" />
        </div>
      </div>
      <h1>OAuth Google</h1>
      <div>
        {isAuthenticated ? (
          <div>
            <p>Xin chào, bạn đã login thành công</p>
            <button onClick={logout}>Click để logout</button>
          </div>
        ) : (
          <a href={oauthURL}>Login with Google</a>
        )}
      </div>
    </>
  );
}

export default Home;
