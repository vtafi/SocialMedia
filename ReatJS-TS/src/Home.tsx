import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

const getOauthGoogleUrl = () => {
  const { VITE_GOOGLE_CLIENT_ID, VITE_GOOGLE_AUTHORIZED_REDIRECT_URI } =
    import.meta.env;
  // Thêm dòng này để debug
  console.log("CLIENT_ID:", VITE_GOOGLE_CLIENT_ID);
  console.log("REDIRECT_URI:", VITE_GOOGLE_AUTHORIZED_REDIRECT_URI);

  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const options = {
    redirect_uri: VITE_GOOGLE_AUTHORIZED_REDIRECT_URI,
    client_id: VITE_GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };
  const qs = new URLSearchParams(options);
  return `${rootUrl}?${qs.toString()}`;
};

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
      <h2>Video Stream</h2>
      <video controls width={500} height={500}>
        <source
          src="http://localhost:8386/static/video-stream/FPgRTNmEZGOqPpwFTUH0O/q3w0d3ge3tp12eyddpx297uax.mp4"
          type="video/mp4"
        />
      </video>
      <h2>Video HLS</h2>
      <MediaPlayer
        title="Sprite Fight"
        src="https://twitter-nodejs-1.s3.ap-southeast-1.amazonaws.com/videos-hls/RtAFEZiRBK8m4IbmHaIHy/master.m3u8"
      >
        <MediaProvider />
        <DefaultVideoLayout
          thumbnails="https://files.vidstack.io/sprite-fight/thumbnails.vtt"
          icons={defaultLayoutIcons}
        />
      </MediaPlayer>
    </>
  );
}

export default Home;
