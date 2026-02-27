import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

import getOauthGoogleUrl from "./components/auth/Login";

function Home() {
  const isAuthenticated = Boolean(localStorage.getItem("access_token"));
  const oauthURL = getOauthGoogleUrl();
  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    window.location.reload();
  };
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
